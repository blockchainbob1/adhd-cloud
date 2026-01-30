"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export type AvailabilityState = {
  errors?: {
    dayOfWeek?: string[];
    startTime?: string[];
    endTime?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function createAvailability(
  prevState: AvailabilityState | undefined,
  formData: FormData
): Promise<AvailabilityState> {
  const session = await auth();

  if (!session?.user || session.user.role !== "DOCTOR") {
    return { errors: { _form: ["Unauthorized"] } };
  }

  const validatedFields = availabilitySchema.safeParse({
    dayOfWeek: parseInt(formData.get("dayOfWeek") as string),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { dayOfWeek, startTime, endTime } = validatedFields.data;

  // Validate time range
  if (startTime >= endTime) {
    return { errors: { _form: ["End time must be after start time"] } };
  }

  // Check for overlapping availability
  const existing = await prisma.availability.findMany({
    where: {
      doctorId: session.user.id,
      dayOfWeek,
      specificDate: null,
    },
  });

  const hasOverlap = existing.some((slot) => {
    return (
      (startTime >= slot.startTime && startTime < slot.endTime) ||
      (endTime > slot.startTime && endTime <= slot.endTime) ||
      (startTime <= slot.startTime && endTime >= slot.endTime)
    );
  });

  if (hasOverlap) {
    return { errors: { _form: ["This time overlaps with existing availability"] } };
  }

  await prisma.availability.create({
    data: {
      doctorId: session.user.id,
      dayOfWeek,
      startTime,
      endTime,
    },
  });

  revalidatePath("/doctor/roster");
  return { success: true };
}

export async function deleteAvailability(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user || session.user.role !== "DOCTOR") {
    return { success: false, error: "Unauthorized" };
  }

  const availability = await prisma.availability.findUnique({
    where: { id },
  });

  if (!availability || availability.doctorId !== session.user.id) {
    return { success: false, error: "Not found" };
  }

  await prisma.availability.delete({
    where: { id },
  });

  revalidatePath("/doctor/roster");
  return { success: true };
}

export async function getAvailableSlots(
  doctorId: string,
  date: Date,
  consultationType: "INITIAL" | "FOLLOW_UP"
): Promise<{ time: string; available: boolean }[]> {
  const dayOfWeek = date.getDay();
  const duration = consultationType === "INITIAL" ? 30 : 15;

  // Get doctor's availability for this day
  const availability = await prisma.availability.findMany({
    where: {
      doctorId,
      dayOfWeek,
      isBlocked: false,
      OR: [
        { specificDate: null },
        { specificDate: date },
      ],
    },
  });

  if (availability.length === 0) {
    return [];
  }

  // Get existing appointments for this day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ["CONFIRMED", "PENDING_PAYMENT", "IN_PROGRESS"],
      },
    },
  });

  // Generate all possible slots
  const slots: { time: string; available: boolean }[] = [];

  for (const avail of availability) {
    const [startHour, startMin] = avail.startTime.split(":").map(Number);
    const [endHour, endMin] = avail.endTime.split(":").map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin + duration <= endMin)
    ) {
      const slotTime = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;

      // Check if slot is in the past
      const slotDate = new Date(date);
      slotDate.setHours(currentHour, currentMin, 0, 0);
      const isPast = slotDate < new Date();

      // Check if slot conflicts with existing appointment
      const isBooked = existingAppointments.some((apt) => {
        const aptStart = apt.scheduledAt;
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
        const slotEnd = new Date(slotDate.getTime() + duration * 60000);

        return (
          (slotDate >= aptStart && slotDate < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotDate <= aptStart && slotEnd >= aptEnd)
        );
      });

      slots.push({
        time: slotTime,
        available: !isPast && !isBooked,
      });

      // Increment by slot duration
      currentMin += duration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time));
}

export async function getDoctorsWithAvailability() {
  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
      isActive: true,
    },
    include: {
      doctorProfile: true,
      availability: {
        where: {
          isBlocked: false,
          specificDate: null,
        },
      },
    },
  });

  return doctors.filter((doc) => doc.availability.length > 0);
}
