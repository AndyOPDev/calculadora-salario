// ============================================================
// MÓDULO DE RENDIMIENTOS DEL CAPITAL (Base del Ahorro)
// ============================================================

// Escala progresiva para la base del ahorro (2025)
const ESCALA_AHORRO = [
  { hasta: 6000,    tipo: 0.19 },
  { hasta: 50000,   tipo: 0.21 },
  { hasta: 200000,  tipo: 0.23 },
  { hasta: 300000,  tipo: 0.27 },
  { hasta: Infinity, tipo: 0.28 },
];

// Calcula la cuota íntegra correspondiente a la base del ahorro
function calcularCuotaAhorro(baseAhorro) {
  return calcularCuota(baseAhorro, ESCALA_AHORRO);
}