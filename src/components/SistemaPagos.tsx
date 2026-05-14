'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { AlertCircle, CheckCircle, X, Printer, Receipt, FileText, Trash2 } from 'lucide-react';

const DENOMINACIONES = [
  { valor: 100,   label: '$100',    color: 'text-red-600'     },
  { valor: 200,   label: '$200',    color: 'text-orange-600'  },
  { valor: 500,   label: '$500',    color: 'text-violet-600'  },
  { valor: 1000,  label: '$1.000',  color: 'text-blue-600'    },
  { valor: 2000,  label: '$2.000',  color: 'text-emerald-600' },
  { valor: 10000, label: '$10.000', color: 'text-teal-600'    },
  { valor: 20000, label: '$20.000', color: 'text-pink-600'    },
] as const;

const CATEGORIAS_GASTOS = [
  'SUELDOS FIJOS', 'SUELDOS TEMPORALES', 'HORAS EXTRA', 'COMISIONES DE VENTA',
  'GASTOS EMPLEADOS', 'ROCIO PERSONAL', 'JULITO PERSONAL', 'JULIO PERSONAL', 'ELI PERSONAL', 'LEO',
  'DESAYUNO', 'ALMUERZO', 'LIMPIEZA', 'BOLSAS', 'COMBUSTIBLE', 'TAXI/UBER', 'SUPER', 'LIBRERIA',
  'MARKETING', 'SEGURIDAD', 'GASTOS EXTRA', 'PRODUCCION',
  'MANTENIMIENTO JURAMENTO', 'MANTENIMIENTO COLON', 'MANTENIMIENTO JUAN B JUSTO',
  'MANTENIMIENTO DE VEHICULOS', 'CASA', 'ALQUILER',
  'CUENTA GALICIA JULITO', 'CUENTA GALICIA ROCIO', 'CUENTA MERCADO PAGO',
  'TRANSFERENCIAS FINANCIERAS', 'CHEQUES FINANCIEROS', 'CHEQUES DE LEO FINANCISTA',
  'COSTOS FINANCIEROS', 'PAGO TARJETA', 'TARJETA', 'DEPOSITO EN CUENTA', 'FINANCIERA',
  'IMPUESTOS', 'MUNICIPALES', 'SERVICIOS', 'HONORARIOS', 'PUERTOS DE FRIO',
  'PAGO PROVEEDORES', 'FALTANTES',
];

const PAGO_MARKER = '[PAGO]';

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

interface PagoData {
  a: string;
  resp: string;
  billetes: Record<number, number>;
}

interface GastoPago {
  id: string;
  fecha: string;
  categoria: string;
  monto: number;
  notas: string;
  parsed: PagoData;
}

function parsePago(notas: string): PagoData | null {
  try {
    const parts = notas.split('||');
    if (parts[0] !== PAGO_MARKER || !parts[1]) return null;
    return JSON.parse(parts[1]);
  } catch {
    return null;
  }
}

function generarHTML(
  pagoData: PagoData,
  fecha: string,
  categoria: string,
  monto: number,
  numero: string
): string {
  const fechaFmt = (() => {
    try { return format(parseISO(fecha), 'dd/MM/yyyy'); } catch { return fecha.substring(0, 10); }
  })();

  const fillasBilletes = DENOMINACIONES
    .filter(d => (pagoData.billetes[d.valor] ?? 0) > 0)
    .map(d => {
      const qty = pagoData.billetes[d.valor];
      const sub = qty * d.valor;
      return `<tr>
        <td style="padding:2.5px 5px;border-bottom:1px solid #f0f0f0;">${d.label}</td>
        <td style="padding:2.5px 5px;border-bottom:1px solid #f0f0f0;text-align:center;">${qty}</td>
        <td style="padding:2.5px 5px;border-bottom:1px solid #f0f0f0;text-align:right;">${fmt(sub)}</td>
      </tr>`;
    }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante - Alenort</title>
  <style>
    @page{size:210mm 297mm;margin:0}
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:210mm}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111}

    .comprobante{
      width:194mm;height:84mm;
      margin:5mm 8mm;
      display:flex;flex-direction:column;
      overflow:hidden;
    }

    /* Cabecera */
    .hdr{display:flex;align-items:center;justify-content:space-between;padding-bottom:3px;margin-bottom:4px;border-bottom:2px solid #111;flex-shrink:0}
    .title{font-size:24px;font-weight:900;letter-spacing:8px;line-height:1}
    .subtitle{font-size:9px;font-weight:600;letter-spacing:3px;color:#666;margin-top:2px;text-transform:uppercase}
    .hdr-right{text-align:right;font-size:11px;color:#666;line-height:1.5}
    .hdr-right strong{color:#111;font-size:11px}

    /* Info: grilla 2 columnas */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px 14px;margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid #eee;flex-shrink:0}
    .row{display:flex;gap:4px;align-items:baseline}
    .lbl{color:#999;font-size:10px;white-space:nowrap;flex-shrink:0}
    .val{font-weight:700;font-size:11px;word-break:break-word}

    /* Tabla */
    .sec-title{font-size:8.5px;font-weight:700;color:#ccc;text-transform:uppercase;letter-spacing:2px;margin-bottom:2px;flex-shrink:0}
    table{width:100%;border-collapse:collapse;flex-shrink:1}
    th{font-size:9px;color:#bbb;text-transform:uppercase;letter-spacing:1px;padding:1.5px 5px;border-bottom:1px solid #ddd;text-align:left;font-weight:700}
    th:nth-child(2){text-align:center}th:nth-child(3){text-align:right}
    td{padding:1.5px 5px;border-bottom:1px solid #f5f5f5;font-size:11px}
    td:nth-child(2){text-align:center}
    td:nth-child(3){text-align:right;font-weight:600}
    .tot-row td{padding:4px 5px 2px;background:none;color:#111;font-weight:900;font-size:15px;border:none;border-top:2px solid #111}
    .tot-row td:last-child{text-align:right}

    /* Firmas */
    .firmas{display:flex;justify-content:space-between;padding-top:3px;border-top:1px solid #ddd;gap:14px;margin-top:auto;margin-bottom:5mm;flex-shrink:0}
    .firma{flex:1;text-align:center}
    .fline{border-bottom:1px solid #444;height:13px;margin-bottom:3px}
    .flbl{font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:1px}
  </style>
</head>
<body>
<div class="comprobante">
  <div class="hdr">
    <div class="hdr-left">
      <div class="title">ALENORT</div>
      <div class="subtitle">Comprobante de Pago</div>
    </div>
    <div class="hdr-right">
      <strong>N° ${numero}</strong><br>
      ${fechaFmt}
    </div>
  </div>

  <div class="info-grid">
    <div class="row"><span class="lbl">A:</span><span class="val">${pagoData.a}</span></div>
    <div class="row"><span class="lbl">Responsable:</span><span class="val">${pagoData.resp}</span></div>
    <div class="row"><span class="lbl">Categoría:</span><span class="val">${categoria}</span></div>
    <div class="row"><span class="lbl">Método:</span><span class="val">Efectivo</span></div>
    <div class="row"><span class="lbl">Fecha:</span><span class="val">${fechaFmt}</span></div>
  </div>

  <div class="sec-title">Detalle de billetes</div>
  <table>
    <thead><tr>
      <th>Billete</th><th>Cant.</th><th>Subtotal</th>
    </tr></thead>
    <tbody>
      ${fillasBilletes}
      <tr class="tot-row">
        <td colspan="2">TOTAL</td>
        <td>${fmt(monto)}</td>
      </tr>
    </tbody>
  </table>

  <div class="firmas">
    <div class="firma"><div class="fline"></div><div class="flbl">Entregado por</div></div>
    <div class="firma"><div class="fline"></div><div class="flbl">Recibido por — ${pagoData.a}</div></div>
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

export default function SistemaPagos() {
  const [receptor, setReceptor] = useState('');
  const [responsable, setResponsable] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fecha, setFecha] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [billetes, setBilletes] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [pagos, setPagos] = useState<GastoPago[]>([]);
  const [cargando, setCargando] = useState(true);

  const total = DENOMINACIONES.reduce((acc, d) => {
    const qty = parseInt(billetes[d.valor] || '0', 10);
    return acc + (isNaN(qty) || qty < 0 ? 0 : qty * d.valor);
  }, 0);

  const cargarPagos = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase
      .from('gastos')
      .select('id, fecha, categoria, monto, notas')
      .ilike('notas', `${PAGO_MARKER}%`)
      .order('fecha', { ascending: false })
      .limit(100);
    if (data) {
      const parsed = data
        .map(g => {
          const p = parsePago(g.notas);
          return p ? ({ ...g, parsed: p } as GastoPago) : null;
        })
        .filter(Boolean) as GastoPago[];
      setPagos(parsed);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarPagos();
    const ch = supabase
      .channel('pagos-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, cargarPagos)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cargarPagos]);

  const showToast = (tipo: 'ok' | 'err', msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const setBillete = (valor: number, qty: string) =>
    setBilletes(p => ({ ...p, [valor]: qty.replace(/\D/g, '') }));

  const billetesNumericos = (): Record<number, number> => {
    const r: Record<number, number> = {};
    DENOMINACIONES.forEach(d => {
      const qty = parseInt(billetes[d.valor] || '0', 10);
      if (qty > 0) r[d.valor] = qty;
    });
    return r;
  };

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!receptor.trim()) e.receptor = 'Indicá a quién se le paga';
    if (!responsable.trim()) e.responsable = 'Indicá el responsable';
    if (!categoria) e.categoria = 'Seleccioná una categoría';
    if (total <= 0) e.total = 'Ingresá al menos un billete';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const limpiar = () => {
    setReceptor(''); setResponsable(''); setCategoria('');
    setFecha(format(new Date(), 'yyyy-MM-dd'));
    setBilletes({}); setErrores({});
  };

  const guardar = async () => {
    if (!validar()) return;
    const pagoData: PagoData = { a: receptor.trim(), resp: responsable.trim(), billetes: billetesNumericos() };
    const notas = `${PAGO_MARKER}||${JSON.stringify(pagoData)}`;
    setGuardando(true);
    const { error } = await supabase.from('gastos').insert({
      categoria,
      monto: total,
      metodo_pago: 'Efectivo',
      notas,
      fecha: new Date(fecha + 'T12:00:00').toISOString(),
    });
    setGuardando(false);
    if (!error) {
      showToast('ok', `Pago a ${receptor.trim()} registrado`);
      limpiar();
      cargarPagos();
    } else {
      showToast('err', `Error: ${error.message}`);
    }
  };

  const imprimirPago = (pago: GastoPago) => {
    const num = pago.id.substring(0, 8).toUpperCase();
    abrirVentanaImpresion(generarHTML(pago.parsed, pago.fecha, pago.categoria, pago.monto, num));
  };

  const imprimirActual = () => {
    if (!validar()) return;
    const num = Math.random().toString(36).substring(2, 10).toUpperCase();
    const pagoData: PagoData = { a: receptor.trim(), resp: responsable.trim(), billetes: billetesNumericos() };
    abrirVentanaImpresion(generarHTML(pagoData, fecha + 'T12:00:00.000Z', categoria || '—', total, num));
  };

  const eliminarPago = async (id: string) => {
    if (!confirm('¿Eliminar este pago del registro?')) return;
    await supabase.from('gastos').delete().eq('id', id);
    cargarPagos();
  };

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium ${toast.tipo === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.tipo === 'ok' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100"><X size={15} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── FORMULARIO ── */}
        <div className="space-y-4">

          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 rounded-xl bg-violet-100">
              <Receipt size={22} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registrar Pago</h2>
              <p className="text-xs text-gray-500 mt-0.5">Se imputará como egreso y queda con comprobante imprimible</p>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 shadow-sm">

            {/* A quién */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                A quién se paga <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nombre de la persona o empresa"
                value={receptor}
                onChange={e => { setReceptor(e.target.value); setErrores(p => ({ ...p, receptor: '' })); }}
                className={`w-full p-3 bg-gray-50 border rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 transition-colors ${errores.receptor ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500 hover:border-gray-400'}`}
              />
              {errores.receptor && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{errores.receptor}</p>}
            </div>

            {/* Responsable */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Responsable del dinero <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Quién se hace cargo de este pago"
                value={responsable}
                onChange={e => { setResponsable(e.target.value); setErrores(p => ({ ...p, responsable: '' })); }}
                className={`w-full p-3 bg-gray-50 border rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 transition-colors ${errores.responsable ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500 hover:border-gray-400'}`}
              />
              {errores.responsable && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{errores.responsable}</p>}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Categoría de egreso <span className="text-red-500">*</span>
              </label>
              <select
                value={categoria}
                onChange={e => { setCategoria(e.target.value); setErrores(p => ({ ...p, categoria: '' })); }}
                className={`w-full p-3 bg-gray-50 border rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 transition-colors ${errores.categoria ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-violet-500 hover:border-gray-400'}`}
              >
                <option value="">— Seleccioná una categoría —</option>
                {CATEGORIAS_GASTOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errores.categoria && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{errores.categoria}</p>}
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-gray-400 transition-colors"
              />
            </div>

            {/* Detalle de billetes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Detalle de billetes <span className="text-red-500">*</span>
              </label>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

                {/* Encabezado */}
                <div className="grid grid-cols-3 px-5 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Billete</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-center">Cantidad</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-right">Subtotal</span>
                </div>

                {/* Filas */}
                <div className="divide-y divide-gray-100">
                  {DENOMINACIONES.map((d, idx) => {
                    const raw = billetes[d.valor] ?? '';
                    const qty = parseInt(raw || '0', 10);
                    const subtotal = isNaN(qty) || qty < 0 ? 0 : qty * d.valor;
                    return (
                      <div key={d.valor} className="grid grid-cols-3 items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                        <span className={`font-bold text-sm tabular-nums ${d.color}`}>{d.label}</span>
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={raw}
                            onChange={e => setBillete(d.valor, e.target.value)}
                            onFocus={e => e.target.select()}
                            placeholder="0"
                            tabIndex={idx + 1}
                            className="w-20 text-center bg-gray-50 border border-gray-300 rounded-lg px-2 py-1.5 text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 tabular-nums"
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
                <div className="px-5 py-4 bg-gray-50 border-t-2 border-gray-900 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total a pagar</span>
                  <span className={`text-3xl font-black tabular-nums ${total > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                    {fmt(total)}
                  </span>
                </div>
              </div>
              {errores.total && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{errores.total}</p>}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={guardar}
                disabled={guardando}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all shadow-md ${guardando ? 'bg-gray-300 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 active:scale-95'}`}
              >
                <Receipt size={18} />
                {guardando ? 'Guardando...' : 'Registrar Pago'}
              </button>
              <button
                onClick={imprimirActual}
                disabled={total === 0}
                title="Vista previa e imprimir (sin guardar)"
                className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <Printer size={16} />
                <span className="text-xs">Preview</span>
              </button>
              <button
                onClick={limpiar}
                disabled={guardando}
                className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-colors text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* ── REGISTRO ── */}
        <div className="space-y-4">

          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 rounded-xl bg-gray-100">
              <FileText size={22} className="text-gray-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registro de Pagos</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {cargando ? 'Cargando...' : `${pagos.length} pago${pagos.length !== 1 ? 's' : ''} registrado${pagos.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {cargando ? (
              <p className="text-center py-12 text-gray-400 text-sm">Cargando pagos...</p>
            ) : pagos.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">No hay pagos registrados aún</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {pagos.map(pago => {
                  const fechaFmt = (() => {
                    try { return format(parseISO(pago.fecha), 'dd/MM/yyyy'); } catch { return pago.fecha.substring(0, 10); }
                  })();
                  return (
                    <div key={pago.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className="text-xs text-gray-400 font-medium">{fechaFmt}</span>
                            <span className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full font-medium truncate max-w-[180px]">
                              {pago.categoria}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900 text-sm">A: {pago.parsed.a}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Resp: {pago.parsed.resp}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {Object.entries(pago.parsed.billetes)
                              .map(([val, qty]) => `${qty}×$${Number(val).toLocaleString('es-AR')}`)
                              .join(' · ')}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          <span className="font-bold text-violet-700 tabular-nums text-base">{fmt(pago.monto)}</span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => imprimirPago(pago)}
                              className="p-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-600 transition-colors"
                              title="Imprimir comprobante"
                            >
                              <Printer size={13} />
                            </button>
                            <button
                              onClick={() => eliminarPago(pago.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
