import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  Download,
  TrendingUp,
  Calendar,
  Euro
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DebtFormModal } from "@/components/debt/debt-form-modal";
import { ScenarioDuplicateModal } from "@/components/debt/scenario-duplicate-modal";

interface DebtDetail {
  id: string;
  entidad: string;
  tipo: string;
  capital_pendiente: number;
  tir: number;
  plazo_restante: string;
  cuota: number;
  proximo_vencimiento: string;
  escenario: string;
}

export default function DebtPoolPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { toast } = useToast();

  const [selectedScenario, setSelectedScenario] = useState("base");
  const [scenarios, setScenarios] = useState<Array<{ escenario: string; num_deudas: number }>>([]);
  const [debts, setDebts] = useState<DebtDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPI states
  const [totalDebt, setTotalDebt] = useState(0);
  const [weightedTir, setWeightedTir] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  // Modal states
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtDetail | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      fetchScenarios();
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId && selectedScenario) {
      fetchDebts();
      fetchKPIs();
    }
  }, [companyId, selectedScenario]);

  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase.rpc('get_debt_scenarios', {
        _company_id: companyId
      });

      if (error) throw error;
      
      const scenariosList = data || [];
      setScenarios(scenariosList);

      // If no scenarios exist, add default 'base' scenario
      if (scenariosList.length === 0) {
        setScenarios([{ escenario: 'base', num_deudas: 0 }]);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      setError('Error al cargar escenarios');
    }
  };

  const fetchDebts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vw_debt_detail')
        .select('*')
        .eq('company_id', companyId)
        .eq('escenario', selectedScenario)
        .order('proximo_vencimiento', { ascending: true });

      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
      setError('Error al cargar las deudas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKPIs = async () => {
    try {
      const [totalDebtResult, tirResult, paymentResult] = await Promise.all([
        supabase.rpc('get_total_debt', { _company_id: companyId, _escenario: selectedScenario }),
        supabase.rpc('get_weighted_tir', { _company_id: companyId, _escenario: selectedScenario }),
        supabase.rpc('get_monthly_payment_total', { _company_id: companyId, _escenario: selectedScenario })
      ]);

      if (totalDebtResult.error) throw totalDebtResult.error;
      if (tirResult.error) throw tirResult.error;
      if (paymentResult.error) throw paymentResult.error;

      setTotalDebt(totalDebtResult.data || 0);
      setWeightedTir(tirResult.data || 0);
      setMonthlyPayment(paymentResult.data || 0);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  const handleDeleteDebt = async () => {
    if (!debtToDelete) return;

    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtToDelete);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Deuda eliminada correctamente",
      });

      fetchDebts();
      fetchKPIs();
      fetchScenarios();
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la deuda",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDebtToDelete(null);
    }
  };

  const handleEditDebt = (debt: DebtDetail) => {
    setEditingDebt(debt);
    setIsDebtModalOpen(true);
  };

  const handleAddDebt = () => {
    setEditingDebt(null);
    setIsDebtModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchDebts();
    fetchKPIs();
    fetchScenarios();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pool Bancario</h1>
          <p className="text-muted-foreground">Gestión y análisis del endeudamiento</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedScenario} onValueChange={setSelectedScenario}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar escenario" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((scenario) => (
                <SelectItem key={scenario.escenario} value={scenario.escenario}>
                  {scenario.escenario} ({scenario.num_deudas})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setIsDuplicateModalOpen(true)}
            disabled={scenarios.length === 0}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicar Escenario
          </Button>
          
          <Button onClick={handleAddDebt}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir Deuda
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Pendiente Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
            <p className="text-xs text-muted-foreground">
              Suma total de capital pendiente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TIR Promedio Ponderada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weightedTir.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Ponderada por capital pendiente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuota Mensual Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</div>
            <p className="text-xs text-muted-foreground">
              Suma de todas las cuotas mensuales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Deudas - {selectedScenario}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : debts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay deudas registradas en este escenario</p>
              <Button onClick={handleAddDebt} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Añadir Primera Deuda
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Capital</TableHead>
                    <TableHead className="text-right">TIR</TableHead>
                    <TableHead>Plazo</TableHead>
                    <TableHead className="text-right">Cuota</TableHead>
                    <TableHead>Próx. Venc.</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium">{debt.entidad}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{debt.tipo}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(debt.capital_pendiente)}</TableCell>
                      <TableCell className="text-right">{debt.tir?.toFixed(1)}%</TableCell>
                      <TableCell>{debt.plazo_restante}</TableCell>
                      <TableCell className="text-right">{formatCurrency(debt.cuota)}</TableCell>
                      <TableCell>{formatDate(debt.proximo_vencimiento)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDebt(debt)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDebtToDelete(debt.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <DebtFormModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSuccess={handleModalSuccess}
        companyId={companyId!}
        scenario={selectedScenario}
        editingDebt={editingDebt}
      />

      <ScenarioDuplicateModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onSuccess={handleModalSuccess}
        companyId={companyId!}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La deuda será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDebt}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}