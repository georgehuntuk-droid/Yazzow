import { DEFAULT_PORTAL_ACCENT } from "@/lib/constants";
import type { TutorProfile } from "@/lib/types";

type PortalThemeWrapperProps = {
  tutor: TutorProfile;
  children: React.ReactNode;
};

export function PortalThemeWrapper({ tutor, children }: PortalThemeWrapperProps) {
  const accent = tutor.portalAccentOklch ?? DEFAULT_PORTAL_ACCENT;

  return (
    <div
      className="tutor-portal-theme min-h-full"
      style={
        {
          "--primary": accent,
          "--ring": accent,
          "--sidebar-primary": accent,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
