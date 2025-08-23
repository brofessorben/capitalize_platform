import express from "express";
import helmet from "helmet";
import cors from "cors";
import serverless from "serverless-http";
import { z } from "zod";
import { nanoid } from "nanoid";

/**
 * CAPITALIZE – minimal Express app for Vercel serverless.
 * Features: security headers, CORS, JSON parsing, Zod validation, centralized errors,
 * and a tiny in-memory store (swap to real DB later).
 */

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

/** ---------- Utils: errors & async wrapper ---------- */
class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const asyncHandler =
  <T extends express.RequestHandler>(fn: T): express.RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

function validate<T extends z.ZodTypeAny>(schema: T, source: "body" | "query" | "params" = "body") {
  return (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const parsed = schema.safeParse((req as any)[source]);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      const err: any = new AppError("ValidationError", 400);
      err.details = details;
      return next(err);
    }
    (req as any)[source] = parsed.data; // use parsed data downstream
    next();
  };
}

/** ---------- In-memory mock store ---------- */
type Referral = {
  id: string;
  hostEmail: string;
  vendorId: string;
  note?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};
const REFERRALS = new Map<string, Referral>();

/** ---------- Schemas ---------- */
const CreateReferralSchema = z.object({
  hostEmail: z.string().email(),
  vendorId: z.string().min(1),
  note: z.string().max(500).optional(),
});

const IdParamSchema = z.object({
  id: z.string().min(1),
});

/** ---------- Routes ---------- */

// Health check
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Create referral
app.post(
  "/referrals",
  validate(CreateReferralSchema, "body"),
  asyncHandler(async (req, res) => {
    const { hostEmail, vendorId, note } = req.body as z.infer<typeof CreateReferralSchema>;
    const id = nanoid();
    const record: Referral = {
      id,
      hostEmail,
      vendorId,
      note,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    REFERRALS.set(id, record);
    res.status(201).json({ ok: true, referral: record });
  })
);

// Get by ID
app.get(
  "/referrals/:id",
  validate(IdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof IdParamSchema>;
    const found = REFERRALS.get(id);
    if (!found) throw new AppError("Referral not found", 404);
    res.json({ ok: true, referral: found });
  })
);

// List all
app.get(
  "/referrals",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, referrals: Array.from(REFERRALS.values()) });
  })
);

/** ---------- Error middleware (last) ---------- */
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isValidation = err?.message === "ValidationError";
  const status = isValidation ? 400 : err?.status ?? 500;
  const payload: any = { ok: false, error: err?.message ?? "Internal Server Error" };
  if (isValidation && err.details) payload.details = err.details;
  res.status(status).json(payload);
});

/** ---------- Export as Vercel serverless function ---------- */
export default serverless(app);
