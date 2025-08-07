import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

interface SecurityContextType {
  logSecurityEvent: (action: string, resourceType: string, resourceId?: string, details?: any) => void;
  isSecurityEventLogged: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSecurityEventLogged, setIsSecurityEventLogged] = useState(false);

  const logSecurityEvent = async (
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any
  ) => {
    if (!user) return;

    try {
      setIsSecurityEventLogged(true);
      await supabase.rpc('log_security_event', {
        _action: action,
        _resource_type: resourceType,
        _resource_id: resourceId || null,
        _details: details || null
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    } finally {
      setIsSecurityEventLogged(false);
    }
  };

  // Log login events
  useEffect(() => {
    if (user) {
      logSecurityEvent('LOGIN', 'user', user.id);
    }
  }, [user]);

  return (
    <SecurityContext.Provider value={{
      logSecurityEvent,
      isSecurityEventLogged
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}