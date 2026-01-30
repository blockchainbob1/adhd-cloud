import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export async function createCheckoutSession({
  appointmentId,
  consultationType,
  amount,
  customerEmail,
  patientName,
  doctorName,
  scheduledAt,
}: {
  appointmentId: string;
  consultationType: string;
  amount: number;
  customerEmail: string;
  patientName: string;
  doctorName: string;
  scheduledAt: Date;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: `${consultationType === "INITIAL" ? "Initial" : "Follow-up"} Consultation`,
            description: `Telehealth appointment with ${doctorName} on ${scheduledAt.toLocaleDateString()}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/patient/appointments?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/patient/appointments?cancelled=true`,
  });

  return session;
}

export async function getCheckoutSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId);
}
