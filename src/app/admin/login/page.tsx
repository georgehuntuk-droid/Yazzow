import type { Metadata } from "next";
import { AdminLoginClient } from "./admin-login-client";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Admin Sign in · ${BRAND_NAME}`,
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
