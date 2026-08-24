import File from "../../models/fileModel";
import Subscription from "../../models/subscriptionModel";
import User from "../../models/userModel";
import FileSerivces from "../../services/file/index";
import { getPlanDetailsById } from "../../utils/getPlanDetails";

export default async function handleCancelledEvent(eventBody: any): Promise<string> {
  const webhookSubscription = eventBody.payload.subscription.entity;

  const user = await User.findById(webhookSubscription.notes.userId)
    .populate("subscriptionId")
    .lean();

  // Case 1 -> User account has been deleted and subscription has cancelled.
  if (!user) {
    return "User not found, webhook ignored";
  }

  const subscriptionDocument = await Subscription.findOne({
    userId: user._id,
    razorpaySubscriptionId: webhookSubscription.id,
  });
  if (!subscriptionDocument) {
    return "Subscription not found for user, webhook ignored";
  }

  // Case 2 -> User planned to take another subscription and previous one has cancelled.
  if (subscriptionDocument.status === "created") {
    return "User selected different plan, webhook ignored";
  }

  // Case 3 -> Subscription cancelled event triggered due to user cancelled it from the UI/cancel-API OR revoked the mandate
  if (
    subscriptionDocument.status === "cancelled" ||
    webhookSubscription.status === "cancelled"
  ) {
    // 0) get free-plan (default) details
    const defaultPlan = getPlanDetailsById("default");

    // 1) Revoke user access (storageLimit, maxDevice, fileLimit, etc...)
    if (defaultPlan) {
      await User.findByIdAndUpdate(user._id, {
        subscriptionId: null,
        maxStorageLimit: defaultPlan.limits.storageBytes,
        maxDevices: defaultPlan.limits.maxDevices,
        maxFileSize: defaultPlan.limits.maxFileSizeBytes,
        isDeleted: false, // In case user was marked deleted due to paused subscription
      });
    }

    // 2) Delete all the files uploaded under the subscription period.
    const filesUploadedInSubscription = await File.find({
      userId: user._id,
      createdAt: { $gte: new Date(subscriptionDocument.startDate as any) },
    });

    // delete each file from DB and S3
    for (const file of filesUploadedInSubscription) {
      await FileSerivces.DeleteFileService(file._id as any, user._id as any);
    }

    // 3) Delete the subscription document
    await subscriptionDocument.deleteOne();

    return "Cancelled subscription & revoked acess";
  }

  return "Cancelled event unhandled condition";
}