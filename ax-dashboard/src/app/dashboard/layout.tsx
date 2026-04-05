import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { PublicModeProvider } from "@/components/dashboard/public-mode-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicModeProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-[68px] flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </PublicModeProvider>
  );
}
