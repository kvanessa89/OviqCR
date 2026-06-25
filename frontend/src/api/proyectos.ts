import api from './client';
import type { ProyectoDto } from '../types';

export const getProyectos = async (): Promise<ProyectoDto[]> => {
  const res = await api.get<ProyectoDto[]>('/Proyectos');
  return res.data;
};

export const getProyecto = async (id: number): Promise<ProyectoDto> => {
  const res = await api.get<ProyectoDto>(`/Proyectos/${id}`);
  return res.data;
};
