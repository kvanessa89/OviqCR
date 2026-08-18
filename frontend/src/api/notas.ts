import api from './client';
import type { NotaDto } from '../types';

export const getNotas = async (): Promise<NotaDto[]> => {
  const res = await api.get<NotaDto[]>('/Notas');
  return res.data;
};

export const crearNota = async (descripcion: string): Promise<NotaDto> => {
  const res = await api.post<NotaDto>('/Notas', { descripcion });
  return res.data;
};

export const actualizarNota = async (id: number, descripcion: string): Promise<void> => {
  await api.put(`/Notas/${id}`, { descripcion });
};

export const cambiarEstadoNota = async (id: number, completada: boolean): Promise<void> => {
  await api.patch(`/Notas/${id}/estado`, { completada });
};

export const eliminarNota = async (id: number): Promise<void> => {
  await api.delete(`/Notas/${id}`);
};
