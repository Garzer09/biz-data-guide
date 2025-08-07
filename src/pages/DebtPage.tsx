import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { 
  Plus, 
  Download, 
  Copy, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Info,
  Building2,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

interface DebtDetail {
  id: string;
  company_id: string;
  entidad: string;
  tipo: string;
  capital_pendiente: number;
  tir: number;
  plazo_restante: string;
  cuota: number;
  proximo_vencimiento: string;
  escenario: string;
  created_at: string;
}

interface KpiData {
  totalDebt: number;
  debtCount: number;
  avgTir: number;
  monthlyPayment: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function DebtPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedScenario, setSelectedScenario] = useState<string>("base");
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [debts, setDebts] = useState<DebtDetail[]>([]);
  const [kpiData, setKpiData] = useState<KpiData>({
    totalDebt: 0,
    debtCount: 0,
    avgTir: 0,
    monthlyPayment: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Chart data
  const [compositionData, setCompositionData] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId, selectedScenario]);

  const fetchData = async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Fetch KPI data
      const [totalDebtResult, avgTirResult, monthlyPaymentResult] = await Promise.all([
        supabase.rpc('get_total_debt', { _company_id: companyId, _escenario: selectedScenario }),
        supabase.rpc('get_weighted_tir', { _company_id: companyId, _escenario: selectedScenario }),
        supabase.rpc('get_monthly_payment_total', { _company_id: companyId, _escenario: selectedScenario })
      ]);

      // Fetch debt details
      const { data: debtDetails, error: debtError } = await supabase
        .from('vw_debt_detail')
        .select('*')
        .eq('company_id', companyId)
        .eq('escenario', selectedScenario)
        .order('capital_pendiente', { ascending: false });

      if (debtError) throw debtError;

      // Fetch scenarios
      const { data: scenariosData } = await supabase
        .from('debt_scenarios')
        .select('*')
        .eq('company_id', companyId);

      const debtCount = debtDetails?.length || 0;

      setKpiData({
        totalDebt: totalDebtResult.data || 0,
        debtCount,
        avgTir: avgTirResult.data || 0,
        monthlyPayment: monthlyPaymentResult.data || 0
      });

      setDebts(debtDetails || []);
      setScenarios(scenariosData || []);

      // Prepare chart data
      prepareChartData(debtDetails || []);

    } catch (err: any) {
      console.error('Error fetching debt data:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de deuda",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const prepareChartData = (data: DebtDetail[]) => {
    // Composition by type
    const typeComposition = data.reduce((acc, debt) => {
      acc[debt.tipo] = (acc[debt.tipo] || 0) + debt.capital_pendiente;
      return acc;
    }, {} as Record<string, number>);

    const compositionChart = Object.entries(typeComposition).map(([tipo, value]) => ({
      name: tipo,
      value,
      percentage: ((value / kpiData.totalDebt) * 100).toFixed(1)
    }));

    // Evolution by month
    const monthlyData = data.reduce((acc, debt) => {
      const month = format(new Date(debt.created_at), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + debt.capital_pendiente;
      return acc;
    }, {} as Record<string, number>);

    const evolutionChart = Object.entries(monthlyData)
      .map(([month, value]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        capital: value
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    setCompositionData(compositionChart);
    setEvolutionData(evolutionChart);
  };

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || debt.tipo === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredDebts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDebts = filteredDebts.slice(startIndex, startIndex + itemsPerPage);

  const uniqueTypes = [...new Set(debts.map(debt => debt.tipo))];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-40 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pool Bancario</h1>
              <p className="text-muted-foreground">
                Gestión del endeudamiento y análisis financiero
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar escenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Escenario Base</SelectItem>
                  {scenarios.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.nombre}>
                      {scenario.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capital Pendiente Total</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Suma total del capital pendiente de todas las deudas</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpiData.totalDebt)}</div>
              <p className="text-xs text-muted-foreground">
                {kpiData.debtCount} instrumentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TIR Promedio</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tasa interna de retorno ponderada por capital</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(kpiData.avgTir)}</div>
              <p className="text-xs text-muted-foreground">
                ponderado por capital
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuota Mensual</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Suma de todas las cuotas mensuales</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpiData.monthlyPayment)}</div>
              <p className="text-xs text-muted-foreground">
                compromisos regulares
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Añadir Deuda
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Duplicar Escenario
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por entidad o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Debt Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Deudas</CardTitle>
            <CardDescription>
              Listado completo del portfolio de deuda del escenario seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDebts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No hay deudas cargadas para este escenario</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Capital Pendiente</TableHead>
                      <TableHead className="text-right">TIR</TableHead>
                      <TableHead>Plazo Restante</TableHead>
                      <TableHead className="text-right">Cuota</TableHead>
                      <TableHead>Próx. Vencimiento</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDebts.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">{debt.entidad}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{debt.tipo}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(debt.capital_pendiente)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPercentage(debt.tir)}
                        </TableCell>
                        <TableCell>{debt.plazo_restante}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(debt.cuota)}
                        </TableCell>
                        <TableCell>
                          {debt.proximo_vencimiento ? 
                            format(new Date(debt.proximo_vencimiento), 'dd/MM/yyyy') : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredDebts.length)} de {filteredDebts.length} resultados
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        {debts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Composition Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Composición por Tipo</CardTitle>
                <CardDescription>
                  Distribución del capital pendiente según tipo de instrumento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={compositionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {compositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Capital']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolución del Pool</CardTitle>
                <CardDescription>
                  Capital pendiente acumulado por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <RechartsTooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Capital']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="capital" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Capital Pendiente"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}