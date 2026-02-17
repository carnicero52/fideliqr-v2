import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// Obtener candidatos del negocio
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const sesion = await db.sesion.findUnique({
      where: { token },
      include: { negocio: true }
    });

    if (!sesion || sesion.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }

    const candidatos = await db.candidato.findMany({
      where: { negocioId: sesion.negocioId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ candidatos });
  } catch (error) {
    console.error('Error al obtener candidatos:', error);
    return NextResponse.json({ error: 'Error al obtener candidatos' }, { status: 500 });
  }
}

// Crear nuevo candidato (desde la página pública)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { slug, ...candidatoData } = data;

    // Buscar el negocio por slug
    const negocio = await db.negocio.findUnique({
      where: { slug }
    });

    if (!negocio) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    if (!negocio.buscandoPersonal) {
      return NextResponse.json({ error: 'Este negocio no está recibiendo aplicaciones' }, { status: 400 });
    }

    // Verificar si ya aplicó con ese email
    const existente = await db.candidato.findFirst({
      where: { 
        negocioId: negocio.id,
        email: candidatoData.email 
      }
    });

    if (existente) {
      return NextResponse.json({ error: 'Ya has aplicado anteriormente con este email' }, { status: 400 });
    }

    const candidato = await db.candidato.create({
      data: {
        negocioId: negocio.id,
        nombre: candidatoData.nombre,
        email: candidatoData.email,
        telefono: candidatoData.telefono,
        direccion: candidatoData.direccion || null,
        fechaNacimiento: candidatoData.fechaNacimiento || null,
        puestoSolicitado: candidatoData.puestoSolicitado || null,
        experiencia: candidatoData.experiencia || null,
        educacion: candidatoData.educacion || null,
        habilidades: candidatoData.habilidades || null,
        experienciaDetallada: candidatoData.experienciaDetallada || null,
        disponibilidad: candidatoData.disponibilidad || null,
        cvUrl: candidatoData.cvUrl || null,
        fotoUrl: candidatoData.fotoUrl || null,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Tu aplicación ha sido enviada correctamente',
      candidato: { id: candidato.id, nombre: candidato.nombre }
    });
  } catch (error) {
    console.error('Error al crear candidato:', error);
    return NextResponse.json({ error: 'Error al enviar la aplicación' }, { status: 500 });
  }
}
