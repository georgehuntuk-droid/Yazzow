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
