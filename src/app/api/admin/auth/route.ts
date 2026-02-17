import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Verificar sesión actual
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

    return NextResponse.json({
      negocio: {
        id: sesion.negocio.id,
        nombre: sesion.negocio.nombre,
        slug: sesion.negocio.slug,
        email: sesion.negocio.email,
        telefono: sesion.negocio.telefono,
        direccion: sesion.negocio.direccion,
        descripcion: sesion.negocio.descripcion,
        puestoBuscado: sesion.negocio.puestoBuscado,
        requisitos: sesion.negocio.requisitos,
        whatsapp: sesion.negocio.whatsapp,
        buscandoPersonal: sesion.negocio.buscandoPersonal
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error de autenticación' }, { status: 500 });
  }
}

// Login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const negocio = await db.negocio.findUnique({
      where: { email }
    });

    if (!negocio) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, negocio.password);
    if (!validPassword) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Crear nueva sesión
    const { nanoid } = await import('nanoid');
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.sesion.create({
      data: {
        negocioId: negocio.id,
        token,
        expiresAt
      }
    });

    const response = NextResponse.json({
      negocio: {
        id: negocio.id,
        nombre: negocio.nombre,
        slug: negocio.slug,
        email: negocio.email,
        telefono: negocio.telefono,
        direccion: negocio.direccion,
        puestoBuscado: negocio.puestoBuscado,
        buscandoPersonal: negocio.buscandoPersonal
      }
    });

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}

// Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    
    if (token) {
      await db.sesion.delete({ where: { token } }).catch(() => {});
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('session_token');
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}
