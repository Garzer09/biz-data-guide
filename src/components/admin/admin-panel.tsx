import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Settings, Upload } from "lucide-react";
import { CompaniesManagement } from "./companies-management";
import { UsersManagement } from "./users-management";
import { CompanyPagesManagement } from "./company-pages-management";
import { ImportDataManagement } from "./import-data-management";

export function AdminPanel() {
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
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Páginas
          </TabsTrigger>
          <TabsTrigger value="imports" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Empresas</CardTitle>
              <CardDescription>
                Crear, editar y gestionar empresas del sistema
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

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Páginas por Empresa</CardTitle>
              <CardDescription>
                Activa o desactiva páginas específicas para cada empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyPagesManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports">
          <Card>
            <CardHeader>
              <CardTitle>Carga de Datos e Historial</CardTitle>
              <CardDescription>
                Importa datos financieros y revisa el historial de importaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportDataManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}