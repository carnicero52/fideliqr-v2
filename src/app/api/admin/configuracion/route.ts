import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// Actualizar configuración del negocio
export async function PATCH(request: NextRequest) {
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

    const data = await request.json();

    const actualizado = await db.negocio.update({
      where: { id: sesion.negocioId },
      data: {
        nombre: data.nombre,
        telefono: data.telefono,
        direccion: data.direccion,
        descripcion: data.descripcion,
        puestoBuscado: data.puestoBuscado,
        requisitos: data.requisitos,
        buscandoPersonal: data.buscandoPersonal,
        whatsapp: data.whatsapp,
        facebook: data.facebook,
        instagram: data.instagram
      }
    });

    return NextResponse.json({ success: true, negocio: actualizado });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
