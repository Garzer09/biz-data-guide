import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const debtTypes = [
  "Préstamo ICO",
  "Línea de Crédito",
  "Leasing Financiero",
  "Leasing Operativo",
  "Préstamo Bancario",
  "Confirming",
  "Factoring",
  "Renting",
  "Otros"
];

const formSchema = z.object({
  entidad: z.string().min(1, "La entidad es obligatoria"),
  tipo: z.string().min(1, "El tipo es obligatorio"),
  capital: z.number().min(0.01, "El capital debe ser mayor a 0"),
  tir: z.number().min(0, "La TIR debe ser mayor o igual a 0").max(100, "La TIR debe ser menor o igual a 100"),
  plazo_meses: z.number().int().min(1, "El plazo debe ser al menos 1 mes"),
  cuota: z.number().min(0, "La cuota debe ser mayor o igual a 0"),
  proximo_venc: z.date({
    required_error: "La fecha de próximo vencimiento es obligatoria",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
  scenario: string;
  editingDebt?: any;
}

export const DebtFormModal: React.FC<DebtFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  companyId,
  scenario,
  editingDebt
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entidad: "",
      tipo: "",
      capital: 0,
      tir: 0,
      plazo_meses: 12,
      cuota: 0,
      proximo_venc: new Date(),
    },
  });

  useEffect(() => {
    if (editingDebt) {
      form.reset({
        entidad: editingDebt.entidad || "",
        tipo: editingDebt.tipo || "",
        capital: editingDebt.capital || 0,
        tir: editingDebt.tir || 0,
        plazo_meses: editingDebt.plazo_meses || 12,
        cuota: editingDebt.cuota || 0,
        proximo_venc: editingDebt.proximo_venc ? new Date(editingDebt.proximo_venc) : new Date(),
      });
    } else {
      form.reset({
        entidad: "",
        tipo: "",
        capital: 0,
        tir: 0,
        plazo_meses: 12,
        cuota: 0,
        proximo_venc: new Date(),
      });
    }
  }, [editingDebt, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const debtData = {
        company_id: companyId,
        entidad: data.entidad,
        tipo: data.tipo,
        capital: data.capital,
        tir: data.tir,
        plazo_meses: data.plazo_meses,
        cuota: data.cuota,
        proximo_venc: data.proximo_venc.toISOString().split('T')[0],
        escenario: scenario,
      };

      let result;
      if (editingDebt?.id) {
        // Update existing debt
        result = await supabase
          .from('debts')
          .update(debtData)
          .eq('id', editingDebt.id);
      } else {
        // Insert new debt
        result = await supabase
          .from('debts')
          .insert([debtData]);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Éxito",
        description: `Deuda ${editingDebt?.id ? 'actualizada' : 'creada'} correctamente`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving debt:', error);
      toast({
        title: "Error",
        description: `Error al ${editingDebt?.id ? 'actualizar' : 'crear'} la deuda`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingDebt?.id ? 'Editar Deuda' : 'Añadir Nueva Deuda'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="entidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la entidad financiera" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Deuda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de deuda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {debtTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capital (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TIR (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plazo_meses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plazo (meses)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="12"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cuota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuota Mensual (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="proximo_venc"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Próximo Vencimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : (editingDebt?.id ? "Actualizar" : "Crear")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};