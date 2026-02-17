'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Users, 
  QrCode, 
  Link2, 
  Download, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  Copy,
  Settings,
  FileText,
  MessageSquare,
  Share2,
  LogOut,
  User,
  Calendar,
  GraduationCap,
  Briefcase as BriefcaseIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Candidato {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion?: string;
  puestoSolicitado?: string;
  experiencia?: string;
  educacion?: string;
  habilidades?: string;
  experienciaDetallada?: string;
  disponibilidad?: string;
  cvUrl?: string;
  fotoUrl?: string;
  estado: string;
  notas?: string;
  createdAt: string;
}

interface Negocio {
  id: string;
  nombre: string;
  slug: string;
  email: string;
  telefono?: string;
  direccion?: string;
  descripcion?: string;
  puestoBuscado?: string;
  requisitos?: string;
  whatsapp?: string;
  buscandoPersonal: boolean;
}

export default function AdminPage() {
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);

  const loadCandidatos = useCallback(async () => {
    try {
      const response = await fetch('/api/candidatos');
      const data = await response.json();
      setCandidatos(data.candidatos || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth');
      const data = await response.json();
      
      if (data.negocio) {
        setNegocio(data.negocio);
        loadCandidatos();
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  }, [loadCandidatos]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, [checkAuth]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password')
        })
      });

      const data = await response.json();

      if (data.negocio) {
        setNegocio(data.negocio);
        loadCandidatos();
        toast({ title: 'Bienvenido', description: `Hola, ${data.negocio.nombre}` });
      } else {
        toast({ title: 'Error', description: data.error || 'Credenciales inválidas', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al iniciar sesión', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setNegocio(null);
    setCandidatos([]);
    toast({ title: 'Sesión cerrada' });
  };

  const copyLink = () => {
    if (!negocio) return;
    const url = `${window.location.origin}/aplicar/${negocio.slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado', description: 'El link se copió al portapapeles' });
  };

  const updateCandidatoEstado = async (id: string, nuevoEstado: string) => {
    try {
      await fetch(`/api/candidatos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      setCandidatos(prev => prev.map(c => 
        c.id === id ? { ...c, estado: nuevoEstado } : c
      ));
      
      if (selectedCandidato?.id === id) {
        setSelectedCandidato({ ...selectedCandidato, estado: nuevoEstado });
      }

      toast({ title: 'Estado actualizado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const updateNegocio = async (data: Partial<Negocio>) => {
    try {
      const response = await fetch('/api/admin/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setNegocio(prev => prev ? { ...prev, ...data } : null);
        toast({ title: 'Configuración guardada' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
    }
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      nuevo: 'bg-blue-100 text-blue-700',
      revisado: 'bg-amber-100 text-amber-700',
      contactado: 'bg-purple-100 text-purple-700',
      contratado: 'bg-green-100 text-green-700',
      rechazado: 'bg-red-100 text-red-700'
    };
    return colores[estado] || 'bg-gray-100 text-gray-700';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      nuevo: 'Nuevo',
      revisado: 'Revisado',
      contactado: 'Contactado',
      contratado: 'Contratado',
      rechazado: 'Rechazado'
    };
    return labels[estado] || estado;
  };

  const candidatosFiltrados = candidatos.filter(c => {
    const matchEstado = filterEstado === 'todos' || c.estado === filterEstado;
    const matchSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchEstado && matchSearch;
  });

  const stats = {
    total: candidatos.length,
    nuevos: candidatos.filter(c => c.estado === 'nuevo').length,
    revisados: candidatos.filter(c => c.estado === 'revisado').length,
    contratados: candidatos.filter(c => c.estado === 'contratado').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <CardTitle>Acceder a tu panel</CardTitle>
            <CardDescription>Ingresa tus credenciales</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" placeholder="••••••" required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Entrar
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              ¿No tienes cuenta?{' '}
              <a href="/" className="text-emerald-600 hover:underline">Registra tu negocio</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">{negocio.nombre}</h1>
              <p className="text-xs text-slate-500">{negocio.puestoBuscado || 'Buscando personal'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total candidatos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.nuevos}</p>
                  <p className="text-xs text-muted-foreground">Nuevos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.revisados}</p>
                  <p className="text-xs text-muted-foreground">Revisados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.contratados}</p>
                  <p className="text-xs text-muted-foreground">Contratados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="candidatos" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="candidatos" className="gap-2">
              <Users className="w-4 h-4" />
              Candidatos
            </TabsTrigger>
            <TabsTrigger value="compartir" className="gap-2">
              <Share2 className="w-4 h-4" />
              Compartir
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="gap-2">
              <Settings className="w-4 h-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Candidatos Tab */}
          <TabsContent value="candidatos">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Lista de candidatos */}
              <div className="lg:col-span-2 space-y-4">
                {/* Filtros */}
                <Card className="border-none shadow-sm">
                  <CardContent className="py-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre o email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {['todos', 'nuevo', 'revisado', 'contactado', 'contratado', 'rechazado'].map(estado => (
                          <Button
                            key={estado}
                            variant={filterEstado === estado ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterEstado(estado)}
                            className={filterEstado === estado ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                          >
                            {estado === 'todos' ? 'Todos' : getEstadoLabel(estado)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {candidatosFiltrados.length === 0 ? (
                    <Card className="border-none shadow-sm">
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No hay candidatos aún</p>
                        <p className="text-sm">Comparte tu link para recibir aplicaciones</p>
                      </CardContent>
                    </Card>
                  ) : (
                    candidatosFiltrados.map(candidato => (
                      <Card 
                        key={candidato.id} 
                        className={`border-none shadow-sm cursor-pointer transition-all hover:shadow-md ${
                          selectedCandidato?.id === candidato.id ? 'ring-2 ring-emerald-500' : ''
                        }`}
                        onClick={() => setSelectedCandidato(candidato)}
                      >
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              {candidato.fotoUrl ? (
                                <img src={candidato.fotoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-slate-800">{candidato.nombre}</h3>
                                <Badge className={getEstadoColor(candidato.estado)}>
                                  {getEstadoLabel(candidato.estado)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{candidato.email}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {candidato.puestoSolicitado && (
                                  <span className="flex items-center gap-1">
                                    <BriefcaseIcon className="w-3 h-3" />
                                    {candidato.puestoSolicitado}
                                  </span>
                                )}
                                {candidato.experiencia && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {candidato.experiencia} exp.
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(candidato.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {candidato.cvUrl && (
                              <div className="shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-red-600" />
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Detalle del candidato */}
              <div className="lg:col-span-1">
                {selectedCandidato ? (
                  <Card className="border-none shadow-sm sticky top-24">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          {selectedCandidato.fotoUrl ? (
                            <img src={selectedCandidato.fotoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{selectedCandidato.nombre}</CardTitle>
                          <CardDescription>{selectedCandidato.puestoSolicitado || 'Sin puesto especificado'}</CardDescription>
                          <Badge className={`mt-2 ${getEstadoColor(selectedCandidato.estado)}`}>
                            {getEstadoLabel(selectedCandidato.estado)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Contacto */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-700">Contacto</h4>
                        <div className="space-y-1">
                          <a href={`mailto:${selectedCandidato.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600">
                            <Mail className="w-4 h-4" />
                            {selectedCandidato.email}
                          </a>
                          <a href={`tel:${selectedCandidato.telefono}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600">
                            <Phone className="w-4 h-4" />
                            {selectedCandidato.telefono}
                          </a>
                          {selectedCandidato.direccion && (
                            <p className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPin className="w-4 h-4" />
                              {selectedCandidato.direccion}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Información profesional */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-700">Información</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {selectedCandidato.experiencia && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-4 h-4" />
                              {selectedCandidato.experiencia}
                            </div>
                          )}
                          {selectedCandidato.educacion && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <GraduationCap className="w-4 h-4" />
                              {selectedCandidato.educacion}
                            </div>
                          )}
                          {selectedCandidato.disponibilidad && (
                            <div className="flex items-center gap-2 text-slate-600 col-span-2">
                              <Calendar className="w-4 h-4" />
                              {selectedCandidato.disponibilidad}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Habilidades */}
                      {selectedCandidato.habilidades && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-slate-700">Habilidades</h4>
                          <p className="text-sm text-slate-600">{selectedCandidato.habilidades}</p>
                        </div>
                      )}

                      {/* Experiencia detallada */}
                      {selectedCandidato.experienciaDetallada && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-slate-700">Experiencia</h4>
                          <p className="text-sm text-slate-600 whitespace-pre-line">{selectedCandidato.experienciaDetallada}</p>
                        </div>
                      )}

                      {/* CV */}
                      {selectedCandidato.cvUrl && (
                        <Button 
                          className="w-full gap-2" 
                          variant="outline"
                          onClick={() => window.open(selectedCandidato.cvUrl!, '_blank')}
                        >
                          <FileText className="w-4 h-4" />
                          Ver CV
                        </Button>
                      )}

                      {/* Acciones */}
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium text-sm text-slate-700">Cambiar estado</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateCandidatoEstado(selectedCandidato.id, 'revisado')}
                            disabled={selectedCandidato.estado === 'revisado'}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Revisado
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateCandidatoEstado(selectedCandidato.id, 'contactado')}
                            disabled={selectedCandidato.estado === 'contactado'}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Contactado
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => updateCandidatoEstado(selectedCandidato.id, 'contratado')}
                            disabled={selectedCandidato.estado === 'contratado'}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Contratado
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => updateCandidatoEstado(selectedCandidato.id, 'rechazado')}
                            disabled={selectedCandidato.estado === 'rechazado'}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazado
                          </Button>
                        </div>
                      </div>

                      {/* Notas */}
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium text-sm text-slate-700">Notas</h4>
                        <Textarea 
                          placeholder="Agrega notas sobre este candidato..."
                          defaultValue={selectedCandidato.notas || ''}
                          onBlur={(e) => {
                            fetch(`/api/candidatos/${selectedCandidato.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ notas: e.target.value })
                            });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-none shadow-sm">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Selecciona un candidato</p>
                      <p className="text-sm">para ver sus detalles</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Compartir Tab */}
          <TabsContent value="compartir">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-emerald-600" />
                    Tu Link
                  </CardTitle>
                  <CardDescription>Comparte este link para recibir candidatos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={`${window.location.origin}/aplicar/${negocio.slug}`}
                      readOnly
                      className="bg-slate-50"
                    />
                    <Button onClick={copyLink} className="shrink-0">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <a 
                    href={`/aplicar/${negocio.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver página de aplicación
                  </a>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-600" />
                    Código QR
                  </CardTitle>
                  <CardDescription>Imprime y coloca en tu mostrador</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div 
                    ref={qrRef}
                    className="bg-white p-4 rounded-xl shadow-sm border"
                  >
                    {/* QR generado dinámicamente */}
                    <div className="w-48 h-48 bg-slate-100 flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/aplicar/${negocio.slug}`)}`}
                        alt="QR"
                        className="w-44 h-44"
                      />
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Escanea para aplicar
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/aplicar/${negocio.slug}`)}`;
                      link.download = `qr-${negocio.slug}.png`;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar QR
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuración Tab */}
          <TabsContent value="configuracion">
            <div className="max-w-2xl space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Información del negocio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input 
                      defaultValue={negocio.nombre}
                      onBlur={(e) => updateNegocio({ nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono / WhatsApp</Label>
                    <Input 
                      defaultValue={negocio.telefono || ''}
                      placeholder="+52 55 1234 5678"
                      onBlur={(e) => updateNegocio({ telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input 
                      defaultValue={negocio.direccion || ''}
                      onBlur={(e) => updateNegocio({ direccion: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Configuración de vacante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Buscando personal</p>
                      <p className="text-sm text-muted-foreground">Activa para recibir candidatos</p>
                    </div>
                    <Button 
                      variant={negocio.buscandoPersonal ? 'default' : 'outline'}
                      onClick={() => updateNegocio({ buscandoPersonal: !negocio.buscandoPersonal })}
                      className={negocio.buscandoPersonal ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                      {negocio.buscandoPersonal ? 'Activo' : 'Inactivo'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Puesto buscado</Label>
                    <Input 
                      defaultValue={negocio.puestoBuscado || ''}
                      placeholder="Ej: Cajero, Mesero, Vendedor..."
                      onBlur={(e) => updateNegocio({ puestoBuscado: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Requisitos (opcional)</Label>
                    <Textarea 
                      defaultValue={negocio.requisitos || ''}
                      placeholder="Ej: Experiencia previa, disponibilidad de horario..."
                      onBlur={(e) => updateNegocio({ requisitos: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
