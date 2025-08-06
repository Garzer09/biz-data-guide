import { useAuth } from "@/hooks/use-auth";
import { AdminPanel } from "@/components/admin/admin-panel";

export function AdminPage() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">No tienes permisos para acceder al panel de administrador</p>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
}