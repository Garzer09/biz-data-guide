import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UserPlus, 
  Trash2, 
  Users, 
  Building2, 
  Shield, 
  ShieldCheck, 
  Mail, 
  Settings,
  AlertTriangle
} from "lucide-react";
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

interface UserWithAssignments extends Profile {
  assignedCompanies: Company[];
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserWithAssignments[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithAssignments | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "user"
  });
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
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

      // Fetch user-company assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_companies')
        .select('user_id, company_id');

      if (assignmentsError) throw assignmentsError;

      // Build users with their assigned companies
      const usersWithAssignments = (usersData || []).map(user => {
        const userAssignments = (assignmentsData || []).filter(a => a.user_id === user.user_id);
        const assignedCompanies = userAssignments.map(assignment => 
          companiesData?.find(c => c.id === assignment.company_id)
        ).filter(Boolean) as Company[];

        return {
          ...user,
          assignedCompanies
        };
      });

      setUsers(usersWithAssignments);
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

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password) {
      toast({
        title: "Error",
        description: "Email y contraseña son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.admin.createUser({
        email: newUserData.email,
        password: newUserData.password,
        user_metadata: {
          first_name: newUserData.first_name,
          last_name: newUserData.last_name,
          role: newUserData.role
        }
      });

      if (error) throw error;

      toast({
        title: "Usuario creado",
        description: "El usuario se ha creado correctamente",
      });

      setIsCreateModalOpen(false);
      setNewUserData({ email: "", password: "", first_name: "", last_name: "", role: "user" });
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    }
  };

  const handleToggleAdmin = async (user: UserWithAssignments) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "Permisos actualizados",
        description: `El usuario ahora es ${newRole === 'admin' ? 'administrador' : 'usuario normal'}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los permisos",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: UserWithAssignments) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.email}?`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(user.user_id);

      if (error) throw error;

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const openAssignModal = (user: UserWithAssignments) => {
    setSelectedUser(user);
    setSelectedCompanies(user.assignedCompanies.map(c => c.id));
    setIsAssignModalOpen(true);
  };

  const handleUpdateAssignments = async () => {
    if (!selectedUser) return;

    try {
      // First, remove all existing assignments
      await supabase
        .from('user_companies')
        .delete()
        .eq('user_id', selectedUser.user_id);

      // Then add the new assignments
      if (selectedCompanies.length > 0) {
        const assignments = selectedCompanies.map(companyId => ({
          user_id: selectedUser.user_id,
          company_id: companyId
        }));

        const { error } = await supabase
          .from('user_companies')
          .insert(assignments);

        if (error) throw error;
      }

      toast({
        title: "Asignaciones actualizadas",
        description: "Las asignaciones de empresas se han actualizado correctamente",
      });

      setIsAssignModalOpen(false);
      setSelectedUser(null);
      setSelectedCompanies([]);
      fetchData();
    } catch (error) {
      console.error('Error updating assignments:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las asignaciones",
        variant: "destructive",
      });
    }
  };

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  if (!isAdmin) {
    return (
      <div className="text-center text-muted-foreground">
        No tienes permisos para acceder a esta sección
      </div>
    );
  }

  if (loading) {
    return <div className="text-center">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa los datos para crear un nuevo usuario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Contraseña temporal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={newUserData.first_name}
                    onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Apellidos</Label>
                  <Input
                    id="last_name"
                    value={newUserData.last_name}
                    onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                    placeholder="Apellidos"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={newUserData.role} onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateUser} className="w-full">
                Crear Usuario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.user_id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : "Sin nombre completo"
                        }
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Empresas asignadas:</span>
                        {user.assignedCompanies.length > 0 ? (
                          user.assignedCompanies.map(company => (
                            <Badge key={company.id} variant="outline" className="text-xs">
                              {company.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">Sin asignar</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                    {user.role === 'admin' ? 'Admin' : 'Usuario'}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAdmin(user)}
                    className="flex items-center gap-1"
                  >
                    {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignModal(user)}
                    className="flex items-center gap-1"
                  >
                    <Building2 className="h-4 w-4" />
                    Asignar
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No hay usuarios registrados aún
        </div>
      )}

      {/* Assignment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Empresas</DialogTitle>
            <DialogDescription>
              Selecciona las empresas a las que {selectedUser?.email} tendrá acceso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={company.id}
                    checked={selectedCompanies.includes(company.id)}
                    onCheckedChange={() => handleCompanyToggle(company.id)}
                  />
                  <label
                    htmlFor={company.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    {company.name}
                  </label>
                </div>
              ))}
            </div>
            <Button onClick={handleUpdateAssignments} className="w-full">
              Actualizar Asignaciones
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}