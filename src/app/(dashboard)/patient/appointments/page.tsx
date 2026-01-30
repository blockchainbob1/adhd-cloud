import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Video, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default async function PatientAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string; success?: string; cancelled?: string }>;
}) {
  const session = await auth();
  const { booked, success, cancelled } = await searchParams;

  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const [upcomingAppointments, pastAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        patientId: session.user.id,
        scheduledAt: { gte: new Date() },
        status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
      },
      include: {
        doctor: { select: { firstName: true, lastName: true } },
        payment: true,
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        patientId: session.user.id,
        OR: [
          { scheduledAt: { lt: new Date() } },
          { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
        ],
      },
      include: {
        doctor: { select: { firstName: true, lastName: true } },
        payment: true,
      },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600">View and manage your consultations</p>
        </div>
        <Link href="/patient/book">
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Book New
          </Button>
        </Link>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Payment Successful!</p>
            <p className="text-sm">
              Your appointment is now confirmed. You&apos;ll receive a confirmation email shortly.
            </p>
          </div>
        </div>
      )}

      {cancelled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
          <p className="font-medium">Payment Cancelled</p>
          <p className="text-sm">
            Your payment was cancelled. You can try again by clicking &quot;Pay Now&quot; on your appointment.
          </p>
        </div>
      )}

      {booked && !success && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Appointment Booked!</p>
            <p className="text-sm">
              Please complete payment to confirm your booking. You&apos;ll also need to
              upload your referral before the appointment.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No upcoming appointments
                </h3>
                <p className="text-gray-500 mb-4">
                  Book your first consultation to get started
                </p>
                <Link href="/patient/book">
                  <Button>Book Appointment</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Video className="h-7 w-7 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {appointment.consultationType === "INITIAL"
                              ? "Initial Consultation"
                              : "Follow-up Consultation"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {format(appointment.scheduledAt, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge
                            variant={
                              appointment.status === "CONFIRMED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {appointment.status === "PENDING_PAYMENT"
                              ? "Payment Required"
                              : "Confirmed"}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {appointment.duration} min
                          </p>
                        </div>
                        {appointment.status === "CONFIRMED" && (
                          <Link href={`/consultation/${appointment.id}`}>
                            <Button>Join Call</Button>
                          </Link>
                        )}
                        {appointment.status === "PENDING_PAYMENT" && (
                          <Link href={`/patient/appointments/${appointment.id}/pay`}>
                            <Button>Pay Now</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No past appointments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <Card key={appointment.id} className="opacity-80">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Video className="h-7 w-7 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {appointment.consultationType === "INITIAL"
                              ? "Initial Consultation"
                              : "Follow-up Consultation"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(appointment.scheduledAt, "MMMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          appointment.status === "COMPLETED"
                            ? "secondary"
                            : appointment.status === "CANCELLED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
