import { useState, useEffect, useRef } from 'react';
import { crearFactura, actualizarFactura, subirArchivoFactura } from '../../api/facturas';
import { getClientes } from '../../api/clientes';
import { getProyectos } from '../../api/proyectos';
import { useCatalogo } from '../../hooks/useCatalogo';
import type { ClienteDto, FacturaDto, ProyectoDto } from '../../types';

interface Props {
  factura?: FacturaDto;
  onClose: () => void;
  onGuardada: () => void;
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <div style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0, position: 'relative',
        background: value ? 'var(--primary)' : 'var(--border-strong)',
        transition: 'background 0.18s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16,
          borderRadius: '50%', background: '#fff', transition: 'left 0.18s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        }} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)' }}>{label}</span>
    </button>
  );
}

function fmtFecha(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function NuevaFacturaModal({ factura, onClose, onGuardada }: Props) {
  const editando = !!factura;
  const { items: estados } = useCatalogo('estados-factura');
  const { items: monedas } = useCatalogo('monedas');
  const [clientes, setClientes]   = useState<ClienteDto[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoDto[]>([]);

  const [numero, setNumero]           = useState(factura?.numero ?? '');
  const [clienteId, setClienteId]     = useState(factura ? String(factura.clienteId) : '');
  const [subcuentaId, setSubcuentaId] = useState(factura?.subcuentaId ? String(factura.subcuentaId) : '');
  const [proyectoId, setProyectoId]   = useState(factura ? String(factura.proyectoId) : '');
  const [monedaId, setMoneda]         = useState(factura ? String(factura.monedaId) : '');
  const [monto, setMonto]             = useState(factura ? String(factura.monto) : '');
  const [sinIva, setSinIva]           = useState(factura?.sinIva ?? false);
  const [fechaEmision, setFE]         = useState(factura ? factura.fechaEmision.slice(0, 10) : '');
  const [fechaEstimadaPago, setFEP]   = useState(factura ? factura.fechaEstimadaPago.slice(0, 10) : '');
  const [estadoId, setEstado]         = useState('');
  const [notas, setNotas]             = useState(factura?.notas ?? '');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [archivo, setArchivo]         = useState<File | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const bodyRef                       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [error]);

  useEffect(() => {
    Promise.all([getClientes(), getProyectos()]).then(([c, p]) => {
      setClientes(c);
      setProyectos(p);
    });
  }, []);

  // Pre-seleccionar estado al editar (mapea "vencida" → "emitida" porque es virtual)
  useEffect(() => {
    if (estados.length > 0 && !estadoId && editando) {
      const codigoReal = factura!.estaVencida ? 'emitida' : factura!.estadoCodigo;
      const actual = estados.find(e => e.codigo === codigoReal);
      if (actual) setEstado(String(actual.id));
    }
  }, [estados]);

  const clienteSeleccionado   = clientes.find(c => c.id === Number(clienteId));
  const subcuentasDisponibles = clienteSeleccionado?.subcuentas ?? [];
  const proyectosFiltrados = proyectos.filter(p => {
    if (!clienteId) return false;
    if (p.clienteId !== Number(clienteId)) return false;
    if (subcuentasDisponibles.length === 0) return true;
    if (subcuentaId) return p.subcuentaId === Number(subcuentaId);
    return !p.subcuentaId;
  });

  const handleClienteChange = (val: string) => {
    setClienteId(val);
    setSubcuentaId('');
    setProyectoId('');
  };

  const handleSubcuentaChange = (val: string) => {
    setSubcuentaId(val);
    setProyectoId('');
  };

  const handleGuardar = async () => {
    if (!numero.trim())                    { setError('El número de factura es requerido'); return; }
    if (!clienteId)                        { setError('Seleccione un cliente'); return; }
    if (!proyectoId)                       { setError('Seleccione un proyecto'); return; }
    if (!monedaId)                         { setError('Seleccione una moneda'); return; }
    if (!monto || Number(monto) <= 0)      { setError('El monto debe ser mayor a 0'); return; }
    if (!fechaEmision)                     { setError('La fecha de emisión es requerida'); return; }
    if (!fechaEstimadaPago)                { setError('La fecha estimada de pago es requerida'); return; }
    if (fechaEstimadaPago < fechaEmision)  { setError('La fecha estimada de pago debe ser igual o posterior a la de emisión'); return; }
    if (!estadoId)                         { setError('Seleccione un estado'); return; }

    setError('');
    setLoading(true);
    try {
      let facturaId: number;
      if (editando) {
        await actualizarFactura(factura!.id, {
          numero: numero.trim(),
          proyectoId: Number(proyectoId),
          subcuentaId: subcuentaId ? Number(subcuentaId) : undefined,
          monedaId: Number(monedaId),
          monto: Number(monto),
          sinIva,
          fechaEmision: fechaEmision + 'T00:00:00.000Z',
          fechaEstimadaPago: fechaEstimadaPago + 'T00:00:00.000Z',
          estadoId: Number(estadoId),
          notas: notas || undefined,
        });
        facturaId = factura!.id;
      } else {
        const nueva = await crearFactura({
          numero: numero.trim(),
          proyectoId: Number(proyectoId),
          subcuentaId: subcuentaId ? Number(subcuentaId) : undefined,
          monedaId: Number(monedaId),
          monto: Number(monto),
          sinIva,
          fechaEmision: fechaEmision + 'T00:00:00.000Z',
          fechaEstimadaPago: fechaEstimadaPago + 'T00:00:00.000Z',
          estadoId: Number(estadoId),
          notas: notas || undefined,
        });
        facturaId = nueva.id;
      }
      if (archivo) {
        await subirArchivoFactura(facturaId, archivo);
      }
      onGuardada();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al guardar la factura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') onClose(); }}>
      <div className="modal wide">
        <div className="modal-head">
          <i className={`fa-solid ${editando ? 'fa-pen' : 'fa-file-invoice-dollar'}`} style={{ color: 'var(--primary)' }}></i>
          <div className="modal-title">{editando ? `Editar factura · ${factura!.numero}` : 'Nueva factura'}</div>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="modal-body" ref={bodyRef}>
          {error && (
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          {/* Número + Estado */}
          <div className="field-row">
            <div className="field">
              <label>Número de factura <span className="req">*</span></label>
              <input className="input" value={numero} onChange={e => setNumero(e.target.value)} autoFocus placeholder="" />
            </div>
            <div className="field">
              <label>Estado <span className="req">*</span></label>
              <select className="select" value={estadoId} onChange={e => setEstado(e.target.value)}>
                <option value="">Seleccione...</option>
                {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div className="field">
            <label>Cliente <span className="req">*</span></label>
            <select className="select" value={clienteId} onChange={e => handleClienteChange(e.target.value)}>
              <option value="">Seleccione un cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Subcuenta — solo si el cliente tiene subcuentas */}
          {clienteId && subcuentasDisponibles.length > 0 && (
            <div className="field">
              <label>Subcuenta</label>
              <select className="select" value={subcuentaId} onChange={e => handleSubcuentaChange(e.target.value)}>
                <option value="">Sin subcuenta</option>
                {subcuentasDisponibles.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}{s.clasificacionNombre ? ` - ${s.clasificacionNombre}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Proyecto */}
          <div className="field">
            <label>Proyecto <span className="req">*</span></label>
            <select
              className="select"
              value={proyectoId}
              onChange={e => setProyectoId(e.target.value)}
              disabled={!clienteId}
            >
              <option value="">{clienteId ? 'Seleccione un proyecto...' : 'Primero seleccione un cliente'}</option>
              {proyectosFiltrados.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Monto + Moneda */}
          <div className="field-row">
            <div className="field">
              <label>Monto <span className="req">*</span></label>
              <input className="input" type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="field">
              <label>Moneda <span className="req">*</span></label>
              <select className="select" value={monedaId} onChange={e => setMoneda(e.target.value)}>
                <option value="">Seleccione...</option>
                {monedas.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>)}
              </select>
            </div>
          </div>

          {/* Sin IVA */}
          <div className="field" style={{ paddingTop: 2 }}>
            <Toggle value={sinIva} onChange={setSinIva} label="Sin IVA" />
            {sinIva && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, marginLeft: 46 }}>
                No se aplica el 13% de IVA a esta factura
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="field-row">
            <div className="field">
              <label>Fecha de emisión <span className="req">*</span></label>
              <input className="input" type="date" value={fechaEmision} onChange={e => setFE(e.target.value)} />
            </div>
            <div className="field">
              <label>Fecha estimada de pago <span className="req">*</span></label>
              <input className="input" type="date" value={fechaEstimadaPago} min={fechaEmision || undefined} onChange={e => setFEP(e.target.value)} />
            </div>
          </div>

          {/* Fecha de pago efectivo — solo visible al editar si ya fue pagada */}
          {editando && factura!.fechaPago && (
            <div className="field">
              <label style={{ color: 'var(--text-3)' }}>Fecha de pago efectivo</label>
              <div className="input" style={{ background: 'rgba(16,185,129,0.06)', color: '#047857', cursor: 'default', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: 13 }}></i>
                {fmtFecha(factura!.fechaPago)}
              </div>
            </div>
          )}

          {/* Archivo adjunto */}
          <div className="field">
            <label>Archivo adjunto (PDF, JPG, PNG)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={e => setArchivo(e.target.files?.[0] ?? null)}
            />
            {editando && factura!.archivoUrl && !archivo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={`https://localhost:7299${factura!.archivoUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}
                >
                  <i className="fa-solid fa-file-pdf"></i> Ver archivo actual
                </a>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: 12 }}
                >
                  Reemplazar
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed var(--border-strong)', borderRadius: 8, padding: '10px 14px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  color: archivo ? 'var(--text-1)' : 'var(--text-3)', fontSize: 13,
                  background: 'var(--surface-alt)',
                }}
              >
                <i className={`fa-solid ${archivo ? 'fa-file-circle-check' : 'fa-upload'}`} style={{ color: archivo ? 'var(--primary)' : undefined }}></i>
                {archivo ? archivo.name : 'Seleccionar archivo...'}
                {archivo && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setArchivo(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 14, lineHeight: 1 }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="field">
            <label>Notas</label>
            <textarea className="textarea" value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleGuardar} disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
              : <><i className="fa-solid fa-floppy-disk"></i> Guardar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
