import { RegisterForm } from "@/components/forms/register-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRedirectPath } from "@/actions/auth";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    const path = await getRedirectPath(session.user.role);
    redirect(path);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">ADHD Clinic</h1>
        <p className="mt-2 text-gray-600">Create your patient account</p>
      </div>
      <RegisterForm />
    </div>
  );
}
