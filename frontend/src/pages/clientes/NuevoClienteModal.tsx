import { useState, useEffect } from 'react';
import { useCatalogo } from '../../hooks/useCatalogo';
import { crearCliente, type CrearClasificacionPayload, type CrearSubcuentaPayload } from '../../api/clientes';

interface Props {
  onClose: () => void;
  onCreado: () => void;
}

interface SubcuentaRow {
  nombre: string;
  clasificacionTempId: string;
}

interface ClasificacionRow {
  tempId: string;
  nombre: string;
}

export default function NuevoClienteModal({ onClose, onCreado }: Props) {
  const { items: estados } = useCatalogo('estados-cliente');

  const [nombre, setNombre]         = useState('');
  const [estadoId, setEstadoId]     = useState('');
  const [contacto, setContacto]     = useState('');
  const [email, setEmail]           = useState('');
  const [telefono, setTelefono]     = useState('');
  const [descripcion, setDesc]      = useState('');

  const [clasifs, setClasifs]       = useState<ClasificacionRow[]>([]);
  const [newClasif, setNewClasif]   = useState('');
  const [addingClasif, setAddingClasif] = useState(false);

  const [subcuentas, setSubcuentas] = useState<SubcuentaRow[]>([]);

  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!estadoId && estados.length > 0) {
      const activo = estados.find(e => e.codigo === 'activo');
      if (activo) setEstadoId(String(activo.id));
    }
  }, [estados]);

  // ── Clasificaciones ──────────────────────────────────────────────

  const agregarClasif = () => {
    const n = newClasif.trim();
    if (!n || clasifs.some(c => c.nombre === n)) return;
    const tempId = crypto.randomUUID().slice(0, 8);
    setClasifs(prev => [...prev, { tempId, nombre: n }]);
    setNewClasif('');
    setAddingClasif(false);
  };

  const quitarClasif = (tempId: string) => {
    setClasifs(prev => prev.filter(c => c.tempId !== tempId));
    setSubcuentas(prev => prev.map(s =>
      s.clasificacionTempId === tempId ? { ...s, clasificacionTempId: '' } : s
    ));
  };

  // ── Subcuentas ───────────────────────────────────────────────────

  const agregarSubcuenta = () =>
    setSubcuentas(prev => [...prev, { nombre: '', clasificacionTempId: '' }]);

  const actualizarSubcuenta = (i: number, patch: Partial<SubcuentaRow>) =>
    setSubcuentas(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  const quitarSubcuenta = (i: number) =>
    setSubcuentas(prev => prev.filter((_, idx) => idx !== i));

  // ── Guardar ──────────────────────────────────────────────────────

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    if (!estadoId)      { setError('Seleccione un estado'); return; }

    setError('');
    setLoading(true);
    try {
      await crearCliente({
        nombre: nombre.trim(),
        estadoId: Number(estadoId),
        contacto: contacto || undefined,
        email: email || undefined,
        telefono: telefono || undefined,
        descripcion: descripcion || undefined,
        clasificaciones: clasifs.map<CrearClasificacionPayload>(c => ({
          tempId: c.tempId,
          nombre: c.nombre,
        })),
        subcuentas: subcuentas
          .filter(s => s.nombre.trim())
          .map<CrearSubcuentaPayload>(s => ({
            nombre: s.nombre.trim(),
            clasificacionTempId: s.clasificacionTempId || undefined,
          })),
      });
      onCreado();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') onClose(); }}>
      <div className="modal">
        {/* Header */}
        <div className="modal-head">
          <i className="fa-solid fa-user-plus" style={{ color: 'var(--primary)' }}></i>
          <div className="modal-title">Nuevo cliente</div>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <div className="field-row">
            <div className="field">
              <label>Nombre <span className="req">*</span></label>
              <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus placeholder="" />
            </div>
            <div className="field">
              <label>Estado</label>
              <select className="select" value={estadoId} onChange={e => setEstadoId(e.target.value)}>
                {estados.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Nombre de contacto</label>
              <input className="input" value={contacto} onChange={e => setContacto(e.target.value)} placeholder="" />
            </div>
            <div className="field">
              <label>Email de contacto</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="" />
            </div>
          </div>

          <div className="field">
            <label>Teléfono de contacto</label>
            <input className="input" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="" />
          </div>

          <div className="field">
            <label>Descripción</label>
            <textarea className="textarea" value={descripcion} onChange={e => setDesc(e.target.value)} placeholder="" />
          </div>

          {/* Clasificaciones */}
          <div className="cm-panel">
            <div className="cm-panel-title">Clasificaciones</div>
            <div className="cm-panel-sub">Defina las clasificaciones que tendrá este cliente. Luego puedes asignarlas a las subcuentas.</div>
            <div className="cm-clasif-row">
              {clasifs.map(c => (
                <span key={c.tempId} className="cm-clasif-chip">
                  {c.nombre}
                  <button type="button" onClick={() => quitarClasif(c.tempId)} title="Quitar">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </span>
              ))}
              {addingClasif ? (
                <input
                  className="input cm-clasif-input"
                  autoFocus
                  value={newClasif}
                  onChange={e => setNewClasif(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); agregarClasif(); }
                    if (e.key === 'Escape') { setNewClasif(''); setAddingClasif(false); }
                  }}
                  onBlur={() => { agregarClasif(); setAddingClasif(false); }}
                  placeholder="Nombre de clasificación"
                />
              ) : (
                <button type="button" className="cm-add-dashed cm-add-dashed-sm" onClick={() => setAddingClasif(true)}>
                  <i className="fa-solid fa-plus"></i> Agregar clasificación
                </button>
              )}
            </div>
          </div>

          {/* Subcuentas */}
          <div className="cm-panel">
            <div className="cm-panel-title">Subcuentas</div>
            <div className="cm-panel-sub">Agregue las subcuentas del cliente y seleccione la clasificación que corresponde.</div>
            {subcuentas.length > 0 && (
              <div className="cm-sub-grid">
                <div className="cm-sub-grid-head">
                  <span>Nombre subcuenta</span>
                  <span>Clasificación</span>
                  <span></span>
                </div>
                {subcuentas.map((s, i) => (
                  <div className="cm-sub-grid-row" key={i}>
                    <input
                      className="input"
                      placeholder={`Subcuenta ${i + 1}`}
                      value={s.nombre}
                      onChange={e => actualizarSubcuenta(i, { nombre: e.target.value })}
                    />
                    <select
                      className="select cm-sub-grid-select"
                      value={s.clasificacionTempId}
                      onChange={e => actualizarSubcuenta(i, { clasificacionTempId: e.target.value })}
                    >
                      <option value="">Sin clasificación</option>
                      {clasifs.map(c => (
                        <option key={c.tempId} value={c.tempId}>{c.nombre}</option>
                      ))}
                    </select>
                    <button className="cm-sub-grid-del" type="button" title="Quitar" onClick={() => quitarSubcuenta(i)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" className="cm-add-dashed" onClick={agregarSubcuenta}>
              <i className="fa-solid fa-plus"></i> Agregar subcuenta
            </button>
          </div>
        </div>

        {/* Footer */}
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
