import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Users, Globe, MapPin, Edit, Save, X } from "lucide-react";

interface CompanyProfile {
  company_id: string;
  sector: string | null;
  industria: string | null;
  empleados: number | null;
  sede_principal: string | null;
  web: string | null;
  descripcion: string | null;
}

export function CompanyProfilePage() {
  const { companyId } = useParams();
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    sector: "",
    industria: "",
    empleados: "",
    sede_principal: "",
    web: "",
    descripcion: "",
  });

  useEffect(() => {
    if (companyId) {
      fetchCompanyProfile();
      fetchCompanyName();
    }
  }, [companyId]);

  const fetchCompanyName = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (data) {
      setCompanyName(data.name);
    }
  };

  const fetchCompanyProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("company_profile")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (error && error.code !== "PGRST116") {
      toast.error("Error al cargar el perfil de la empresa");
      console.error(error);
    } else if (data) {
      setProfile(data);
      setFormData({
        sector: data.sector || "",
        industria: data.industria || "",
        empleados: data.empleados?.toString() || "",
        sede_principal: data.sede_principal || "",
        web: data.web || "",
        descripcion: data.descripcion || "",
      });
    }
    setLoading(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        sector: profile.sector || "",
        industria: profile.industria || "",
        empleados: profile.empleados?.toString() || "",
        sede_principal: profile.sede_principal || "",
        web: profile.web || "",
        descripcion: profile.descripcion || "",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    const profileData = {
      company_id: companyId,
      sector: formData.sector || null,
      industria: formData.industria || null,
      empleados: formData.empleados ? parseInt(formData.empleados) : null,
      sede_principal: formData.sede_principal || null,
      web: formData.web || null,
      descripcion: formData.descripcion || null,
    };

    const { error } = await supabase
      .from("company_profile")
      .upsert(profileData);

    if (error) {
      toast.error("Error al guardar el perfil");
      console.error(error);
    } else {
      toast.success("Perfil actualizado correctamente");
      setIsEditing(false);
      await fetchCompanyProfile();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Perfil de Empresa</h1>
          <p className="text-muted-foreground">{companyName}</p>
        </div>
        {isAdmin && !isEditing && (
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        )}
        {isAdmin && isEditing && (
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sector">Sector</Label>
                {isEditing ? (
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    placeholder="Ej: Tecnología, Servicios, Industrial..."
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.sector || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="industria">Industria</Label>
                {isEditing ? (
                  <Input
                    id="industria"
                    value={formData.industria}
                    onChange={(e) => setFormData({ ...formData, industria: e.target.value })}
                    placeholder="Ej: Software, Consultoría, Manufactura..."
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.industria || "No especificado"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recursos y Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="empleados">Número de Empleados</Label>
                {isEditing ? (
                  <Input
                    id="empleados"
                    type="number"
                    value={formData.empleados}
                    onChange={(e) => setFormData({ ...formData, empleados: e.target.value })}
                    placeholder="Ej: 50"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.empleados ? `${profile.empleados} empleados` : "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="sede_principal">Sede Principal</Label>
                {isEditing ? (
                  <Input
                    id="sede_principal"
                    value={formData.sede_principal}
                    onChange={(e) => setFormData({ ...formData, sede_principal: e.target.value })}
                    placeholder="Ej: Madrid, España"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile?.sede_principal || "No especificado"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Presencia Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="web">Sitio Web</Label>
              {isEditing ? (
                <Input
                  id="web"
                  value={formData.web}
                  onChange={(e) => setFormData({ ...formData, web: e.target.value })}
                  placeholder="Ej: https://www.empresa.com"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  {profile?.web ? (
                    <a 
                      href={profile.web} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.web}
                    </a>
                  ) : (
                    "No especificado"
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descripción de la Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              {isEditing ? (
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe la empresa, su misión, visión y actividades principales..."
                  rows={4}
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {profile?.descripcion || "No hay descripción disponible"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}