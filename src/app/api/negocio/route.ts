import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

function generateSlug(nombre: string): string {
  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  
  const random = nanoid(6);
  return `${base}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, password, telefono, puestoBuscado } = body;

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existente = await db.negocio.findUnique({
      where: { email }
    });

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un negocio con ese email' },
        { status: 400 }
      );
    }

    const slug = generateSlug(nombre);
    const hashedPassword = await bcrypt.hash(password, 10);

    const negocio = await db.negocio.create({
      data: {
        nombre,
        slug,
        email,
        password: hashedPassword,
        telefono: telefono || null,
        puestoBuscado: puestoBuscado || 'Personal general',
        buscandoPersonal: true,
      }
    });

    // Crear sesión
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
      success: true,
      negocio: {
        id: negocio.id,
        nombre: negocio.nombre,
        slug: negocio.slug,
        email: negocio.email
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
    console.error('Error al registrar negocio:', error);
    return NextResponse.json(
      { error: 'Error al registrar el negocio' },
      { status: 500 }
    );
  }
}
