import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDoctorsWithAvailability } from "@/actions/availability";
import { BookingWizard } from "@/components/appointments/booking-wizard";

export default async function BookAppointmentPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const doctors = await getDoctorsWithAvailability();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="text-gray-600">
          Schedule your telehealth consultation in a few simple steps
        </p>
      </div>

      <BookingWizard
        doctors={doctors.map((d) => ({
          id: d.id,
          firstName: d.firstName,
          lastName: d.lastName,
          doctorProfile: d.doctorProfile,
        }))}
      />
    </div>
  );
}
