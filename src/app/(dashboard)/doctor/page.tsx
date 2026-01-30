import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";

export default async function DoctorDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const today = new Date();

  const todaysAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: session.user.id,
      scheduledAt: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
    },
    include: {
      patient: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: session.user.id,
      scheduledAt: { gt: endOfDay(today) },
      status: "CONFIRMED",
    },
    include: {
      patient: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });

  const totalPatients = await prisma.appointment.groupBy({
    by: ["patientId"],
    where: {
      doctorId: session.user.id,
    },
  });

  const completedThisMonth = await prisma.appointment.count({
    where: {
      doctorId: session.user.id,
      status: "COMPLETED",
      endedAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), 1),
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {today.getHours() < 12 ? "morning" : today.getHours() < 18 ? "afternoon" : "evening"}, Dr. {session.user.lastName}
          </h1>
          <p className="text-gray-600">
            Here&apos;s your schedule for today
          </p>
        </div>
        <Link href="/doctor/roster">
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Manage Roster
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today&apos;s Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Upcoming
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed (Month)
            </CardTitle>
            <Video className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Schedule</CardTitle>
          <CardDescription>
            {format(today, "EEEE, MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysAppointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaysAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold">
                        {format(appointment.scheduledAt, "h:mm")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(appointment.scheduledAt, "a")}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {appointment.patient.firstName[0]}
                        {appointment.patient.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.consultationType === "INITIAL"
                          ? "Initial Consultation"
                          : "Follow-up"}{" "}
                        • {appointment.duration} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        appointment.status === "IN_PROGRESS"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {appointment.status === "IN_PROGRESS" ? "In Progress" : "Confirmed"}
                    </Badge>
                    <Link href={`/doctor/patients/${appointment.patientId}`}>
                      <Button variant="outline" size="sm">
                        View Patient
                      </Button>
                    </Link>
                    <Link href={`/consultation/${appointment.id}`}>
                      <Button size="sm">
                        <Video className="mr-2 h-4 w-4" />
                        {appointment.status === "IN_PROGRESS" ? "Rejoin" : "Start"}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Your next scheduled consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {appointment.patient.firstName[0]}
                        {appointment.patient.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(appointment.scheduledAt, "EEE, MMM d 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {appointment.consultationType === "INITIAL" ? "Initial" : "Follow-up"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
