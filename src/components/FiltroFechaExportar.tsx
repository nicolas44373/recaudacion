'use client';
import { Download, Calendar, FileText } from 'lucide-react';
import { format, parseISO, isValid, subDays, startOfMonth, startOfWeek } from 'date-fns';
import * as XLSX from 'xlsx';
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
  datos: Item[];
  tipo: 'ingresos' | 'gastos';
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

// ── REPORTE HTML ──────────────────────────────────────────────────────────────

function generarReporteHTML(datos: Item[], tipo: 'ingresos' | 'gastos', desde: string, hasta: string): string {
  const esIngreso = tipo === 'ingresos';
  const titulo = esIngreso ? 'REPORTE DE INGRESOS' : 'REPORTE DE EGRESOS';
  const accentColor = esIngreso ? '#059669' : '#dc2626';
  const accentLight = esIngreso ? '#ecfdf5' : '#fef2f2';

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
        <td>${fmtFecha(i.fecha)}</td>
        <td>${esAp ? '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">APERTURA</span>' : (i.categoria || '—')}</td>
        <td style="text-align:right;font-weight:600;color:${esAp ? '#d97706' : accentColor};">${fmtMoney(Number(i.monto))}</td>
        <td>${i.metodo_pago || '—'}</td>
        <td style="color:#999;font-size:11.5px;">${i.notas || '—'}</td>
      </tr>`;
    }).join('');

  const filasCat = catOrdenadas.map(([cat, monto]) => {
    const pct = total > 0 ? ((monto / total) * 100).toFixed(1) : '0.0';
    return `<tr>
      <td>${cat}</td>
      <td style="text-align:right;font-weight:600;">${fmtMoney(monto)}</td>
      <td style="text-align:right;color:#888;">${pct}%</td>
      <td style="padding:8px 12px;">
        <div style="background:#f0f0f0;border-radius:4px;height:8px;width:100%;max-width:180px;">
          <div style="background:${accentColor};height:8px;border-radius:4px;width:${pct}%;"></div>
        </div>
      </td>
    </tr>`;
  }).join('');

  const filasMetodo = metOrdenados.map(([met, monto]) => {
    const pct = total > 0 ? ((monto / total) * 100).toFixed(1) : '0.0';
    return `<tr>
      <td>${met}</td>
      <td style="text-align:right;font-weight:600;">${fmtMoney(monto)}</td>
      <td style="text-align:right;color:#888;">${pct}%</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${titulo} — Alenort</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background: #fff; }

    /* HEADER */
    .hdr { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 12px; margin-bottom: 20px; border-bottom: 3px solid #111; }
    .brand { font-size: 36px; font-weight: 900; letter-spacing: 8px; line-height: 1; }
    .brand-sub { font-size: 9px; letter-spacing: 3px; color: #888; text-transform: uppercase; margin-top: 4px; }
    .hdr-right { text-align: right; }
    .rep-title { font-size: 18px; font-weight: 800; color: ${accentColor}; letter-spacing: 1px; }
    .rep-period { font-size: 11px; color: #666; margin-top: 3px; }
    .rep-gen { font-size: 10px; color: #bbb; margin-top: 2px; }

    /* STAT CARDS */
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .stat { background: ${accentLight}; border: 1px solid ${accentColor}22; border-radius: 10px; padding: 12px 14px; }
    .stat-label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1.5px; }
    .stat-value { font-size: 17px; font-weight: 900; color: ${accentColor}; margin-top: 4px; line-height: 1; }
    .stat-sub { font-size: 10px; color: #999; margin-top: 3px; }

    /* SECTION TITLES */
    .section-title { font-size: 10px; font-weight: 700; color: #bbb; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; margin-top: 18px; }

    /* TABLES */
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    thead tr { background: #111; }
    thead th { color: #fff; font-weight: 700; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #f0f0f0; }
    tbody tr:hover { background: #fafafa; }
    tbody td { padding: 7px 12px; }

    /* SPLIT LAYOUT */
    .two-col { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-bottom: 6px; }

    /* TOTALS */
    .total-row td { font-weight: 900; font-size: 13px; background: #f8f8f8; border-top: 2px solid #111 !important; }

    /* APERTURA */
    .apertura-row { background: #fffbeb; color: #92400e; }

    /* FOOTER */
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px; color: #bbb; }

    @media print {
      body { font-size: 11px; }
      .stats { gap: 8px; }
    }
  </style>
</head>
<body>

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
          <th>Categoría</th>
          <th style="text-align:right">Monto</th>
          <th style="text-align:right">%</th>
          <th>Distribución</th>
        </tr></thead>
        <tbody>
          ${filasCat}
          <tr class="total-row">
            <td>TOTAL</td>
            <td style="text-align:right">${fmtMoney(total)}</td>
            <td style="text-align:right">100%</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      <div class="section-title">Por método de pago</div>
      <table>
        <thead><tr>
          <th>Método</th>
          <th style="text-align:right">Monto</th>
          <th style="text-align:right">%</th>
        </tr></thead>
        <tbody>
          ${filasMetodo}
          <tr class="total-row">
            <td>TOTAL</td>
            <td style="text-align:right">${fmtMoney(total)}</td>
            <td style="text-align:right">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- DETALLE -->
  <div class="section-title" style="margin-top:22px;">Detalle de transacciones</div>
  <table>
    <thead><tr>
      <th>Fecha</th>
      <th>Categoría</th>
      <th style="text-align:right">Monto</th>
      <th>Método</th>
      <th>Notas</th>
    </tr></thead>
    <tbody>
      ${filasDetalle}
      <tr class="total-row">
        <td colspan="2">TOTAL REAL</td>
        <td style="text-align:right">${fmtMoney(total)}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>

  <!-- FOOTER -->
  <div class="footer">
    <span>Alenort — Sistema de Recaudación</span>
    <span>Reporte generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm")}</span>
  </div>

</body>
</html>`;
}

// ── EXCEL PROFESIONAL ─────────────────────────────────────────────────────────

function exportarExcelPro(datos: Item[], tipo: 'ingresos' | 'gastos', desde: string, hasta: string) {
  const esIngreso = tipo === 'ingresos';
  const datosReales = esIngreso ? datos.filter(i => i.categoria !== CATEGORIA_INICIO_DIA) : datos;
  const total = datosReales.reduce((s, i) => s + Number(i.monto), 0);

  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Detalle ──────────────────────────
  const detalleData: (string | number)[][] = [
    [`ALENORT — ${esIngreso ? 'REPORTE DE INGRESOS' : 'REPORTE DE EGRESOS'}`],
    [`Período: ${fmtFecha(desde)} al ${fmtFecha(hasta)}   |   Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
    [],
    ['FECHA', 'CATEGORÍA', 'MONTO ($)', 'MÉTODO DE PAGO', 'NOTAS'],
    ...[...datos]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(i => [
        fmtFecha(i.fecha),
        i.categoria || 'Sin categoría',
        Number(i.monto),
        i.metodo_pago || '',
        i.notas || '',
      ]),
    [],
    ['', 'TOTAL REAL', total, '', ''],
    ...(esIngreso ? [['', 'TOTAL BRUTO', datos.reduce((s, i) => s + Number(i.monto), 0), '', '']] : []),
  ];

  const wsDetalle = XLSX.utils.aoa_to_sheet(detalleData);
  wsDetalle['!cols'] = [{ wch: 14 }, { wch: 36 }, { wch: 18 }, { wch: 18 }, { wch: 40 }];
  wsDetalle['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }];
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

  // ── Hoja 2: Por Categoría ────────────────────
  const porCategoria = new Map<string, number>();
  datosReales.forEach(i => {
    const cat = i.categoria || 'Sin categoría';
    porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + Number(i.monto));
  });
  const catOrdenadas = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);

  const catData: (string | number)[][] = [
    ['RESUMEN POR CATEGORÍA'],
    [`Período: ${fmtFecha(desde)} al ${fmtFecha(hasta)}`],
    [],
    ['CATEGORÍA', 'MONTO ($)', '% DEL TOTAL', 'REGISTROS'],
    ...catOrdenadas.map(([cat, monto]) => {
      const qty = datosReales.filter(i => (i.categoria || 'Sin categoría') === cat).length;
      const pct = total > 0 ? ((monto / total) * 100).toFixed(2) + '%' : '0.00%';
      return [cat, monto, pct, qty];
    }),
    [],
    ['TOTAL', total, '100%', datosReales.length],
  ];

  const wsCat = XLSX.utils.aoa_to_sheet(catData);
  wsCat['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 14 }, { wch: 12 }];
  wsCat['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }];
  XLSX.utils.book_append_sheet(wb, wsCat, 'Por Categoría');

  // ── Hoja 3: Por Método ───────────────────────
  const porMetodo = new Map<string, number>();
  datosReales.forEach(i => {
    const m = i.metodo_pago || 'Sin método';
    porMetodo.set(m, (porMetodo.get(m) ?? 0) + Number(i.monto));
  });
  const metOrdenados = [...porMetodo.entries()].sort((a, b) => b[1] - a[1]);

  const metData: (string | number)[][] = [
    ['RESUMEN POR MÉTODO DE PAGO'],
    [`Período: ${fmtFecha(desde)} al ${fmtFecha(hasta)}`],
    [],
    ['MÉTODO DE PAGO', 'MONTO ($)', '% DEL TOTAL', 'REGISTROS'],
    ...metOrdenados.map(([met, monto]) => {
      const qty = datosReales.filter(i => (i.metodo_pago || 'Sin método') === met).length;
      const pct = total > 0 ? ((monto / total) * 100).toFixed(2) + '%' : '0.00%';
      return [met, monto, pct, qty];
    }),
    [],
    ['TOTAL', total, '100%', datosReales.length],
  ];

  const wsMet = XLSX.utils.aoa_to_sheet(metData);
  wsMet['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 12 }];
  wsMet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }];
  XLSX.utils.book_append_sheet(wb, wsMet, 'Por Método');

  const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([blob]), `Alenort_${tipo}_${desde}_al_${hasta}.xlsx`);
}

// ── COMPONENTE ────────────────────────────────────────────────────────────────

export default function FiltroFechaExportar({ desde, hasta, setDesde, setHasta, datos, tipo }: Props) {

  const aplicarPreset = (preset: typeof PRESETS[0]) => {
    setDesde(preset.desde());
    setHasta(preset.hasta());
  };

  const presetActivo = (preset: typeof PRESETS[0]) =>
    desde === preset.desde() && hasta === preset.hasta();

  const abrirReporte = () => {
    if (!datos.length) { alert('No hay datos para exportar.'); return; }
    const html = generarReporteHTML(datos, tipo, desde, hasta);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) win.addEventListener('load', () => URL.revokeObjectURL(url));
  };

  const exportarExcel = () => {
    if (!datos.length) { alert('No hay datos para exportar.'); return; }
    try { exportarExcelPro(datos, tipo, desde, hasta); }
    catch (err) { console.error(err); alert('Error al exportar.'); }
  };

  const datosReales = tipo === 'ingresos' ? datos.filter(i => i.categoria !== CATEGORIA_INICIO_DIA) : datos;
  const total = datosReales.reduce((s, i) => s + Number(i.monto), 0);
  const totalBruto = datos.reduce((s, i) => s + Number(i.monto), 0);

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
            Excel
          </button>
        </div>
      </div>

      {/* Resumen */}
      {datos.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 border-t border-gray-100 pt-2">
          <span>{datos.length} registros</span>
          <span>Total bruto: <span className="text-gray-900 font-semibold">{fmtMoney(totalBruto)}</span></span>
          {tipo === 'ingresos' && (
            <span>Total real: <span className="text-emerald-600 font-semibold">{fmtMoney(total)}</span></span>
          )}
          {tipo === 'gastos' && (
            <span>Total: <span className="text-red-600 font-semibold">{fmtMoney(total)}</span></span>
          )}
        </div>
      )}
    </div>
  );
}
