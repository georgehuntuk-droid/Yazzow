import { MarketingShell } from "@/components/layout/marketing-shell";
import { BRAND_NAME } from "@/lib/constants";
import { Shield, Key, Lock, Server, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Security · ${BRAND_NAME}`,
  description: `${BRAND_NAME} prioritizes security at every level, providing robust measures to protect your data and ensure safe platform usage.`,
};

export default function SecurityPage() {
  return (
    <MarketingShell>
      <div className="bg-gradient-to-b from-primary/5 via-transparent to-transparent flex-1">
        <div className="yazz-container max-w-3xl py-16 sm:py-20 space-y-12">
          {/* Page Header */}
          <div className="text-center space-y-4 border-b border-border/60 pb-10">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto shadow-inner">
              <Shield className="size-8" />
            </div>
            <h1 className="font-heading text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Security Overview
            </h1>
            <p className="max-w-xl mx-auto text-base text-muted-foreground leading-relaxed font-semibold">
              {BRAND_NAME} prioritizes security at every level, providing robust measures to protect your data and ensure safe platform usage.
            </p>
          </div>

          {/* Intro Section */}
          <div className="p-6 rounded-2xl border border-primary/10 bg-primary/[0.01] text-sm sm:text-base leading-relaxed text-muted-foreground text-center font-medium">
            With flexible access controls, encrypted passwords, multi-factor authentication, and secure server infrastructure, your business and user information remain safeguarded against unauthorized access.
          </div>

          {/* Feature Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 transition duration-300 space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Flexible Access Controls</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tutor data, student logs, and messaging threads are fully compartmentalized. Row Level Security (RLS) rules guarantee only you and your designated families can access specific classroom material.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 transition duration-300 space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Key className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Encrypted Passwords</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All login credentials are secured using industry-standard hashing and encryption protocols before storage, ensuring passwords remain confidential and secure.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 transition duration-300 space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Multi-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Advanced verification steps prevent credential theft. Enable secondary authentication methods to block unauthorized logins, even if email credentials are compromised.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 transition duration-300 space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Server className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Secure Server Infrastructure</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Deployed using protected cloud databases with real-time DDoS protection, strict firewall filters, and daily database backup systems to ensure your operational continuity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
