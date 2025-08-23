import express from "express";
import helmet from "helmet";
import cors from "cors";
import serverless from "serverless-http";
import { z } from "zod";
import { nanoid } from "nanoid";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";

const app = express();

/** ---------- Middlewares ---------- */
app.use(helmet());

// 🔒 CORS allowlist (replace with your domains later)
const allowedOrigins = ["https://yourdomain.com", "http://localhost:3000"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

// ⚡ Rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// 🪪 Request IDs for logging/tracing
app.use((req, _res, next) => {
  (req as any).id = uuidv4();
  console.log(`[${(req as any).id}] ${req.method} ${req.url}`);
  next();
});

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
    (req as any)[source] = parsed.data;
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
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isValidation = err?.message === "ValidationError";
  const status = isValidation ? 400 : err?.status ?? 500;
  const payload: any = {
    ok: false,
    error: err?.message ?? "Internal Server Error",
    requestId: (req as any).id,
  };
  if (isValidation && err.details) payload.details = err.details;
  res.status(status).json(payload);
});

/** ---------- Export ---------- */
export default serverless(app);
