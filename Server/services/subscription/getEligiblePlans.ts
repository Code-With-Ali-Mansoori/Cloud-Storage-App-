import { StatusCodes } from "http-status-codes";
import Subscription from "../../models/subscriptionModel";
import CustomError from "../../utils/ErrorResponse";
import { getPlanDetailsById, getPlansEligibleForChange } from "../../utils/getPlanDetails";
import { getDayRemaining } from "../../utils/getDaysRemaining";

export default async function getEligiblePlansForChange(
  userId: string,
  subscriptionId: string
): Promise<any> {
  // find user's active subscription
  const subscriptionDoc = await Subscription.findOne({
    _id: subscriptionId,
    userId,
    status: "active",
  }).lean();

  if (!subscriptionDoc) {
    throw new CustomError("No active plan found!", StatusCodes.NOT_FOUND);
  }

  // eligible plan logic
  const eligiblePlans = getPlansEligibleForChange(subscriptionDoc.planId);
  // get the active plan details
  const planDetails = getPlanDetailsById(subscriptionDoc.planId);

  return {
    message: "You're eligible for a plan change",
    status: StatusCodes.OK,
    data: {
      activeSubscription: {
        planId: subscriptionDoc.planId,
        planName: planDetails?.name || "",
        planTagLine: planDetails?.tagline || "",
        planPrice: planDetails?.price || 0,
        billingCycle: planDetails?.billingCycle || "",
        nextBillingDate: subscriptionDoc.currentPeriodEnd,
        daysUntilRenewal: getDayRemaining(subscriptionDoc.currentPeriodEnd as any),
        features: planDetails?.features || [],
      },
      EligiblePlanIds: eligiblePlans,
    }
  }
}
