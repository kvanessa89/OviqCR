import api from './client';
import type { TicketDto } from '../types';

export const getTickets = async (): Promise<TicketDto[]> => {
  const res = await api.get<TicketDto[]>('/Tickets');
  return res.data;
};

export const getTicketsPorProyecto = async (proyectoId: number): Promise<TicketDto[]> => {
  const res = await api.get<TicketDto[]>(`/Tickets/proyecto/${proyectoId}`);
  return res.data;
};

export const crearTicket = async (dto: CrearTicketPayload): Promise<TicketDto> => {
  const res = await api.post<TicketDto>('/Tickets', dto);
  return res.data;
};

export const actualizarTicket = async (id: number, dto: ActualizarTicketPayload): Promise<void> => {
  await api.put(`/Tickets/${id}`, dto);
};

export const cambiarEstadoTicket = async (id: number, estadoId: number): Promise<void> => {
  await api.patch(`/Tickets/${id}/estado`, { estadoId });
};

export const eliminarTicket = async (id: number): Promise<void> => {
  await api.delete(`/Tickets/${id}`);
};

export interface CrearTicketPayload {
  titulo: string;
  descripcion?: string;
  proyectoId: number;
  usuarioId?: number;
  prioridadId: number;
  estadoId: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ActualizarTicketPayload {
  titulo: string;
  descripcion?: string;
  usuarioId?: number;
  prioridadId: number;
  estadoId: number;
  fechaInicio?: string;
  fechaFin?: string;
}
