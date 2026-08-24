import { StatusCodes } from "http-status-codes";
import Subscription from "../../models/subscriptionModel";
import CustomError from "../../utils/ErrorResponse";
import { getPlanDetailsById } from "../../utils/getPlanDetails";
import File from "../../models/fileModel";
import Directory from "../../models/dirModel";
import redisClient from "../../config/redis";
import { getDayRemaining } from "../../utils/getDaysRemaining";


export default async function subscriptionStatus(userId: string, userDetails: any): Promise<any> {
  // Find the user's current subscription
  const subscriptionDoc = await Subscription.findOne({
    userId,
    _id: userDetails.subscriptionId,
  }).lean();

  // Case 1 -> No subscription found
  if (!subscriptionDoc) {
    throw new CustomError(
      "No active subscription found!",
      StatusCodes.NOT_FOUND
    );
  }

  // Case 2 -> Subscription renewal failed — inform user to retry payment
  if (subscriptionDoc.status === "renewal_failed") {
    throw new CustomError(
      "Subscription renewal failed — please retry payment.",
      StatusCodes.CONFLICT,
      { details: "renewal_failed" }
    );
  }

  // Case 3 -> Active subscription — calculate usage and plan details
  if (subscriptionDoc.status === "active") {
    const planDetails = getPlanDetailsById(subscriptionDoc.planId);

    // total files of the user
    const totalFiles = await File.countDocuments({ userId }).lean();

    // total files uploaded during subscription period
    const filesUploadedInSubscription = await File.countDocuments({
      userId,
      createdAt: { $gte: new Date(subscriptionDoc.startDate as any) },
    });

    // Storage used based on root directory
    const rootDirSize =
      (await Directory.findById(userDetails.rootDirId).select("size").lean())
        ?.size || 0;

    // number of files shared by the user
    const sharedFiles = await File.countDocuments({
      userId,
      $or: [
        { "sharedViaLink.enabled": true },
        { sharedWith: { $not: { $size: 0 } } },
      ],
    });

    // number of active device sessions
    const activeSession = await redisClient.countUserSessions(userId);

    return {
      message: "Active plan found!",
      status: StatusCodes.OK,
      data: {
        subscription: {
          hasActivePlan: true,
          status: subscriptionDoc.status,
          planId: subscriptionDoc.planId,
          planName: planDetails?.name || "",
          planTagLine: planDetails?.tagline || "",
          planPrice: planDetails?.price || 0,
          billingCycle: planDetails?.billingCycle || "",
          nextBillingDate: subscriptionDoc.currentPeriodEnd,
          daysUntilRenewal: getDayRemaining(subscriptionDoc.currentPeriodEnd as any),
          features: planDetails?.features || [],
          cancellationScheduled: false,
          cancellationDate: null,
          invoiceURL: `${process.env.RAZORPAY_INVOICE_LINK}${subscriptionDoc.invoiceId}`,
        },
        usage: {
          maxFileUploadSize: planDetails?.limits?.maxFileSize || "0 MB",
          storageUsed: rootDirSize,
          storageTotal: userDetails.maxStorageLimit,
          storagePercentage: (
            (rootDirSize / userDetails.maxStorageLimit) *
            100
          ).toFixed(1),
          totalFiles,
          sharedFiles,
          devicesConnected: activeSession,
          maxDevices: planDetails?.limits?.maxDevices || 1,
          filesUploadedInSubscription,
        },
      },
    };
  }

  // Subscription exists but with different status.
  throw new CustomError("No active subscription found!", StatusCodes.NOT_FOUND);
}
