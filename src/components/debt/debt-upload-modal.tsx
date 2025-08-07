import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, AlertCircle } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Company {
  id: string;
  name: string;
}

const formSchema = z.object({
  company_id: z.string().min(1, "Debe seleccionar una empresa"),
  scenario: z.string().min(1, "El escenario es obligatorio"),
  file: z.any().refine((file) => file instanceof File, "Debe seleccionar un archivo")
    .refine((file) => file?.type === "text/csv" || file?.name?.endsWith('.csv'), "Debe ser un archivo CSV"),
});

type FormData = z.infer<typeof formSchema>;

interface DebtUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DebtUploadModal: React.FC<DebtUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_id: "",
      scenario: "base",
      file: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

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
    const csvContent = `entidad,tipo,capital,tir,plazo_meses,cuota,proximo_venc,escenario
Banco Santander,Préstamo ICO,100000,3.5,60,2000,2025-12-31,base
BBVA,Línea de Crédito,50000,4.2,36,1500,2025-06-30,base
CaixaBank,Leasing Financiero,75000,5.1,48,1800,2026-01-15,base`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'debt_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onSubmit = async (data: FormData) => {
    setIsUploading(true);
    
    try {
      // Generate unique file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filePath = `debt_uploads/${data.company_id}/${timestamp}/${file?.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('import-files')
        .upload(filePath, file!);

      if (uploadError) throw uploadError;

      // Create import job record
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          company_id: data.company_id,
          tipo: 'debts',
          storage_path: filePath,
          estado: 'pending',
          resumen: null
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Process the file immediately
      const { data: processResult, error: processError } = await supabase.functions.invoke('import-debts', {
        body: { job_id: jobData.id, scenario: data.scenario }
      });

      if (processError) throw processError;

      toast({
        title: "Éxito",
        description: `Deudas importadas correctamente. ${processResult.summary?.ok_rows || 0} filas procesadas exitosamente.`,
      });

      onSuccess();
      onClose();
      form.reset();
      setFile(null);
    } catch (error: any) {
      console.error('Error uploading debts:', error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar el archivo de deudas",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      form.setValue('file', selectedFile);
    }
  };

  const handleClose = () => {
    form.reset();
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Cargar Datos de Deudas
          </DialogTitle>
          <DialogDescription>
            Importa datos de deudas desde un archivo CSV para gestionar el pool bancario de una empresa
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            El archivo CSV debe incluir las columnas: entidad, tipo, capital, tir, plazo_meses, cuota, proximo_venc, escenario
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Plantilla de Ejemplo</CardTitle>
            <CardDescription>
              Descarga la plantilla para ver el formato correcto del archivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla CSV
            </Button>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la empresa" />
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
              name="scenario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escenario</FormLabel>
                  <FormControl>
                    <Input placeholder="base" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Archivo CSV</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                  </FormControl>
                  {file && (
                    <div className="text-sm text-muted-foreground">
                      Archivo seleccionado: <Badge variant="outline">{file.name}</Badge>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Procesando..." : "Cargar Deudas"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};