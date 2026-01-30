import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        payment: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.patientId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to pay for this appointment" },
        { status: 403 }
      );
    }

    if (appointment.payment?.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Payment already completed" },
        { status: 400 }
      );
    }

    const amount = appointment.payment?.amount ||
      (appointment.consultationType === "INITIAL" ? 50000 : 30000);

    const checkoutSession = await createCheckoutSession({
      appointmentId: appointment.id,
      consultationType: appointment.consultationType,
      amount,
      customerEmail: appointment.patient.email,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      scheduledAt: appointment.scheduledAt,
    });

    // Update payment with session ID
    if (appointment.payment) {
      await prisma.payment.update({
        where: { id: appointment.payment.id },
        data: { stripeSessionId: checkoutSession.id },
      });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
