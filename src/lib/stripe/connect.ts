import "server-only";

import { PUBLIC_SITE_URL } from "@/lib/constants";
import { getStripe } from "@/lib/stripe/server";

export type ConnectStatus = {
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  ready: boolean;
};

export async function createExpressAccount(email: string): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: { platform: "Yazzow" },
  });
  return account.id;
}

export async function createOnboardingLink(
  accountId: string,
): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${PUBLIC_SITE_URL}/dashboard/payments?refresh=1`,
    return_url: `${PUBLIC_SITE_URL}/dashboard/payments?connected=1`,
    type: "account_onboarding",
  });
  return link.url;
}

let cachedConnectStatus: { [accountId: string]: { status: ConnectStatus; timestamp: number } } = {};
const CONNECT_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function getConnectStatus(
  accountId: string | null | undefined,
  options?: { forceFresh?: boolean },
): Promise<ConnectStatus> {
  if (!accountId) {
    return {
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      ready: false,
    };
  }

  const now = Date.now();
  if (
    !options?.forceFresh &&
    cachedConnectStatus[accountId] &&
    now - cachedConnectStatus[accountId].timestamp < CONNECT_CACHE_TTL
  ) {
    return cachedConnectStatus[accountId].status;
  }

  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);

    const chargesEnabled = account.charges_enabled ?? false;
    const payoutsEnabled = account.payouts_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;

    const status: ConnectStatus = {
      accountId,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      ready: chargesEnabled && payoutsEnabled && detailsSubmitted,
    };

    cachedConnectStatus[accountId] = { status, timestamp: now };
    return status;
  } catch (error) {
    console.error("Error retrieving Stripe account details:", error);
    return {
      accountId,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      ready: false,
    };
  }
}

export async function createExpressDashboardLink(
  accountId: string,
): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}
