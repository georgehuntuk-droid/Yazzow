import { config } from "dotenv";
import Stripe from "stripe";

config({ path: ".env.local" });

const key = process.env.STRIPE_SECRET_KEY;
const pub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!key) {
  console.error("FAIL: STRIPE_SECRET_KEY missing from .env.local");
  process.exit(1);
}

const keyMode = key.startsWith("sk_live_") ? "live" : key.startsWith("sk_test_") ? "test" : "unknown";
const pubMode = pub?.startsWith("pk_live_") ? "live" : pub?.startsWith("pk_test_") ? "test" : "missing";

if (keyMode !== pubMode && pubMode !== "missing") {
  console.error(`FAIL: Key mode mismatch — secret is ${keyMode}, publishable is ${pubMode}`);
  process.exit(1);
}

const stripe = new Stripe(key);

try {
  const balance = await stripe.balance.retrieve();
  const account = await stripe.accounts.retrieve();
  console.log("OK: Stripe secret key is valid");
  console.log(`Mode: ${keyMode}`);
  console.log(`Platform account: ${account.id}`);
  console.log(`Country: ${account.country ?? "—"}`);
  console.log(
    `Connect: ${account.capabilities ? "capabilities configured" : "check Connect in dashboard"}`,
  );
  const available = balance.available.map((b) => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(", ");
  console.log(`Balance (available): ${available || "0"}`);
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("WARN: STRIPE_WEBHOOK_SECRET is empty — bookings won't confirm until webhooks are set up");
  }
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("FAIL:", msg);
  process.exit(1);
}
