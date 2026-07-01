import { useState, useEffect } from 'react';
import { useCatalogo } from '../../hooks/useCatalogo';
import {
  actualizarCliente,
  agregarClasificacion, renombrarClasificacion, eliminarClasificacion,
  agregarSubcuenta, actualizarSubcuenta, eliminarSubcuenta,
} from '../../api/clientes';
import type { ClienteDto, ClasificacionDto, SubcuentaDto } from '../../types';

interface Props {
  cliente: ClienteDto;
  onClose: () => void;
  onGuardado: () => void;
}

export default function EditarClienteModal({ cliente, onClose, onGuardado }: Props) {
  const { items: estados } = useCatalogo('estados-cliente');

  // ── Datos básicos ────────────────────────────────────────────────────
  const [nombre, setNombre]       = useState(cliente.nombre);
  const [estadoId, setEstadoId]   = useState(String(cliente.estadoId));
  const [contacto, setContacto]   = useState(cliente.contacto ?? '');
  const [email, setEmail]         = useState(cliente.email ?? '');
  const [telefono, setTelefono]   = useState(cliente.telefono ?? '');
  const [descripcion, setDesc]    = useState(cliente.descripcion ?? '');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!estadoId && estados.length > 0) {
      const match = estados.find(e => e.id === cliente.estadoId);
      if (match) setEstadoId(String(match.id));
    }
  }, [estados]);

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    if (!estadoId)      { setError('Seleccione un estado'); return; }
    setError('');
    setLoading(true);
    try {
      // Auto-confirmar subcuenta en edición si quedó pendiente
      if (editingSubId !== null && editingSubNombre.trim()) {
        await actualizarSubcuenta(cliente.id, editingSubId, {
          nombre: editingSubNombre.trim(),
          clasificacionId: editingSubClasifId ? Number(editingSubClasifId) : undefined,
        });
        const cn = clasifs.find(c => c.id === Number(editingSubClasifId))?.nombre;
        setSubs(prev => prev.map(s => s.id === editingSubId
          ? { ...s, nombre: editingSubNombre.trim(), clasificacionId: editingSubClasifId ? Number(editingSubClasifId) : undefined, clasificacionNombre: cn }
          : s
        ));
        setEditingSubId(null);
      }
      // Auto-confirmar subcuenta nueva si quedó pendiente
      if (addingSub && newSubNombre.trim()) {
        const nueva = await agregarSubcuenta(cliente.id, {
          nombre: newSubNombre.trim(),
          clasificacionId: newSubClasifId ? Number(newSubClasifId) : undefined,
        });
        setSubs(prev => [...prev, nueva]);
        setAddingSub(false);
        setNewSubNombre('');
        setNewSubClasifId('');
      }

      await actualizarCliente(cliente.id, {
        nombre: nombre.trim(),
        estadoId: Number(estadoId),
        contacto: contacto || undefined,
        email: email || undefined,
        telefono: telefono || undefined,
        descripcion: descripcion || undefined,
      });
      onGuardado();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  // ── Clasificaciones ──────────────────────────────────────────────────
  const [clasifs, setClasifs] = useState<ClasificacionDto[]>(cliente.clasificaciones);
  const [addingClasif, setAddingClasif] = useState(false);
  const [newClasif, setNewClasif] = useState('');
  const [editingClasifId, setEditingClasifId] = useState<number | null>(null);
  const [editingClasifNombre, setEditingClasifNombre] = useState('');
  const [clasifError, setClasifError] = useState('');

  const handleAgregarClasif = async () => {
    const n = newClasif.trim();
    if (!n) return;
    setClasifError('');
    try {
      const nueva = await agregarClasificacion(cliente.id, n);
      setClasifs(prev => [...prev, nueva]);
      setNewClasif('');
      setAddingClasif(false);
    } catch (err: any) {
      setClasifError(err.response?.data?.mensaje || 'Error al agregar clasificación');
    }
  };

  const handleRenombrarClasif = async (id: number) => {
    const n = editingClasifNombre.trim();
    if (!n) { setEditingClasifId(null); return; }
    setClasifError('');
    try {
      await renombrarClasificacion(cliente.id, id, n);
      setClasifs(prev => prev.map(c => c.id === id ? { ...c, nombre: n } : c));
      setEditingClasifId(null);
    } catch (err: any) {
      setClasifError(err.response?.data?.mensaje || 'Error al renombrar');
    }
  };

  const handleEliminarClasif = async (id: number) => {
    setClasifError('');
    try {
      await eliminarClasificacion(cliente.id, id);
      setClasifs(prev => prev.filter(c => c.id !== id));
      setSubs(prev => prev.map(s => s.clasificacionId === id ? { ...s, clasificacionId: undefined, clasificacionNombre: undefined } : s));
    } catch (err: any) {
      setClasifError(err.response?.data?.mensaje || 'Error al eliminar');
    }
  };

  // ── Subcuentas ───────────────────────────────────────────────────────
  const [subs, setSubs] = useState<SubcuentaDto[]>(cliente.subcuentas);
  const [addingSub, setAddingSub] = useState(false);
  const [newSubNombre, setNewSubNombre] = useState('');
  const [newSubClasifId, setNewSubClasifId] = useState('');
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editingSubNombre, setEditingSubNombre] = useState('');
  const [editingSubClasifId, setEditingSubClasifId] = useState('');
  const [subError, setSubError] = useState('');

  const handleAgregarSub = async () => {
    const n = newSubNombre.trim();
    if (!n) return;
    setSubError('');
    try {
      const nueva = await agregarSubcuenta(cliente.id, {
        nombre: n,
        clasificacionId: newSubClasifId ? Number(newSubClasifId) : undefined,
      });
      setSubs(prev => [...prev, nueva]);
      setNewSubNombre('');
      setNewSubClasifId('');
      setAddingSub(false);
    } catch (err: any) {
      setSubError(err.response?.data?.mensaje || 'Error al agregar subcuenta');
    }
  };

  const startEditSub = (sub: SubcuentaDto) => {
    setEditingSubId(sub.id);
    setEditingSubNombre(sub.nombre);
    setEditingSubClasifId(sub.clasificacionId ? String(sub.clasificacionId) : '');
  };

  const handleActualizarSub = async (id: number) => {
    const n = editingSubNombre.trim();
    if (!n) return;
    setSubError('');
    try {
      await actualizarSubcuenta(cliente.id, id, {
        nombre: n,
        clasificacionId: editingSubClasifId ? Number(editingSubClasifId) : undefined,
      });
      const clasifNombre = clasifs.find(c => c.id === Number(editingSubClasifId))?.nombre;
      setSubs(prev => prev.map(s => s.id === id
        ? { ...s, nombre: n, clasificacionId: editingSubClasifId ? Number(editingSubClasifId) : undefined, clasificacionNombre: clasifNombre }
        : s
      ));
      setEditingSubId(null);
    } catch (err: any) {
      setSubError(err.response?.data?.mensaje || 'Error al actualizar subcuenta');
    }
  };

  const handleEliminarSub = async (id: number) => {
    setSubError('');
    try {
      await eliminarSubcuenta(cliente.id, id);
      setSubs(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setSubError(err.response?.data?.mensaje || 'Error al eliminar subcuenta');
    }
  };

  return (
    <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') onClose(); }}>
      <div className="modal wide">
        <div className="modal-head">
          <i className="fa-solid fa-pen" style={{ color: 'var(--primary)' }}></i>
          <div className="modal-title">Editar cliente</div>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          {/* Datos básicos */}
          <div className="field-row">
            <div className="field">
              <label>Nombre <span className="req">*</span></label>
              <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label>Estado <span className="req">*</span></label>
              <select className="select" value={estadoId} onChange={e => setEstadoId(e.target.value)}>
                {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Nombre de contacto</label>
              <input className="input" value={contacto} onChange={e => setContacto(e.target.value)} />
            </div>
            <div className="field">
              <label>Email de contacto</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Teléfono de contacto</label>
            <input className="input" value={telefono} onChange={e => setTelefono(e.target.value)} />
          </div>
          <div className="field">
            <label>Descripción</label>
            <textarea className="textarea" value={descripcion} onChange={e => setDesc(e.target.value)} />
          </div>

          {/* Clasificaciones */}
          <div className="cm-panel">
            <div className="cm-panel-title">Clasificaciones</div>
            <div className="cm-panel-sub">Agrupan las subcuentas visualmente.</div>

            {clasifError && (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{clasifError}</div>
            )}

            <div className="cm-clasif-row" style={{ marginTop: 10 }}>
              {clasifs.map(c => (
                editingClasifId === c.id ? (
                  <input
                    key={c.id}
                    className="input cm-clasif-input"
                    autoFocus
                    value={editingClasifNombre}
                    onChange={e => setEditingClasifNombre(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleRenombrarClasif(c.id); }
                      if (e.key === 'Escape') setEditingClasifId(null);
                    }}
                    onBlur={() => handleRenombrarClasif(c.id)}
                  />
                ) : (
                  <span key={c.id} className="cm-clasif-chip">
                    {c.nombre}
                    <button type="button" title="Renombrar" onClick={() => { setEditingClasifId(c.id); setEditingClasifNombre(c.nombre); }}>
                      <i className="fa-solid fa-pen" style={{ fontSize: 9 }}></i>
                    </button>
                    <button type="button" title="Eliminar" onClick={() => handleEliminarClasif(c.id)}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </span>
                )
              ))}
              {addingClasif ? (
                <input
                  className="input cm-clasif-input"
                  autoFocus
                  value={newClasif}
                  onChange={e => setNewClasif(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAgregarClasif(); }
                    if (e.key === 'Escape') { setNewClasif(''); setAddingClasif(false); }
                  }}
                  onBlur={() => { handleAgregarClasif(); }}
                  placeholder="Nombre de clasificación"
                />
              ) : (
                <button type="button" className="cm-add-dashed cm-add-dashed-sm" onClick={() => setAddingClasif(true)}>
                  <i className="fa-solid fa-plus"></i> Agregar
                </button>
              )}
            </div>
          </div>

          {/* Subcuentas */}
          <div className="cm-panel">
            <div className="cm-panel-title">Subcuentas</div>
            <div className="cm-panel-sub">Entidades que facturan dentro del cliente.</div>

            {subError && (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{subError}</div>
            )}

            {subs.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {subs.map(s => (
                  editingSubId === s.id ? (
                    <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className="input"
                        style={{ flex: 1 }}
                        autoFocus
                        value={editingSubNombre}
                        onChange={e => setEditingSubNombre(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') setEditingSubId(null); }}
                        placeholder="Nombre de subcuenta"
                      />
                      {clasifs.length > 0 && (
                        <select className="select" style={{ flex: '0 0 auto', width: 160 }} value={editingSubClasifId} onChange={e => setEditingSubClasifId(e.target.value)}>
                          <option value="">Sin clasificación</option>
                          {clasifs.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                      )}
                      <button className="btn btn-primary btn-sm" onClick={() => handleActualizarSub(s.id)}>
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingSubId(null)}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ) : (
                    <div key={s.id} className="cm-sub-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="sub-dot" style={{ background: '#7F77DD', width: 7, height: 7, borderRadius: '50%', flexShrink: 0 }}></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{s.nombre}</div>
                        {s.clasificacionNombre && (
                          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{s.clasificacionNombre}</div>
                        )}
                      </div>
                      <button className="cc-menu" title="Editar" onClick={() => startEditSub(s)}>
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="cc-menu cc-menu-danger" title="Eliminar" onClick={() => handleEliminarSub(s.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  )
                ))}
              </div>
            )}

            {addingSub ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  autoFocus
                  value={newSubNombre}
                  onChange={e => setNewSubNombre(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setNewSubNombre(''); setNewSubClasifId(''); setAddingSub(false); } }}
                  placeholder="Nombre de subcuenta"
                />
                {clasifs.length > 0 && (
                  <select className="select" style={{ flex: '0 0 auto', width: 160 }} value={newSubClasifId} onChange={e => setNewSubClasifId(e.target.value)}>
                    <option value="">Sin clasificación</option>
                    {clasifs.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                )}
                <button className="btn btn-primary btn-sm" onClick={handleAgregarSub}>
                  <i className="fa-solid fa-check"></i>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setNewSubNombre(''); setNewSubClasifId(''); setAddingSub(false); }}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : (
              <button type="button" className="cm-add-dashed" style={{ marginTop: 10 }} onClick={() => setAddingSub(true)}>
                <i className="fa-solid fa-plus"></i> Agregar subcuenta
              </button>
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
