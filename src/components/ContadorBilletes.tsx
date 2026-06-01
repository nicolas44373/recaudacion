'use client';
import { useState, useEffect } from 'react';
import { Banknote, Trash2, Printer } from 'lucide-react';
import { format } from 'date-fns';

const DENOMINACIONES = [
  { valor: 100,   label: '$100',    color: 'text-red-600',     border: 'border-red-300',     dot: 'bg-red-400' },
  { valor: 200,   label: '$200',    color: 'text-orange-600',  border: 'border-orange-300',  dot: 'bg-orange-400' },
  { valor: 500,   label: '$500',    color: 'text-violet-600',  border: 'border-violet-300',  dot: 'bg-violet-400' },
  { valor: 1000,  label: '$1.000',  color: 'text-blue-600',    border: 'border-blue-300',    dot: 'bg-blue-400' },
  { valor: 2000,  label: '$2.000',  color: 'text-emerald-600', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  { valor: 10000, label: '$10.000', color: 'text-teal-600',    border: 'border-teal-300',    dot: 'bg-teal-500' },
  { valor: 20000, label: '$20.000', color: 'text-pink-600',    border: 'border-pink-300',    dot: 'bg-pink-400' },
] as const;

const STORAGE_KEY = 'contador-billetes-v1';

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

function generarHTMLArqueo(
  cantidades: Record<number, string>,
  netoEfectivo: number,
  totalContado: number,
  diferencia: number
): string {
  const fechaFmt = format(new Date(), 'dd/MM/yyyy HH:mm');
  const coincide = Math.abs(diferencia) < 1;
  const sobran = diferencia > 0;
  const estadoTexto = coincide ? '✓ CUADRA PERFECTO' : sobran ? 'SOBRANTE DE BILLETES' : 'FALTANTE DE BILLETES';
  const estadoColor = coincide ? '#059669' : sobran ? '#d97706' : '#dc2626';

  const filasBilletes = DENOMINACIONES
    .filter(d => parseInt(cantidades[d.valor] ?? '0', 10) > 0)
    .map(d => {
      const qty = parseInt(cantidades[d.valor] ?? '0', 10);
      const sub = qty * d.valor;
      return `<tr>
        <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;">${d.label}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${qty}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">${fmt(sub)}</td>
      </tr>`;
    }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Arqueo de Caja - Alenort</title>
  <style>
    @page{size:210mm 297mm;margin:0}
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:210mm}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111}

    .comprobante{
      width:194mm;
      margin:10mm 8mm;
      display:flex;flex-direction:column;
      overflow:hidden;
      border: 1px solid #eee;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }

    /* Cabecera */
    .hdr{display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;margin-bottom:12px;border-bottom:2px solid #111;flex-shrink:0}
    .title{font-size:26px;font-weight:900;letter-spacing:6px;line-height:1}
    .subtitle{font-size:9px;font-weight:600;letter-spacing:2px;color:#666;margin-top:4px;text-transform:uppercase}
    .hdr-right{text-align:right;font-size:11px;color:#666;line-height:1.5}
    .hdr-right strong{color:#111;font-size:12px}

    /* Info */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #eee;flex-shrink:0}
    .row{display:flex;gap:4px;align-items:baseline}
    .lbl{color:#777;font-size:11px;white-space:nowrap;flex-shrink:0}
    .val{font-weight:700;font-size:12px;word-break:break-word}

    /* Resumen de cuadre */
    .comp-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 15px;
    }
    .comp-title {
      font-size: 9px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .comp-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12px;
    }
    .comp-total {
      display: flex;
      justify-content: space-between;
      font-weight: 900;
      font-size: 14px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
    }

    /* Tabla */
    .sec-title{font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;margin-top:10px;flex-shrink:0}
    table{width:100%;border-collapse:collapse;flex-shrink:1;margin-bottom:20px;}
    th{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;padding:6px 8px;border-bottom:1px solid #cbd5e1;text-align:left;font-weight:700}
    th:nth-child(2){text-align:center}th:nth-child(3){text-align:right}
    td{padding:5px 8px;border-bottom:1px solid #f1f5f9;font-size:11px}
    td:nth-child(2){text-align:center}
    td:nth-child(3){text-align:right;font-weight:600}
    .tot-row td{padding:8px 8px 6px;background:none;color:#111;font-weight:950;font-size:14px;border:none;border-top:2px solid #111}
    .tot-row td:last-child{text-align:right}

    /* Firmas */
    .firmas{display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #e2e8f0;gap:24px;margin-top:30px;margin-bottom:5mm;flex-shrink:0}
    .firma{flex:1;text-align:center}
    .fline{border-bottom:1px solid #475569;height:20px;margin-bottom:4px}
    .flbl{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px}
  </style>
</head>
<body>
<div class="comprobante">
  <div class="hdr">
    <div class="hdr-left">
      <div class="title">ALENORT</div>
      <div class="subtitle">Planilla de Control de Caja</div>
    </div>
    <div class="hdr-right">
      <strong>ARQUEO DE CAJA</strong><br>
      ${fechaFmt}
    </div>
  </div>

  <div class="info-grid">
    <div class="row"><span class="lbl">Tipo de Control:</span><span class="val">Arqueo de Efectivo</span></div>
    <div class="row"><span class="lbl">Fecha Emisión:</span><span class="val">${fechaFmt}</span></div>
  </div>

  <div class="comp-box">
    <div class="comp-title">Resumen de Cuadre</div>
    <div class="comp-row">
      <span style="color:#475569;">Total Contado:</span>
      <strong style="color:#0f172a;">${fmt(totalContado)}</strong>
    </div>
    <div class="comp-row">
      <span style="color:#475569;">Neto Esperado en Caja:</span>
      <strong style="color:#0f172a;">${fmt(netoEfectivo)}</strong>
    </div>
    <div class="comp-total" style="color: ${estadoColor};">
      <span>Diferencia (${estadoTexto}):</span>
      <span>${diferencia > 0 ? '+' : ''}${fmt(diferencia)}</span>
    </div>
  </div>

  <div class="sec-title">Detalle de billetes contados</div>
  <table>
    <thead><tr>
      <th>Billete</th><th>Cantidad</th><th>Subtotal</th>
    </tr></thead>
    <tbody>
      ${filasBilletes || `<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:15px;font-style:italic;">No se registraron billetes</td></tr>`}
      <tr class="tot-row">
        <td colspan="2">TOTAL CONTADO</td>
        <td>${fmt(totalContado)}</td>
      </tr>
    </tbody>
  </table>

  <div class="firmas">
    <div class="firma"><div class="fline"></div><div class="flbl">Controlado por</div></div>
    <div class="firma"><div class="fline"></div><div class="flbl">Responsable de Caja</div></div>
  </div>
</div>
</body>
</html>`;
}

function abrirVentanaImpresion(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) return;
  win.addEventListener('load', () => {
    setTimeout(() => {
      win.print();
      URL.revokeObjectURL(url);
    }, 400);
  });
}

interface Props {
  netoEfectivo: number;
}

export default function ContadorBilletes({ netoEfectivo }: Props) {
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCantidades(JSON.parse(saved));
    } catch {}
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cantidades));
  }, [cantidades, listo]);

  const setCantidad = (valor: number, raw: string) => {
    setCantidades(prev => ({ ...prev, [valor]: raw }));
  };

  const limpiar = () => {
    setCantidades({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const totalContado = DENOMINACIONES.reduce((sum, d) => {
    const n = parseInt(cantidades[d.valor] ?? '0', 10);
    return sum + (isNaN(n) || n < 0 ? 0 : n * d.valor);
  }, 0);

  const diferencia = totalContado - netoEfectivo;
  const coincide = Math.abs(diferencia) < 1;
  const sobran = diferencia > 0;

  const imprimir = () => {
    const html = generarHTMLArqueo(cantidades, netoEfectivo, totalContado, diferencia);
    abrirVentanaImpresion(html);
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Banknote size={20} className="text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">Contador de billetes</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={imprimir}
            disabled={totalContado === 0}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Printer size={12} />
            Imprimir
          </button>
          <button
            onClick={limpiar}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 size={12} />
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

        {/* Encabezado */}
        <div className="grid grid-cols-3 px-5 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Billete</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-center">Cantidad</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-right">Subtotal</span>
        </div>

        {/* Filas */}
        <div className="divide-y divide-gray-100">
          {DENOMINACIONES.map((d, idx) => {
            const raw = cantidades[d.valor] ?? '';
            const n = parseInt(raw || '0', 10);
            const subtotal = isNaN(n) || n < 0 ? 0 : n * d.valor;

            return (
              <div key={d.valor} className="grid grid-cols-3 items-center px-5 py-3 hover:bg-gray-50 transition-colors">

                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${d.dot}`} />
                  <span className={`font-bold text-sm tabular-nums ${d.color}`}>{d.label}</span>
                </div>

                <div className="flex justify-center">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={raw}
                    onChange={e => setCantidad(d.valor, e.target.value)}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    tabIndex={idx + 1}
                    className={`w-20 text-center bg-gray-50 border ${d.border} rounded-lg px-2 py-1.5 text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums`}
                  />
                </div>

                <div className="text-right">
                  <span className={`text-sm font-semibold tabular-nums ${subtotal > 0 ? d.color : 'text-gray-300'}`}>
                    {subtotal > 0 ? fmt(subtotal) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total contado</span>
          <span className="text-2xl font-extrabold text-gray-900 tabular-nums">{fmt(totalContado)}</span>
        </div>
      </div>

      {/* Comparación */}
      <div className={`rounded-2xl border p-5 space-y-3 shadow-sm ${
        coincide ? 'bg-emerald-50 border-emerald-200'
        : sobran  ? 'bg-amber-50 border-amber-200'
        :           'bg-red-50 border-red-200'
      }`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${
          coincide ? 'text-emerald-700' : sobran ? 'text-amber-700' : 'text-red-700'
        }`}>
          Comparación con caja
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Billetes contados</span>
            <span className="text-gray-900 font-semibold tabular-nums">{fmt(totalContado)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Neto esperado en caja</span>
            <span className="text-emerald-700 font-semibold tabular-nums">{fmt(netoEfectivo)}</span>
          </div>
          <div className={`flex items-center justify-between border-t pt-2 font-bold ${
            coincide ? 'border-emerald-200' : sobran ? 'border-amber-200' : 'border-red-200'
          }`}>
            <span className={coincide ? 'text-emerald-700' : sobran ? 'text-amber-700' : 'text-red-700'}>
              {coincide ? '✓ Cuadra perfecto' : sobran ? 'Sobran billetes' : 'Faltan billetes'}
            </span>
            <span className={`tabular-nums text-lg ${
              coincide ? 'text-emerald-700' : sobran ? 'text-amber-700' : 'text-red-700'
            }`}>
              {coincide ? '—' : (sobran ? '+' : '') + fmt(diferencia)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
