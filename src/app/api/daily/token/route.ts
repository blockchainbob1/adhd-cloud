import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMeetingToken } from "@/lib/daily";

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
    });

    if (!appointment || !appointment.dailyRoomName) {
      return NextResponse.json(
        { error: "Appointment or room not found" },
        { status: 404 }
      );
    }

    // Check if user is participant
    const isDoctor = session.user.id === appointment.doctorId;
    const isPatient = session.user.id === appointment.patientId;

    if (!isDoctor && !isPatient) {
      return NextResponse.json(
        { error: "Not authorized for this appointment" },
        { status: 403 }
      );
    }

    const participantName = `${session.user.firstName} ${session.user.lastName}`;
    const token = await createMeetingToken(
      appointment.dailyRoomName,
      isDoctor ? `Dr. ${participantName}` : participantName,
      isDoctor // Doctor is the owner
    );

    return NextResponse.json({ token: token.token });
  } catch (error) {
    console.error("Daily token creation error:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
