// ============================================================
// UTILIDADES COMUNES (formato, cálculo de cuota por escalas)
// ============================================================

// Formato de números (español: puntos miles, coma decimal)
function formatearNumero(numero, decimales = 0) {
  let partes = numero.toFixed(decimales).split('.');
  let entero = partes[0];
  let decimal = partes[1] ? ',' + partes[1] : '';
  let enteroConPuntos = '';
  for (let i = entero.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) enteroConPuntos = '.' + enteroConPuntos;
    enteroConPuntos = entero[i] + enteroConPuntos;
  }
  return enteroConPuntos + decimal;
}

function fmt(n, d = 0) {
  return formatearNumero(n, d) + ' €';
}

function fmtBig(n) {
  return formatearNumero(n, 2) + ' €';
}

function fmtNumber(n, d = 0) {
  return formatearNumero(n, d);
}

function fmtPercent(n, d = 2) {
  return formatearNumero(n, d) + '%';
}

// Cálculo genérico de cuota según una escala (tramos)
// base: número, escala: array de { hasta, tipo }
function calcularCuota(base, escala) {
  let cuota = 0;
  let limiteAnterior = 0;
  for (const tramo of escala) {
    if (base <= limiteAnterior) break;
    const limite = Math.min(tramo.hasta, base);
    const baseTramo = limite - limiteAnterior;
    cuota += baseTramo * tramo.tipo;
    limiteAnterior = limite;
  }
  return cuota;
}