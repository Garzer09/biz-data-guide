import { useState } from "react";
import { Sidebar } from "./sidebar";
import { MainDashboard } from "@/components/dashboard/main-dashboard";
import { CompaniesManagement } from "@/components/companies/companies-management";

export function MainLayout() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <MainDashboard />;
      case "companies":
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
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  );
}