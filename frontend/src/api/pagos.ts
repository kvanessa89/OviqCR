import api from './client';
import type { PagoProyectoDto } from '../types';

export const getPagosPorProyecto = async (proyectoId: number): Promise<PagoProyectoDto[]> => {
  const res = await api.get<PagoProyectoDto[]>(`/proyectos/${proyectoId}/pagos`);
  return res.data;
};
