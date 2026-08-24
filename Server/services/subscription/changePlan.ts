import { StatusCodes } from "http-status-codes";
import Subscription from "../../models/subscriptionModel";
import CustomError from "../../utils/ErrorResponse";
import { getPlanDetailsById } from "../../utils/getPlanDetails";
import { getPlanChangeType } from "../../utils/getPlanChangeType";
import { downgradeSubscriptionService, upgradeSubscriptionService } from "./index";

export default async function changePlan(changePlanId: string, user: any): Promise<any> {
  const subscriptionDoc = await Subscription.findById(
    user.subscriptionId
  ).lean();

  if (!subscriptionDoc || subscriptionDoc.status !== "active") {
    throw new CustomError(
      "Active subscription not found",
      StatusCodes.BAD_REQUEST
    );
  }

  const currentPlan = getPlanDetailsById(subscriptionDoc.planId) as any;
  const desirePlan = getPlanDetailsById(changePlanId) as any;

  if (!desirePlan) {
    throw new CustomError(
      "Selected planId is not valid",
      StatusCodes.NOT_FOUND
    );
  }

  // Determine plan change type
  const planChangeType = getPlanChangeType(currentPlan, desirePlan);

  let result;

  switch (planChangeType) {
    case "invalid":
      throw new CustomError(
        "Invalid plan data received.",
        StatusCodes.BAD_REQUEST
      );

    case "no-change":
      throw new CustomError(
        "Already on the same plan.",
        StatusCodes.BAD_REQUEST
      );

    // Create a new plan in pending state
    case "upgrade":
    case "cycle-change": {
      result = await upgradeSubscriptionService({
        userId: user._id,
        desirePlan,
      });
      break;
    }

    // 1. check for storage limit exceed
    // 2. create new plan in pending state
    case "downgrade": {
      result = await downgradeSubscriptionService({
        user,
        desirePlan,
      });
      break;
    }

    default:
      throw new CustomError(
        "Unknown plan change type.",
        StatusCodes.BAD_REQUEST
      );
  }

  return {
    message: "New subscription created for the selected plan",
    status: StatusCodes.CREATED,
    data: { newSubscriptionId: result.newSubscriptionId },
  };
}
