/**
 * Helper to identify connection and database resolution errors.
 * Useful for graceful degradation when Supabase is offline, paused, or misconfigured.
 */
export function isConnectionError(error: any): boolean {
  if (!error) return false;
  
  const msg = String(error.message || error).toLowerCase();
  
  return (
    msg.includes("fetch failed") ||
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("network error") ||
    msg.includes("failed to fetch") ||
    msg.includes("database connection") ||
    msg.includes("supabase_secret_key") ||
    msg.includes("supabase_url")
  );
}

/**
 * Executes a Supabase query/operation inside a try/catch boundary.
 * Returns the fallback value on connection failures instead of crashing the server/component.
 */
export async function safeDbCall<T>(
  operation: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error("[Safe DB Call] Uncaught database exception caught safely:", error);
    return fallbackValue;
  }
}
