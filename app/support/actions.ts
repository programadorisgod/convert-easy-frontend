"use server";

import * as z from "zod";
import { mail } from "@/lib/mail";
import { env } from "@/lib/env";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 3;

const supportSchema = z.object({
  email: z.email("Invalid email"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export type SupportInput = z.infer<typeof supportSchema>;

export async function sendSupportEmail(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const email = formData.get("email") as string;
    const description = formData.get("description") as string;

    const parsed = supportSchema.safeParse({ email, description });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
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

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to send email. Try again later." };
  }
}
