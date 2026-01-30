import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoCall } from "@/components/video/video-call";
import { Clock, User } from "lucide-react";

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { firstName: true, lastName: true, email: true } },
      doctor: { select: { firstName: true, lastName: true } },
      payment: true,
    },
  });

  if (!appointment) {
    notFound();
  }

  // Check if user is a participant
  const isDoctor = session.user.id === appointment.doctorId;
  const isPatient = session.user.id === appointment.patientId;

  if (!isDoctor && !isPatient) {
    redirect("/");
  }

  // Check if appointment is confirmed
  if (appointment.status !== "CONFIRMED" && appointment.status !== "IN_PROGRESS") {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Cannot Join Call</h2>
            <p className="text-gray-600 mb-4">
              {appointment.status === "PENDING_PAYMENT"
                ? "Payment is required before joining the consultation."
                : appointment.status === "COMPLETED"
                ? "This consultation has already been completed."
                : "This appointment is not available for video call."}
            </p>
            <Badge variant="secondary">{appointment.status.replace("_", " ")}</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const otherParticipant = isDoctor ? appointment.patient : appointment.doctor;
  const participantLabel = isDoctor
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Video call area */}
      <div className="flex-1 min-h-[400px]">
        <VideoCall appointmentId={appointmentId} isDoctor={isDoctor} />
      </div>

      {/* Side panel - info */}
      <div className="w-full lg:w-80 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{participantLabel}</p>
                <p className="text-xs text-gray-500">
                  {isDoctor ? "Patient" : "Doctor"}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {format(appointment.scheduledAt, "h:mm a")} •{" "}
                  {appointment.duration} min
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {appointment.consultationType === "INITIAL"
                  ? "Initial Consultation"
                  : "Follow-up Consultation"}
              </p>
            </div>

            {appointment.chiefComplaint && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-1">Chief Complaint</p>
                <p className="text-sm">{appointment.chiefComplaint}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {isDoctor && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-500">
                Session notes and prescriptions can be added after the call ends.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
