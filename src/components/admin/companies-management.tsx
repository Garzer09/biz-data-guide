import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Edit, ExternalLink, Settings, Upload, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CompanyPagesManagement } from "./company-pages-management";
import { ImportDataManagement } from "./import-data-management";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Company {
  id: string;
  name: string;
  cif_nif: string;
  estado: string;
  creado_en: string;
}

export function CompaniesManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    cif_nif: "",
    estado: "ACTIVO"
  });
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          cif_nif: formData.cif_nif,
          estado: formData.estado
        });

      if (error) throw error;

      toast({
        title: "Empresa creada",
        description: "La empresa se ha creado correctamente",
      });

      setIsCreateModalOpen(false);
      setFormData({ name: "", cif_nif: "", estado: "ACTIVO" });
      fetchCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la empresa",
        variant: "destructive",
      });
    }
  };

  const handleEditCompany = async () => {
    if (!selectedCompany) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          cif_nif: formData.cif_nif,
          estado: formData.estado
        })
        .eq('id', selectedCompany.id);

      if (error) throw error;

      toast({
        title: "Empresa actualizada",
        description: "La empresa se ha actualizado correctamente",
      });

      setIsEditModalOpen(false);
      setSelectedCompany(null);
      setFormData({ name: "", cif_nif: "", estado: "ACTIVO" });
      fetchCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la empresa",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      cif_nif: company.cif_nif || "",
      estado: company.estado
    });
    setIsEditModalOpen(true);
  };

  const handleAccessDashboard = (companyId: string) => {
    navigate(`/c/${companyId}/dashboard`);
  };

  const toggleCompanyExpansion = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  if (!isAdmin) {
    return (
      <div className="text-center text-muted-foreground">
        No tienes permisos para acceder a esta sección
      </div>
    );
  }

  if (loading) {
    return <div className="text-center">Cargando empresas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Empresas</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Empresa</DialogTitle>
              <DialogDescription>
                Completa los datos para crear una nueva empresa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Empresa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <Label htmlFor="cif_nif">CIF/NIF</Label>
                <Input
                  id="cif_nif"
                  value={formData.cif_nif}
                  onChange={(e) => setFormData({ ...formData, cif_nif: e.target.value })}
                  placeholder="CIF o NIF de la empresa"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateCompany} className="w-full">
                Crear Empresa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {companies.map((company) => (
          <Card key={company.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Company Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-4 flex-1">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      CIF/NIF: {company.cif_nif || "No especificado"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Creado: {new Date(company.creado_en).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={company.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                    {company.estado}
                  </Badge>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAccessDashboard(company.id)}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(company)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCompanyExpansion(company.id)}
                    className="flex items-center gap-1"
                  >
                    {expandedCompanies.has(company.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Gestionar
                  </Button>
                </div>
              </div>

              {/* Expanded Content */}
              <Collapsible open={expandedCompanies.has(company.id)}>
                <CollapsibleContent>
                  <div className="p-6 bg-muted/30">
                    <Tabs defaultValue="pages" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pages" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Páginas
                        </TabsTrigger>
                        <TabsTrigger value="imports" className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Importaciones
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="pages" className="mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Configuración de Páginas</CardTitle>
                            <CardDescription>
                              Activa o desactiva páginas específicas para {company.name}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <CompanyPagesManagement filterCompanyId={company.id} />
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="imports" className="mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Historial de Importaciones</CardTitle>
                            <CardDescription>
                              Importaciones de datos para {company.name}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ImportDataManagement filterCompanyId={company.id} />
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Modifica los datos de la empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre de la Empresa</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-cif">CIF/NIF</Label>
              <Input
                id="edit-cif"
                value={formData.cif_nif}
                onChange={(e) => setFormData({ ...formData, cif_nif: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-estado">Estado</Label>
              <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEditCompany} className="w-full">
              Actualizar Empresa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}