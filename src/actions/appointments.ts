"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ConsultationType } from "@prisma/client";

const bookingSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  consultationType: z.enum(["INITIAL", "FOLLOW_UP"]),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  chiefComplaint: z.string().optional(),
});

export type BookingState = {
  errors?: {
    doctorId?: string[];
    consultationType?: string[];
    date?: string[];
    time?: string[];
    chiefComplaint?: string[];
    _form?: string[];
  };
  success?: boolean;
  appointmentId?: string;
  checkoutUrl?: string;
};

export async function createBooking(
  prevState: BookingState | undefined,
  formData: FormData
): Promise<BookingState> {
  const session = await auth();

  if (!session?.user || session.user.role !== "PATIENT") {
    return { errors: { _form: ["Please log in to book an appointment"] } };
  }

  const validatedFields = bookingSchema.safeParse({
    doctorId: formData.get("doctorId"),
    consultationType: formData.get("consultationType"),
    date: formData.get("date"),
    time: formData.get("time"),
    chiefComplaint: formData.get("chiefComplaint"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { doctorId, consultationType, date, time, chiefComplaint } = validatedFields.data;

  // Parse the date and time
  const scheduledAt = new Date(`${date}T${time}:00`);

  // Validate the appointment time is in the future
  if (scheduledAt <= new Date()) {
    return { errors: { _form: ["Cannot book appointments in the past"] } };
  }

  // Get consultation details
  const clinicSettings = await prisma.clinicSettings.findFirst();
  const duration = consultationType === "INITIAL" ? 30 : 15;
  const price =
    consultationType === "INITIAL"
      ? clinicSettings?.initialConsultPrice ?? 50000
      : clinicSettings?.followUpConsultPrice ?? 30000;

  // Check if the slot is still available
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId,
      scheduledAt,
      status: { in: ["CONFIRMED", "PENDING_PAYMENT", "IN_PROGRESS"] },
    },
  });

  if (existingAppointment) {
    return { errors: { _form: ["This time slot is no longer available"] } };
  }

  // Create the appointment
  const appointment = await prisma.appointment.create({
    data: {
      patientId: session.user.id,
      doctorId,
      scheduledAt,
      duration,
      consultationType: consultationType as ConsultationType,
      chiefComplaint,
      status: "PENDING_PAYMENT",
      payment: {
        create: {
          amount: price,
          depositAmount: price,
          status: "PENDING",
        },
      },
    },
  });

  revalidatePath("/patient");
  revalidatePath("/patient/appointments");

  return {
    success: true,
    appointmentId: appointment.id,
  };
}

export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { payment: true },
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  // Check permissions
  const canCancel =
    session.user.id === appointment.patientId ||
    session.user.id === appointment.doctorId ||
    session.user.role === "RECEPTION" ||
    session.user.role === "CLINIC_MANAGER";

  if (!canCancel) {
    return { success: false, error: "Not authorized to cancel this appointment" };
  }

  // Update appointment status
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  revalidatePath("/patient");
  revalidatePath("/patient/appointments");
  revalidatePath("/doctor");
  revalidatePath("/doctor/appointments");

  return { success: true };
}

export async function getUpcomingAppointments(userId: string, role: string) {
  const where =
    role === "PATIENT"
      ? { patientId: userId }
      : role === "DOCTOR"
      ? { doctorId: userId }
      : {};

  return prisma.appointment.findMany({
    where: {
      ...where,
      scheduledAt: { gte: new Date() },
      status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
    },
    include: {
      patient: { select: { firstName: true, lastName: true, email: true } },
      doctor: { select: { firstName: true, lastName: true } },
      payment: true,
    },
    orderBy: { scheduledAt: "asc" },
  });
}
