"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Paperclip, Send, Loader2, X } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export function SupportDialog() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: { email: "", description: "" },
  });

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

  async function onSubmit(values: SupportFormValues) {
    setSending(true);
    const fd = new FormData();
    fd.append("email", values.email);
    fd.append("description", values.description);
    files.forEach((f) => fd.append("files", f));

    const result = await sendSupportEmail(fd);
    setSending(false);

    if (result.ok) {
      toast.success("Support request sent!");
      setOpen(false);
      form.reset();
      setFiles([]);
    } else {
      toast.error(result.error ?? "Something went wrong");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          form.reset();
          setFiles([]);
        }
      }}
    >
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe your problem</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's happening? Include steps to reproduce if possible."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <Button type="submit" className="w-full gap-1.5" disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? "Sending..." : "Send Request"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
