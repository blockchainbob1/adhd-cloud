import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, Activity, Settings, UserPlus } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== "CLINIC_MANAGER") {
    redirect("/login");
  }

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Get stats
  const [
    totalPatients,
    totalDoctors,
    totalStaff,
    monthlyAppointments,
    completedThisMonth,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "PATIENT", isActive: true } }),
    prisma.user.count({ where: { role: "DOCTOR", isActive: true } }),
    prisma.user.count({
      where: { role: { in: ["RECEPTION", "CLINIC_MANAGER"] }, isActive: true },
    }),
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        status: "COMPLETED",
        endedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  const recentAppointments = await prisma.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      doctor: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const revenueAmount = (monthlyRevenue._sum.amount || 0) / 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Clinic overview for {format(today, "MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-gray-500">Active patient accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Doctors
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDoctors}</div>
            <p className="text-xs text-gray-500">Active practitioners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monthly Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyAppointments}</div>
            <p className="text-xs text-gray-500">
              {completedThisMonth} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff Overview</CardTitle>
            <CardDescription>Active clinic staff members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Doctors</p>
                    <p className="text-sm text-gray-500">Medical practitioners</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">{totalDoctors}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Support Staff</p>
                    <p className="text-sm text-gray-500">Reception & Admin</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">{totalStaff}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No recent appointments</p>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        with Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {format(appointment.scheduledAt, "MMM d")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(appointment.scheduledAt, "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex flex-col items-start">
                  <UserPlus className="h-5 w-5 mb-2" />
                  <span className="font-medium">Add User</span>
                  <span className="text-xs text-gray-500">Create new account</span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/doctors">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex flex-col items-start">
                  <Activity className="h-5 w-5 mb-2" />
                  <span className="font-medium">Manage Doctors</span>
                  <span className="text-xs text-gray-500">Doctor profiles</span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex flex-col items-start">
                  <DollarSign className="h-5 w-5 mb-2" />
                  <span className="font-medium">View Reports</span>
                  <span className="text-xs text-gray-500">Revenue & analytics</span>
                </div>
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex flex-col items-start">
                  <Settings className="h-5 w-5 mb-2" />
                  <span className="font-medium">Clinic Settings</span>
                  <span className="text-xs text-gray-500">Pricing & info</span>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
