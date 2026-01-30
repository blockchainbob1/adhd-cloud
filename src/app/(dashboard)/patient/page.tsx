import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video } from "lucide-react";
import { format } from "date-fns";

export default async function PatientDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      patientId: session.user.id,
      scheduledAt: { gte: new Date() },
      status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
    },
    include: {
      doctor: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });

  const pastAppointmentsCount = await prisma.appointment.count({
    where: {
      patientId: session.user.id,
      status: "COMPLETED",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.firstName}
          </h1>
          <p className="text-gray-600">
            Manage your appointments and health records
          </p>
        </div>
        <Link href="/patient/book">
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Upcoming Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Sessions
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastAppointmentsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Next Appointment
            </CardTitle>
            <Video className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingAppointments.length > 0
                ? format(upcomingAppointments[0].scheduledAt, "MMM d")
                : "None"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Your scheduled consultations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No upcoming appointments</p>
              <Link href="/patient/book">
                <Button variant="outline">Book your first appointment</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Video className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {appointment.consultationType === "INITIAL"
                          ? "Initial Consultation"
                          : "Follow-up Consultation"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(appointment.scheduledAt, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        appointment.status === "CONFIRMED"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {appointment.status === "PENDING_PAYMENT"
                        ? "Awaiting Payment"
                        : "Confirmed"}
                    </Badge>
                    {appointment.status === "CONFIRMED" && appointment.dailyRoomUrl && (
                      <Link href={`/consultation/${appointment.id}`}>
                        <Button size="sm">Join Call</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
