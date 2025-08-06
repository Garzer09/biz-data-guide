import { useParams } from "react-router-dom";
import { CompanySelector } from "./company-selector";
import { DynamicSidebar } from "./dynamic-sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { companyId } = useParams();

  const handlePageChange = (page: string) => {
    // Page changes are now handled by navigation in DynamicSidebar
  };

  return (
    <div className="flex h-screen w-screen bg-background">
      <DynamicSidebar onPageChange={handlePageChange} />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">FinSight Pro</h1>
            </div>
            <CompanySelector />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}