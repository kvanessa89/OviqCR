import { useState } from 'react';
import { actualizarUsuario } from '../../api/usuarios';
import { useCatalogo } from '../../hooks/useCatalogo';
import type { UsuarioDto } from '../../types';

interface Props {
  usuario: UsuarioDto;
  esUsuarioActual?: boolean;
  onClose: () => void;
  onActualizado: () => void;
}

export default function EditarUsuarioModal({ usuario, esUsuarioActual = false, onClose, onActualizado }: Props) {
  const { items: formasPago } = useCatalogo('formas-pago');

  const [nombre, setNombre]         = useState(usuario.nombre);
  const [email, setEmail]           = useState(usuario.email);
  const [rol, setRol]               = useState<'Administrador' | 'Trabajador'>(usuario.rol as 'Administrador' | 'Trabajador');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [activo, setActivo]         = useState(usuario.activo);
  const [cargo, setCargo]           = useState(usuario.perfilTrabajador?.cargo || '');
  const [emailContacto, setEmailC]  = useState(usuario.perfilTrabajador?.emailContacto || '');
  const [telefono, setTelefono]     = useState(usuario.perfilTrabajador?.telefono || '');
  const [formaPagoId, setFormaPago] = useState(String(usuario.perfilTrabajador?.formaPagoId || ''));
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const esTrabajador = rol === 'Trabajador';

  const handleGuardar = async () => {
    if (!nombre.trim())                   { setError('El nombre es requerido'); return; }
    if (!email.trim())                    { setError('El email es requerido'); return; }
    if (password && password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (esTrabajador && !cargo)           { setError('Seleccione el cargo del trabajador'); return; }
    if (esTrabajador && !formaPagoId)     { setError('Seleccione la modalidad del trabajador'); return; }

    setError('');
    setLoading(true);
    try {
      await actualizarUsuario(usuario.id, {
        nombre:  nombre.trim(),
        email:   email.trim(),
        rol,
        activo:  esUsuarioActual ? true : activo,
        password: password || undefined,
        perfilTrabajador: esTrabajador && cargo && formaPagoId ? {
          formaPagoId: Number(formaPagoId),
          cargo,
          emailContacto: emailContacto.trim() || undefined,
          telefono:      telefono.trim() || undefined,
        } : undefined,
      });
      onActualizado();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <i className="fa-solid fa-user-pen" style={{ color: 'var(--primary)' }}></i>
          <div className="modal-title">Editar usuario</div>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <div className="field">
            <label>Nombre completo <span className="req">*</span></label>
            <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Email de acceso <span className="req">*</span></label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Rol <span className="req">*</span></label>
              {esUsuarioActual ? (
                <>
                  <input className="input" value={rol} readOnly style={{ background: 'var(--bg-2)', color: 'var(--text-3)', cursor: 'default' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>No puedes cambiar tu propio rol.</div>
                </>
              ) : (
                <select className="select" value={rol} onChange={e => setRol(e.target.value as 'Administrador' | 'Trabajador')}>
                  <option value="Administrador">Administrador</option>
                  <option value="Trabajador">Trabajador</option>
                </select>
              )}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Contraseña <span className="req">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                >
                  <i className={`fa-regular ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Dejar en blanco para no cambiar.</div>
            </div>
            <div className="field">
              <label>Estado <span className="req">*</span></label>
              {esUsuarioActual ? (
                <>
                  <input className="input" value="Activo" readOnly style={{ background: 'var(--bg-2)', color: 'var(--text-3)', cursor: 'default' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>No puedes desactivar tu propio usuario.</div>
                </>
              ) : (
                <select className="select" value={activo ? 'true' : 'false'} onChange={e => setActivo(e.target.value === 'true')}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              )}
            </div>
          </div>

          {esTrabajador && (
            <div className="cm-panel">
              <div className="cm-panel-title">Perfil del trabajador</div>
              <div className="cm-panel-sub">Cargo y datos de contacto.</div>

              <div className="field-row" style={{ marginTop: 12 }}>
                <div className="field">
                  <label>Cargo <span className="req">*</span></label>
                  <select className="select" value={cargo} onChange={e => setCargo(e.target.value)}>
                    <option value="">...</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Tecnico">Técnico</option>
                  </select>
                </div>
                <div className="field">
                  <label>Teléfono</label>
                  <input className="input" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="8888-8888" />
                </div>
              </div>

              <div className="field-row" style={{ marginTop: 0 }}>
                <div className="field">
                  <label>Email de contacto</label>
                  <input className="input" type="email" value={emailContacto} onChange={e => setEmailC(e.target.value)} placeholder="contacto@ejemplo.com" />
                </div>
                <div className="field">
                  <label>Modalidad <span className="req">*</span></label>
                  <select className="select" value={formaPagoId} onChange={e => setFormaPago(e.target.value)}>
                    <option value="">Seleccione...</option>
                    {formasPago.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleGuardar} disabled={loading}>
            {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</> : <><i className="fa-solid fa-floppy-disk"></i> Guardar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
