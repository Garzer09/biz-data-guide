import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Company {
  id: string;
  name: string;
  estado: string;
}

export function CompanySelector() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { companyId } = useParams();

  const selectedCompany = companies.find(c => c.id === companyId);

  useEffect(() => {
    fetchCompanies();
  }, [user, isAdmin]);

  const fetchCompanies = async () => {
    if (!user) return;

    try {
      let query = supabase.from('companies').select('id, name, estado');

      if (!isAdmin) {
        // For normal users, only get assigned companies
        const { data: userCompanies } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', user.id);

        if (userCompanies && userCompanies.length > 0) {
          const companyIds = userCompanies.map(uc => uc.company_id);
          query = query.in('id', companyIds);
        } else {
          setCompanies([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query.eq('estado', 'ACTIVO').order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    navigate(`/c/${company.id}/dashboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Cargando...</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Sin empresas asignadas</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {selectedCompany && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          {selectedCompany.name}
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {selectedCompany ? selectedCompany.name : "Seleccionar empresa"}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover">
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => handleCompanySelect(company)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="h-4 w-4" />
              <span>{company.name}</span>
              {company.id === companyId && (
                <Badge variant="default" className="ml-auto">Activa</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}