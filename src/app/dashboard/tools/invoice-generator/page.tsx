import { InvoiceGeneratorClient } from "@/app/tools/invoice-generator/invoice-generator-client";
import { requireTutorProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Tutor Invoice Maker",
};

export default async function DashboardInvoiceGeneratorPage() {
  const { user, profile } = await requireTutorProfile();
  
  const defaultTutorDetails = {
    name: profile.displayName || "",
    email: user.email || "",
    businessName: profile.headline || profile.displayName || "",
    paymentInstructions: profile.paymentInstructions || "",
  };

  return (
    <div className="px-6 py-4">
      <InvoiceGeneratorClient 
        defaultCurrency={profile.currency} 
        isDashboard={true} 
        defaultTutorDetails={defaultTutorDetails} 
      />
    </div>
  );
}
