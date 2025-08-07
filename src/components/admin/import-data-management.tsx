import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Calendar, Building2, AlertCircle, CheckCircle, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
}

interface ImportJob {
  id: string;
  company_id: string;
  tipo: string;
  estado: string;
  storage_path: string;
  resumen: any;
  creado_en: string;
  actualizado_en: string;
  companies: Company;
}

const importTypes = [
  { value: 'pyg_anual', label: 'P&G Anual' }
];

export function ImportDataManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('estado', 'ACTIVO')
        .order('name');

      if (companiesError) throw companiesError;

      // Fetch import jobs with company info
      const { data: jobsData, error: jobsError } = await supabase
        .from('import_jobs')
        .select(`
          id,
          company_id,
          tipo,
          estado,
          storage_path,
          resumen,
          creado_en,
          actualizado_en,
          companies:company_id (id, name)
        `)
        .order('creado_en', { ascending: false })
        .limit(50);

      if (jobsError) throw jobsError;

      setCompanies(companiesData || []);
      setImportJobs(jobsData || []);
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

  const handleFileUpload = async () => {
    if (!selectedCompanyId || !selectedType || !file) {
      toast({
        title: "Error",
        description: "Completa todos los campos y selecciona un archivo",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);
      
      // Create import job record
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          company_id: selectedCompanyId,
          tipo: 'pyg_anual',
          storage_path: 'pending', // Will be updated after file upload
          estado: 'pending',
          resumen: null
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobData.id}.${fileExt}`;
      const filePath = `${selectedCompanyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('import-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update job with storage path
      const { error: updateError } = await supabase
        .from('import_jobs')
        .update({ storage_path: filePath })
        .eq('id', jobData.id);

      if (updateError) throw updateError;

      toast({
        title: "Archivo subido",
        description: "El archivo se ha subido correctamente. Haz clic en 'Procesar' para procesarlo.",
      });

      setIsModalOpen(false);
      setSelectedCompanyId("");
      setSelectedType("");
      setFile(null);
      fetchData();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessJob = async (jobId: string, jobType: string) => {
    try {
      setProcessing(true);
      
      if (jobType === 'pyg_anual') {
        const { error } = await supabase.functions.invoke('import-pyg-anual', {
          body: { job_id: jobId }
        });

        if (error) throw error;
        
        toast({
          title: "Procesamiento iniciado",
          description: "El archivo P&G anual está siendo procesado",
        });
      } else {
        toast({
          title: "Tipo no soportado",
          description: "El procesamiento de este tipo de archivo aún no está implementado",
          variant: "destructive",
        });
      }
      
      fetchData();
    } catch (error) {
      console.error('Error processing job:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pendiente</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-600">Procesando</Badge>;
      case 'done':
        return <Badge className="bg-green-600 text-white hover:bg-green-700">Completado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getTypeLabel = (tipo: string) => {
    return importTypes.find(t => t.value === tipo)?.label || tipo;
  };

  if (!isAdmin) {
    return (
      <div className="text-center text-muted-foreground">
        No tienes permisos para acceder a esta sección
      </div>
    );
  }

  if (loading) {
    return <div className="text-center">Cargando datos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Carga de Datos e Historial</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Cargar Datos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cargar Datos Financieros</DialogTitle>
              <DialogDescription>
                Selecciona la empresa, tipo de datos y archivo a procesar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company">Empresa</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una empresa" />
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
                <Label htmlFor="type">Tipo de Datos</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de datos" />
                  </SelectTrigger>
                  <SelectContent>
                    {importTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file">Archivo CSV/Excel</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button onClick={handleFileUpload} className="w-full" disabled={processing}>
                {processing ? "Subiendo..." : "Subir Archivo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Importaciones</CardTitle>
          <CardDescription>
            Últimas 50 importaciones realizadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {importJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {job.companies.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getTypeLabel(job.tipo)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(job.creado_en).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    {job.resumen && (
                      <>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {job.resumen.ok_rows?.length || 0} exitosos
                        </div>
                        {(job.resumen.error_rows?.length || 0) > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            {job.resumen.error_rows?.length || 0} errores
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          Total: {(job.resumen.ok_rows?.length || 0) + (job.resumen.error_rows?.length || 0)}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {job.estado === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProcessJob(job.id, job.tipo)}
                        disabled={processing}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Procesar
                      </Button>
                    )}
                    {getStatusBadge(job.estado)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {importJobs.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No hay importaciones registradas aún
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}