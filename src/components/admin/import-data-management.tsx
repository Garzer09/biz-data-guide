import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Calendar, Building2, AlertCircle, CheckCircle, Play, Info, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  { value: 'pyg_anual', label: 'P&G Anual' },
  { value: 'company_profile', label: 'Perfil de Empresa' },
  { value: 'balance_operativo', label: 'Balance Operativo' },
  { value: 'balance_financiero', label: 'Balance Financiero' },
  { value: 'cashflow_operativo', label: 'Cashflow Operativo' },
  { value: 'cashflow_inversion', label: 'Cashflow Inversión' },
  { value: 'cashflow_financiacion', label: 'Cashflow Financiación' }
];

interface ImportDataManagementProps {
  filterCompanyId?: string;
}

export function ImportDataManagement({ filterCompanyId }: ImportDataManagementProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("pyg_anual");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingJobs, setProcessingJobs] = useState<Set<string>>(new Set());
  const [selectedJobDetail, setSelectedJobDetail] = useState<ImportJob | null>(null);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Separate useEffect for setting the company when filterCompanyId changes
  useEffect(() => {
    if (filterCompanyId && companies.length > 0) {
      console.log('Setting selectedCompanyId to:', filterCompanyId);
      setSelectedCompanyId(filterCompanyId);
    }
  }, [filterCompanyId, companies]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch companies based on filter or admin status
      let companiesData;
      if (filterCompanyId) {
        // If filtering by specific company, only fetch that company
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .eq('id', filterCompanyId)
          .eq('estado', 'ACTIVO');
        
        if (error) throw error;
        companiesData = data;
      } else if (isAdmin) {
        // Admin can see all companies
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .eq('estado', 'ACTIVO')
          .order('name');
        
        if (error) throw error;
        companiesData = data;
      } else {
        // Regular users see accessible companies
        const { data, error } = await supabase
          .rpc('get_accessible_companies', { _user_id: (await supabase.auth.getUser()).data.user?.id });
        
        if (error) throw error;
        
        // Get company details for accessible company IDs
        if (data && data.length > 0) {
          const { data: companyDetails, error: detailsError } = await supabase
            .from('companies')
            .select('id, name')
            .in('id', data.map((c: any) => c.company_id))
            .eq('estado', 'ACTIVO');
          
          if (detailsError) throw detailsError;
          companiesData = companyDetails;
        } else {
          companiesData = [];
        }
      }

      // Fetch import jobs with company info
      let jobsQuery = supabase
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
      
      // Filter jobs by company if specified
      if (filterCompanyId) {
        jobsQuery = jobsQuery.eq('company_id', filterCompanyId);
      }

      const { data: jobsData, error: jobsError } = await jobsQuery;

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

  const uploadFile = async () => {
    console.log('uploadFile called');
    console.log('file:', file);
    console.log('selectedCompanyId:', selectedCompanyId);
    console.log('selectedType:', selectedType);
    
    if (!file || !selectedCompanyId) {
      console.log('Validation failed - missing file or company');
      toast({
        title: "Error",
        description: "Por favor selecciona empresa y archivo",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting upload process');
      setProcessing(true);
      // Generate unique file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileExt = file.name.split('.').pop();
      const filePath = `raw_uploads/${selectedCompanyId}/${timestamp}/${file.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('import-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create import job record
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          company_id: selectedCompanyId,
          tipo: selectedType,
          storage_path: filePath,
          estado: 'pending',
          resumen: null
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Reset form and close modal
      setFile(null);
      setSelectedCompanyId("");
      setSelectedType("pyg_anual");
      setIsModalOpen(false);

      // Refresh data
      await fetchData();

      toast({
        title: "Archivo subido",
        description: "El archivo ha sido subido y está listo para procesar",
      });

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: error.message || "Error al subir el archivo",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const processJob = async (jobId: string) => {
    try {
      setProcessingJobs(prev => new Set([...prev, jobId]));

      // Update job status to processing in UI immediately
      setImportJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, estado: 'processing' } : job
      ));

      // Get job type to determine which function to call
      const job = importJobs.find(j => j.id === jobId);
      let functionName = 'import-pyg-anual'; // default
      let functionBody: any = { job_id: jobId };
      
      if (job?.tipo === 'company_profile') {
        functionName = 'import-company-profile';
      } else if (job?.tipo === 'balance_operativo' || job?.tipo === 'balance_financiero') {
        functionName = 'import-balance';
        functionBody = { job_id: jobId, tipo: job.tipo.replace('balance_', '') };
      } else if (job?.tipo?.startsWith('cashflow_')) {
        functionName = 'import-cashflow';
        functionBody = { job_id: jobId, tipo: job.tipo.replace('cashflow_', '') };
      }
        
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: functionBody
      });

      if (error) throw error;

      // Refresh the specific job data
      await fetchData();

      toast({
        title: "Procesamiento completado",
        description: (() => {
          if (job?.tipo?.startsWith('cashflow_')) {
            return `Estado: ${data.success ? 'Exitoso' : 'Error'}. ${data.results?.ok_rows || 0} filas exitosas, ${data.results?.error_rows || 0} errores.`;
          } else {
            return `Estado: ${data.status}. ${data.summary?.ok_rows || 0} filas exitosas, ${data.summary?.error_rows || 0} errores.`;
          }
        })(),
      });

    } catch (error: any) {
      console.error('Error processing job:', error);
      toast({
        title: "Error en procesamiento",
        description: error.message || "Error al procesar el archivo",
        variant: "destructive"
      });
      
      // Refresh data to get current status
      await fetchData();
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const job = importJobs.find(j => j.id === jobId);
      if (!job) return;

      // Delete the file from storage first
      const { error: storageError } = await supabase.storage
        .from('import-files')
        .remove([job.storage_path]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
      }

      // Delete the import job record
      const { error: dbError } = await supabase
        .from('import_jobs')
        .delete()
        .eq('id', jobId);

      if (dbError) throw dbError;

      // Refresh data
      await fetchData();

      toast({
        title: "Archivo eliminado",
        description: "El archivo y el registro de importación han sido eliminados",
      });

    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el archivo",
        variant: "destructive"
      });
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
    const typeMap: Record<string, string> = {
      'pyg_anual': 'P&G Anual',
      'company_profile': 'Perfil de Empresa',
      'balance_operativo': 'Balance Operativo',
      'balance_financiero': 'Balance Financiero',
      'cashflow_operativo': 'Cashflow Operativo',
      'cashflow_inversion': 'Cashflow Inversión',
      'cashflow_financiacion': 'Cashflow Financiación'
    };
    return typeMap[tipo] || tipo;
  };

  const downloadTemplate = (type?: string) => {
    const templateType = type || selectedType;
    
    if (templateType === 'company_profile') {
      const csvContent = "company_alias,sector,industria,anio_fundacion,empleados,ingresos_anuales,sede,sitio_web,descripcion,estructura_accionarial,organigrama\n";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'company_profile_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (templateType === 'balance_operativo') {
      // Download from public templates
      const link = document.createElement('a');
      link.href = '/templates/seed_balance_operativo_2024.csv';
      link.download = 'balance_operativo_template.csv';
      link.click();
    } else if (templateType === 'balance_financiero') {
      // Download from public templates
      const link = document.createElement('a');
      link.href = '/templates/seed_balance_financiero_2024.csv';
      link.download = 'balance_financiero_template.csv';
      link.click();
    } else if (templateType === 'cashflow_operativo') {
      const csvContent = "company_code,periodo,flujo_operativo\nEMP_DEMO_2,2024-01,50000\nEMP_DEMO_2,2024-02,55000\n";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'cashflow_operativo_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (templateType === 'cashflow_inversion') {
      const csvContent = "company_code,periodo,flujo_inversion\nEMP_DEMO_2,2024-01,-25000\nEMP_DEMO_2,2024-02,-30000\n";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'cashflow_inversion_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (templateType === 'cashflow_financiacion') {
      const csvContent = "company_code,periodo,flujo_financiacion\nEMP_DEMO_2,2024-01,10000\nEMP_DEMO_2,2024-02,15000\n";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'cashflow_financiacion_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
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
        <h2 className="text-xl font-semibold">
          {filterCompanyId ? "Importaciones de la Empresa" : "Gestión de Importaciones"}
        </h2>
        {/* Only show upload button if we have companies to select from */}
        {companies.length > 0 && (
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
                  <Select 
                    value={selectedCompanyId} 
                    onValueChange={(value) => {
                      console.log('Company selected:', value);
                      setSelectedCompanyId(value);
                    }}
                    disabled={!!filterCompanyId} // Disable if filtering by specific company
                  >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      filterCompanyId 
                        ? companies.find(c => c.id === filterCompanyId)?.name || "Empresa seleccionada"
                        : "Selecciona una empresa"
                    } />
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

              {(selectedType === 'company_profile' || selectedType === 'balance_operativo' || selectedType === 'balance_financiero' || selectedType.startsWith('cashflow_')) && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Para importar {getTypeLabel(selectedType).toLowerCase()}, descarga la plantilla:
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadTemplate()}
                    className="text-xs"
                  >
                    📄 Descargar plantilla CSV
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="file">Archivo CSV/Excel</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    console.log('File selected:', selectedFile);
                    setFile(selectedFile);
                  }}
                />
              </div>

              <Button onClick={uploadFile} className="w-full" disabled={processing}>
                {processing ? "Subiendo..." : "Subir Archivo"}
              </Button>
            </div>
            </DialogContent>
          </Dialog>
        )}
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
            {importJobs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No hay importaciones registradas aún
              </div>
            )}
            
            <div className="space-y-4">
              {importJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{job.companies.name}</span>
                          <Badge variant="outline">{job.tipo}</Badge>
                          {getStatusBadge(job.estado)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.creado_en).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Summary stats */}
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
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {(job.estado === 'done' || job.estado === 'failed') && job.resumen && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedJobDetail(job)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {(job.estado === 'pending' || job.estado === 'failed') && (
                            <Button
                              size="sm"
                              onClick={() => processJob(job.id)}
                              disabled={processingJobs.has(job.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {processingJobs.has(job.id) ? 'Procesando...' : 'Procesar'}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteJob(job.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Detail Drawer */}
      {selectedJobDetail && (
        <Drawer open={!!selectedJobDetail} onOpenChange={() => setSelectedJobDetail(null)}>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>Detalle de Importación</DrawerTitle>
              <DrawerDescription>
                {selectedJobDetail.companies.name} - {selectedJobDetail.tipo} - {getStatusBadge(selectedJobDetail.estado)}
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="p-6 space-y-6">
              {selectedJobDetail.resumen && (
                <>
                   {/* Summary Stats */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Card>
                       <CardContent className="p-4 text-center">
                         <div className="text-2xl font-bold text-green-600">
                           {selectedJobDetail.resumen.ok_rows?.length || 0}
                         </div>
                         <div className="text-sm text-muted-foreground">Filas exitosas</div>
                       </CardContent>
                     </Card>
                     
                     <Card>
                       <CardContent className="p-4 text-center">
                         <div className="text-2xl font-bold text-red-600">
                           {selectedJobDetail.resumen.error_rows?.length || 0}
                         </div>
                         <div className="text-sm text-muted-foreground">Filas con error</div>
                       </CardContent>
                     </Card>
                     
                     <Card>
                       <CardContent className="p-4 text-center">
                         <div className="text-2xl font-bold text-yellow-600">
                           {selectedJobDetail.resumen.warnings?.length || 0}
                         </div>
                         <div className="text-sm text-muted-foreground">Advertencias</div>
                       </CardContent>
                     </Card>
                   </div>

                   {/* JSON Fields Summary for Company Profile */}
                   {selectedJobDetail.tipo === 'company_profile' && selectedJobDetail.resumen && (
                     <>
                       {selectedJobDetail.resumen.estructura_accionarial && selectedJobDetail.resumen.estructura_accionarial.length > 0 && (
                         <Card>
                           <CardHeader>
                             <CardTitle className="text-base">Estructura Accionarial Procesada</CardTitle>
                           </CardHeader>
                           <CardContent>
                             <ScrollArea className="h-40">
                               <div className="space-y-2">
                                 {selectedJobDetail.resumen.estructura_accionarial.map((item: any, index: number) => (
                                   <div key={index} className="p-2 bg-muted rounded text-sm">
                                     <strong>{item.company}:</strong>
                                     <pre className="mt-1 text-xs overflow-x-auto">
                                       {JSON.stringify(item.data, null, 2)}
                                     </pre>
                                   </div>
                                 ))}
                               </div>
                             </ScrollArea>
                           </CardContent>
                         </Card>
                       )}

                       {selectedJobDetail.resumen.organigrama && selectedJobDetail.resumen.organigrama.length > 0 && (
                         <Card>
                           <CardHeader>
                             <CardTitle className="text-base">Organigrama Procesado</CardTitle>
                           </CardHeader>
                           <CardContent>
                             <ScrollArea className="h-40">
                               <div className="space-y-2">
                                 {selectedJobDetail.resumen.organigrama.map((item: any, index: number) => (
                                   <div key={index} className="p-2 bg-muted rounded text-sm">
                                     <strong>{item.company}:</strong>
                                     <pre className="mt-1 text-xs overflow-x-auto">
                                       {JSON.stringify(item.data, null, 2)}
                                     </pre>
                                   </div>
                                 ))}
                               </div>
                             </ScrollArea>
                           </CardContent>
                         </Card>
                       )}
                     </>
                   )}

                  {/* Error Details */}
                  {selectedJobDetail.resumen.error_rows && selectedJobDetail.resumen.error_rows.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-red-600">Errores encontrados</h3>
                      <ScrollArea className="h-60 w-full border rounded-md p-4">
                        <div className="space-y-2">
                          {selectedJobDetail.resumen.error_rows.map((error: any, index: number) => (
                            <div key={index} className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                              <div className="font-medium text-sm">Fila {error.row}</div>
                              <div className="text-sm text-red-700">{error.error}</div>
                              {error.data && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {JSON.stringify(error.data)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Success Details */}
                  {selectedJobDetail.resumen.ok_rows && selectedJobDetail.resumen.ok_rows.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-600">Importaciones exitosas</h3>
                      <ScrollArea className="h-40 w-full border rounded-md p-4">
                        <div className="space-y-1">
                          {selectedJobDetail.resumen.ok_rows.slice(0, 10).map((success: any, index: number) => (
                            <div key={index} className="p-2 bg-green-50 border-l-4 border-green-400 rounded text-sm">
                              Fila {success.row}: {success.data.concepto_codigo} - {success.data.anio} - {success.data.valor_total}
                            </div>
                          ))}
                          {selectedJobDetail.resumen.ok_rows.length > 10 && (
                            <div className="text-sm text-muted-foreground text-center py-2">
                              ... y {selectedJobDetail.resumen.ok_rows.length - 10} más
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Warnings */}
                  {selectedJobDetail.resumen.warnings && selectedJobDetail.resumen.warnings.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-yellow-600">Advertencias</h3>
                      <ScrollArea className="h-32 w-full border rounded-md p-4">
                        <div className="space-y-1">
                          {selectedJobDetail.resumen.warnings.map((warning: string, index: number) => (
                            <div key={index} className="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded text-sm">
                              {warning}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}