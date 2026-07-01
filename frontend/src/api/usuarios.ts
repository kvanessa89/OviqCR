import api from './client';
import type { UsuarioDto } from '../types';

export const getUsuarios = async (): Promise<UsuarioDto[]> => {
  const res = await api.get<UsuarioDto[]>('/Usuarios');
  return res.data;
};

export const getUsuario = async (id: number): Promise<UsuarioDto> => {
  const res = await api.get<UsuarioDto>(`/Usuarios/${id}`);
  return res.data;
};

export const crearUsuario = async (dto: CrearUsuarioPayload): Promise<UsuarioDto> => {
  const res = await api.post<UsuarioDto>('/Usuarios', dto);
  return res.data;
};

export const actualizarUsuario = async (id: number, dto: ActualizarUsuarioPayload): Promise<void> => {
  await api.put(`/Usuarios/${id}`, dto);
};

export const eliminarUsuario = async (id: number): Promise<void> => {
  await api.delete(`/Usuarios/${id}`);
};

export interface CrearPerfilTrabajadorPayload {
  formaPagoId: number;
  cargo: string;
  emailContacto?: string;
  telefono?: string;
}

export interface CrearUsuarioPayload {
  nombre: string;
  email: string;
  password: string;
  rol: 'Administrador' | 'Trabajador';
  activo: boolean;
  perfilTrabajador?: CrearPerfilTrabajadorPayload;
}

export interface ActualizarUsuarioPayload {
  nombre: string;
  email: string;
  rol: 'Administrador' | 'Trabajador';
  activo: boolean;
  password?: string;
  perfilTrabajador?: CrearPerfilTrabajadorPayload;
}
