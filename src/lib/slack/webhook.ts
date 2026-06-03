import "server-only";

type SlackTicketPayload = {
  name: string;
  email: string;
  category: string;
  message: string;
  source?: string;
};

export async function sendSlackTicket(payload: SlackTicketPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("SLACK_WEBHOOK_URL is not configured.");
  }

  const body = {
    text: `New Yazzow support ticket from ${payload.name}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🎒 New support ticket", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*From:*\n${payload.name}` },
          { type: "mrkdwn", text: `*Email:*\n${payload.email}` },
          { type: "mrkdwn", text: `*Category:*\n${payload.category}` },
          { type: "mrkdwn", text: `*Source:*\n${payload.source ?? "support page"}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Message:*\n${payload.message}`,
        },
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed (${response.status})`);
  }
}

export function isSlackConfigured(): boolean {
  return Boolean(process.env.SLACK_WEBHOOK_URL);
}

type SlackBookingPayload = {
  tutorName: string;
  parentEmail: string;
  studentName?: string | null;
  slotRange: string;
  amountLabel: string;
};

export async function sendSlackBookingNotification(
  payload: SlackBookingPayload,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const studentLine = payload.studentName
    ? `*Student:*\n${payload.studentName}`
    : "*Student:*\n(not provided)";

  const body = {
    text: `New lesson booked with ${payload.tutorName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📅 New lesson booking", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Tutor:*\n${payload.tutorName}` },
          { type: "mrkdwn", text: `*When:*\n${payload.slotRange}` },
          { type: "mrkdwn", text: `*Parent:*\n${payload.parentEmail}` },
          { type: "mrkdwn", text: studentLine },
          { type: "mrkdwn", text: `*Paid:*\n${payload.amountLabel}` },
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed (${response.status})`);
  }
}
