import Subscription from "../../models/subscriptionModel";
import User from "../../models/userModel";
import { razorpayInstance } from "../../services/razorpayService";
import { getPlanDetailsById } from "../../utils/getPlanDetails";
import { sendEventToUser } from "../../controllers/EventController";
import { fetchRazorpayInvoiceUrl } from "../subscription/fetchInvoiceUrl";

export default async function handleActivatedEvent(eventBody: any): Promise<string> {
  const webhookSubscription = eventBody.payload.subscription.entity;
  const userId = webhookSubscription.notes.userId;

  const currentSubscription = await Subscription.findOne({
    razorpaySubscriptionId: webhookSubscription.id,
    userId,
  });

  if (!currentSubscription) {
    return "No matching subscription found, webhook ignored";
  }

  if (currentSubscription.status === "active") {
    return "Subscription already active — webhook ignored";
  }

  if (currentSubscription.status === "pending") {
    // find the old_subscription from DB
    const oldSubscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (oldSubscription) {
      // Cancel old Razorpay subscription
      try {
        await razorpayInstance.subscriptions.cancel(
          oldSubscription.razorpaySubscriptionId,
          false // cancels the subscription immediately, not at the end of the cycle.
        );
      } catch (error) {
        console.error("Failed to cancel the previous Razorpay subscription:", error);
      }

      // Remove old subscription record
      await Subscription.deleteOne({ _id: oldSubscription._id });
    }
  }

  // update the user subscription document
  const invoiceId = eventBody.payload.payment?.entity?.invoice_id || null;
  let invoiceURL = null;
  if (invoiceId) {
    try {
      invoiceURL = await fetchRazorpayInvoiceUrl(invoiceId);
    } catch (error) {
      console.error("Failed to fetch Razorpay invoice URL:", error);
    }
  }
  const updateSubscriptionDoc = await Subscription.findOneAndUpdate(
    {
      userId,
      razorpaySubscriptionId: webhookSubscription.id,
    },
    {
      status: "active",
      currentPeriodStart: webhookSubscription.current_start * 1000,
      currentPeriodEnd: webhookSubscription.current_end * 1000,
      startDate: webhookSubscription.start_at * 1000,
      endDate: webhookSubscription.end_at * 1000,
      invoiceId,
      invoiceURL,
    },
    {
      new: true,
    }
  );

  if (!updateSubscriptionDoc) {
    return "Subscription document update failed";
  }

  // get planDetails from planId
  const planDetails = getPlanDetailsById(updateSubscriptionDoc.planId);

  // update the user with updated storageLimit
  if (planDetails) {
    await User.findByIdAndUpdate(webhookSubscription.notes.userId, {
      maxStorageLimit: planDetails.limits.storageBytes,
      maxFileSize: planDetails.limits.maxFileSizeBytes,
      maxDevices: planDetails.limits.maxDevices,
      subscriptionId: updateSubscriptionDoc._id,
    });
  }
  
  sendEventToUser(userId, {
    type: "subscriptionActivated",
    plan: planDetails?.name || "Free",
    message: "Your subscription has been activated!",
  });

  return "Activated event handled";
}
