import Subscription from "../../models/subscriptionModel";


export default async function handlePaymentFailureEvent(eventBody: any): Promise<string> {
  const webhookSubscription = eventBody.payload.subscription.entity;
  const userId = webhookSubscription.notes.userId;

  const subscription = await Subscription.findOne({
    userId,
    razorpaySubscriptionId: webhookSubscription.id,
  });

  if (!subscription) return "No subscription found in pending event";

  subscription.status = "renewal_failed";
  await subscription.save();

  return "Handled subscription.pending event";
}