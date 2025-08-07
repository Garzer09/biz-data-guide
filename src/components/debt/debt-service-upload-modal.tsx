import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Loader2, Download, Upload } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

const formSchema = z.object({
  company: z.string().min(1, "Selecciona una empresa"),
  file: z.instanceof(File, { message: "El archivo es requerido" }),
});

type FormData = z.infer<typeof formSchema>;

interface DebtServiceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DebtServiceUploadModal({ isOpen, onClose, onSuccess }: DebtServiceUploadModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('estado', 'ACTIVO')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Error al cargar las empresas",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const headers = ['company_code', 'periodo', 'principal', 'intereses', 'flujo_operativo'];
    const sampleData = [
      'EMP_DEMO_2,2024-01,50000,5000,65000',
      'EMP_DEMO_2,2024-02,48000,4800,68000',
      'EMP_DEMO_2,2024-03,46000,4600,70000'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_servicio_deuda.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Selecciona un archivo CSV",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Validate file
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('El archivo es demasiado grande (máximo 10MB)');
      }

      if (!['text/csv', 'application/csv', 'text/plain'].includes(selectedFile.type)) {
        throw new Error('Solo se permiten archivos CSV');
      }

      // Create unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `debt_service_${timestamp}_${selectedFile.name}`;
      const filePath = `raw_uploads/${data.company}/${timestamp}/${filename}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('import-files')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      // Create import job record
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          company_id: data.company,
          tipo: 'debt_service',
          storage_path: filePath,
          estado: 'pending'
        })
        .select()
        .single();

      if (jobError) {
        throw new Error(`Error al crear trabajo de importación: ${jobError.message}`);
      }

      // Call edge function to process the import
      const { error: functionError } = await supabase.functions.invoke('import-debt-service', {
        body: { job_id: jobData.id }
      });

      if (functionError) {
        throw new Error(`Error al procesar importación: ${functionError.message}`);
      }

      toast({
        title: "Éxito",
        description: "Archivo subido correctamente. El procesamiento comenzará en breve.",
      });

      form.reset();
      setSelectedFile(null);
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error uploading debt service file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir el archivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    if (file) {
      form.setValue('file', file);
      form.clearErrors('file');
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cargar Servicio de Deuda</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con los datos de servicio de deuda
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription>
            <strong>Columnas requeridas:</strong> company_code, periodo (YYYY-MM), principal, intereses, flujo_operativo
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar Plantilla CSV
          </Button>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      onOpenChange={fetchCompanies}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>Archivo CSV</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                    </FormControl>
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Archivo seleccionado: {selectedFile.name}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir Archivo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}