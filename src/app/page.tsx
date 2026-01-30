import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRedirectPath } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    const path = await getRedirectPath(session.user.role);
    redirect(path);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">ADHD Clinic</h1>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Book Appointment</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold text-gray-900 leading-tight">
            Expert ADHD Care,
            <br />
            <span className="text-blue-600">From Anywhere</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Access specialized ADHD consultations through secure telehealth
            appointments. Get diagnosed, treated, and supported by experienced
            specialists.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Book Your Consultation
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Telehealth Consultations
            </h3>
            <p className="text-gray-600">
              Secure video appointments from the comfort of your home. No travel
              required.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Digital Prescriptions
            </h3>
            <p className="text-gray-600">
              Receive your prescriptions electronically. Easy to access and
              share with your pharmacy.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Easy Booking
            </h3>
            <p className="text-gray-600">
              Book appointments online at times that suit your schedule. Initial
              and follow-up options available.
            </p>
          </div>
        </div>

        <div className="mt-24 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Consultation Options
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border-2 border-blue-200">
              <h4 className="text-lg font-semibold text-gray-900">
                Initial Consultation
              </h4>
              <p className="text-3xl font-bold text-blue-600 mt-2">$500</p>
              <p className="text-gray-600 mt-1">30 minutes</p>
              <p className="text-sm text-gray-500 mt-4">
                Comprehensive assessment for new patients. Includes diagnosis
                discussion and treatment planning.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">
                Follow-up Consultation
              </h4>
              <p className="text-3xl font-bold text-gray-900 mt-2">$300</p>
              <p className="text-gray-600 mt-1">15 minutes</p>
              <p className="text-sm text-gray-500 mt-4">
                For existing patients. Medication review, progress check, and
                prescription renewal.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-16 border-t text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} ADHD Clinic. All rights reserved.</p>
      </footer>
    </div>
  );
}
