"use client";

import { useState, useRef } from "react";
import * as z from "zod";
import {
  Paperclip,
  Send,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sendSupportEmail } from "@/app/support/actions";

const supportFormSchema = z.object({
  email: z.email("Enter a valid email"),
  description: z
    .string()
    .min(10, "Describe your problem in at least 10 characters"),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 3;
const ACCEPTED = ".png,.jpg,.jpeg,.pdf,.txt,.csv,.doc,.docx";

const RATE_LIMIT_KEY = "support_email_attempts";
const RATE_LIMIT_MAX = 5;

function getRateLimitState(): { count: number; resetTime: number } {
  if (typeof window === "undefined") return { count: 0, resetTime: 0 };
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { count: 0, resetTime: 0 };
    const data = JSON.parse(raw) as { count: number; resetTime: number };
    if (Date.now() > data.resetTime) {
      localStorage.removeItem(RATE_LIMIT_KEY);
      return { count: 0, resetTime: 0 };
    }
    return data;
  } catch {
    return { count: 0, resetTime: 0 };
  }
}

function incrementRateLimit(): { remaining: number; limited: boolean } {
  const state = getRateLimitState();
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;

  if (state.count === 0 || now > state.resetTime) {
    const newState = { count: 1, resetTime: now + windowMs };
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
    return { remaining: RATE_LIMIT_MAX - 1, limited: false };
  }

  if (state.count >= RATE_LIMIT_MAX) {
    return { remaining: 0, limited: true };
  }

  const newState = { count: state.count + 1, resetTime: state.resetTime };
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
  return { remaining: RATE_LIMIT_MAX - newState.count, limited: false };
}

export function SupportDialog() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [remaining, setRemaining] = useState<number | null>(() => {
    const state = getRateLimitState();
    return RATE_LIMIT_MAX - state.count;
  });

  // Manual form state (no react-hook-form to avoid Zod v4 resolver issues)
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<"email" | "description", string | undefined>
  >({ email: undefined, description: undefined });
  const fileRef = useRef<HTMLInputElement>(null);

  const isRateLimited = remaining !== null && remaining <= 0;

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const next = [...files];
    for (const f of Array.from(newFiles)) {
      if (next.length >= MAX_FILES) break;
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" exceeds 5MB`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function clearForm() {
    setEmail("");
    setDescription("");
    setFiles([]);
    setFieldErrors({ email: undefined, description: undefined });
  }

  function resetForm() {
    clearForm();
    setSubmitResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitResult(null);
    setFieldErrors({ email: undefined, description: undefined });

    if (isRateLimited) {
      setSubmitResult({
        type: "error",
        message: `Daily limit reached. You can send up to ${RATE_LIMIT_MAX} support emails per day.`,
      });
      return;
    }

    // Validate manually with safeParse (Zod v4 compatible)
    const result = supportFormSchema.safeParse({ email, description });
    if (!result.success) {
      const errors: Record<"email" | "description", string | undefined> = {
        email: undefined,
        description: undefined,
      };
      for (const issue of result.error.issues) {
        const path = issue.path[0] as "email" | "description";
        if (path) errors[path] = issue.message;
      }
      setFieldErrors(errors);
      setSubmitResult({
        type: "error",
        message: result.error.issues[0]?.message ?? "Please fix the errors below",
      });
      return;
    }

    const fd = new FormData();
    fd.append("email", email);
    fd.append("description", description);
    files.forEach((f) => fd.append("files", f));

    setSending(true);
    try {
      const serverResult = await sendSupportEmail(fd);

      if (serverResult.ok) {
        const { remaining: r } = incrementRateLimit();
        setRemaining(r);
        setSubmitResult({
          type: "success",
          message: `Support request sent successfully!${r > 0 ? ` (${r} remaining today)` : ""}`,
        });
        clearForm();
        toast.success("Support request sent!");
      } else {
        setSubmitResult({
          type: "error",
          message: serverResult.error ?? "Something went wrong",
        });
        if (serverResult.remaining !== undefined) {
          setRemaining(serverResult.remaining);
        }
      }
    } catch {
      setSubmitResult({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setSending(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      resetForm();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
          Support
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get Support</DialogTitle>
          <DialogDescription>
            Describe your issue and we&apos;ll get back to you.
          </DialogDescription>
        </DialogHeader>

        {/* Inline feedback banner */}
        {submitResult && (
          <div
            className={`animate-in fade-in slide-in-from-top-2 duration-200 flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${
              submitResult.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {submitResult.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{submitResult.message}</span>
          </div>
        )}

        {/* Rate limit warning — only show when no active result banner */}
        {remaining !== null && !isRateLimited && remaining <= 2 && submitResult?.type !== "success" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {remaining === 0
                ? "No more emails remaining today"
                : `${remaining} email${remaining === 1 ? "" : "s"} remaining today`}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="support-email">Email</Label>
            <Input
              id="support-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              disabled={isRateLimited || sending}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="animate-in fade-in slide-in-from-top-1 duration-150 text-sm text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="support-desc">Describe your problem</Label>
            <Textarea
              id="support-desc"
              placeholder="What's happening? Include steps to reproduce if possible."
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description)
                  setFieldErrors((p) => ({ ...p, description: undefined }));
              }}
              disabled={isRateLimited || sending}
              aria-invalid={!!fieldErrors.description}
              aria-describedby={
                fieldErrors.description ? "desc-error" : undefined
              }
            />
            {fieldErrors.description && (
              <p id="desc-error" className="animate-in fade-in slide-in-from-top-1 duration-150 text-sm text-destructive">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Attachments{" "}
              <span className="text-muted-foreground font-normal">
                (optional, max {MAX_FILES})
              </span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
              disabled={isRateLimited || sending}
            >
              <Paperclip className="h-3.5 w-3.5" />
              Add file
            </Button>

            {files.length > 0 && (
              <ul className="space-y-1">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                  >
                    <span className="truncate">{f.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeFile(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gap-1.5"
            disabled={sending || isRateLimited}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending
              ? "Sending..."
              : isRateLimited
                ? "Daily limit reached"
                : "Send Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
