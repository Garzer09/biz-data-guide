import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/use-auth';
import { Auth } from './pages/Auth';
import { AppLayout } from './components/layout/app-layout';
import { AdminPage } from './pages/AdminPage';
import { CompanySelector } from './pages/CompanySelector';
import { CompanyDashboard } from './pages/company/CompanyDashboard';
import { PyGPage } from './pages/company/PyGPage';
import { PyGAnalyticPage } from './pages/company/PyGAnalyticPage';
import { SalesSegmentsPage } from './pages/company/SalesSegmentsPage';
import { CashflowPage } from './pages/CashflowPage';
import { RatiosPage } from './pages/RatiosPage';
import { BreakevenPage } from './pages/BreakevenPage';
import { NofPage } from './pages/NofPage';
import DebtPage from './pages/DebtPage';
import DebtPoolPage from './pages/DebtPoolPage';
import DebtServicePage from './pages/company/DebtServicePage';
import { CompanyPage } from './pages/company/CompanyPage';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  const { user, loading, isAdmin, userProfile } = useAuth();

  if (loading || (user && !userProfile)) {
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
          {/* Company selector for normal users */}
          <Route 
            path="/home" 
            element={<CompanySelector />} 
          />
          
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
            path="/c/:companyId/pyg" 
            element={
              <AppLayout>
                <PyGPage />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/cashflow" 
            element={
              <AppLayout>
                <CashflowPage />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/ratios" 
            element={
              <AppLayout>
                <RatiosPage />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/breakeven" 
            element={
              <AppLayout>
                <BreakevenPage />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/nof" 
            element={
              <AppLayout>
                <NofPage />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/debt" 
            element={
              <AppLayout>
                <DebtPage />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/pool-bancario" 
            element={
              <AppLayout>
                <DebtPoolPage />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/debt-service" 
            element={
              <AppLayout>
                <DebtServicePage />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/pyg_analytic" 
            element={
              <AppLayout>
                <PyGAnalyticPage />
              </AppLayout>
            } 
          />
          
          <Route 
            path="/c/:companyId/sales-segments" 
            element={
              <AppLayout>
                <SalesSegmentsPage />
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
          
          {/* Root redirect based on user role */}
          <Route 
            path="/" 
            element={
              <Navigate 
                to={isAdmin ? "/admin" : "/home"} 
                replace 
              />
            } 
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
