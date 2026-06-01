'use client';
import { Download, Calendar, FileText } from 'lucide-react';
import { format, parseISO, isValid, subDays, startOfMonth, startOfWeek } from 'date-fns';
import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import React from 'react';

const CATEGORIA_INICIO_DIA = 'INICIO DEL DIA';

interface Item {
  categoria: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
  notas?: string;
}

interface Props {
  desde: string;
  hasta: string;
  setDesde: (_: string) => void;
  setHasta: (_: string) => void;
  ingresos: Item[];
  gastos: Item[];
  vistaActual: 'dashboard' | 'contador' | 'ingresos' | 'formulario' | 'gastos' | 'nuevo-gasto' | 'recordatorios' | 'pagos';
}

const hoy = () => format(new Date(), 'yyyy-MM-dd');
const diasAtras = (n: number) => format(subDays(new Date(), n), 'yyyy-MM-dd');

const PRESETS = [
  { label: 'Hoy',       desde: () => hoy(),                        hasta: () => hoy() },
  { label: 'Ayer',      desde: () => diasAtras(1),                  hasta: () => diasAtras(1) },
  { label: 'Esta sem.', desde: () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), hasta: () => hoy() },
  { label: 'Este mes',  desde: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'), hasta: () => hoy() },
  { label: '30 días',   desde: () => diasAtras(30), hasta: () => hoy() },
  { label: '90 días',   desde: () => diasAtras(90), hasta: () => hoy() },
];

const fmtFecha = (fecha: string) => {
  try {
    const d = parseISO(fecha);
    return isValid(d) ? format(d, 'dd/MM/yyyy') : fecha;
  } catch { return fecha; }
};

const fmtMoney = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

const cleanNotas = (notas?: string): string => {
  if (!notas) return '';
  try {
    const parts = notas.split('||');
    if (parts[0] === '[PAGO]' && parts[1]) {
      const p = JSON.parse(parts[1]);
      const receptor = p.a || '';
      let obs = p.observaciones || '';
      // Clean prefix "name - obs:"
      obs = obs.replace(/^.*?-\s*obs:\s*/i, '').trim();

      const met = p.metodo || 'Efectivo';
      let chInfo = '';
      if (met === 'Cheque' || met === 'eCheq') {
        const ch = p.cheque;
        chInfo = ch ? ` (${met}: ${ch.banco} N° ${ch.serie})` : ` (${met})`;
      } else if (met === 'Transferencia') {
        chInfo = ' (Transf.)';
      }

      if (receptor && obs) {
        return `${receptor}${chInfo} - Obs: ${obs}`;
      }
      return `${receptor}${chInfo}` || obs;
    }
    return notas;
  } catch {
    return notas;
  }
};

// ── REPORTE HTML ──────────────────────────────────────────────────────────────

function generarReporteHTML(datos: Item[], tipo: 'ingresos' | 'gastos', desde: string, hasta: string): string {
  const esIngreso = tipo === 'ingresos';
  const titulo = esIngreso ? 'REPORTE DE INGRESOS' : 'REPORTE DE EGRESOS';
  const accentColor = esIngreso ? '#0f766e' : '#b91c1c';
  const accentLight = esIngreso ? '#f0fdfa' : '#fef2f2';
  const accentBorder = esIngreso ? '#99f6e4' : '#fecaca';

  const datosReales = esIngreso
    ? datos.filter(i => i.categoria !== CATEGORIA_INICIO_DIA)
    : datos;
  const apertura = esIngreso
    ? datos.filter(i => i.categoria === CATEGORIA_INICIO_DIA).reduce((s, i) => s + Number(i.monto), 0)
    : 0;

  const total = datosReales.reduce((s, i) => s + Number(i.monto), 0);
  const totalBruto = datos.reduce((s, i) => s + Number(i.monto), 0);
  const promedio = datosReales.length > 0 ? total / datosReales.length : 0;

  // Por categoría
  const porCategoria = new Map<string, number>();
  datosReales.forEach(i => {
    const cat = i.categoria || 'Sin categoría';
    porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + Number(i.monto));
  });
  const catOrdenadas = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);

  // Por método
  const porMetodo = new Map<string, number>();
  datosReales.forEach(i => {
    const m = i.metodo_pago || 'Sin método';
    porMetodo.set(m, (porMetodo.get(m) ?? 0) + Number(i.monto));
  });
  const metOrdenados = [...porMetodo.entries()].sort((a, b) => b[1] - a[1]);

  const filasDetalle = [...datos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(i => {
      const esAp = i.categoria === CATEGORIA_INICIO_DIA;
      return `<tr style="${esAp ? 'opacity:0.55;' : ''}">
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${fmtFecha(i.fecha)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">${esAp ? '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:0.5px;">APERTURA</span>' : (i.categoria || '—')}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align:right;font-weight:700;color:${esAp ? '#b45309' : accentColor};">${fmtMoney(Number(i.monto))}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #475569;">${i.metodo_pago || '—'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color:#475569;font-size:11px;">${cleanNotas(i.notas) || '—'}</td>
      </tr>`;
    }).join('');

  const filasCat = catOrdenadas.map(([cat, monto]) => {
    const pct = total > 0 ? ((monto / total) * 100).toFixed(1) : '0.0';
    return `<tr>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${cat}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align:right;font-weight:700;color:#0f172a;">${fmtMoney(monto)}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align:right;color:#64748b;font-weight:600;">${pct}%</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">
        <div style="background:#e2e8f0;border-radius:4px;height:6px;width:100%;max-width:180px;">
          <div style="background:${accentColor};height:6px;border-radius:4px;width:${pct}%;"></div>
        </div>
      </td>
    </tr>`;
  }).join('');

  const filasMetodo = metOrdenados.map(([met, monto]) => {
    const pct = total > 0 ? ((monto / total) * 100).toFixed(1) : '0.0';
    return `<tr>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${met}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align:right;font-weight:700;color:#0f172a;">${fmtMoney(monto)}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align:right;color:#64748b;font-weight:600;">${pct}%</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${titulo} — Alenort</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Outfit', sans-serif;
      font-size: 11.5px;
      color: #1e293b;
      background: #f1f5f9;
      padding: 30px 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
 
    /* TOOLBAR VISIBLE ONLY ON SCREEN */
    .toolbar {
      width: 100%;
      max-width: 210mm;
      background: #0f172a;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    }
    .toolbar-title {
      color: #f8fafc;
      font-weight: 700;
      font-size: 13.5px;
      letter-spacing: 0.5px;
    }
    .btn-print {
      background: #0f766e;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
    }
    .btn-print:hover {
      background: #0d9488;
      transform: translateY(-1px);
    }
    .btn-print:active {
      transform: translateY(0);
    }

    /* A4 PAGE CONTAINER CENTERED ON SCREEN */
    .page-container {
      width: 210mm;
      background: #fff;
      padding: 15mm;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
    }

    /* HEADER */
    .hdr { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 14px; margin-bottom: 22px; border-bottom: 3px solid #0f172a; }
    .brand { font-size: 38px; font-weight: 900; letter-spacing: 6px; line-height: 1; color: #0f172a; }
    .brand-sub { font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #64748b; text-transform: uppercase; margin-top: 5px; }
    .hdr-right { text-align: right; }
    .rep-title { font-size: 19px; font-weight: 800; color: ${accentColor}; letter-spacing: 0.5px; }
    .rep-period { font-size: 11px; color: #475569; margin-top: 4px; font-weight: 500; }
    .rep-gen { font-size: 10px; color: #94a3b8; margin-top: 3px; }
 
    /* STAT CARDS */
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
    .stat { background: ${accentLight}; border: 1px solid ${accentBorder}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
    .stat-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .stat-value { font-size: 18px; font-weight: 800; color: ${accentColor}; margin-top: 5px; line-height: 1; }
    .stat-sub { font-size: 10px; color: #64748b; margin-top: 4px; font-weight: 500; }
 
    /* SECTION TITLES */
    .section-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; margin-top: 22px; }
 
    /* TABLES */
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
    thead tr { background: #0f172a; }
    thead th { color: #fff; font-weight: 600; padding: 8px 10px; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.8px; border: none; }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:hover { background: #f8fafc; }
    tbody td { padding: 6px 10px; }
 
    /* SPLIT LAYOUT */
    .two-col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-bottom: 8px; }
 
    /* TOTALS */
    .total-row td { font-weight: 800; font-size: 12px; background: #f8fafc; border-top: 2px solid #0f172a !important; color: #0f172a; padding: 10px 10px; }
    .total-row td:last-child { text-align: right; }
 
    /* FOOTER */
    .footer { margin-top: auto; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9.5px; color: #94a3b8; font-weight: 500; }
 
    /* PRINT STYLES OVERRIDE */
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none !important; }
      .page-container {
        width: 100%;
        box-shadow: none;
        padding: 0;
        border-radius: 0;
      }
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
 
  <!-- TOOLBAR (SCREEN ONLY) -->
  <div class="toolbar">
    <div class="toolbar-title">Vista de Impresión — ALENORT</div>
    <button onclick="window.print()" class="btn-print">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      Imprimir Reporte
    </button>
  </div>

  <!-- A4 CONTAINER -->
  <div class="page-container">

    <!-- HEADER -->
    <div class="hdr">
      <div>
        <div class="brand">ALENORT</div>
        <div class="brand-sub">Sistema de Recaudación</div>
      </div>
      <div class="hdr-right">
        <div class="rep-title">${titulo}</div>
        <div class="rep-period">Período: ${fmtFecha(desde)} al ${fmtFecha(hasta)}</div>
        <div class="rep-gen">Generado el ${format(new Date(), 'dd/MM/yyyy')} a las ${format(new Date(), 'HH:mm')}</div>
      </div>
    </div>
 
    <!-- STATS -->
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Total ${esIngreso ? 'real' : 'egresos'}</div>
        <div class="stat-value">${fmtMoney(total)}</div>
        <div class="stat-sub">${datosReales.length} registro${datosReales.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Promedio por registro</div>
        <div class="stat-value">${fmtMoney(Math.round(promedio))}</div>
        <div class="stat-sub">&nbsp;</div>
      </div>
      <div class="stat">
        <div class="stat-label">Categorías distintas</div>
        <div class="stat-value">${porCategoria.size}</div>
        <div class="stat-sub">&nbsp;</div>
      </div>
      <div class="stat">
        <div class="stat-label">${esIngreso ? 'Apertura del día' : 'Total bruto'}</div>
        <div class="stat-value">${esIngreso ? fmtMoney(apertura) : fmtMoney(totalBruto)}</div>
        <div class="stat-sub">${esIngreso ? 'No incluido en total' : 'Sin filtros'}</div>
      </div>
    </div>
 
    <!-- BREAKDOWNS -->
    <div class="two-col">
      <div>
        <div class="section-title">Desglose por categoría</div>
        <table>
          <thead><tr>
            <th style="padding: 8px 10px;">Categoría</th>
            <th style="text-align:right; padding: 8px 10px;">Monto</th>
            <th style="text-align:right; padding: 8px 10px;">%</th>
            <th style="padding: 8px 10px;">Distribución</th>
          </tr></thead>
          <tbody>
            ${filasCat}
            <tr class="total-row">
              <td style="padding: 10px 10px;">TOTAL</td>
              <td style="text-align:right; padding: 10px 10px;">${fmtMoney(total)}</td>
              <td style="text-align:right; padding: 10px 10px;">100%</td>
              <td style="padding: 10px 10px;"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <div class="section-title">Por método de pago</div>
        <table>
          <thead><tr>
            <th style="padding: 8px 10px;">Método</th>
            <th style="text-align:right; padding: 8px 10px;">Monto</th>
            <th style="text-align:right; padding: 8px 10px;">%</th>
          </tr></thead>
          <tbody>
            ${filasMetodo}
            <tr class="total-row">
              <td style="padding: 10px 10px;">TOTAL</td>
              <td style="text-align:right; padding: 10px 10px;">${fmtMoney(total)}</td>
              <td style="text-align:right; padding: 10px 10px;">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
 
    <!-- DETALLE -->
    <div class="section-title" style="margin-top:22px;">Detalle de transacciones</div>
    <table>
      <thead><tr>
        <th style="padding: 8px 10px;">Fecha</th>
        <th style="padding: 8px 10px;">Categoría</th>
        <th style="text-align:right; padding: 8px 10px;">Monto</th>
        <th style="padding: 8px 10px;">Método</th>
        <th style="padding: 8px 10px;">Notas</th>
      </tr></thead>
      <tbody>
        ${filasDetalle}
        <tr class="total-row">
          <td colspan="2" style="padding: 10px 10px;">TOTAL REAL</td>
          <td style="text-align:right; padding: 10px 10px;">${fmtMoney(total)}</td>
          <td colspan="2" style="padding: 10px 10px;"></td>
        </tr>
      </tbody>
    </table>
 
    <!-- FOOTER -->
    <div class="footer">
      <span>Alenort — Sistema de Recaudación</span>
      <span>Reporte generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm")}</span>
    </div>

  </div>
 
</body>
</html>`;
}

function exportarExcelPro(ingresos: Item[], gastos: Item[], desde: string, hasta: string) {
  // 1. Color Palettes
  const PALETTE = {
    headerBg: '0F766E',      // Teal
    headerText: 'FFFFFF',
    border: 'CBD5E1',        // Slate 200 (light gray)
    zebraEven: 'F8FAFC',     // Slate 50 (very light zebra gray)
    textDark: '1E293B',
    accentText: '0F766E',
    titleBg: '0F172A',       // Slate 900
    titleText: 'FFFFFF',
  };

  // 2. Custom Styles
  const STYLES = {
    title: {
      font: { name: 'Arial', sz: 14, bold: true, color: { rgb: PALETTE.titleText } },
      fill: { fgColor: { rgb: PALETTE.titleBg } },
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    subtitle: {
      font: { name: 'Arial', sz: 9, italic: true, color: { rgb: '64748B' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    },
    header: {
      font: { name: 'Arial', sz: 10, bold: true, color: { rgb: PALETTE.headerText } },
      fill: { fgColor: { rgb: PALETTE.headerBg } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'medium', color: { rgb: '000000' } }
      }
    },
    headerRight: {
      font: { name: 'Arial', sz: 10, bold: true, color: { rgb: PALETTE.headerText } },
      fill: { fgColor: { rgb: PALETTE.headerBg } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'medium', color: { rgb: '000000' } }
      }
    },
    data: {
      font: { name: 'Arial', sz: 10, color: { rgb: PALETTE.textDark } },
      border: {
        bottom: { style: 'thin', color: { rgb: PALETTE.border } }
      }
    },
    dataEven: {
      font: { name: 'Arial', sz: 10, color: { rgb: PALETTE.textDark } },
      fill: { fgColor: { rgb: PALETTE.zebraEven } },
      border: {
        bottom: { style: 'thin', color: { rgb: PALETTE.border } }
      }
    },
    dataRight: {
      font: { name: 'Arial', sz: 10, color: { rgb: PALETTE.textDark } },
      alignment: { horizontal: 'right' },
      border: {
        bottom: { style: 'thin', color: { rgb: PALETTE.border } }
      }
    },
    dataRightEven: {
      font: { name: 'Arial', sz: 10, color: { rgb: PALETTE.textDark } },
      fill: { fgColor: { rgb: PALETTE.zebraEven } },
      alignment: { horizontal: 'right' },
      border: {
        bottom: { style: 'thin', color: { rgb: PALETTE.border } }
      }
    },
    total: {
      font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '000000' } },
      fill: { fgColor: { rgb: 'F1F5F9' } },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'double', color: { rgb: '000000' } }
      }
    },
    totalRight: {
      font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '000000' } },
      fill: { fgColor: { rgb: 'F1F5F9' } },
      alignment: { horizontal: 'right' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'double', color: { rgb: '000000' } }
      }
    },
    summaryLabel: {
      font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '000000' } },
      border: { bottom: { style: 'thin', color: { rgb: PALETTE.border } } }
    },
    summaryValue: {
      font: { name: 'Arial', sz: 10, bold: true, color: { rgb: PALETTE.accentText } },
      border: { bottom: { style: 'thin', color: { rgb: PALETTE.border } } }
    },
    summaryDesc: {
      font: { name: 'Arial', sz: 9, italic: true, color: { rgb: '64748B' } },
      border: { bottom: { style: 'thin', color: { rgb: PALETTE.border } } }
    }
  };

  const makeCell = (val: any, styleType: keyof typeof STYLES, numFormat?: string, formula?: string) => {
    const cellStyle = { ...STYLES[styleType] };
    const isNum = typeof val === 'number';
    const c: any = {
      v: val,
      t: isNum ? 'n' : 's',
      s: cellStyle
    };
    if (numFormat) {
      cellStyle.numFmt = numFormat;
      c.z = numFormat;
    }
    if (formula) c.f = formula;
    return c;
  };

  const wb = XLSX.utils.book_new();

  const ingresosLen = ingresos.length;
  const gastosLen = gastos.length;

  // 1. Prepare data for Resumen Alenort
  const ingresosReales = ingresos.filter(i => i.categoria !== CATEGORIA_INICIO_DIA);
  const totalIngresosReal = ingresosReales.reduce((s, i) => s + Number(i.monto), 0);
  const totalIngresosInicio = ingresos.filter(i => i.categoria === CATEGORIA_INICIO_DIA).reduce((s, i) => s + Number(i.monto), 0);
  const totalIngresosBruto = ingresos.reduce((s, i) => s + Number(i.monto), 0);
  const totalGastos = gastos.reduce((s, i) => s + Number(i.monto), 0);
  const balanceNeto = totalIngresosReal - totalGastos;

  const resumenData: any[][] = [
    [makeCell('ALENORT — CONTROL DE RECAUDACIÓN Y BALANCE', 'title')],
    [makeCell(`Período: ${fmtFecha(desde)} al ${fmtFecha(hasta)}   |   Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 'subtitle')],
    [],
    [
      makeCell('CONCEPTO', 'header'),
      makeCell('VALOR ($)', 'headerRight'),
      makeCell('REGISTROS', 'headerRight'),
      makeCell('DESCRIPCIÓN', 'header')
    ],
    [
      makeCell('Total Ingresos (Real)', 'summaryLabel'),
      ingresosLen > 0 ? makeCell(totalIngresosReal, 'summaryValue', '$#,##0') : makeCell(0, 'summaryValue', '$#,##0'),
      ingresosLen > 0 ? makeCell(ingresosReales.length, 'dataRight', '0') : makeCell(0, 'dataRight', '0'),
      makeCell('Suma de ingresos excluyendo Apertura del Día', 'summaryDesc')
    ],
    [
      makeCell('Apertura de Caja (Inicio del Día)', 'summaryLabel'),
      ingresosLen > 0 ? makeCell(totalIngresosInicio, 'summaryValue', '$#,##0') : makeCell(0, 'summaryValue', '$#,##0'),
      ingresosLen > 0 ? makeCell(ingresos.filter(i => i.categoria === CATEGORIA_INICIO_DIA).length, 'dataRight', '0') : makeCell(0, 'dataRight', '0'),
      makeCell('Dinero inicial en caja (no computa en balance neto)', 'summaryDesc')
    ],
    [
      makeCell('Total Ingresos (Bruto)', 'summaryLabel'),
      ingresosLen > 0 ? makeCell(totalIngresosBruto, 'summaryValue', '$#,##0') : makeCell(0, 'summaryValue', '$#,##0'),
      ingresosLen > 0 ? makeCell(ingresosLen, 'dataRight', '0') : makeCell(0, 'dataRight', '0'),
      makeCell('Total bruto acumulado en ingresos', 'summaryDesc')
    ],
    [
      makeCell('Total Egresos (Gastos / Pagos)', 'summaryLabel'),
      gastosLen > 0 ? makeCell(totalGastos, 'summaryValue', '$#,##0') : makeCell(0, 'summaryValue', '$#,##0'),
      gastosLen > 0 ? makeCell(gastosLen, 'dataRight', '0') : makeCell(0, 'dataRight', '0'),
      makeCell('Suma total de egresos registrados', 'summaryDesc')
    ],
    [],
    [
      makeCell('BALANCE NETO (Real - Egresos)', 'header'),
      makeCell(balanceNeto, 'headerRight', '$#,##0'),
      makeCell('', 'header'),
      makeCell('Diferencia neta (Ingresos Reales - Egresos)', 'header')
    ],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 55 }];
  wsResumen['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
  ];

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Alenort');

  // 2. DETALLE DE INGRESOS SHEET
  const porCategoriaIngresos = new Map<string, number>();
  ingresosReales.forEach(i => {
    const cat = i.categoria || 'Sin categoría';
    porCategoriaIngresos.set(cat, (porCategoriaIngresos.get(cat) ?? 0) + Number(i.monto));
  });
  const catIngresosOrdenadas = [...porCategoriaIngresos.entries()].sort((a, b) => b[1] - a[1]);

  const detalleIngresosData: any[][] = [
    [makeCell('ALENORT — DETALLE DE INGRESOS', 'title')],
    [makeCell(`Período: ${fmtFecha(desde)} al ${fmtFecha(hasta)}`, 'subtitle')],
    [],
    [
      makeCell('FECHA', 'header'),
      makeCell('CATEGORÍA', 'header'),
      makeCell('MONTO ($)', 'headerRight'),
      makeCell('MÉTODO DE PAGO', 'header'),
      makeCell('NOTAS', 'header')
    ],
    ...[...ingresos]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((i, idx) => {
        const rowStyle = idx % 2 === 0 ? 'data' : 'dataEven';
        const numStyle = idx % 2 === 0 ? 'dataRight' : 'dataRightEven';
        return [
          makeCell(fmtFecha(i.fecha), rowStyle),
          makeCell(i.categoria === CATEGORIA_INICIO_DIA ? 'APERTURA (INICIO DEL DIA)' : (i.categoria || 'Sin categoría'), rowStyle),
          makeCell(Number(i.monto), numStyle, '$#,##0'),
          makeCell(i.metodo_pago || '', rowStyle),
          makeCell(cleanNotas(i.notas), rowStyle)
        ];
      }),
    [],
    [
      makeCell('TOTAL REAL (Sin Apertura)', 'total'),
      makeCell('', 'total'),
      makeCell(totalIngresosReal, 'totalRight', '$#,##0'),
      makeCell('', 'total'),
      makeCell('', 'total')
    ],
    [
      makeCell('TOTAL BRUTO', 'total'),
      makeCell('', 'total'),
      makeCell(totalIngresosBruto, 'totalRight', '$#,##0'),
      makeCell('', 'total'),
      makeCell('', 'total')
    ],
    [],
    [],
    [
      makeCell('RESUMEN POR CATEGORÍA', 'header'),
      makeCell('MONTO ($)', 'headerRight'),
      makeCell('% DEL TOTAL', 'headerRight'),
      makeCell('REGISTROS', 'headerRight'),
      makeCell('', 'header')
    ],
    ...catIngresosOrdenadas.map(([cat, monto], idx) => {
      const qty = ingresosReales.filter(i => (i.categoria || 'Sin categoría') === cat).length;
      const rowStyle = idx % 2 === 0 ? 'data' : 'dataEven';
      const numStyle = idx % 2 === 0 ? 'dataRight' : 'dataRightEven';
      const pctVal = totalIngresosReal > 0 ? (monto / totalIngresosReal) : 0;
      return [
        makeCell(cat, rowStyle),
        makeCell(monto, numStyle, '$#,##0'),
        makeCell(pctVal, numStyle, '0.00%'),
        makeCell(qty, numStyle, '0'),
        makeCell('', rowStyle)
      ];
    })
  ];

  const wsIngresos = XLSX.utils.aoa_to_sheet(detalleIngresosData);
  wsIngresos['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 50 }];
  wsIngresos['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
  ];

  wsIngresos['!autofilter'] = {
    ref: `A4:E${4 + ingresosLen}`
  };

  XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos');

  // 3. DETALLE DE EGRESOS SHEET
  const porCategoriaGastos = new Map<string, number>();
  gastos.forEach(i => {
    const cat = i.categoria || 'Sin categoría';
    porCategoriaGastos.set(cat, (porCategoriaGastos.get(cat) ?? 0) + Number(i.monto));
  });
  const catGastosOrdenadas = [...porCategoriaGastos.entries()].sort((a, b) => b[1] - a[1]);

  const detalleGastosData: any[][] = [
    [makeCell('ALENORT — DETALLE DE EGRESOS', 'title')],
    [makeCell(`Período: ${fmtFecha(desde)} al ${fmtFecha(hasta)}`, 'subtitle')],
    [],
    [
      makeCell('FECHA', 'header'),
      makeCell('CATEGORÍA', 'header'),
      makeCell('MONTO ($)', 'headerRight'),
      makeCell('MÉTODO DE PAGO', 'header'),
      makeCell('NOTAS', 'header')
    ],
    ...[...gastos]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((i, idx) => {
        const rowStyle = idx % 2 === 0 ? 'data' : 'dataEven';
        const numStyle = idx % 2 === 0 ? 'dataRight' : 'dataRightEven';
        return [
          makeCell(fmtFecha(i.fecha), rowStyle),
          makeCell(i.categoria || 'Sin categoría', rowStyle),
          makeCell(Number(i.monto), numStyle, '$#,##0'),
          makeCell(i.metodo_pago || '', rowStyle),
          makeCell(cleanNotas(i.notes || i.notas), rowStyle)
        ];
      }),
    [],
    [
      makeCell('TOTAL EGRESOS', 'total'),
      makeCell('', 'total'),
      makeCell(totalGastos, 'totalRight', '$#,##0'),
      makeCell('', 'total'),
      makeCell('', 'total')
    ],
    [],
    [],
    [
      makeCell('RESUMEN POR CATEGORÍA', 'header'),
      makeCell('MONTO ($)', 'headerRight'),
      makeCell('% DEL TOTAL', 'headerRight'),
      makeCell('REGISTROS', 'headerRight'),
      makeCell('', 'header')
    ],
    ...catGastosOrdenadas.map(([cat, monto], idx) => {
      const qty = gastos.filter(i => (i.categoria || 'Sin categoría') === cat).length;
      const rowStyle = idx % 2 === 0 ? 'data' : 'dataEven';
      const numStyle = idx % 2 === 0 ? 'dataRight' : 'dataRightEven';
      const pctVal = totalGastos > 0 ? (monto / totalGastos) : 0;
      return [
        makeCell(cat, rowStyle),
        makeCell(monto, numStyle, '$#,##0'),
        makeCell(pctVal, numStyle, '0.00%'),
        makeCell(qty, numStyle, '0'),
        makeCell('', rowStyle)
      ];
    })
  ];

  const wsEgresos = XLSX.utils.aoa_to_sheet(detalleGastosData);
  wsEgresos['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 50 }];
  wsEgresos['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
  ];

  wsEgresos['!autofilter'] = {
    ref: `A4:E${4 + gastosLen}`
  };

  XLSX.utils.book_append_sheet(wb, wsEgresos, 'Egresos');

  const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([blob]), `Alenort_Consolidado_${desde}_al_${hasta}.xlsx`);
}

// ── COMPONENTE ────────────────────────────────────────────────────────────────

export default function FiltroFechaExportar({ desde, hasta, setDesde, setHasta, ingresos, gastos, vistaActual }: Props) {

  const aplicarPreset = (preset: typeof PRESETS[0]) => {
    setDesde(preset.desde());
    setHasta(preset.hasta());
  };

  const presetActivo = (preset: typeof PRESETS[0]) =>
    desde === preset.desde() && hasta === preset.hasta();

  const esIngreso = vistaActual === 'gastos' ? false : true;
  const activeDatos = esIngreso ? ingresos : gastos;
  const activeTipo = esIngreso ? 'ingresos' : 'gastos';

  const abrirReporte = () => {
    if (!activeDatos.length) { alert('No hay datos para exportar.'); return; }
    const html = generarReporteHTML(activeDatos, activeTipo, desde, hasta);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) win.addEventListener('load', () => URL.revokeObjectURL(url));
  };

  const exportarExcel = () => {
    if (!ingresos.length && !gastos.length) { alert('No hay datos para exportar.'); return; }
    try { exportarExcelPro(ingresos, gastos, desde, hasta); }
    catch (err) { console.error(err); alert('Error al exportar.'); }
  };

  const ingresosReales = ingresos.filter(i => i.categoria !== CATEGORIA_INICIO_DIA);
  const totalIngresosReal = ingresosReales.reduce((s, i) => s + Number(i.monto), 0);
  const totalIngresosBruto = ingresos.reduce((s, i) => s + Number(i.monto), 0);
  const totalGastos = gastos.reduce((s, i) => s + Number(i.monto), 0);
  const balanceNeto = totalIngresosReal - totalGastos;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[11px] text-gray-400 uppercase tracking-widest self-center mr-1">Rápido:</span>
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => aplicarPreset(p)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              presetActivo(p)
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Fechas + botones */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
          <Calendar size={15} />
          <span className="text-xs font-semibold text-gray-600">Período</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-10 flex-shrink-0">Desde</label>
            <input
              type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-400 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-10 flex-shrink-0">Hasta</label>
            <input
              type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={abrirReporte}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
          >
            <FileText size={15} />
            Reporte PDF
          </button>
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
          >
            <Download size={15} />
            Excel Unificado
          </button>
        </div>
      </div>

      {/* Resumen */}
      {(ingresos.length > 0 || gastos.length > 0) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500 border-t border-gray-100 pt-2 font-medium">
          <span>Ingresos Reales: <span className="text-emerald-600 font-bold">{fmtMoney(totalIngresosReal)}</span></span>
          <span className="text-gray-300">|</span>
          <span>Egresos Totales: <span className="text-red-600 font-bold">{fmtMoney(totalGastos)}</span></span>
          <span className="text-gray-300">|</span>
          <span>Balance Neto: <span className={`font-bold ${balanceNeto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmtMoney(balanceNeto)}</span></span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">Generado para la vista: <span className="font-semibold text-gray-600 uppercase">{vistaActual === 'gastos' ? 'Egresos' : vistaActual === 'ingresos' ? 'Ingresos' : 'Dashboard'}</span></span>
        </div>
      )}
    </div>
  );
}
