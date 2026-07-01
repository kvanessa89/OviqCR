import api from './client';
import type { ClienteDto } from '../types';

export const getClientes = async (): Promise<ClienteDto[]> => {
  const res = await api.get<ClienteDto[]>('/Clientes');
  return res.data;
};

export const getCliente = async (id: number): Promise<ClienteDto> => {
  const res = await api.get<ClienteDto>(`/Clientes/${id}`);
  return res.data;
};

export const crearCliente = async (dto: CrearClientePayload): Promise<ClienteDto> => {
  const res = await api.post<ClienteDto>('/Clientes', dto);
  return res.data;
};

export const actualizarCliente = async (id: number, dto: ActualizarClientePayload): Promise<void> => {
  await api.put(`/Clientes/${id}`, dto);
};

export const eliminarCliente = async (id: number): Promise<void> => {
  await api.delete(`/Clientes/${id}`);
};

// ── Clasificaciones ──────────────────────────────────────────────────────

export const agregarClasificacion = async (clienteId: number, nombre: string): Promise<ClasificacionPayload> => {
  const res = await api.post<ClasificacionPayload>(`/Clientes/${clienteId}/clasificaciones`, { nombre });
  return res.data;
};

export const renombrarClasificacion = async (clienteId: number, id: number, nombre: string): Promise<void> => {
  await api.put(`/Clientes/${clienteId}/clasificaciones/${id}`, { nombre });
};

export const eliminarClasificacion = async (clienteId: number, id: number): Promise<void> => {
  await api.delete(`/Clientes/${clienteId}/clasificaciones/${id}`);
};

// ── Subcuentas ───────────────────────────────────────────────────────────

export const agregarSubcuenta = async (clienteId: number, dto: { nombre: string; clasificacionId?: number }): Promise<SubcuentaPayload> => {
  const res = await api.post<SubcuentaPayload>(`/Clientes/${clienteId}/subcuentas`, dto);
  return res.data;
};

export const actualizarSubcuenta = async (clienteId: number, id: number, dto: { nombre: string; clasificacionId?: number }): Promise<void> => {
  await api.put(`/Clientes/${clienteId}/subcuentas/${id}`, dto);
};

export const eliminarSubcuenta = async (clienteId: number, id: number): Promise<void> => {
  await api.delete(`/Clientes/${clienteId}/subcuentas/${id}`);
};

export interface ClasificacionPayload { id: number; nombre: string; }
export interface SubcuentaPayload { id: number; nombre: string; clasificacionId?: number; clasificacionNombre?: string; }

// ── Tipos del payload (espeja los DTOs del backend) ──────────────────

export interface CrearClasificacionPayload {
  tempId: string;
  nombre: string;
}

export interface CrearSubcuentaPayload {
  nombre: string;
  clasificacionTempId?: string;
}

export interface CrearClientePayload {
  nombre: string;
  estadoId: number;
  contacto?: string;
  email?: string;
  telefono?: string;
  descripcion?: string;
  clasificaciones: CrearClasificacionPayload[];
  subcuentas: CrearSubcuentaPayload[];
}

export interface ActualizarClientePayload {
  nombre: string;
  estadoId: number;
  contacto?: string;
  email?: string;
  telefono?: string;
  descripcion?: string;
}
