import { useState, useEffect, useRef } from 'react';
import { actualizarProyecto } from '../../api/proyectos';
import { getCliente } from '../../api/clientes';
import { useCatalogo } from '../../hooks/useCatalogo';
import type { ProyectoDto, SubcuentaDto } from '../../types';

interface Props {
  proyecto: ProyectoDto;
  onClose: () => void;
  onGuardado: () => void;
}

export default function EditarProyectoModal({ proyecto, onClose, onGuardado }: Props) {
  const { items: estados } = useCatalogo('estados-proyecto');
  const { items: monedas } = useCatalogo('monedas');
  const [subcuentas, setSubcuentas] = useState<SubcuentaDto[]>([]);

  const [nombre, setNombre]           = useState(proyecto.nombre);
  const [estadoId, setEstadoId]       = useState('');
  const [subcuentaId, setSubcuentaId] = useState(proyecto.subcuentaId ? String(proyecto.subcuentaId) : '');
  const [fechaInicio, setFechaInicio] = useState(proyecto.fechaInicio?.slice(0, 10) ?? '');
  const [fechaFin, setFechaFin]       = useState(proyecto.fechaFin?.slice(0, 10) ?? '');
  const [descripcion, setDesc]        = useState(proyecto.descripcion ?? '');
  const [requiereFactura, setRequiereFactura] = useState(proyecto.requiereFactura);
  const [presupuestoInicial, setPresupuestoInicial] = useState(proyecto.presupuestoInicial != null ? String(proyecto.presupuestoInicial) : '');

  const [tieneOC, setTieneOC]         = useState(!!proyecto.ordenCompra);
  const [numeroOc, setNumeroOc]       = useState(proyecto.ordenCompra?.numeroOc ?? '');
  const [aQuienFacturar, setAQF]      = useState(proyecto.ordenCompra?.aQuienFacturar ?? '');
  const [detalle, setDetalle]         = useState(proyecto.ordenCompra?.detalle ?? '');
  const [montoTotal, setMonto]        = useState(proyecto.ordenCompra ? String(proyecto.ordenCompra.montoTotal) : '');
  const [monedaId, setMonedaId]       = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const bodyRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [error]);

  // Inicializar estadoId desde el codigo del proyecto
  useEffect(() => {
    if (estados.length > 0 && !estadoId) {
      const e = estados.find(e => e.codigo === proyecto.estadoCodigo);
      if (e) setEstadoId(String(e.id));
    }
  }, [estados]);

  // Inicializar monedaId desde el codigo de la OC
  useEffect(() => {
    if (monedas.length > 0 && !monedaId && proyecto.ordenCompra?.monedaCodigo) {
      const m = monedas.find(m => m.codigo === proyecto.ordenCompra!.monedaCodigo);
      if (m) setMonedaId(String(m.id));
    }
  }, [monedas]);

  // Cargar subcuentas del cliente
  useEffect(() => {
    getCliente(proyecto.clienteId)
      .then(c => setSubcuentas(c.subcuentas))
      .catch(() => setSubcuentas([]));
  }, [proyecto.clienteId]);

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError('El nombre del proyecto es requerido'); return; }
    if (!estadoId)      { setError('Seleccione un estado'); return; }
    if (tieneOC && !monedaId) { setError('Seleccione la moneda de la orden de compra'); return; }

    setError('');
    setLoading(true);
    try {
      await actualizarProyecto(proyecto.id, {
        nombre: nombre.trim(),
        subcuentaId: subcuentaId ? Number(subcuentaId) : undefined,
        estadoId: Number(estadoId),
        fechaInicio: fechaInicio ? fechaInicio + 'T00:00:00.000Z' : undefined,
        fechaFin: fechaFin ? fechaFin + 'T00:00:00.000Z' : undefined,
        descripcion: descripcion || undefined,
        requiereFactura,
        presupuestoInicial: presupuestoInicial ? Number(presupuestoInicial) : undefined,
        ordenCompra: tieneOC ? {
          numeroOc: numeroOc || undefined,
          aQuienFacturar: aQuienFacturar || undefined,
          detalle: detalle || undefined,
          montoTotal: Number(montoTotal) || 0,
          monedaId: Number(monedaId),
        } : undefined,
      });
      onGuardado();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') onClose(); }}>
      <div className="modal wide">
        <div className="modal-head">
          <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--primary)' }}></i>
          <div className="modal-title">Editar proyecto</div>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="modal-body" ref={bodyRef}>
          {error && (
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <div className="field">
            <label>Nombre <span className="req">*</span></label>
            <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Estado <span className="req">*</span></label>
              <select className="select" value={estadoId} onChange={e => setEstadoId(e.target.value)}>
                <option value="">Seleccione...</option>
                {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            {subcuentas.length > 0 && (
              <div className="field">
                <label>Subcuenta</label>
                <select className="select" value={subcuentaId} onChange={e => setSubcuentaId(e.target.value)}>
                  <option value="">Sin subcuenta</option>
                  {subcuentas.map(s => <option key={s.id} value={s.id}>{s.nombre}{s.clasificacionNombre ? ` (${s.clasificacionNombre})` : ''}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="field-row">
            <div className="field">
              <label>Fecha de inicio</label>
              <input className="input" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            </div>
            <div className="field">
              <label>Fecha estimada de fin</label>
              <input className="input" type="date" value={fechaFin} min={fechaInicio || undefined} onChange={e => setFechaFin(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Descripción</label>
            <textarea className="textarea" value={descripcion} onChange={e => setDesc(e.target.value)} />
          </div>

          <div className="field">
            <label>Presupuesto inicial</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Opcional"
              value={presupuestoInicial}
              onChange={e => setPresupuestoInicial(e.target.value)}
            />
          </div>

          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setRequiereFactura(v => !v)}
                style={{
                  width: 36, height: 20, borderRadius: 10, flexShrink: 0, position: 'relative', cursor: 'pointer',
                  background: requiereFactura ? 'var(--primary)' : 'var(--border-strong)',
                  transition: 'background 0.18s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, left: requiereFactura ? 18 : 2, width: 16, height: 16,
                  borderRadius: '50%', background: '#fff', transition: 'left 0.18s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                }} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)' }}>Requiere factura</span>
            </label>
          </div>

          <div className="cm-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div className="cm-panel-title" style={{ margin: 0 }}>Orden de compra</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', fontWeight: 500, cursor: 'pointer' }}>
                <input type="checkbox" checked={tieneOC} onChange={e => setTieneOC(e.target.checked)} />
                Incluir
              </label>
            </div>
            <div className="cm-panel-sub">Número de orden, monto y a quién se factura.</div>

            {tieneOC && (
              <>
                <div className="field-row" style={{ marginTop: 12 }}>
                  <div className="field">
                    <label>Número de OC</label>
                    <input className="input" value={numeroOc} onChange={e => setNumeroOc(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>A quién facturar</label>
                    <input className="input" value={aQuienFacturar} onChange={e => setAQF(e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Detalle de la orden</label>
                  <textarea className="textarea" value={detalle} onChange={e => setDetalle(e.target.value)} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Monto total</label>
                    <input className="input" type="number" value={montoTotal} onChange={e => setMonto(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Moneda</label>
                    <select className="select" value={monedaId} onChange={e => setMonedaId(e.target.value)}>
                      <option value="">Seleccione...</option>
                      {monedas.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleGuardar} disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
              : <><i className="fa-solid fa-floppy-disk"></i> Guardar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
