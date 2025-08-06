import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
}

interface CompanyPages {
  company_id: string;
  enabled_pages: string[];
}

const availablePages = [
  { id: 'dashboard', label: 'Dashboard Principal' },
  { id: 'pyg', label: 'Cuenta P&G' },
  { id: 'balance', label: 'Balance' },
  { id: 'cashflow', label: 'Flujos de Caja' },
  { id: 'ratios', label: 'Ratios Financieros' },
  { id: 'sensibilidad', label: 'Análisis Sensibilidad' },
  { id: 'proyecciones', label: 'Proyecciones' },
  { id: 'eva', label: 'Análisis EVA' },
  { id: 'conclusiones', label: 'Conclusiones' }
];

export function CompanyPagesManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [enabledPages, setEnabledPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCompanyPages();
    }
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('estado', 'ACTIVO')
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

  const fetchCompanyPages = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('company_pages')
        .select('enabled_pages')
        .eq('company_id', selectedCompanyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setEnabledPages(data?.enabled_pages || ['dashboard']);
    } catch (error) {
      console.error('Error fetching company pages:', error);
      setEnabledPages(['dashboard']); // Default fallback
    }
  };

  const handlePageToggle = (pageId: string) => {
    setEnabledPages(prev => {
      if (prev.includes(pageId)) {
        // Don't allow removing dashboard - it's always required
        if (pageId === 'dashboard') {
          toast({
            title: "Dashboard requerido",
            description: "El dashboard principal no se puede desactivar",
            variant: "destructive",
          });
          return prev;
        }
        return prev.filter(id => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleSavePages = async () => {
    if (!selectedCompanyId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_pages')
        .upsert({
          company_id: selectedCompanyId,
          enabled_pages: enabledPages
        }, {
          onConflict: 'company_id'
        });

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: "Las páginas han sido configuradas correctamente",
      });
    } catch (error) {
      console.error('Error saving company pages:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
      <div>
        <h2 className="text-xl font-semibold mb-4">Configuración de Páginas por Empresa</h2>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Seleccionar Empresa</label>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecciona una empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCompanyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Páginas Disponibles
            </CardTitle>
            <CardDescription>
              Selecciona qué páginas estarán disponibles para esta empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {availablePages.map((page) => (
                <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={page.id}
                      checked={enabledPages.includes(page.id)}
                      onCheckedChange={() => handlePageToggle(page.id)}
                      disabled={page.id === 'dashboard'} // Dashboard always enabled
                    />
                    <label
                      htmlFor={page.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {page.label}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    {page.id === 'dashboard' && (
                      <Badge variant="secondary">Requerido</Badge>
                    )}
                    <Badge variant={enabledPages.includes(page.id) ? 'default' : 'outline'}>
                      {enabledPages.includes(page.id) ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={handleSavePages} 
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Páginas activas: {enabledPages.length} de {availablePages.length}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedCompanyId && (
        <div className="text-center text-muted-foreground py-8">
          Selecciona una empresa para configurar sus páginas
        </div>
      )}
    </div>
  );
}