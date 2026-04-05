import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AX — Public Dashboard",
  description: "Read-only view of AX AI Project Management",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
