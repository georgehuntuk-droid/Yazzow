import { DEFAULT_PORTAL_ACCENT } from "@/lib/constants";
import type { TutorProfile } from "@/lib/types";

type PortalThemeWrapperProps = {
  tutor: TutorProfile;
  children: React.ReactNode;
};

export function PortalThemeWrapper({ tutor, children }: PortalThemeWrapperProps) {
  const accent = tutor.portalAccentOklch ?? DEFAULT_PORTAL_ACCENT;
  const bgStyle = tutor.portalBgStyle ?? "dots";

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
      {/* Premium Dynamic Glowing Mesh Gradient Blobs */}
      {bgStyle !== "solid" && (
        <>
          {/* Top-left glowing blob */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[600px] pointer-events-none bg-[radial-gradient(circle_at_30%_20%,var(--primary),transparent_70%)] opacity-[0.08] blur-[100px] z-0" />
          {/* Bottom-right glowing blob */}
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[600px] pointer-events-none bg-[radial-gradient(circle_at_70%_80%,var(--primary),transparent_70%)] opacity-[0.06] blur-[120px] z-0" />
          {/* Subtle center ambient glow */}
          <div className="absolute top-[20%] right-[15%] w-[35%] h-[400px] pointer-events-none bg-[radial-gradient(circle_at_50%_50%,var(--primary),transparent_60%)] opacity-[0.03] blur-[90px] z-0" />
        </>
      )}
      
      {/* Premium Background Grid Pattern (faded out at bottom/sides) */}
      {bgStyle === "grid" && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_bottom,var(--primary)_1px,transparent_1px),linear-gradient(to_right,var(--primary)_1px,transparent_1px)] bg-[size:40px_40px] yazz-portal-grid-fade z-0" />
      )}

      {/* Premium Background Dotted Pattern (faded out at bottom/sides) */}
      {bgStyle === "dots" && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[radial-gradient(var(--primary)_1px,transparent_1px)] bg-[size:24px_24px] yazz-portal-dots-fade z-0" />
      )}

      {/* Content wrapper layered above background effects */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
