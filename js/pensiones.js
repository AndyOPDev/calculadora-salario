// ============================================================
// MÓDULO DE PLANES DE PENSIONES
// ============================================================

// Límites máximos anuales de reducción en base general (2025)
const LIMITE_PLAN_PENSIONES_INDIVIDUAL = 1500;
const LIMITE_PLAN_PENSIONES_EMPRESA = 8500;

// Calcula la reducción total que se puede aplicar a la base general
// individual: aportación a plan de pensiones individual (€)
// empresa: aportación a plan de pensiones de empresa (€)
function calcularReduccionPensiones(individual, empresa) {
  const individualValido = Math.min(individual, LIMITE_PLAN_PENSIONES_INDIVIDUAL);
  const empresaValido = Math.min(empresa, LIMITE_PLAN_PENSIONES_EMPRESA);
  return individualValido + empresaValido;
}