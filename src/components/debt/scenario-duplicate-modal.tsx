import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  sourceScenario: z.string().min(1, "Debe seleccionar un escenario origen"),
  newScenarioName: z.string().min(1, "El nombre del nuevo escenario es obligatorio"),
});

type FormData = z.infer<typeof formSchema>;

interface ScenarioDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
}

export const ScenarioDuplicateModal: React.FC<ScenarioDuplicateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  companyId
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scenarios, setScenarios] = useState<Array<{ escenario: string; num_deudas: number }>>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceScenario: "",
      newScenarioName: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchScenarios();
    }
  }, [isOpen, companyId]);

  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase.rpc('get_debt_scenarios', {
        _company_id: companyId
      });

      if (error) throw error;
      setScenarios(data || []);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      toast({
        title: "Error",
        description: "Error al cargar los escenarios",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: result, error } = await supabase.rpc('duplicate_debt_scenario', {
        _company_id: companyId,
        _old_scenario: data.sourceScenario,
        _new_scenario: data.newScenarioName
      });

      if (error) throw error;

      const response = result?.[0];
      if (!response?.success) {
        throw new Error(response?.message || 'Error al duplicar escenario');
      }

      toast({
        title: "Éxito",
        description: `Escenario duplicado correctamente. ${response.new_debts_count} deudas copiadas.`,
      });

      onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      console.error('Error duplicating scenario:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al duplicar el escenario",
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Duplicar Escenario</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sourceScenario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escenario Origen</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el escenario a duplicar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.escenario} value={scenario.escenario}>
                          {scenario.escenario} ({scenario.num_deudas} deudas)
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
              name="newScenarioName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Nuevo Escenario</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Escenario Optimista" {...field} />
                  </FormControl>
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
                {isSubmitting ? "Duplicando..." : "Duplicar Escenario"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};