import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Building2, Upload, Eye, BarChart3, History, Users, UserPlus } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface Company {
  id: string;
  name: string;
  currency: string;
  accounting_plan: string;
  coverage: string;
  last_load: string | null;
  status: "FAILED" | "SUCCESS" | "PENDING";
  sector: string;
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

export function CompaniesManagement() {
  const { isAdmin } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    currency: "EUR",
    accounting_plan: "PGC",
    sector: ""
  });
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "user"
  });

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCompanies((data || []) as Company[]);
    } catch (error: any) {
      toast.error('Error al cargar empresas');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Error al cargar usuarios');
    }
  };

  const handleCreateCompany = async () => {
    if (newCompany.name.trim()) {
      try {
        const { error } = await supabase
          .from('companies')
          .insert([{
            name: newCompany.name,
            currency: newCompany.currency,
            accounting_plan: newCompany.accounting_plan,
            sector: newCompany.sector
          }]);
        
        if (error) throw error;
        
        toast.success('Empresa creada exitosamente');
        setNewCompany({ name: "", currency: "EUR", accounting_plan: "PGC", sector: "" });
        setIsCreateModalOpen(false);
        fetchCompanies();
      } catch (error: any) {
        toast.error('Error al crear empresa');
      }
    }
  };

  const handleCreateUser = async () => {
    if (newUser.email.trim() && newUser.password.trim()) {
      try {
        const { error } = await supabase.auth.admin.createUser({
          email: newUser.email,
          password: newUser.password,
          user_metadata: {
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role
          },
          email_confirm: true
        });
        
        if (error) throw error;
        
        toast.success('Usuario creado exitosamente');
        setNewUser({ email: "", password: "", first_name: "", last_name: "", role: "user" });
        setIsCreateUserModalOpen(false);
        fetchUsers();
      } catch (error: any) {
        toast.error('Error al crear usuario');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader 
          title="Panel de administrador"
          subtitle="Administra empresas y carga datos financieros mediante plantillas CSV"
        />
        
        <div className="flex gap-3">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover">
                <Building2 className="h-4 w-4 mr-2" />
                Crear Empresa
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
                  <Select value={newCompany.accounting_plan} onValueChange={(value) => setNewCompany({...newCompany, accounting_plan: value})}>
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
          
          <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">Nombre</Label>
                    <Input
                      id="first-name"
                      placeholder="Nombre"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Apellidos</Label>
                    <Input
                      id="last-name"
                      placeholder="Apellidos"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="user-email">Email *</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="user-password">Contraseña *</Label>
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="Contraseña temporal"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label>Rol</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleCreateUser}
                    className="flex-1 bg-primary hover:bg-primary-hover"
                  >
                    Crear Usuario
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateUserModalOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                    {company.currency} {company.accounting_plan && `• ${company.accounting_plan}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cobertura de Datos</span>
              </div>
              <p className="text-sm text-muted-foreground">{company.coverage}</p>
              
              {company.last_load && (
                <div className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Última Carga</span>
                  <span className={company.status === "FAILED" ? "text-destructive" : "text-success"}>
                    {company.status === "FAILED" ? "FAILED" : "OK"} {company.last_load}
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

      {/* Users Section */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Gestión de Usuarios
          </h2>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Ver Todos ({users.length})
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.slice(0, 6).map((user) => (
            <Card key={user.id} className="p-6 shadow-card border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user.email
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rol:</span>
                  <span className={user.role === 'admin' ? "text-primary font-medium" : "text-foreground"}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm" className="flex-1">
                  <Building2 className="h-4 w-4 mr-1" />
                  Asignar Empresas
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}