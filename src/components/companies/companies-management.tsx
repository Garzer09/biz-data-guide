import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Building2, Upload, Eye, BarChart3, History } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

interface Company {
  id: string;
  name: string;
  currency: string;
  accountingPlan: string;
  coverage: string;
  balance: string;
  lastLoad: string;
  status: "FAILED" | "SUCCESS" | "PENDING";
  sector: string;
}

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "Alan Coar",
    currency: "EUR",
    accountingPlan: "PGC",
    coverage: "P&G: Sin datos • Balance: Sin datos",
    balance: "",
    lastLoad: "6/8/2025",
    status: "FAILED",
    sector: "Farma"
  },
  {
    id: "2", 
    name: "Prueba AAA",
    currency: "",
    accountingPlan: "",
    coverage: "P&G: 2024 • Balance: 2024",
    balance: "",
    lastLoad: "4/8/2025",
    status: "SUCCESS",
    sector: ""
  },
  {
    id: "3",
    name: "Empresa Demo 2",
    currency: "USD",
    accountingPlan: "IFRS", 
    coverage: "P&G: 2024 • Balance: 2024",
    balance: "",
    lastLoad: "4/8/2025",
    status: "SUCCESS",
    sector: "Manufactura"
  },
  {
    id: "4",
    name: "Empresa Demo 3",
    currency: "EUR",
    accountingPlan: "PGC",
    coverage: "P&G: Sin datos • Balance: Sin datos", 
    balance: "",
    lastLoad: "",
    status: "PENDING",
    sector: "Servicios"
  }
];

export function CompaniesManagement() {
  const [companies, setCompanies] = useState(mockCompanies);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    currency: "EUR",
    accountingPlan: "PGC",
    sector: ""
  });

  const handleCreateCompany = () => {
    if (newCompany.name.trim()) {
      const company: Company = {
        id: Date.now().toString(),
        name: newCompany.name,
        currency: newCompany.currency,
        accountingPlan: newCompany.accountingPlan,
        coverage: "P&G: Sin datos • Balance: Sin datos",
        balance: "",
        lastLoad: "",
        status: "PENDING",
        sector: newCompany.sector
      };
      
      setCompanies([...companies, company]);
      setNewCompany({ name: "", currency: "EUR", accountingPlan: "PGC", sector: "" });
      setIsCreateModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader 
          title="Gestión de Empresas"
          subtitle="Administra empresas y carga datos financieros mediante plantillas CSV"
        />
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              + Crear Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company-name">Nombre de la Empresa *</Label>
                <Input
                  id="company-name"
                  placeholder="Ingresa el nombre de la empresa"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Moneda por Defecto</Label>
                  <Select value={newCompany.currency} onValueChange={(value) => setNewCompany({...newCompany, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - Dólar</SelectItem>
                      <SelectItem value="GBP">GBP - Libra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Estándar Contable</Label>
                  <Select value={newCompany.accountingPlan} onValueChange={(value) => setNewCompany({...newCompany, accountingPlan: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PGC">PGC - Plan General...</SelectItem>
                      <SelectItem value="IFRS">IFRS - International...</SelectItem>
                      <SelectItem value="GAAP">GAAP - US GAAP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  placeholder="Ej: Tecnología, Manufactura, Servicios"
                  value={newCompany.sector}
                  onChange={(e) => setNewCompany({...newCompany, sector: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleCreateCompany}
                  className="flex-1 bg-primary hover:bg-primary-hover"
                >
                  Crear Empresa
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="p-6 shadow-card border border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{company.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {company.currency} {company.accountingPlan && `• ${company.accountingPlan}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">📊 Cobertura de Datos</span>
              </div>
              <p className="text-sm text-muted-foreground">{company.coverage}</p>
              
              {company.lastLoad && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">📅 Última Carga</span>
                  <span className={company.status === "FAILED" ? "text-destructive" : "text-success"}>
                    {company.status === "FAILED" ? "FAILED" : "OK"} {company.lastLoad}
                  </span>
                </div>
              )}

              {company.sector && (
                <p className="text-sm text-muted-foreground">Sector: {company.sector}</p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button size="sm" className="flex-1 bg-primary hover:bg-primary-hover">
                <Upload className="h-4 w-4 mr-1" />
                Cargar Plantillas CSV
              </Button>
            </div>

            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" className="flex-1">
                <History className="h-4 w-4 mr-1" />
                Histórico
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <BarChart3 className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}