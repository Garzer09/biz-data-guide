import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Download, AlertCircle, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Company {
  id: string;
  name: string;
}

interface PyGAnalyticUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PyGAnalyticUploadModal({ isOpen, onClose, onSuccess }: PyGAnalyticUploadModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  // Load companies when modal opens
  const loadCompanies = async () => {
    if (!isAdmin) return;
    
    try {
      setLoadingCompanies(true);
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('estado', 'ACTIVO')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas",
        variant: "destructive",
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Load companies when modal opens
  useState(() => {
    if (isOpen) {
      loadCompanies();
    }
  });

  const downloadTemplate = () => {
    const csvContent = `company_code,periodo,concepto_codigo,valor,segmento,centro_coste
EMP_DEMO_2,2024,PYG_INGRESOS,500000,Ventas Online,Madrid
EMP_DEMO_2,2024,PYG_COSTE_VENTAS,-300000,Ventas Online,Madrid
EMP_DEMO_2,2024,PYG_GASTOS_PERSONAL,-80000,Administración,Madrid
EMP_DEMO_2,2024-01,PYG_INGRESOS,41666,Ventas Online,Madrid
EMP_DEMO_2,2024-01,PYG_COSTE_VENTAS,-25000,Ventas Online,Madrid`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'pyg_analytic_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedCompanyId) {
      toast({
        title: "Error",
        description: "Por favor selecciona empresa y archivo",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      
      // Generate unique file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filePath = `raw_uploads/${selectedCompanyId}/pyg_analytic/${timestamp}/${file.name}`;

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
          tipo: 'pyg_analytic',
          storage_path: filePath,
          estado: 'pending',
          resumen: null
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Process the file immediately
      const { data, error: processError } = await supabase.functions.invoke('import-pyg-analytic', {
        body: { job_id: jobData.id }
      });

      if (processError) throw processError;

      // Reset form and close modal
      setFile(null);
      setSelectedCompanyId("");
      onClose();
      onSuccess();

      toast({
        title: "Archivo procesado",
        description: `Archivo subido y procesado exitosamente. ${data.summary?.ok_rows || 0} filas exitosas, ${data.summary?.error_rows || 0} errores.`,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
        toast({
          title: "Archivo no válido",
          description: "Por favor selecciona un archivo CSV o Excel",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir P&G Analítico
          </DialogTitle>
          <DialogDescription>
            Carga datos de P&G desglosados por centros de coste y segmentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download Section */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Plantilla de archivo
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Descarga la plantilla para conocer el formato correcto del archivo
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar plantilla CSV
            </Button>
          </div>

          {/* Required Fields Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Campos obligatorios:</strong> company_code, periodo, concepto_codigo, valor<br />
              <strong>Campos opcionales:</strong> segmento, centro_coste
            </AlertDescription>
          </Alert>

          {/* Format Information */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Formato del archivo</h4>
            <div className="text-sm space-y-2">
              <div><strong>company_code:</strong> Código de la empresa</div>
              <div><strong>periodo:</strong> Año (2024) o año-mes (2024-01)</div>
              <div><strong>concepto_codigo:</strong> Código del concepto P&G del catálogo</div>
              <div><strong>valor:</strong> Importe numérico (positivo para ingresos, negativo para gastos)</div>
              <div><strong>segmento:</strong> Segmento de negocio (opcional)</div>
              <div><strong>centro_coste:</strong> Centro de coste (opcional)</div>
            </div>
          </div>

          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Select 
              value={selectedCompanyId} 
              onValueChange={setSelectedCompanyId}
              disabled={loadingCompanies}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCompanies ? "Cargando empresas..." : "Selecciona una empresa"} />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {company.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Archivo CSV/Excel</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={processing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || !selectedCompanyId || processing}
            >
              {processing ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir y Procesar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}