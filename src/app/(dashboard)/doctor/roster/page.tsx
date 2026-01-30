import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityForm } from "@/components/forms/availability-form";
import { AvailabilityList } from "@/components/appointments/availability-list";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function RosterPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const availability = await prisma.availability.findMany({
    where: {
      doctorId: session.user.id,
      specificDate: null,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  // Group by day of week
  const availabilityByDay = DAYS.map((day, index) => ({
    day,
    dayOfWeek: index,
    slots: availability.filter((a) => a.dayOfWeek === index),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Roster</h1>
        <p className="text-gray-600">
          Set your weekly availability for patient consultations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Availability</CardTitle>
            <CardDescription>
              Set times when you&apos;re available for appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvailabilityForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Your current availability settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvailabilityList availabilityByDay={availabilityByDay} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
