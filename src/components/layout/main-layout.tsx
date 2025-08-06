import { useState } from "react";
import { Sidebar } from "./sidebar";
import { MainDashboard } from "@/components/dashboard/main-dashboard";
import { CompaniesManagement } from "@/components/companies/companies-management";

export function MainLayout() {
  const [currentPage, setCurrentPage] = useState("admin-panel");

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <MainDashboard />;
      case "admin-panel":
        return <CompaniesManagement />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Página en construcción: {currentPage}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}