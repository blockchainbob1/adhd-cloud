import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDailyRoom } from "@/lib/daily";

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

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if user is participant
    const isParticipant =
      session.user.id === appointment.patientId ||
      session.user.id === appointment.doctorId;

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not authorized for this appointment" },
        { status: 403 }
      );
    }

    // Check if room already exists
    if (appointment.dailyRoomUrl) {
      return NextResponse.json({
        roomUrl: appointment.dailyRoomUrl,
        roomName: appointment.dailyRoomName,
      });
    }

    // Create new room
    const room = await createDailyRoom(appointmentId);

    // Update appointment with room details
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        dailyRoomName: room.name,
        dailyRoomUrl: room.url,
      },
    });

    return NextResponse.json({
      roomUrl: room.url,
      roomName: room.name,
    });
  } catch (error) {
    console.error("Daily room creation error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
