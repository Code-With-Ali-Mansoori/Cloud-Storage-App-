import { razorpayInstance } from "../razorpayService";

export const fetchRazorpayInvoiceUrl = async (
  invoiceId: string
): Promise<string | null> => {
  const invoice = await razorpayInstance.invoices.fetch(invoiceId);
  return typeof invoice.short_url === "string" && invoice.short_url.length > 0
    ? invoice.short_url
    : null;
};