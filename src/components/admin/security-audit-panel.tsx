import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SecurityAuditEvent {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: unknown;
  user_agent: unknown;
  created_at: string;
}

export function SecurityAuditPanel() {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<SecurityAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchSecurityEvents();
    }
  }, [isAdmin]);

  const fetchSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents((data || []) as SecurityAuditEvent[]);
    } catch (error) {
      console.error('Error fetching security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'default';
      case 'ROLE_CHANGE':
        return 'destructive';
      case 'DATA_ACCESS':
        return 'secondary';
      case 'FILE_UPLOAD':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <User className="w-4 h-4" />;
      case 'ROLE_CHANGE':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Acceso Denegado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Solo los administradores pueden acceder al panel de auditoría de seguridad.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Auditoría de Seguridad
        </CardTitle>
        <CardDescription>
          Registro de eventos de seguridad y acciones administrativas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Cargando eventos de seguridad...</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{event.user_id?.substring(0, 8)}...</code>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getActionBadgeVariant(event.action)}
                          className="flex items-center gap-1"
                        >
                          {getActionIcon(event.action)}
                          {event.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {event.resource_type}
                          {event.resource_id && (
                            <span className="text-muted-foreground">
                              :{event.resource_id.substring(0, 8)}...
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        {event.details && (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {JSON.stringify(event.details)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron eventos de seguridad
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}