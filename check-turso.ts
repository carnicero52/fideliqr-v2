import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://fideliqr-carnicero52.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEzNjkxMjgsImlkIjoiMWQ0ZWE2N2ItOTc2My00MTk0LThjNjMtZWI3YWE1NGM2NmU3IiwicmlkIjoiNGJjNjk1OGYtODQzMi00ZTViLTk2MDItY2JkMTI5OGJlYTk4In0.2cL6hKHKwhApFFY4hHeeGtkgFjLv4pS_Ubd6sgcKcAORzjGy-FZ4Yi583TWL69Z4jPNbmS82L7xzAAFka2JVCA',
});

async function checkTables() {
  console.log('=== Verificando estructura de tablas ===\n');
  
  // Verificar tabla Negocio
  console.log('Tabla Negocio:');
  const negocioSchema = await db.execute("PRAGMA table_info(Negocio)");
  console.log(negocioSchema.rows.map(r => `${r.name}: ${r.type}`).join('\n'));
  
  console.log('\n=== Verificando tabla Candidato ===\n');
  const candidatoSchema = await db.execute("PRAGMA table_info(Candidato)");
  console.log(candidatoSchema.rows.map(r => `${r.name}: ${r.type}`).join('\n'));
  
  console.log('\n=== Verificando tabla Sesion ===\n');
  const sesionSchema = await db.execute("PRAGMA table_info(Sesion)");
  console.log(sesionSchema.rows.map(r => `${r.name}: ${r.type}`).join('\n'));
}

checkTables().catch(console.error);
