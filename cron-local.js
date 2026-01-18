// Script para ejecutar AutoMix localmente sin depender de cron-job.org
// Ejecutar con: node cron-local.js

const BASE_URL = 'http://localhost:3000'; // Asegúrate de que tu servidor esté corriendo aquí
const CRON_URL = `${BASE_URL}/api/cron/automix`;

console.log('🚀 Iniciando Cron Local para AutoMix...');
console.log(`📡 Conectando a: ${CRON_URL}`);

async function runCron() {
  try {
    const now = new Date().toLocaleTimeString();
    console.log(`\n[${now}] ⏳ Ejecutando AutoMix...`);
    
    // Usar fetch nativo (Node 18+)
    const res = await fetch(CRON_URL);
    
    if (!res.ok) {
      throw new Error(`Status: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('✅ Resultado:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error ejecutando cron:', error.message);
    if (error.cause) console.error('Causa:', error.cause);
  }
}

// Ejecutar cada 1 minuto (60000 ms)
setInterval(runCron, 60000);

// Ejecución inicial
runCron();
