import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const appointmentId = session.metadata?.appointmentId;

        if (appointmentId) {
          // Update payment status
          await prisma.$transaction([
            prisma.payment.update({
              where: { appointmentId },
              data: {
                status: "COMPLETED",
                stripePaymentId: session.payment_intent as string,
                paidAt: new Date(),
              },
            }),
            prisma.appointment.update({
              where: { id: appointmentId },
              data: { status: "CONFIRMED" },
            }),
          ]);

          console.log(`Payment completed for appointment: ${appointmentId}`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const appointmentId = session.metadata?.appointmentId;

        if (appointmentId) {
          // Mark payment as failed
          await prisma.payment.update({
            where: { appointmentId },
            data: { status: "FAILED" },
          });

          console.log(`Payment expired for appointment: ${appointmentId}`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Find and update the payment
          const payment = await prisma.payment.findFirst({
            where: { stripePaymentId: paymentIntentId },
          });

          if (payment) {
            await prisma.$transaction([
              prisma.payment.update({
                where: { id: payment.id },
                data: { status: "REFUNDED" },
              }),
              prisma.appointment.update({
                where: { id: payment.appointmentId },
                data: { status: "CANCELLED" },
              }),
            ]);

            console.log(`Refund processed for payment: ${payment.id}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
