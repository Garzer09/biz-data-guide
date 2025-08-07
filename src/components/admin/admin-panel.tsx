import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Upload, CreditCard, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompaniesManagement } from "./companies-management";
import { UsersManagement } from "./users-management";
import { ImportDataManagement } from "./import-data-management";
import { DebtUploadModal } from "../debt/debt-upload-modal";
import { PyGAnalyticUploadModal } from "./pyg-analytic-upload-modal";

export function AdminPanel() {
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPyGAnalyticModalOpen, setIsPyGAnalyticModalOpen] = useState(false);

  const handleDebtUploadSuccess = () => {
    // Refresh any data if needed
    console.log('Debt upload completed successfully');
  };

  const handlePyGAnalyticUploadSuccess = () => {
    // Refresh any data if needed
    console.log('P&G Analytic upload completed successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administrador</h1>
        <p className="text-muted-foreground">
          Gestiona empresas, usuarios y configuraciones del sistema
        </p>
      </div>

      <Tabs defaultValue="companies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="imports" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importaciones
          </TabsTrigger>
          <TabsTrigger value="debts" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pool de Deudas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Empresas</CardTitle>
              <CardDescription>
                Crear, editar y gestionar empresas del sistema, sus páginas e importaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompaniesManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Gestiona usuarios, permisos de administrador y asignaciones a empresas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports">
          <Card>
            <CardHeader>
              <CardTitle>Carga de Datos e Historial Global</CardTitle>
              <CardDescription>
                Vista global de todas las importaciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">P&G Analítico</h3>
                  <p className="text-sm text-muted-foreground">
                    Carga datos de P&G desglosados por centros de coste y segmentos
                  </p>
                </div>
                <Button 
                  onClick={() => setIsPyGAnalyticModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Cargar P&G Analítico
                </Button>
              </div>
              
              <ImportDataManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Pool de Deudas</CardTitle>
              <CardDescription>
                Carga masiva de datos de deudas para múltiples empresas y gestión de escenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Importación de Deudas</h3>
                  <p className="text-sm text-muted-foreground">
                    Sube archivos CSV con datos de deudas para gestionar el pool bancario de las empresas
                  </p>
                </div>
                <button 
                  onClick={() => setIsDebtModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <Upload className="h-4 w-4" />
                  Cargar Deudas
                </button>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Formato del Archivo CSV</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  El archivo debe contener las siguientes columnas obligatorias:
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Campos obligatorios:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>entidad (nombre del banco/entidad)</li>
                      <li>tipo (Préstamo ICO, Línea de Crédito, etc.)</li>
                      <li>capital (importe pendiente)</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Campos opcionales:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>tir (tasa de interés, 0-100%)</li>
                      <li>plazo_meses (plazo en meses)</li>
                      <li>cuota (cuota mensual)</li>
                      <li>proximo_venc (fecha YYYY-MM-DD)</li>
                      <li>escenario (nombre del escenario)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <ImportDataManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DebtUploadModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSuccess={handleDebtUploadSuccess}
      />
      
      <PyGAnalyticUploadModal
        isOpen={isPyGAnalyticModalOpen}
        onClose={() => setIsPyGAnalyticModalOpen(false)}
        onSuccess={handlePyGAnalyticUploadSuccess}
      />
    </div>
  );
}