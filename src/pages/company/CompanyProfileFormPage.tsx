import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Edit3, Save, X, Building, Users, Calendar, DollarSign, MapPin, Globe, FileText } from "lucide-react";

interface CompanyProfile {
  sector: string;
  industria: string;
  año_fundacion: number | null;
  empleados: number | null;
  ingresos_anuales: number | null;
  sede: string;
  sitio_web: string;
  descripcion: string;
}

interface ValidationErrors {
  año_fundacion?: string;
  ingresos_anuales?: string;
  sitio_web?: string;
}

export function CompanyProfileFormPage() {
  const { companyId } = useParams();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const [profile, setProfile] = useState<CompanyProfile>({
    sector: "",
    industria: "",
    año_fundacion: null,
    empleados: null,
    ingresos_anuales: null,
    sede: "",
    sitio_web: "",
    descripcion: ""
  });

  const [formData, setFormData] = useState<CompanyProfile>(profile);

  // Check access and load profile
  useEffect(() => {
    if (!companyId) return;

    const checkAccessAndLoadProfile = async () => {
      try {
        setLoading(true);

        // Check access
        const { data: accessData, error: accessError } = await supabase
          .rpc('has_company_access', { _company_id: companyId });

        if (accessError) {
          console.error('Error checking access:', accessError);
          setHasAccess(false);
          return;
        }

        if (!accessData) {
          setHasAccess(false);
          return;
        }

        setHasAccess(true);

        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_company_profile', { _company_id: companyId });

        if (profileError) {
          console.error('Error loading profile:', profileError);
          toast({
            title: "Error",
            description: "No se pudo cargar el perfil de la empresa",
            variant: "destructive"
          });
          return;
        }

        if (profileData && profileData.length > 0) {
          const profileRow = profileData[0];
          const loadedProfile = {
            sector: profileRow.sector || "",
            industria: profileRow.industria || "",
            año_fundacion: profileRow.año_fundacion,
            empleados: profileRow.empleados,
            ingresos_anuales: profileRow.ingresos_anuales,
            sede: profileRow.sede || "",
            sitio_web: profileRow.sitio_web || "",
            descripcion: profileRow.descripcion || ""
          };
          setProfile(loadedProfile);
          setFormData(loadedProfile);
        }

      } catch (error) {
        console.error('Error in checkAccessAndLoadProfile:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error inesperado",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndLoadProfile();
  }, [companyId, toast]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (formData.año_fundacion !== null && formData.año_fundacion <= 1800) {
      newErrors.año_fundacion = "El año de fundación debe ser mayor a 1800";
    }

    if (formData.ingresos_anuales !== null && formData.ingresos_anuales < 0) {
      newErrors.ingresos_anuales = "Los ingresos anuales no pueden ser negativos";
    }

    if (formData.sitio_web && formData.sitio_web.trim()) {
      try {
        new URL(formData.sitio_web);
      } catch {
        newErrors.sitio_web = "Debe ser una URL válida (ej: https://ejemplo.com)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const { error } = await supabase.rpc('upsert_company_profile', {
        _company_id: companyId,
        _sector: formData.sector || null,
        _industria: formData.industria || null,
        _año_fundacion: formData.año_fundacion,
        _empleados: formData.empleados,
        _ingresos_anuales: formData.ingresos_anuales,
        _sede: formData.sede || null,
        _sitio_web: formData.sitio_web || null,
        _descripcion: formData.descripcion || null
      });

      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar el perfil",
          variant: "destructive"
        });
        return;
      }

      setProfile(formData);
      setIsEditing(false);
      toast({
        title: "Éxito",
        description: "Perfil guardado correctamente"
      });

    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setErrors({});
  };

  const formatCurrency = (value: number | null): string => {
    if (value === null) return "";
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Building className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Sin acceso</h3>
          <p className="text-muted-foreground">No tienes acceso a este perfil</p>
        </div>
      </div>
    );
  }

  const isReadOnly = !isAdmin || !isEditing;

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Perfil de Empresa</h2>
          <p className="text-muted-foreground">
            {isAdmin ? "Gestiona la información detallada de la empresa" : "Visualiza la información de la empresa"}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Building className="w-4 h-4 mr-2" />
              Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReadOnly ? (
              <p className="py-2">{profile.sector || "No especificado"}</p>
            ) : (
              <Input
                value={formData.sector}
                onChange={(e) => setFormData({...formData, sector: e.target.value})}
                placeholder="Ej: Tecnología, Financiero, Salud..."
              />
            )}
          </CardContent>
        </Card>

        {/* Industria */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Building className="w-4 h-4 mr-2" />
              Industria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReadOnly ? (
              <p className="py-2">{profile.industria || "No especificado"}</p>
            ) : (
              <Input
                value={formData.industria}
                onChange={(e) => setFormData({...formData, industria: e.target.value})}
                placeholder="Ej: Software, Banca, Farmacéutica..."
              />
            )}
          </CardContent>
        </Card>

        {/* Año de Fundación */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Calendar className="w-4 h-4 mr-2" />
              Año de Fundación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReadOnly ? (
              <p className="py-2">{profile.año_fundacion || "No especificado"}</p>
            ) : (
              <div className="space-y-1">
                <Input
                  type="number"
                  value={formData.año_fundacion || ""}
                  onChange={(e) => setFormData({
                    ...formData, 
                    año_fundacion: e.target.value ? parseInt(e.target.value) : null
                  })}
                  placeholder="Ej: 1995"
                  min="1801"
                  max={new Date().getFullYear()}
                />
                {errors.año_fundacion && (
                  <p className="text-sm text-destructive">{errors.año_fundacion}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empleados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Users className="w-4 h-4 mr-2" />
              Número de Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReadOnly ? (
              <p className="py-2">
                {profile.empleados ? profile.empleados.toLocaleString('es-ES') : "No especificado"}
              </p>
            ) : (
              <Input
                type="number"
                value={formData.empleados || ""}
                onChange={(e) => setFormData({
                  ...formData, 
                  empleados: e.target.value ? parseInt(e.target.value) : null
                })}
                placeholder="Ej: 50"
                min="0"
              />
            )}
          </CardContent>
        </Card>

        {/* Ingresos Anuales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <DollarSign className="w-4 h-4 mr-2" />
              Ingresos Anuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReadOnly ? (
              <p className="py-2">
                {profile.ingresos_anuales ? formatCurrency(profile.ingresos_anuales) : "No especificado"}
              </p>
            ) : (
              <div className="space-y-1">
                <Input
                  type="number"
                  value={formData.ingresos_anuales || ""}
                  onChange={(e) => setFormData({
                    ...formData, 
                    ingresos_anuales: e.target.value ? parseFloat(e.target.value) : null
                  })}
                  placeholder="Ej: 1000000"
                  min="0"
                  step="0.01"
                />
                {errors.ingresos_anuales && (
                  <p className="text-sm text-destructive">{errors.ingresos_anuales}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sede Principal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <MapPin className="w-4 h-4 mr-2" />
              Sede Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReadOnly ? (
              <p className="py-2">{profile.sede || "No especificado"}</p>
            ) : (
              <Input
                value={formData.sede}
                onChange={(e) => setFormData({...formData, sede: e.target.value})}
                placeholder="Ej: Madrid, España"
              />
            )}
          </CardContent>
        </Card>

        {/* Sitio Web */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Globe className="w-4 h-4 mr-2" />
              Sitio Web
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReadOnly ? (
              <p className="py-2">
                {profile.sitio_web ? (
                  <a 
                    href={profile.sitio_web} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.sitio_web}
                  </a>
                ) : (
                  "No especificado"
                )}
              </p>
            ) : (
              <div className="space-y-1">
                <Input
                  type="url"
                  value={formData.sitio_web}
                  onChange={(e) => setFormData({...formData, sitio_web: e.target.value})}
                  placeholder="https://ejemplo.com"
                />
                {errors.sitio_web && (
                  <p className="text-sm text-destructive">{errors.sitio_web}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Descripción */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <FileText className="w-4 h-4 mr-2" />
              Descripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isReadOnly ? (
              <p className="py-2 whitespace-pre-wrap">
                {profile.descripcion || "No especificado"}
              </p>
            ) : (
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Describe la empresa, su misión, valores, productos o servicios principales..."
                rows={4}
                className="resize-none"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}