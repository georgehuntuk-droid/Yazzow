import { DEFAULT_PORTAL_ACCENT } from "@/lib/constants";
import type { TutorProfile } from "@/lib/types";

type PortalThemeWrapperProps = {
  tutor: TutorProfile;
  children: React.ReactNode;
};

export function PortalThemeWrapper({ tutor, children }: PortalThemeWrapperProps) {
  const accent = tutor.portalAccentOklch ?? DEFAULT_PORTAL_ACCENT;
  const bgStyle = tutor.portalBgStyle ?? "grid";

  return (
    <div
      className="tutor-portal-theme min-h-screen relative overflow-x-hidden"
      style={
        {
          "--primary": accent,
          "--ring": accent,
          "--sidebar-primary": accent,
        } as React.CSSProperties
      }
    >
      {/* Premium Dynamic Glowing Mesh Gradient Blob */}
      {bgStyle !== "solid" && (
        <div className="absolute top-[-12%] left-[10%] right-[10%] h-[550px] pointer-events-none bg-[radial-gradient(circle_at_50%_0%,var(--primary),transparent_65%)] opacity-[0.07] blur-[120px] z-0" />
      )}
      
      {/* Premium Background Grid Pattern */}
      {bgStyle === "grid" && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(to_bottom,var(--primary)_1px,transparent_1px),linear-gradient(to_right,var(--primary)_1px,transparent_1px)] bg-[size:48px_48px] z-0" />
      )}

      {/* Premium Background Dotted Pattern */}
      {bgStyle === "dots" && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[radial-gradient(var(--primary)_1px,transparent_1px)] bg-[size:24px_24px] z-0" />
      )}

      {/* Content wrapper layered above background effects */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
