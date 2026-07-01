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

export const crearProyecto = async (dto: CrearProyectoPayload): Promise<ProyectoDto> => {
  const res = await api.post<ProyectoDto>('/Proyectos', dto);
  return res.data;
};

export const actualizarProyecto = async (id: number, dto: ActualizarProyectoPayload): Promise<void> => {
  await api.put(`/Proyectos/${id}`, dto);
};

export const marcarFinalizado = async (id: number): Promise<void> => {
  await api.post(`/Proyectos/${id}/marcar-finalizado`);
};

export const eliminarProyecto = async (id: number): Promise<void> => {
  await api.delete(`/Proyectos/${id}`);
};

export interface ResumenFinancieroDto {
  id: number;
  proyectoId: number;
  totalFacturado: number;
  totalCostos: number;
  utilidadNeta: number;
}

export const getResumenFinanciero = async (proyectoId: number): Promise<ResumenFinancieroDto | null> => {
  const res = await api.get<ResumenFinancieroDto>(`/proyectos/${proyectoId}/resumen-financiero`);
  return res.status === 204 ? null : res.data;
};

export const guardarResumenFinanciero = async (
  proyectoId: number,
  dto: { totalFacturado: number; totalCostos: number; utilidadNeta: number }
): Promise<ResumenFinancieroDto> => {
  const res = await api.put<ResumenFinancieroDto>(`/proyectos/${proyectoId}/resumen-financiero`, dto);
  return res.data;
};

export const registrarPagoCliente = async (proyectoId: number, monto: number): Promise<void> => {
  await api.post(`/proyectos/${proyectoId}/registrar-pago-cliente`, { monto });
};

export interface OrdenCompraPayload {
  numeroOc?: string;
  aQuienFacturar?: string;
  detalle?: string;
  montoTotal: number;
  monedaId: number;
}

export interface CrearProyectoPayload {
  nombre: string;
  clienteId: number;
  subcuentaId?: number;
  estadoId: number;
  fechaInicio?: string;
  fechaFin?: string;
  descripcion?: string;
  requiereFactura: boolean;
  presupuestoInicial?: number;
  ordenCompra?: OrdenCompraPayload;
}

export interface ActualizarProyectoPayload {
  nombre: string;
  subcuentaId?: number;
  estadoId: number;
  fechaInicio?: string;
  fechaFin?: string;
  descripcion?: string;
  requiereFactura: boolean;
  presupuestoInicial?: number;
  ordenCompra?: OrdenCompraPayload;
}
