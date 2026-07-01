import api from './client';
import type { GastoDto } from '../types';

export const getGastosPorProyecto = async (proyectoId: number): Promise<GastoDto[]> => {
  const res = await api.get<GastoDto[]>(`/proyectos/${proyectoId}/gastos`);
  return res.data;
};

export const crearGasto = async (proyectoId: number, dto: { rubro: string; monto: number }): Promise<GastoDto> => {
  const res = await api.post<GastoDto>(`/proyectos/${proyectoId}/gastos`, dto);
  return res.data;
};
