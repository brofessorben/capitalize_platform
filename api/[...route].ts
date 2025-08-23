import express from "express";
import helmet from "helmet";
import cors from "cors";
import serverless from "serverless-http";
import { z } from "zod";
import { nanoid } from "nanoid";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "./_supabase";

const app = express();

/** ---------- Middlewares ---------- */
app.use(helmet());

// 🔒 CORS allowlist (change later to your real domains)
const allowedOrigins = ["https://yourdomain.com", "http://localhost:3000"];
app.use(
  cors({
    origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"))),
  })
);

app.use(express.json());

// ⚡ Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// 🪪 Request IDs
app.use((req, _res, next) => {
  (req as any).id = uuidv4();
  console.log(`[${(req as any).id}] ${req.method} ${req.url}`);
  next();
});

/** ---------- Utils ---------- */
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

/** ---------- Schemas ---------- */
const CreateReferralSchema = z.object({
  hostEmail: z.string().email(),
  vendorId: z.string().min(1),
  note: z.string().max(500).optional(),
});
const IdParamSchema = z.object({ id: z.string().min(1) });
const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(), // use created_at ISO as cursor (or id)
});

/** ---------- Routes ---------- */

// Health check
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Create referral (DB)
app.post(
  "/referrals",
  validate(CreateReferralSchema, "body"),
  asyncHandler(async (req, res) => {
    const { hostEmail, vendorId, note } = req.body as z.infer<typeof CreateReferralSchema>;
    const id = nanoid();

    const { data, error } = await supabase
      .from("referrals")
      .insert([{ id, host_email: hostEmail, vendor_id: vendorId, note, status: "PENDING" }])
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    res.status(201).json({
      ok: true,
      referral: {
        id: data.id,
        hostEmail: data.host_email,
        vendorId: data.vendor_id,
        note: data.note ?? undefined,
        status: data.status,
        createdAt: data.created_at,
      },
    });
  })
);

// Get by ID
app.get(
  "/referrals/:id",
  validate(IdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof IdParamSchema>;

    const { data, error } = await supabase.from("referrals").select("*").eq("id", id).single();
    if (error?.code === "PGRST116") throw new AppError("Referral not found", 404); // no rows
    if (error) throw new AppError(error.message, 500);

    res.json({
      ok: true,
      referral: {
        id: data.id,
        hostEmail: data.host_email,
        vendorId: data.vendor_id,
        note: data.note ?? undefined,
        status: data.status,
        createdAt: data.created_at,
      },
    });
  })
);

// List (cursor + limit)
app.get(
  "/referrals",
  validate(ListQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { limit, cursor } = req.query as unknown as z.infer<typeof ListQuerySchema>;
    let q = supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(limit);

    if (cursor) {
      // fetch items created BEFORE cursor timestamp
      q = q.lt("created_at", cursor);
    }

    const { data, error } = await q;
    if (error) throw new AppError(error.message, 500);

    const nextCursor = data.length === limit ? data[data.length - 1].created_at : null;

    res.json({
      ok: true,
      referrals: data.map((r) => ({
        id: r.id,
        hostEmail: r.host_email,
        vendorId: r.vendor_id,
        note: r.note ?? undefined,
        status: r.status,
        createdAt: r.created_at,
      })),
      nextCursor,
    });
  })
);

/** ---------- Error middleware ---------- */
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
