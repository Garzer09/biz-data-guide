import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Trash2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
}

interface AllocationRule {
  id: string;
  company_id: string;
  anio: string;
  concepto_codigo: string;
  driver: string;
}

interface AllocationWeight {
  id: string;
  allocation_rule_id: string;
  mes: number;
  peso: number;
}

export function AllocationRulesManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allocationRules, setAllocationRules] = useState<AllocationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [conceptCode, setConceptCode] = useState<string>("");
  const [weights, setWeights] = useState<number[]>(new Array(12).fill(1/12));
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('estado', 'ACTIVO')
        .order('name');

      if (companiesError) throw companiesError;

      const { data: rulesData, error: rulesError } = await supabase
        .from('allocation_rules')
        .select('*')
        .order('anio', { ascending: false });

      if (rulesError) throw rulesError;

      setCompanies(companiesData || []);
      setAllocationRules(rulesData || []);
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

  const handleCreateRule = async () => {
    if (!selectedCompanyId || !selectedYear || !conceptCode) {
      toast({
        title: "Error",
        description: "Completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    // Check if weights sum to 1
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      toast({
        title: "Error",
        description: "Los pesos deben sumar 1.0",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create allocation rule
      const { data: ruleData, error: ruleError } = await supabase
        .from('allocation_rules')
        .insert({
          company_id: selectedCompanyId,
          anio: selectedYear,
          concepto_codigo: conceptCode,
          driver: 'PERSONALIZADO'
        })
        .select()
        .single();

      if (ruleError) throw ruleError;

      // Create allocation weights
      const weightData = weights.map((peso, index) => ({
        allocation_rule_id: ruleData.id,
        mes: index + 1,
        peso
      }));

      const { error: weightsError } = await supabase
        .from('allocation_weights')
        .insert(weightData);

      if (weightsError) throw weightsError;

      toast({
        title: "Regla creada",
        description: "La regla de prorrateo se ha creado correctamente",
      });

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la regla",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      // Delete weights first
      await supabase
        .from('allocation_weights')
        .delete()
        .eq('allocation_rule_id', ruleId);

      // Then delete the rule
      const { error } = await supabase
        .from('allocation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Regla eliminada",
        description: "La regla de prorrateo se ha eliminado correctamente",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la regla",
        variant: "destructive",
      });
    }
  };

  const handleGenerateMonthly = async (companyId: string, year: string) => {
    try {
      const { error } = await supabase.rpc('allocate_pyg', {
        _company_id: companyId,
        _anio: year,
        _mode: 'REPLACE'
      });

      if (error) throw error;

      toast({
        title: "Distribución generada",
        description: "Los datos mensuales se han generado correctamente",
      });
    } catch (error) {
      console.error('Error generating monthly data:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la distribución mensual",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedCompanyId("");
    setSelectedYear("");
    setConceptCode("");
    setWeights(new Array(12).fill(1/12));
  };

  const updateWeight = (index: number, value: string) => {
    const newWeights = [...weights];
    newWeights[index] = parseFloat(value) || 0;
    setWeights(newWeights);
  };

  const distributeEvenly = () => {
    setWeights(new Array(12).fill(1/12));
  };

  if (!isAdmin) {
    return (
      <div className="text-center text-muted-foreground">
        No tienes permisos para acceder a esta sección
      </div>
    );
  }

  if (loading) {
    return <div className="text-center">Cargando reglas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Reglas de Prorrateo</h2>
          <p className="text-muted-foreground">
            Configura distribuciones mensuales personalizadas
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Regla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Crear Regla de Prorrateo</DialogTitle>
              <DialogDescription>
                Define una distribución mensual personalizada para un concepto específico
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Empresa</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Año</Label>
                  <Input
                    placeholder="2024"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Código Concepto</Label>
                  <Input
                    placeholder="7000"
                    value={conceptCode}
                    onChange={(e) => setConceptCode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Distribución Mensual (debe sumar 1.0)</Label>
                  <Button variant="outline" size="sm" onClick={distributeEvenly}>
                    Distribuir uniformemente
                  </Button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {weights.map((weight, index) => (
                    <div key={index}>
                      <Label className="text-xs">
                        {new Date(0, index).toLocaleString('es', { month: 'short' })}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={weight.toFixed(3)}
                        onChange={(e) => updateWeight(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total: {weights.reduce((sum, w) => sum + w, 0).toFixed(3)}
                </p>
              </div>

              <Button onClick={handleCreateRule} className="w-full">
                Crear Regla
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reglas Existentes</CardTitle>
          <CardDescription>
            Reglas de prorrateo configuradas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocationRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    {companies.find(c => c.id === rule.company_id)?.name || rule.company_id}
                  </TableCell>
                  <TableCell>{rule.anio}</TableCell>
                  <TableCell>{rule.concepto_codigo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.driver}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateMonthly(rule.company_id, rule.anio)}
                      >
                        <Calculator className="h-3 w-3 mr-1" />
                        Generar Mensual
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {allocationRules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay reglas configuradas aún
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}