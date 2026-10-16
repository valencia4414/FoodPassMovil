// test_e2e_integration.js
// Prueba de integración Frontend -> API -> MySQL para T10 y T11

const jwt = require('c:/Users/santi/Downloads/foodpass-api/foodpass-api/node_modules/jsonwebtoken');

// Token firmado con JWT_SECRET de foodpass_db
const JWT_SECRET = 'foodpass_super_secret_key_2024';
const tokenCarlos = jwt.sign(
  { id: 4, email: 'carlos@soy.sena.edu.co', role: 'beneficiario' },
  JWT_SECRET,
  { expiresIn: '1h' }
);
const tokenJuanca = jwt.sign(
  { id: 12, email: 'r@gmail.com', role: 'cliente' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function runE2E() {
  console.log('====================================================');
  console.log('   PRUEBA INTEGRADA END-TO-END (FRONTEND -> API -> BD)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [OK] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FALLO] ${message}`);
      failed++;
    }
  }

  const BASE_URL = 'http://localhost:3000/api';

  try {
    // ----------------------------------------------------
    // 1. T10: Historial de Pedidos (RFM07)
    // ----------------------------------------------------
    console.log('--- 1. VERIFICACIÓN DE T10 (RFM07 - HISTORIAL DE PEDIDOS) ---');

    // 1.1 Rechazo sin token
    const resSinToken = await fetch(`${BASE_URL}/pedidos/me`);
    assert(resSinToken.status === 401, 'Petición sin token rechazada con 401');

    // 1.2 Consulta de pedidos reales para Carlos
    const resCarlos = await fetch(`${BASE_URL}/pedidos/me`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` }
    });
    assert(resCarlos.status === 200, 'GET /api/pedidos/me responde 200 OK con token válido');

    const jsonCarlos = await resCarlos.json();
    assert(jsonCarlos.success === true, 'Respuesta indica success: true');
    assert(Array.isArray(jsonCarlos.data) && jsonCarlos.data.length >= 2, `Devuelve los pedidos reales del usuario autenticado (Total: ${jsonCarlos.data.length})`);

    const p1 = jsonCarlos.data[0];
    assert(p1.id && p1.total !== undefined && p1.estado && p1.fecha_pedido, 'Cada pedido contiene id, total, estado y fecha_pedido de MySQL');
    assert(Array.isArray(p1.items) && p1.items.length > 0, 'El pedido incluye la relación con sus productos y detalles');
    console.log(`   -> Ejemplo pedido #${p1.id}: Total=$${p1.total}, Estado=${p1.estado}, Items: ${p1.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}`);

    // 1.3 Consulta de usuario sin pedidos (debe responder 200 y array vacío, sin fallar)
    const resJuanca = await fetch(`${BASE_URL}/pedidos/me`, {
      headers: { Authorization: `Bearer ${tokenJuanca}` }
    });
    const jsonJuanca = await resJuanca.json();
    assert(resJuanca.status === 200, 'GET /api/pedidos/me para usuario sin compras responde 200 OK');
    assert(Array.isArray(jsonJuanca.data) && jsonJuanca.data.length === 0, 'Retorna array vacío [] para estado sin pedidos (vacío limpio)');

    // 1.4 Aislamiento de seguridad: Carlos no puede ver pedidos de otros usuarios
    const idList = jsonCarlos.data.map(p => p.id);
    const hasOtherOrders = idList.includes(3) || idList.includes(4) || idList.includes(5);
    assert(!hasOtherOrders, 'Seguridad de aislamiento verificada: un usuario no puede ver pedidos de terceros');

    // ----------------------------------------------------
    // 2. T11: Gestión de Perfil (RFM12)
    // ----------------------------------------------------
    console.log('\n--- 2. VERIFICACIÓN DE T11 (RFM12 - GESTIÓN DE PERFIL) ---');

    // 2.1 GET /api/users/me sin token -> 401
    const resProfileNoAuth = await fetch(`${BASE_URL}/users/me`);
    assert(resProfileNoAuth.status === 401, 'GET /api/users/me rechaza petición sin token con 401');

    // 2.2 GET /api/users/me con token -> Retorna perfil real de Carlos
    const resProfile = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` }
    });
    assert(resProfile.status === 200, 'GET /api/users/me responde 200 OK');
    const jsonProfile = await resProfile.json();
    assert(jsonProfile.data.email === 'carlos@soy.sena.edu.co', 'Carga datos reales del perfil desde MySQL (email verificado)');
    assert(jsonProfile.data.password === undefined, 'No expone campos protegidos como password');

    // 2.3 PUT /api/users/me validación de nombre requerido
    const resVal1 = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`
      },
      body: JSON.stringify({ name: '' })
    });
    assert(resVal1.status === 400, 'PUT /api/users/me valida que el nombre no esté vacío (400 Bad Request)');

    // 2.4 PUT /api/users/me validación de formato de teléfono
    const resVal2 = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`
      },
      body: JSON.stringify({ telefono: 'telefono-no-valido' })
    });
    assert(resVal2.status === 400, 'PUT /api/users/me valida formato de teléfono numérico (400 Bad Request)');

    // 2.5 PUT /api/users/me actualización real y persistencia
    const timestamp = Date.now();
    const nombreActualizado = `Carlos Aprendiz ${timestamp}`;
    const telefonoActualizado = '+57 300 9876543';

    const resUpdate = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`
      },
      body: JSON.stringify({ name: nombreActualizado, telefono: telefonoActualizado })
    });
    assert(resUpdate.status === 200, 'PUT /api/users/me guarda cambios con 200 OK');
    const jsonUpdate = await resUpdate.json();
    assert(jsonUpdate.data.name === nombreActualizado, 'La respuesta de la API confirma el nuevo nombre actualizado');
    assert(jsonUpdate.data.telefono === telefonoActualizado, 'La respuesta de la API confirma el nuevo teléfono actualizado');

    // 2.6 Verificación de persistencia: Consultar de nuevo con GET /api/users/me
    const resCheck = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` }
    });
    const jsonCheck = await resCheck.json();
    assert(jsonCheck.data.name === nombreActualizado, 'Al volver a consultar el perfil, los cambios persisten en MySQL');
    assert(jsonCheck.data.telefono === telefonoActualizado, 'Al volver a consultar el teléfono, persiste en MySQL');

    // 2.7 Restaurar datos originales de Carlos
    await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`
      },
      body: JSON.stringify({ name: 'Carlos Aprendiz', telefono: '3001234567' })
    });
    console.log('   -> Datos de prueba restaurados a su estado original.');

  } catch (err) {
    console.error('Error durante pruebas E2E:', err);
    failed++;
  } finally {
    console.log('\n====================================================');
    console.log(`TOTAL PRUEBAS E2E: ${passed} EXITOSAS | ${failed} FALLIDAS`);
    console.log('====================================================\n');
  }
}

runE2E();
