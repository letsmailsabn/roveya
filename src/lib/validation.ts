import { z } from "zod";

export const indianMobileSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, ""))
  .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number");

export const createRideSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    mobile: indianMobileSchema,
    seats: z.coerce.number().int().min(1).max(8),
    destinationId: z.string().uuid("Select a destination"),
  })
  .strict();

export const createOrderSchema = z
  .object({
    publicId: z.string().trim().min(4).max(40),
  })
  .strict();

export const verifyPaymentSchema = z
  .object({
    publicId: z.string().trim().min(4).max(40),
    razorpay_order_id: z.string().trim().min(4),
    razorpay_payment_id: z.string().trim().min(4),
    razorpay_signature: z.string().trim().min(8),
  })
  .strict();

export const paymentMethodSchema = z.object({
  method: z.enum(["ONLINE", "CASH"]),
});

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  feedback: z.string().trim().max(800).optional().default(""),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: indianMobileSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().min(8).max(2000),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const destinationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  farePerSeat: z.coerce.number().int().min(1).max(100000),
  description: z.string().trim().max(240).optional().default(""),
  active: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export function formatInr(paiseOrRupees: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paiseOrRupees);
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatMobileDisplay(mobile: string) {
  const d = digitsOnly(mobile).slice(-10);
  if (d.length !== 10) return mobile;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
