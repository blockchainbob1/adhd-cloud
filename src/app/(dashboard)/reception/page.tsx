import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, DollarSign } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";

export default async function ReceptionDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== "RECEPTION") {
    redirect("/login");
  }

  const today = new Date();

  const todaysAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
    include: {
      patient: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
      doctor: {
        select: { firstName: true, lastName: true },
      },
      payment: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  const pendingPayments = await prisma.appointment.count({
    where: {
      status: "PENDING_PAYMENT",
    },
  });

  const totalPatientsToday = todaysAppointments.length;
  const confirmedToday = todaysAppointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "IN_PROGRESS"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
          <p className="text-gray-600">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Link href="/reception/bookings">
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            View All Bookings
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
            <div className="text-2xl font-bold">{totalPatientsToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Confirmed
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Today
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todaysAppointments.filter((a) => a.status === "COMPLETED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Schedule</CardTitle>
          <CardDescription>
            All appointments for {format(today, "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysAppointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Doctor</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Payment</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {todaysAppointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b">
                      <td className="py-3">
                        <span className="font-medium">
                          {format(appointment.scheduledAt, "h:mm a")}
                        </span>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.patient.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3">
                        Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </td>
                      <td className="py-3">
                        {appointment.consultationType === "INITIAL" ? "Initial" : "Follow-up"}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            appointment.status === "CONFIRMED"
                              ? "default"
                              : appointment.status === "COMPLETED"
                              ? "secondary"
                              : appointment.status === "IN_PROGRESS"
                              ? "default"
                              : "outline"
                          }
                        >
                          {appointment.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            appointment.payment?.status === "COMPLETED"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {appointment.payment?.status || "PENDING"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Link href={`/reception/patients?id=${appointment.patientId}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
