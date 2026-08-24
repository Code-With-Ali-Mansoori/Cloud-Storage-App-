import Subscription from "../../models/subscriptionModel";
import { cancelSubscriptionService } from "../../services/subscription/index";


export default async function handleHaltedEvent(eventBody: any): Promise<string> {
  const webhookSubscription = eventBody.payload.subscription.entity;
  const userId = webhookSubscription.notes.userId;

  const subscription = await Subscription.findOne({
    userId,
    razorpaySubscriptionId: webhookSubscription.id,
  });

  if (!subscription) return "No subscription found in pending event";

  const { success } = await cancelSubscriptionService(
    subscription.razorpaySubscriptionId
  );

  return success
    ? `Subscription cancelled for user ${userId} — retries exhausted`
    : `Failed to cancel subscription for user ${userId}`;
}