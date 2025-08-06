import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/use-auth';
import { Auth } from './pages/Auth';
import { AppLayout } from './components/layout/app-layout';
import { AdminPage } from './pages/AdminPage';
import { CompanyDashboard } from './pages/company/CompanyDashboard';
import { CompanyPage } from './pages/company/CompanyPage';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/" replace /> : <Auth />} 
      />
      
      {/* Protected routes */}
      {user ? (
        <>
          {/* Admin panel */}
          <Route 
            path="/admin" 
            element={
              <AppLayout>
                <AdminPage />
              </AppLayout>
            } 
          />
          
          {/* Company-specific routes */}
          <Route 
            path="/c/:companyId/dashboard" 
            element={
              <AppLayout>
                <CompanyDashboard />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/:page" 
            element={
              <AppLayout>
                <CompanyPage />
              </AppLayout>
            } 
          />
          
          {/* Root redirect */}
          <Route 
            path="/" 
            element={<Navigate to="/admin" replace />} 
          />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/auth" replace />} />
      )}
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
