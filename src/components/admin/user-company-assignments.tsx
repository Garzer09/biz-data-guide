import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Users, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
}

interface UserCompanyAssignment {
  id: string;
  user_id: string;
  company_id: string;
  profiles: Profile;
  companies: Company;
}

export function UserCompanyAssignments() {
  const [assignments, setAssignments] = useState<UserCompanyAssignment[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_companies')
        .select('id, user_id, company_id');

      if (assignmentsError) throw assignmentsError;

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('email');

      if (usersError) throw usersError;

      // Fetch all companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('estado', 'ACTIVO')
        .order('name');

      if (companiesError) throw companiesError;

      // Build assignments with full user and company data
      const enrichedAssignments = (assignmentsData || []).map(assignment => {
        const user = usersData?.find(u => u.user_id === assignment.user_id);
        const company = companiesData?.find(c => c.id === assignment.company_id);
        
        return {
          id: assignment.id,
          user_id: assignment.user_id,
          company_id: assignment.company_id,
          profiles: user || {
            id: '',
            user_id: assignment.user_id,
            email: 'Usuario no encontrado',
            first_name: '',
            last_name: '',
            role: 'user'
          },
          companies: company || {
            id: assignment.company_id,
            name: 'Empresa no encontrada'
          }
        };
      });

      setAssignments(enrichedAssignments);
      setUsers(usersData || []);
      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedUserId || !selectedCompanyId) {
      toast({
        title: "Error",
        description: "Selecciona un usuario y una empresa",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_companies')
        .insert({
          user_id: selectedUserId,
          company_id: selectedCompanyId
        });

      if (error) throw error;

      toast({
        title: "Asignación creada",
        description: "El usuario ha sido asignado a la empresa correctamente",
      });

      setIsModalOpen(false);
      setSelectedUserId("");
      setSelectedCompanyId("");
      fetchData();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate') 
          ? "El usuario ya está asignado a esta empresa"
          : "No se pudo crear la asignación",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('user_companies')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Asignación eliminada",
        description: "La asignación ha sido eliminada correctamente",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la asignación",
        variant: "destructive",
      });
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
    return <div className="text-center">Cargando asignaciones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Asignaciones Usuario-Empresa</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Nueva Asignación
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Asignación</DialogTitle>
              <DialogDescription>
                Asigna un usuario a una empresa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Usuario</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.email} ({user.first_name} {user.last_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Empresa</label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
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
              <Button onClick={handleCreateAssignment} className="w-full">
                Crear Asignación
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">
                      {assignment.profiles.first_name} {assignment.profiles.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {assignment.profiles.email}
                    </p>
                  </div>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-secondary" />
                  <div>
                    <h3 className="font-medium">{assignment.companies.name}</h3>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{assignment.profiles.role}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteAssignment(assignment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No hay asignaciones creadas aún
        </div>
      )}
    </div>
  );
}