import "server-only";

/**
 * Dispatches an SMS text message using Twilio REST API.
 * Uses standard HTTP fetch to prevent external dependency conflicts.
 */
export async function sendTwilioSms(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[sendTwilioSms] Missing Twilio environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER). Skipping SMS.");
    return false;
  }

  try {
    const authString = `${accountSid}:${authToken}`;
    // Base64 encoding compatible with Node.js environments
    const base64Auth = Buffer.from(authString).toString("base64");

    const params = new URLSearchParams();
    params.append("To", to.trim());
    params.append("From", fromNumber.trim());
    params.append("Body", body);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64Auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[sendTwilioSms] Twilio API call failed:", response.status, errorText);
      return false;
    }

    console.log(`[sendTwilioSms] SMS dispatched successfully to ${to}`);
    return true;
  } catch (err) {
    console.error("[sendTwilioSms] Exception caught sending SMS:", err);
    return false;
  }
}
