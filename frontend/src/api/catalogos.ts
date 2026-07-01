import api from './client';
import type { CatalogoDto } from '../types';

export const getCatalogo = async (tipo: string): Promise<CatalogoDto[]> => {
  const res = await api.get<CatalogoDto[]>(`/${tipo}`);
  return res.data;
};

export const crearCatalogo = async (tipo: string, dto: CrearCatalogoPayload): Promise<CatalogoDto> => {
  const res = await api.post<CatalogoDto>(`/${tipo}`, dto);
  return res.data;
};

export const actualizarCatalogo = async (tipo: string, id: number, dto: ActualizarCatalogoPayload): Promise<void> => {
  await api.put(`/${tipo}/${id}`, dto);
};

export const desactivarCatalogo = async (tipo: string, id: number): Promise<void> => {
  await api.delete(`/${tipo}/${id}`);
};

export interface CrearCatalogoPayload {
  codigo: string;
  nombre: string;
  orden: number;
}

export interface ActualizarCatalogoPayload {
  nombre: string;
  orden: number;
  activo: boolean;
}
