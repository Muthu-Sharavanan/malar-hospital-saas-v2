import { z } from 'zod';

// Patient Registration Schema
export const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  age: z.coerce.number().int().min(0, "Age cannot be negative").max(150, "Age is too high"),
  gender: z.enum(["Male", "Female", "Other"]),
  address: z.string().max(500).optional().or(z.literal('')),
  doctorId: z.string().min(1, "Doctor selection is required"),
  patientId: z.string().optional(), // For existing patients
  visitDate: z.string().optional(),
  visitTime: z.string().optional(),
  reason: z.string().max(500).optional(),
  abhaId: z.string().max(20).optional().or(z.literal('')),
  consentGranted: z.boolean().optional().default(false)
});

// Consultation Schema
export const consultationSchema = z.object({
  visitId: z.string().min(1),
  chiefComplaints: z.string().max(2000).optional(),
  history: z.string().max(5000).optional(),
  examination: z.string().max(5000).optional(),
  diagnosis: z.string().max(2000).optional(),
  investigationAdvised: z.string().max(2000).optional(),
  nextReview: z.string().max(500).optional(),
  isReview: z.boolean().optional(),
  drugs: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string(),
    duration: z.string(),
    instructions: z.string().optional()
  })).optional()
});

// Billing Schema
export const billSchema = z.object({
  billId: z.string().optional(),
  visitId: z.string().optional(),
  type: z.enum(['CONSULTATION', 'LAB', 'PHARMACY', 'SURGERY']),
  paymentMode: z.enum(['CASH', 'UPI']).optional(),
  discount: z.coerce.number().min(0).default(0),
  waiverReason: z.string().max(500).optional(),
  authorizingDocId: z.string().optional(),
  paymentStatus: z.enum(['PAID', 'UNPAID', 'WAIVED', 'REFUNDED']).optional(),
  refundAmount: z.coerce.number().min(0).default(0),
  refundReason: z.string().max(500).optional()
});
