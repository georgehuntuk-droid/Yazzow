"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { detectUserCurrency, publishCurrencyChange } from "@/lib/currency";

type CurrencySelectorProps = {
  tutorCurrency: string;
};

export function CurrencySelector({ tutorCurrency }: CurrencySelectorProps) {
  const [selected, setSelected] = useState(tutorCurrency);

  useEffect(() => {
    setSelected(detectUserCurrency(tutorCurrency));
  }, [tutorCurrency]);

  const handleChange = (val: string) => {
    setSelected(val);
    publishCurrencyChange(val);
  };

  return (
    <div className="relative flex items-center gap-1 bg-muted/30 p-1 px-2 rounded-xl border border-border/40 select-none">
      <Globe className="size-3.5 text-muted-foreground shrink-0" />
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="no-override bg-transparent border-0 outline-none text-xs font-bold text-foreground cursor-pointer py-0.5 pr-4 pl-1 h-6 focus:ring-0 focus:outline-none"
        style={{ appearance: "auto" }}
      >
        <option value="gbp">GBP (£)</option>
        <option value="usd">USD ($)</option>
        <option value="eur">EUR (€)</option>
        <option value="cad">CAD ($)</option>
        <option value="aud">AUD ($)</option>
        <option value="nzd">NZD ($)</option>
        <option value="jpy">JPY (¥)</option>
        <option value="sgd">SGD ($)</option>
        <option value="hkd">HKD ($)</option>
        <option value="chf">CHF (CHF)</option>
        <option value="inr">INR (₹)</option>
        <option value="zar">ZAR (R)</option>
        <option value="aed">AED (AED)</option>
        <option value="cny">CNY (¥)</option>
        <option value="sek">SEK (kr)</option>
      </select>
    </div>
  );
}
