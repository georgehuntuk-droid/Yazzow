/** Static exchange rates relative to GBP (1 GBP = X) */
const GBP_RATES: Record<string, number> = {
  gbp: 1.0,
  usd: 1.28,
  eur: 1.18,
  cad: 1.75,
  aud: 1.92,
  nzd: 2.10,
  jpy: 205.0,
  sgd: 1.73,
  hkd: 10.0,
  chf: 1.14,
  inr: 107.0,
  zar: 23.5,
  aed: 4.70,
  cny: 9.30,
  sek: 13.50,
};

/**
 * Automatically detects visitor preference:
 * 1. Checks localStorage for any cached choice.
 * 2. Checks browser timezone to default to USD if in America, else tutor default currency.
 */
export function detectUserCurrency(tutorCurrency: string = "gbp"): string {
  if (typeof window === "undefined") return tutorCurrency;

  const saved = localStorage.getItem("yazzow_user_currency");
  if (saved) return saved;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && (tz.startsWith("America/") || tz.startsWith("US/"))) {
      return "usd";
    }
  } catch {
    // Ignore timezone error
  }

  return tutorCurrency.toLowerCase();
}

/**
 * Performs a cross-rate conversion from one currency to another using GBP as the anchor base currency.
 */
export function convertAmount(
  amountCents: number,
  fromCurrency: string,
  toCurrency: string
): { amountCents: number; isConverted: boolean } {
  const from = fromCurrency.toLowerCase();
  const to = toCurrency.toLowerCase();

  if (from === to) {
    return { amountCents, isConverted: false };
  }

  const fromRate = GBP_RATES[from];
  const toRate = GBP_RATES[to];

  if (fromRate && toRate) {
    // Convert to GBP base (e.g. from cents), then to target currency
    const gbpAmount = amountCents / fromRate;
    const convertedAmount = Math.round(gbpAmount * toRate);
    return { amountCents: convertedAmount, isConverted: true };
  }

  return { amountCents, isConverted: false };
}

/**
 * Emits a currency change event and saves it to localStorage.
 */
export function publishCurrencyChange(currency: string): void {
  if (typeof window !== "undefined") {
    const code = currency.toLowerCase();
    localStorage.setItem("yazzow_user_currency", code);
    window.dispatchEvent(new CustomEvent("yazzow_currency_change", { detail: code }));
  }
}

/**
 * Subscribes to the currency change event bus.
 */
export function subscribeToCurrencyChange(callback: (currency: string) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<string>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener("yazzow_currency_change", handler);
  return () => window.removeEventListener("yazzow_currency_change", handler);
}
