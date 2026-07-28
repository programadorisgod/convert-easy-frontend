"use server";

import * as z from "zod";
import { headers } from "next/headers";
import { mail } from "@/lib/mail";
import { env } from "@/lib/env";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 3;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory rate limit store: IP → { count, resetTime }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  cleanupOldEntries();
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

const supportSchema = z.object({
  email: z.email("Invalid email"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export type SupportInput = z.infer<typeof supportSchema>;

export async function sendSupportEmail(
  formData: FormData
): Promise<{ ok: boolean; error?: string; remaining?: number }> {
  try {
    // Rate limiting by IP
    const hdrs = await headers();
    const forwarded = hdrs.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return {
        ok: false,
        error: `Daily limit reached. You can send up to ${RATE_LIMIT_MAX} support emails per day.`,
        remaining: 0,
      };
    }

    const email = formData.get("email") as string;
    const description = formData.get("description") as string;

    const parsed = supportSchema.safeParse({ email, description });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message, remaining };
    }

    // Collect files from FormData
    const files: { filename: string; content: string }[] = [];
    const fileEntries = formData.getAll("files") as File[];

    for (const file of fileEntries) {
      if (file.size === 0) continue;
      if (file.size > MAX_FILE_SIZE) {
        return {
          ok: false,
          error: `File "${file.name}" exceeds 5MB limit`,
        };
      }
      if (files.length >= MAX_FILES) {
        return { ok: false, error: `Maximum ${MAX_FILES} files allowed` };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      files.push({
        filename: file.name,
        content: buffer.toString("base64"),
      });
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="border-bottom: 2px solid #eee; padding-bottom: 8px;">
          New Support Request
        </h2>
        <p><strong>From:</strong> ${parsed.data.email}</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="white-space: pre-wrap;">${parsed.data.description}</p>
        ${files.length > 0 ? `<p><em>${files.length} file(s) attached</em></p>` : ""}
      </div>
    `;

    await mail.send({
      from: "Convert Easy <onboarding@resend.dev>",
      to: [env.RESEND_EMAIL],
      subject: `Support: ${parsed.data.email}`,
      html,
      attachments: files,
    });

    return { ok: true, remaining };
  } catch {
    return { ok: false, error: "Failed to send email. Try again later." };
  }
}
