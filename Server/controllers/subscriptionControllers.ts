import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import Subscription from "../models/subscriptionModel";
import { SubscriptionServices } from "../services/index";
import CustomSuccess from "../utils/SuccessResponse";
import { validateInputs } from "../utils/ValidateInputs";
import {
  changePlanSchema,
  createSubscriptionSchema,
} from "../validators/commonValidation";
import { razorpayInstance } from "../services/razorpayService";
import handleActivatedEvent from "../services/webhook/handleActivatedEvent";

export const createSubscription = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { planId } = validateInputs(createSubscriptionSchema, req.body);
    const userId = req.user._id;
    const { message, status, data } = await SubscriptionServices.CreateSubscription(userId, planId);
    return CustomSuccess.send(res, message, status, data);
  } catch (error) {
    console.log('Error in createSubscription Controller => ' ,error);
    next(error);
  }
};

export const checkSubscripitonStatus = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user._id;
    const userDetails = req.user;
    const { message, status, data } = await SubscriptionServices.Status(
      userId,
      userDetails
    );
    return CustomSuccess.send(res, message, status, data);
  } catch (error) {
    next(error);
  }
};

export const confirmSubscription = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { subscriptionId } = req.body || {};
    const userId = req.user._id.toString();

    if (!subscriptionId || typeof subscriptionId !== "string") {
      return CustomSuccess.send(res, "Subscription ID is required", StatusCodes.BAD_REQUEST);
    }

    const subscriptionDoc = await Subscription.findOne({
      userId,
      razorpaySubscriptionId: subscriptionId,
    });

    if (!subscriptionDoc) {
      return CustomSuccess.send(res, "Subscription not found", StatusCodes.NOT_FOUND);
    }

    if (subscriptionDoc.status === "active") {
      return CustomSuccess.send(res, "Subscription is active", StatusCodes.OK, {
        active: true,
      });
    }

    const razorpaySubscription = await razorpayInstance.subscriptions.fetch(subscriptionId);
    if (razorpaySubscription.status !== "active") {
      return CustomSuccess.send(res, "Payment is still being confirmed", StatusCodes.ACCEPTED, {
        active: false,
        razorpayStatus: razorpaySubscription.status,
      });
    }

    const subscriptionEntity = {
      ...razorpaySubscription,
      notes: {
        ...(razorpaySubscription.notes || {}),
        userId,
      },
    };

    await handleActivatedEvent({
      payload: {
        subscription: { entity: subscriptionEntity },
        payment: { entity: { invoice_id: (razorpaySubscription as any).invoice_id || null } },
      },
    });

    return CustomSuccess.send(res, "Subscription is active", StatusCodes.OK, {
      active: true,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = req.user;
    const { message, status } =
      await SubscriptionServices.CancelSubscription(user);
    return CustomSuccess.send(res, message, status);
  } catch (error) {
    next(error);
  }
};

export const plansEligibleforChange = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user._id;
    const subscriptionId = req.user.subscriptionId;
    const { message, status, data } =
      await SubscriptionServices.GetEligiblePlansForChange(
        userId,
        subscriptionId
      );
    return CustomSuccess.send(res, message, status, data);
  } catch (error) {
    next(error);
  }
};

export const changePlan = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { changePlanId } = validateInputs(changePlanSchema, req.body);
    const user = req.user;
    const { message, status, data } = await SubscriptionServices.ChangePlan(
      changePlanId,
      user
    );
    return CustomSuccess.send(res, message, status, data);
  } catch (error) {
    next(error);
  }
};

export const verifySubscriptionId = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { subscriptionId, userId } = req.query;
    if (!subscriptionId || !userId) {
      throw new Error(
        "Missing required query parameters: subscriptionId and userId"
      );
    }

    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionId,
      userId,
    })
      .lean()
      .exec();

    if (!subscription) {
      return CustomSuccess.send(res, "Subscription ID is invalid", 403, {
        isValid: false,
        status: "not_found",
      });
    }

    return CustomSuccess.send(res, "Subscription ID is valid", 200, {
      isValid: true,
      status: (subscription as any).status,
    });
  } catch (error) {
    next(error);
  }
};
