import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import Webhook from "../models/razorpayWebhookModel";
import { WebhookServices } from "../services/index";
import CustomError from "../utils/ErrorResponse";

export const razorpayWebhookController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const webhookBody = req.body;
    const webhookSignature = (req.headers["x-razorpay-signature"] as string) || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    const isValidRequest = validateWebhookSignature(
      req.rawBody?.toString("utf8") || JSON.stringify(webhookBody),
      webhookSignature,
      webhookSecret
    );

    if (!isValidRequest) {
      throw new CustomError("Invalid signature", StatusCodes.BAD_REQUEST);
    }

    const event = webhookBody?.event;
    if (typeof event !== "string") {
      throw new CustomError("Webhook event is missing", StatusCodes.BAD_REQUEST);
    }

    const webhookSubscription = webhookBody?.payload?.subscription?.entity;
    const userId = webhookSubscription?.notes?.userId || null;

    if (!webhookSubscription) {
      res.status(StatusCodes.OK).send("Webhook received and ignored");
      return;
    }

    const webhookDoc = await Webhook.create({
      userId,
      razorpaySubscriptionId: webhookSubscription.id,
      eventType: event,
      signature: webhookSignature,
      payload: webhookBody,
      status: "pending",
    });

    const message = await WebhookServices.RazorpayEventHandler(
      event,
      webhookBody
    );

    webhookDoc.status = "processed";
    webhookDoc.responseMessage = message;
    webhookDoc.processedAt = new Date();
    await webhookDoc.save();

    res.status(StatusCodes.OK).send("Webhook processed successfully");
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    next(error);
  }
};
