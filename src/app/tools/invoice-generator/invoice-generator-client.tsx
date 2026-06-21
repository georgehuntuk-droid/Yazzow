"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Printer, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Upload, 
  X, 
  FileText, 
  Briefcase, 
  User, 
  Receipt 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LineItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
}

const DEFAULT_INVOICE_DATA = {
  invoiceNumber: "INV-2026-001",
  issueDate: "",
  dueDate: "",
  currency: "gbp",
  
  // Sender Details
  senderName: "Alex Mercer",
  senderBusiness: "Mercer Physics & Maths Academy",
  senderEmail: "alex@mercertutoring.co.uk",
  senderPhone: "+44 7700 900077",
  senderAddress: "Flat 4B, 12 High Street\nLondon, SW1A 1AA",
  logoUrl: "",
  avatarColor: "violet",
  
  // Recipient Details
  clientName: "Sarah Jenkins (Parent of Thomas)",
  clientEmail: "sarah.jenkins@example.com",
  clientAddress: "45 Meadow Lane\nRichmond, TW10 6TF",
  
  // Line items
  items: [
    { id: "1", description: "A-Level Physics Tuition (1-on-1) - Mechanics Review", hours: 2, rate: 45 },
    { id: "2", description: "GCSE Mathematics Lesson - Calculus Introduction", hours: 1.5, rate: 40 },
    { id: "3", description: "Exam Prep Worksheet & Question Pack (PDF)", hours: 1, rate: 15 }
  ],
  
  taxPercent: 0,
  paymentDetails: "Bank Transfer:\nStarling Bank\nAccount: 87654321\nSort Code: 60-83-71\nReference: Please use invoice number",
  notes: "Thank you for booking these sessions. Good luck to Thomas on his upcoming exams!"
};

const AVATAR_COLORS = [
  { id: "violet", bg: "bg-violet-600 text-white", oklch: "#8b5cf6" },
  { id: "indigo", bg: "bg-indigo-600 text-white", oklch: "#4f46e5" },
  { id: "blue", bg: "bg-blue-600 text-white", oklch: "#2563eb" },
  { id: "teal", bg: "bg-teal-600 text-white", oklch: "#0d9488" },
  { id: "rose", bg: "bg-rose-600 text-white", oklch: "#e11d48" },
  { id: "amber", bg: "bg-amber-600 text-white", oklch: "#d97706" }
];

export function InvoiceGeneratorClient() {
  const [invoiceNumber, setInvoiceNumber] = useState(DEFAULT_INVOICE_DATA.invoiceNumber);
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_INVOICE_DATA.currency);
  
  // Sender Details
  const [senderName, setSenderName] = useState(DEFAULT_INVOICE_DATA.senderName);
  const [senderBusiness, setSenderBusiness] = useState(DEFAULT_INVOICE_DATA.senderBusiness);
  const [senderEmail, setSenderEmail] = useState(DEFAULT_INVOICE_DATA.senderEmail);
  const [senderPhone, setSenderPhone] = useState(DEFAULT_INVOICE_DATA.senderPhone);
  const [senderAddress, setSenderAddress] = useState(DEFAULT_INVOICE_DATA.senderAddress);
  const [logoUrl, setLogoUrl] = useState("");
  const [avatarColor, setAvatarColor] = useState("violet");
  
  // Recipient Details
  const [clientName, setClientName] = useState(DEFAULT_INVOICE_DATA.clientName);
  const [clientEmail, setClientEmail] = useState(DEFAULT_INVOICE_DATA.clientEmail);
  const [clientAddress, setClientAddress] = useState(DEFAULT_INVOICE_DATA.clientAddress);
  
  // Items
  const [items, setItems] = useState<LineItem[]>(DEFAULT_INVOICE_DATA.items);
  
  // Extras
  const [taxPercent, setTaxPercent] = useState<number>(DEFAULT_INVOICE_DATA.taxPercent);
  const [paymentDetails, setPaymentDetails] = useState(DEFAULT_INVOICE_DATA.paymentDetails);
  const [notes, setNotes] = useState(DEFAULT_INVOICE_DATA.notes);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default dates on client mount
  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    setIssueDate(today);
    setDueDate(nextWeek);

    // Try loading from localStorage
    try {
      const saved = localStorage.getItem("yazzow_invoice_maker_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
        if (parsed.issueDate) setIssueDate(parsed.issueDate);
        if (parsed.dueDate) setDueDate(parsed.dueDate);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.senderName) setSenderName(parsed.senderName);
        if (parsed.senderBusiness) setSenderBusiness(parsed.senderBusiness);
        if (parsed.senderEmail) setSenderEmail(parsed.senderEmail);
        if (parsed.senderPhone) setSenderPhone(parsed.senderPhone);
        if (parsed.senderAddress) setSenderAddress(parsed.senderAddress);
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
        if (parsed.avatarColor) setAvatarColor(parsed.avatarColor);
        if (parsed.clientName) setClientName(parsed.clientName);
        if (parsed.clientEmail) setClientEmail(parsed.clientEmail);
        if (parsed.clientAddress) setClientAddress(parsed.clientAddress);
        if (parsed.items) setItems(parsed.items);
        if (parsed.taxPercent !== undefined) setTaxPercent(parsed.taxPercent);
        if (parsed.paymentDetails) setPaymentDetails(parsed.paymentDetails);
        if (parsed.notes) setNotes(parsed.notes);
      }
    } catch (e) {
      console.error("Failed to parse invoice state from localStorage", e);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    const dataToSave = {
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      senderName,
      senderBusiness,
      senderEmail,
      senderPhone,
      senderAddress,
      logoUrl,
      avatarColor,
      clientName,
      clientEmail,
      clientAddress,
      items,
      taxPercent,
      paymentDetails,
      notes
    };
    try {
      localStorage.setItem("yazzow_invoice_maker_data", JSON.stringify(dataToSave));
    } catch (e) {
      // Ignore storage limit warnings
    }
  }, [
    invoiceNumber, issueDate, dueDate, currency, 
    senderName, senderBusiness, senderEmail, senderPhone, senderAddress, logoUrl, avatarColor,
    clientName, clientEmail, clientAddress, items, taxPercent, paymentDetails, notes
  ]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: "",
      hours: 1,
      rate: 30
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, val: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the invoice data to defaults?")) {
      const today = new Date().toISOString().substring(0, 10);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      
      setInvoiceNumber(DEFAULT_INVOICE_DATA.invoiceNumber);
      setIssueDate(today);
      setDueDate(nextWeek);
      setCurrency(DEFAULT_INVOICE_DATA.currency);
      setSenderName(DEFAULT_INVOICE_DATA.senderName);
      setSenderBusiness(DEFAULT_INVOICE_DATA.senderBusiness);
      setSenderEmail(DEFAULT_INVOICE_DATA.senderEmail);
      setSenderPhone(DEFAULT_INVOICE_DATA.senderPhone);
      setSenderAddress(DEFAULT_INVOICE_DATA.senderAddress);
      setLogoUrl("");
      setAvatarColor("violet");
      setClientName(DEFAULT_INVOICE_DATA.clientName);
      setClientEmail(DEFAULT_INVOICE_DATA.clientEmail);
      setClientAddress(DEFAULT_INVOICE_DATA.clientAddress);
      setItems(DEFAULT_INVOICE_DATA.items);
      setTaxPercent(DEFAULT_INVOICE_DATA.taxPercent);
      setPaymentDetails(DEFAULT_INVOICE_DATA.paymentDetails);
      setNotes(DEFAULT_INVOICE_DATA.notes);
      
      localStorage.removeItem("yazzow_invoice_maker_data");
    }
  };

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case "usd": return "$";
      case "eur": return "€";
      case "gbp":
      default:
        return "£";
    }
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    const sym = getCurrencySymbol(currencyCode);
    return `${sym}${amount.toFixed(2)}`;
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (Number(item.hours) || 0) * (Number(item.rate) || 0), 0);
  const taxAmount = (subtotal * (Number(taxPercent) || 0)) / 100;
  const total = subtotal + taxAmount;

  const symbol = getCurrencySymbol(currency);

  const getTutorInitials = () => {
    if (senderBusiness) {
      const words = senderBusiness.trim().split(/\s+/);
      if (words.length > 1) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return senderBusiness.substring(0, 2).toUpperCase();
    }
    if (senderName) {
      const words = senderName.trim().split(/\s+/);
      if (words.length > 1) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return senderName.substring(0, 2).toUpperCase();
    }
    return "TX";
  };

  const selectedColor = AVATAR_COLORS.find(c => c.id === avatarColor) || AVATAR_COLORS[0];

  return (
    <div className="py-10">
      {/* SCOPED MEDIA PRINT RULES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          header, footer, nav, button, .no-print, [data-slot="pwa-install-banner"], .pwa-banner {
            display: none !important;
          }
          body, html {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .print-badge {
            border: 1px solid #e2e8f0 !important;
            background: #f8fafc !important;
            color: #0f172a !important;
          }
        }
      `}} />

      <div className="yazz-container">
        {/* Eyebrow & Title */}
        <div className="no-print mb-8 text-center sm:text-left">
          <span className="yazz-eyebrow mb-3">Free Tools</span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tutor <span className="yazz-gradient-text">Invoice Generator</span>
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Create, download and print beautiful invoice sheets for your pupils. Completely private — all billing computations happen client-side.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.2fr] gap-8 items-start">
          
          {/* LEFT: Form Controls */}
          <div className="no-print space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 yazz-surface">
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Receipt className="size-4 text-primary" /> Edit Details
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3.5 mr-1" /> Reset
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => window.print()}
                  className="yazz-btn-primary h-8 text-xs font-semibold px-4"
                >
                  <Printer className="size-3.5 mr-1.5" /> Download PDF
                </Button>
              </div>
            </div>

            {/* Sender details Card */}
            <div className="yazz-surface p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Briefcase className="size-4" /> Your Details (Tutor)
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Your Name</label>
                  <Input 
                    placeholder="e.g. Alex Mercer" 
                    value={senderName} 
                    onChange={e => setSenderName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Academy / Trading Name</label>
                  <Input 
                    placeholder="e.g. Mercer Physics Academy" 
                    value={senderBusiness} 
                    onChange={e => setSenderBusiness(e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="e.g. alex@mercer.com" 
                    value={senderEmail} 
                    onChange={e => setSenderEmail(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Phone Number</label>
                  <Input 
                    placeholder="e.g. +44 7700 900077" 
                    value={senderPhone} 
                    onChange={e => setSenderPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Contact Address</label>
                <textarea 
                  rows={2}
                  className="w-full min-w-0 rounded-xl border border-input bg-card/85 px-3 py-2 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/15 dark:bg-input/30"
                  placeholder="Street name, City, Postcode"
                  value={senderAddress}
                  onChange={e => setSenderAddress(e.target.value)}
                />
              </div>

              {/* Logo customization */}
              <div className="pt-2 border-t border-border/50">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Invoice Logo / Branding</label>
                <div className="flex items-center gap-4 flex-wrap">
                  {logoUrl ? (
                    <div className="relative size-12 rounded-lg border border-border overflow-hidden bg-white">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      <button 
                        onClick={clearLogo}
                        className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5 hover:bg-red-700 transition"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <div className={`size-12 rounded-xl flex items-center justify-center font-bold text-base transition-colors ${selectedColor.bg}`}>
                      {getTutorInitials()}
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1 min-w-[200px]">
                    <div className="flex gap-1.5">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        onChange={handleLogoChange} 
                        className="hidden" 
                      />
                      <Button 
                        variant="outline" 
                        size="xs"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs"
                      >
                        <Upload className="size-3 mr-1" /> Upload Image
                      </Button>
                      {logoUrl && (
                        <Button 
                          variant="destructive" 
                          size="xs"
                          onClick={clearLogo}
                          className="text-xs"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {!logoUrl && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-muted-foreground mr-1">Initials Color:</span>
                        {AVATAR_COLORS.map(color => (
                          <button
                            key={color.id}
                            className={`size-4 rounded-full border border-black/15 transition-transform ${color.bg} ${avatarColor === color.id ? "scale-125 ring-2 ring-primary/20" : "hover:scale-110"}`}
                            onClick={() => setAvatarColor(color.id)}
                            title={color.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Details Card */}
            <div className="yazz-surface p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <User className="size-4" /> Recipient Details (Client / Parent)
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Student / Parent Name</label>
                  <Input 
                    placeholder="e.g. Sarah Jenkins" 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email / Contact info</label>
                  <Input 
                    placeholder="e.g. sarah.j@example.com" 
                    value={clientEmail} 
                    onChange={e => setClientEmail(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Client Address</label>
                <textarea 
                  rows={2}
                  className="w-full min-w-0 rounded-xl border border-input bg-card/85 px-3 py-2 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/15 dark:bg-input/30"
                  placeholder="Recipient billing address"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Invoice Details Card */}
            <div className="yazz-surface p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <FileText className="size-4" /> Invoice Details & Metadata
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Invoice Reference</label>
                  <Input 
                    placeholder="e.g. INV-2026-001" 
                    value={invoiceNumber} 
                    onChange={e => setInvoiceNumber(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Currency</label>
                  <select 
                    className="h-9 w-full min-w-0 rounded-xl border border-input bg-card/85 px-3 py-2 text-sm shadow-sm transition-all outline-none focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/15 dark:bg-input/30"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                  >
                    <option value="gbp">British Pound (GBP £)</option>
                    <option value="usd">US Dollar (USD $)</option>
                    <option value="eur">Euro (EUR €)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Issue Date</label>
                  <Input 
                    type="date" 
                    value={issueDate} 
                    onChange={e => setIssueDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Due Date</label>
                  <Input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            <div className="yazz-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Line Items</h2>
                <Button 
                  variant="outline" 
                  size="xs" 
                  onClick={handleAddItem}
                  className="text-xs text-primary border-primary/20 hover:bg-primary/5"
                >
                  <Plus className="size-3 mr-1" /> Add Row
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-start border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1 space-y-2">
                      <Input 
                        placeholder="Description (e.g. Lesson tuition date...)" 
                        value={item.description}
                        onChange={e => handleUpdateItem(item.id, "description", e.target.value)}
                        className="text-xs h-8"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">Hours / Qty</label>
                          <Input 
                            type="number" 
                            step="any"
                            value={item.hours === 0 ? "" : item.hours}
                            onChange={e => handleUpdateItem(item.id, "hours", parseFloat(e.target.value) || 0)}
                            className="text-xs h-8"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">Rate ({symbol})</label>
                          <Input 
                            type="number" 
                            step="any"
                            value={item.rate === 0 ? "" : item.rate}
                            onChange={e => handleUpdateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="mt-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-0"
                      title="Remove Row"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment instructions & Notes */}
            <div className="yazz-surface p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Payment & Extra Notes</h2>
              
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tax / VAT Rate (%) - Optional</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 0 (leave empty if none)" 
                  value={taxPercent === 0 ? "" : taxPercent} 
                  onChange={e => setTaxPercent(parseFloat(e.target.value) || 0)} 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Instructions (Bank Account / Reference)</label>
                <textarea 
                  rows={3}
                  className="w-full min-w-0 rounded-xl border border-input bg-card/85 px-3 py-2 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/15 dark:bg-input/30"
                  placeholder="Enter Bank Name, Sort Code, Account Number, or IBAN instructions..."
                  value={paymentDetails}
                  onChange={e => setPaymentDetails(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Additional Terms or Notes</label>
                <textarea 
                  rows={2}
                  className="w-full min-w-0 rounded-xl border border-input bg-card/85 px-3 py-2 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/15 dark:bg-input/30"
                  placeholder="E.g. Thank you for your business!"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Platform onboarding CTA Box */}
            <div className="p-6 bg-gradient-to-br from-primary/10 to-indigo-600/5 border border-primary/20 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="size-20 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-4 text-primary animate-pulse" /> Automate your business
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Tired of manual invoice generation? With Yazzow, you can automate lesson scheduling, trigger client cards upfront via Stripe, track your monthly income automatically, and sell worksheet packs via your customized tutor workspace.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link 
                  href="/auth/signup"
                  className="inline-flex h-7 items-center justify-center rounded-lg bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition-all hover:bg-[oklch(0.50_0.18_250)]"
                >
                  Create Free Account <ArrowRight className="size-3 ml-1" />
                </Link>
                <Link 
                  href="/#features"
                  className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-card/80 px-3 text-[11px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                  Learn More
                </Link>
              </div>
            </div>

          </div>

          {/* RIGHT: Live A4 Preview Sheet */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <span className="no-print block text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-2">
              Live Invoice Preview (A4 Page Fit)
            </span>

            {/* A4 Sheet Mock */}
            <div className="print-area w-full bg-white text-slate-800 shadow-xl border border-slate-200/60 rounded-xl overflow-hidden p-8 sm:p-12 min-h-[700px] flex flex-col justify-between">
              
              <div>
                {/* Invoice Header */}
                <div className="flex justify-between items-start gap-4 pb-8 border-b border-slate-100">
                  <div className="space-y-1 max-w-[65%]">
                    {logoUrl ? (
                      <div className="h-12 w-auto max-w-[200px] mb-2 overflow-hidden flex items-center">
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="size-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                          style={{ backgroundColor: selectedColor.oklch }}
                        >
                          {getTutorInitials()}
                        </div>
                        {senderBusiness && (
                          <h2 className="font-bold text-slate-900 text-lg leading-tight">{senderBusiness}</h2>
                        )}
                      </div>
                    )}
                    
                    <h3 className="font-semibold text-slate-800 text-sm">{senderName}</h3>
                    {senderAddress && (
                      <p className="text-[11px] text-slate-500 whitespace-pre-wrap leading-normal">
                        {senderAddress}
                      </p>
                    )}
                    {(senderEmail || senderPhone) && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {[senderEmail, senderPhone].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <span className="print-badge inline-block bg-primary/5 text-primary text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">
                      INVOICE
                    </span>
                    <p className="text-xs text-slate-400 font-medium mt-2">Invoice Number</p>
                    <p className="text-sm font-bold text-slate-900">{invoiceNumber || "—"}</p>
                  </div>
                </div>

                {/* Billing Info & Dates */}
                <div className="grid grid-cols-2 gap-4 py-8 text-xs border-b border-slate-100">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bill To:</span>
                    <h4 className="font-bold text-slate-900">{clientName || "—"}</h4>
                    {clientEmail && <p className="text-slate-500 text-[11px]">{clientEmail}</p>}
                    {clientAddress && (
                      <p className="text-[11px] text-slate-500 whitespace-pre-wrap leading-normal">
                        {clientAddress}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-2">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Date Issued</span>
                      <span className="font-semibold text-slate-800">{issueDate ? new Date(issueDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Due Date</span>
                      <span className={`font-semibold ${dueDate && new Date(dueDate) < new Date() ? "text-red-600 font-bold" : "text-slate-800"}`}>
                        {dueDate ? new Date(dueDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="py-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 pr-2">Description</th>
                        <th className="py-2.5 px-2 text-right w-16">Hours</th>
                        <th className="py-2.5 px-2 text-right w-24">Rate</th>
                        <th className="py-2.5 pl-2 text-right w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                            No line items added yet. Click "Add Row" on the left to add items.
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 text-slate-700">
                            <td className="py-3.5 pr-2 font-medium text-slate-800 break-words max-w-[200px]">
                              {item.description || <span className="text-slate-300 italic">No description</span>}
                            </td>
                            <td className="py-3.5 px-2 text-right tabular-nums">{item.hours}</td>
                            <td className="py-3.5 px-2 text-right tabular-nums">{formatCurrency(item.rate, currency)}</td>
                            <td className="py-3.5 pl-2 text-right font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(item.hours * item.rate, currency)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Calculations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  
                  {/* Payment Details info (left) */}
                  <div className="space-y-3">
                    {paymentDetails && (
                      <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100/60">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">How To Pay</span>
                        <p className="text-[10px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                          {paymentDetails}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Sums (right) */}
                  <div className="space-y-2 text-xs text-right md:pl-8">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{formatCurrency(subtotal, currency)}</span>
                    </div>

                    {taxPercent > 0 && (
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Tax / VAT ({taxPercent}%)</span>
                        <span className="font-semibold text-slate-800 tabular-nums">{formatCurrency(taxAmount, currency)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 text-sm font-bold text-slate-900">
                      <span>Total Due</span>
                      <span className="text-base font-extrabold text-slate-900 tabular-nums">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer Notes (bottom of invoice page) */}
              <div className="pt-10 border-t border-slate-100 text-center md:text-left mt-8">
                {notes && (
                  <p className="text-[10px] text-slate-400 italic leading-relaxed whitespace-pre-wrap">
                    {notes}
                  </p>
                )}
                <p className="text-[9px] text-slate-300 mt-4 text-center">
                  Invoice generated using Yazzow.com (100% Free Tutor Tools)
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
