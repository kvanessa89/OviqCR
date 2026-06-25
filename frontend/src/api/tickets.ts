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
