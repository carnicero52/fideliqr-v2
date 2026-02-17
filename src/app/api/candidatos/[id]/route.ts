import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// Actualizar candidato
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verificar que el candidato pertenece a este negocio
    const candidato = await db.candidato.findFirst({
      where: { 
        id,
        negocioId: sesion.negocioId 
      }
    });

    if (!candidato) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    const actualizado = await db.candidato.update({
      where: { id },
      data: {
        estado: data.estado,
        notas: data.notas
      }
    });

    return NextResponse.json({ success: true, candidato: actualizado });
  } catch (error) {
    console.error('Error al actualizar candidato:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// Eliminar candidato
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verificar que el candidato pertenece a este negocio
    const candidato = await db.candidato.findFirst({
      where: { 
        id,
        negocioId: sesion.negocioId 
      }
    });

    if (!candidato) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    await db.candidato.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar candidato:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
