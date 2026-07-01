import api from './client';
import type { FacturaDto } from '../types';

export const getFacturas = async (): Promise<FacturaDto[]> => {
  const res = await api.get<FacturaDto[]>('/Facturas');
  return res.data;
};

export const getFacturasPorProyecto = async (proyectoId: number): Promise<FacturaDto[]> => {
  const res = await api.get<FacturaDto[]>(`/Facturas/proyecto/${proyectoId}`);
  return res.data;
};

export const crearFactura = async (dto: CrearFacturaPayload): Promise<FacturaDto> => {
  const res = await api.post<FacturaDto>('/Facturas', dto);
  return res.data;
};

export const actualizarFactura = async (id: number, dto: ActualizarFacturaPayload): Promise<void> => {
  await api.put(`/Facturas/${id}`, dto);
};

export const eliminarFactura = async (id: number): Promise<void> => {
  await api.delete(`/Facturas/${id}`);
};

export const subirArchivoFactura = async (id: number, archivo: File): Promise<string> => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const res = await api.post<{ url: string }>(`/Facturas/${id}/archivo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};

export interface CrearFacturaPayload {
  numero: string;
  proyectoId: number;
  subcuentaId?: number;
  monedaId: number;
  monto: number;
  sinIva: boolean;
  fechaEmision: string;
  fechaEstimadaPago: string;
  estadoId: number;
  notas?: string;
}

export interface ActualizarFacturaPayload {
  numero: string;
  proyectoId: number;
  subcuentaId?: number;
  monedaId: number;
  monto: number;
  sinIva: boolean;
  fechaEmision: string;
  fechaEstimadaPago: string;
  estadoId: number;
  notas?: string;
}
