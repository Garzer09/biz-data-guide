import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger, logError } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to our centralized logging system
    logError(error, 'ErrorBoundary');
    logger.error('Component error caught by boundary', 'ErrorBoundary', {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });

    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={24} />
                <CardTitle>¡Ups! Algo salió mal</CardTitle>
              </div>
              <CardDescription>
                Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error ID: {this.state.errorId}</AlertTitle>
                <AlertDescription>
                  {this.state.error?.message || 'Error desconocido'}
                </AlertDescription>
              </Alert>

              {this.props.showDetails && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Detalles técnicos (para desarrolladores)
                  </summary>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div className="mb-2">
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-wrap gap-2 pt-4">
                <Button onClick={this.handleRetry} variant="default">
                  <RefreshCw size={16} className="mr-2" />
                  Intentar de nuevo
                </Button>
                <Button onClick={this.handleReload} variant="outline">
                  <RefreshCw size={16} className="mr-2" />
                  Recargar página
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home size={16} className="mr-2" />
                  Ir al inicio
                </Button>
              </div>

              <div className="text-sm text-gray-500 mt-4">
                Si el problema persiste, por favor contacta con soporte técnico 
                proporcionando el ID del error: <code className="bg-gray-100 px-1 rounded">{this.state.errorId}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to report errors
export const useErrorHandler = () => {
  return React.useCallback((error: Error, context?: string) => {
    logError(error, context || 'useErrorHandler');
    // In a real app, you might want to report this to an error tracking service
    throw error; // Re-throw to trigger Error Boundary
  }, []);
};