import { LightLayout } from "./LightLayout";

/** Compatibility wrapper for public pages using the shared light website theme. */
export function LandingLayout({ children }: { children: React.ReactNode }) {
  return <LightLayout>{children}</LightLayout>;
}
