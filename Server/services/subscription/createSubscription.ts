import { StatusCodes } from "http-status-codes";
import Subscription from "../../models/subscriptionModel";
import { getPlanDetailsById } from "../../utils/getPlanDetails";
import CustomError from "../../utils/ErrorResponse";
import { razorpayInstance } from "../razorpayService";

export default async function createSubscription(userId: string, planId: string): Promise<any> {
  const planDetails = getPlanDetailsById(planId);

  if (!planDetails) {
    throw new CustomError("Plan ID is not valid", StatusCodes.NOT_FOUND);
  }

  const subscriptionDoc = await Subscription.findOne({ userId }).sort({ createdAt: -1 });

  if (subscriptionDoc) {
    if (subscriptionDoc.status === "active") {
      throw new CustomError(
        "You already have an active subscription",
        StatusCodes.BAD_REQUEST
      );
    }

    const isSamePlan = subscriptionDoc.planId === planId;
    const isPendingState = ["created", "pending"].includes(subscriptionDoc.status);

    if (isPendingState) {
      let razorpaySub: any = null;

      try {
        razorpaySub = await razorpayInstance.subscriptions.fetch(
          subscriptionDoc.razorpaySubscriptionId
        );
      } catch {
        razorpaySub = null;
      }

      if (isSamePlan && razorpaySub && ["created", "authenticated", "active"].includes(razorpaySub.status)) {
        return {
          status: StatusCodes.CREATED,
          message: "Subscription already exists.",
          data: { subscriptionId: subscriptionDoc.razorpaySubscriptionId },
        };
      }

      if (subscriptionDoc.razorpaySubscriptionId) {
        try {
          await razorpayInstance.subscriptions.cancel(
            subscriptionDoc.razorpaySubscriptionId,
            false
          );
        } catch {
          // Ignore cancel failures here; the webhook will resolve the final state.
        }
      }

      let subscription: any;
      try {
        subscription = await razorpayInstance.subscriptions.create({
          plan_id: planId,
          total_count: 12,
          notes: { userId: userId.toString() },
        });
      } catch (error: any) {
        console.error("Razorpay create subscription error:", error);
        throw new CustomError(
          error?.error?.description ||
            error?.message ||
            "Failed to create subscription",
          StatusCodes.BAD_GATEWAY
        );
      }

      await Subscription.findByIdAndUpdate(subscriptionDoc._id, {
        planId,
        razorpaySubscriptionId: subscription.id,
        status: "created",
        currentPeriodStart: null,
        currentPeriodEnd: null,
        startDate: null,
        endDate: null,
        invoiceId: null,
        invoiceURL: null,
      });

      return {
        status: StatusCodes.CREATED,
        message: "Subscription created successfully",
        data: { subscriptionId: subscription.id },
      };
    }
  }

  let subscription: any;
  try {
  
    subscription = await razorpayInstance.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      notes: { userId: userId.toString() },
    });
  } catch (error: any) {
    
    console.error("Razorpay create subscription error:", error);
    throw new CustomError(
      error?.error?.description ||
        error?.message ||
        "Failed to create subscription",
      StatusCodes.BAD_GATEWAY
    );
  }

  if (!subscription) {
    throw new CustomError(
      "Failed to create subscription",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  await Subscription.create({
    planId: subscription.plan_id,
    userId,
    razorpaySubscriptionId: subscription.id,
    currentPeriodEnd: null,
    currentPeriodStart: null,
    endDate: null,
    startDate: null,
    invoiceId: null,
    invoiceURL: null,
    status: "created",
  });

  return {
    status: StatusCodes.CREATED,
    message: "Subscription created successfully",
    data: { subscriptionId: subscription.id },
  };
}
