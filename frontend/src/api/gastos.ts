import api from './client';
import type { GastoDto } from '../types';

export const getGastosPorProyecto = async (proyectoId: number): Promise<GastoDto[]> => {
  const res = await api.get<GastoDto[]>(`/proyectos/${proyectoId}/gastos`);
  return res.data;
};
