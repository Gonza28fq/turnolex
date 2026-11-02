// Pruebas de la fase 0 de seguridad. Corre contra una base MongoDB en memoria (no toca nada real).
// uso: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.JWT_SECRET = 'x'.repeat(48);
process.env.SUPERADMIN_SECRET = 's'.repeat(32);
process.env.RATE_LIMIT_AUTH = '1000';
process.env.EMAIL_USER = '';

import { crearApp } from '../src/app';
import Estudio from '../src/models/Estudio';
import User from '../src/models/User';
import Turno from '../src/models/Turno';
import { firmarAccionEstudio } from '../src/utils/seguridad';
import { transporter } from '../src/utils/email';

// no mandar mails de verdad
(transporter as any).sendMail = async () => ({});

let mongo: MongoMemoryServer;
const app = crearApp();
const PASS = 'clave-segura-123';
const ids: Record<string, string> = {};
const tok: Record<string, string> = {};

const login = async (email: string) => (await request(app).post('/api/auth/login').send({ email, password: PASS })).body.data?.token as string;
const enHoras = (h: number) => new Date(Date.now() + h * 3600e3);

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const hash = await bcrypt.hash(PASS, 4);
  const a = await Estudio.create({ nombre: 'Estudio A', slug: 'estudio-a', email: 'a@a.com', aprobado: true });
  const b = await Estudio.create({ nombre: 'Estudio B', slug: 'estudio-b', email: 'b@b.com', aprobado: true });
  const pend = await Estudio.create({ nombre: 'Pendiente', slug: 'pendiente', email: 'p@p.com', aprobado: false });
  ids.a = String(a._id); ids.b = String(b._id); ids.pend = String(pend._id);
  const mk = async (k: string, rol: string, estudio: string) => {
    const u = await User.create({ nombre: k, email: `${k}@x.com`, password: hash, rol, estudio });
    ids[k] = String(u._id);
  };
  await mk('adminA', 'admin', ids.a);
  await mk('abogA', 'abogado', ids.a);
  await mk('abogA2', 'abogado', ids.a);
  await mk('cli1', 'cliente', ids.a);
  await mk('cli2', 'cliente', ids.a);
  await mk('abogB', 'abogado', ids.b);
  for (const k of ['adminA', 'abogA', 'abogA2', 'cli1', 'cli2', 'abogB']) tok[k] = await login(`${k}@x.com`);
  const t = await Turno.create({ estudio: ids.a, abogado: ids.abogA, cliente: ids.cli1, fecha: enHoras(48), duracion: 60, motivo: 'Consulta de cli1' });
  ids.turnoCli1 = String(t._id);
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('1. aprobar un estudio sin firma NO funciona', async () => {
  const r = await request(app).get(`/api/admin/estudios/${ids.pend}/aprobar`);
  assert.equal(r.status, 401);
  assert.equal((await Estudio.findById(ids.pend))!.aprobado, false);
});

test('1b. firma de "rechazar" no sirve para "aprobar", ni firma vencida', async () => {
  const re = firmarAccionEstudio(ids.pend, 'rechazar');
  assert.equal((await request(app).get(`/api/admin/estudios/${ids.pend}/aprobar?v=${re.vence}&f=${re.firma}`)).status, 401);
  const vieja = firmarAccionEstudio(ids.pend, 'aprobar', Date.now() - 1000);
  assert.equal((await request(app).get(`/api/admin/estudios/${ids.pend}/aprobar?v=${vieja.vence}&f=${vieja.firma}`)).status, 401);
});

test('1c. con firma válida aprueba, y solo una vez', async () => {
  const ap = firmarAccionEstudio(ids.pend, 'aprobar');
  const r = await request(app).get(`/api/admin/estudios/${ids.pend}/aprobar?v=${ap.vence}&f=${ap.firma}`);
  assert.equal(r.status, 200);
  assert.equal((await Estudio.findById(ids.pend))!.aprobado, true);
  const re = firmarAccionEstudio(ids.pend, 'rechazar');
  assert.equal((await request(app).get(`/api/admin/estudios/${ids.pend}/rechazar?v=${re.vence}&f=${re.firma}`)).status, 409);
});

test('5. el secreto de superadmin por query string ya no sirve', async () => {
  assert.equal((await request(app).get(`/api/admin/estudios?secret=${'s'.repeat(32)}`)).status, 401);
  assert.equal((await request(app).get('/api/admin/estudios').set('x-superadmin-secret', 's'.repeat(32))).status, 200);
});

test('2. un cliente NO ve el turno ni el PDF de otro cliente', async () => {
  const r = await request(app).get(`/api/turnos/${ids.turnoCli1}`).set('Authorization', `Bearer ${tok.cli2}`);
  assert.equal(r.status, 404);
  const pdf = await request(app).get(`/api/turnos/${ids.turnoCli1}/pdf`).set('Authorization', `Bearer ${tok.cli2}`);
  assert.equal(pdf.status, 404);
  const propio = await request(app).get(`/api/turnos/${ids.turnoCli1}`).set('Authorization', `Bearer ${tok.cli1}`);
  assert.equal(propio.status, 200);
});

test('2b. un estudio no ve turnos de otro estudio', async () => {
  const r = await request(app).get(`/api/turnos/${ids.turnoCli1}`).set('Authorization', `Bearer ${tok.abogB}`);
  assert.equal(r.status, 404);
});

test('3. no se puede pedir turno con un abogado de otro estudio', async () => {
  const r = await request(app).post('/api/turnos').set('Authorization', `Bearer ${tok.cli1}`)
    .send({ abogadoId: ids.abogB, fecha: enHoras(72).toISOString(), motivo: 'Intento cruzado' });
  assert.equal(r.status, 400);
});

test('7. choque de horarios: 10:30 choca con un turno de 10:00 a 11:00', async () => {
  const base = enHoras(48); // turno existente de cli1 dura 60'
  const r = await request(app).post('/api/turnos').set('Authorization', `Bearer ${tok.cli2}`)
    .send({ abogadoId: ids.abogA, fecha: new Date(base.getTime() + 30 * 60000).toISOString(), motivo: 'Se pisa' });
  assert.equal(r.status, 409);
  const despues = await request(app).post('/api/turnos').set('Authorization', `Bearer ${tok.cli2}`)
    .send({ abogadoId: ids.abogA, fecha: new Date(base.getTime() + 60 * 60000).toISOString(), motivo: 'Justo después' });
  assert.equal(despues.status, 201);
});

test('admin carga turno para un cliente del estudio (y no para uno ajeno)', async () => {
  const ok = await request(app).post('/api/turnos').set('Authorization', `Bearer ${tok.adminA}`)
    .send({ abogadoId: ids.abogA2, clienteId: ids.cli2, fecha: enHoras(96).toISOString(), motivo: 'Carga del admin' });
  assert.equal(ok.status, 201);
  assert.equal(String(ok.body.data.turno.cliente._id), ids.cli2);
  const sinCliente = await request(app).post('/api/turnos').set('Authorization', `Bearer ${tok.adminA}`)
    .send({ abogadoId: ids.abogA2, fecha: enHoras(100).toISOString(), motivo: 'Sin cliente' });
  assert.equal(sinCliente.status, 400);
});

test('9. un abogado no cambia el estado de turnos de otro abogado', async () => {
  const r = await request(app).put(`/api/turnos/${ids.turnoCli1}/estado`).set('Authorization', `Bearer ${tok.abogA2}`).send({ estado: 'cancelado' });
  assert.equal(r.status, 404);
  const propio = await request(app).put(`/api/turnos/${ids.turnoCli1}/estado`).set('Authorization', `Bearer ${tok.abogA}`).send({ estado: 'confirmado' });
  assert.equal(propio.status, 200);
  const raro = await request(app).put(`/api/turnos/${ids.turnoCli1}/estado`).set('Authorization', `Bearer ${tok.abogA}`).send({ estado: 'pagado' });
  assert.equal(raro.status, 400);
});

test('inyección de operadores de Mongo en el login no entra', async () => {
  const r = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: PASS });
  assert.equal(r.status, 400);
});

test('8. un usuario desactivado pierde el acceso aunque tenga token', async () => {
  const r = await request(app).put(`/api/users/${ids.cli2}`).set('Authorization', `Bearer ${tok.adminA}`).send({ activo: false });
  assert.equal(r.status, 200);
  const despues = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tok.cli2}`);
  assert.equal(despues.status, 401);
});

test('4. el nombre del estudio llega escapado al mail del superadmin', async () => {
  let html = '';
  (transporter as any).sendMail = async (m: any) => { html += m.html; return {}; };
  process.env.SUPERADMIN_EMAIL = 'super@x.com';
  const r = await request(app).post('/api/auth/register').send({
    nombreEstudio: '<a href="http://malo">Clic</a>', nombreAdmin: 'Ana', email: 'nuevo@x.com', password: PASS,
  });
  assert.equal(r.status, 201);
  assert.ok(!html.includes('<a href="http://malo">'));
  assert.ok(html.includes('&lt;a href=&quot;http://malo&quot;&gt;'));
});

test('6. los errores no devuelven detalles internos', async () => {
  const r = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
  assert.equal(r.status, 400);
  assert.ok(!JSON.stringify(r.body).includes('Unexpected'));
});

test('contraseñas cortas se rechazan', async () => {
  const r = await request(app).post('/api/auth/register').send({ nombreEstudio: 'Otro', nombreAdmin: 'Ana', email: 'otro@x.com', password: '123' });
  assert.equal(r.status, 400);
});
