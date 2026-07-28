import { Resend } from "resend";
import { env } from "./env";

export interface SendMailParams {
  from: string;
  to: string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}

export interface MailService {
  send(params: SendMailParams): Promise<{ id: string }>;
}

function createResendMailService(): MailService {
  const resend = new Resend(env.RESEND_API_KEY);

  return {
    async send({ from, to, subject, html, attachments }) {
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        attachments,
      });

      if (error) throw new Error(error.message);
      if (!data?.id) throw new Error("No email id returned");
      return { id: data.id };
    },
  };
}

// ponytail: single impl, swap by changing this function
export const mail: MailService = createResendMailService();
