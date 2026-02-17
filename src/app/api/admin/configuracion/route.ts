import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db-libsql';
import { cookies } from 'next/headers';

// Actualizar configuración del negocio
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const db = getDb();

    const sesionResult = await db.execute({
      sql: 'SELECT * FROM Sesion WHERE token = ?',
      args: [token]
    });

    if (sesionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }

    const sesion = sesionResult.rows[0];
    const data = await request.json();

    // Construir query dinámicamente solo con los campos enviados
    const updates: string[] = [];
    const values: any[] = [];

    // Mapeo de campos permitidos
    const camposBoleanos = ['buscandoPersonal', 'notifTelegramActivo', 'notifEmailActivo', 'notifWhatsappActivo', 'googleSheetsActivo'];
    const camposTexto = ['nombre', 'telefono', 'direccion', 'descripcion', 'puestoBuscado', 'requisitos', 'whatsapp', 'facebook', 'instagram',
      'notifTelegramBotToken', 'notifTelegramChatId', 'notifEmailSmtp', 'notifEmailUsuario', 'notifEmailPassword', 'notifEmailRemitente',
      'notifWhatsappApiUrl', 'notifWhatsappApiKey', 'notifWhatsappNumero', 'googleSheetsId', 'googleSheetsApiKey'];
    const camposNumericos = ['notifEmailPuerto'];

    for (const [key, value] of Object.entries(data)) {
      if (camposBoleanos.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value ? 1 : 0);
      } else if (camposTexto.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value || null);
      } else if (camposNumericos.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value || null);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay campos para actualizar' });
    }

    // Siempre actualizar updatedAt
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());

    // Agregar el ID del negocio
    values.push(sesion.negocioId);

    const sql = `UPDATE Negocio SET ${updates.join(', ')} WHERE id = ?`;

    await db.execute({ sql, args: values });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json({ error: 'Error al guardar', details: String(error) }, { status: 500 });
  }
}
