import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const negocio = await db.negocio.findUnique({
      where: { slug },
      select: {
        id: true,
        nombre: true,
        slug: true,
        telefono: true,
        direccion: true,
        descripcion: true,
        puestoBuscado: true,
        requisitos: true,
        buscandoPersonal: true
      }
    });

    if (!negocio) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ negocio });
  } catch (error) {
    console.error('Error al obtener negocio:', error);
    return NextResponse.json({ error: 'Error al obtener negocio' }, { status: 500 });
  }
}
