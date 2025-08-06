import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, Users, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  estado: string;
  cif_nif: string;
}

export function CompanySelector() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isAdmin) {
      fetchAssignedCompanies();
    }
  }, [user, isAdmin]);

  const fetchAssignedCompanies = async () => {
    if (!user) return;

    try {
      // Get companies assigned to this user
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (userCompaniesError) throw userCompaniesError;

      if (!userCompanies || userCompanies.length === 0) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      const companyIds = userCompanies.map(uc => uc.company_id);

      // Get company details
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, estado, cif_nif')
        .in('id', companyIds)
        .eq('estado', 'ACTIVO')
        .order('name');

      if (companiesError) throw companiesError;

      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Error fetching assigned companies:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas asignadas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccessDashboard = (companyId: string) => {
    navigate(`/c/${companyId}/dashboard`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">FinSight Pro</h1>
              <p className="text-muted-foreground">Análisis Financiero Integral</p>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-2">
              Bienvenido, {user?.email}
            </h2>
            <p className="text-muted-foreground">
              Selecciona una empresa para acceder a su dashboard financiero
            </p>
          </div>
        </div>

        {/* Companies Grid */}
        {companies.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {companies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{company.name}</h3>
                      {company.cif_nif && (
                        <p className="text-sm text-muted-foreground font-normal">
                          CIF/NIF: {company.cif_nif}
                        </p>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {company.estado}
                    </Badge>
                  </div>
                  
                  <Button 
                    onClick={() => handleAccessDashboard(company.id)}
                    className="w-full flex items-center gap-2"
                    size="lg"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Acceder al Dashboard
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // No companies assigned
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>Sin empresas asignadas</CardTitle>
                <CardDescription>
                  No tienes empresas asignadas actualmente. Contacta con tu administrador para obtener acceso.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Contacta con el administrador para asignar empresas</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>¿Necesitas acceso a más empresas? Contacta con tu administrador</p>
        </div>
      </div>
    </div>
  );
}