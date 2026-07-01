import api from './client';
import type { ComentarioDto } from '../types';

export const getComentariosProyecto = async (proyectoId: number): Promise<ComentarioDto[]> => {
  const res = await api.get<ComentarioDto[]>(`/proyectos/${proyectoId}/comentarios`);
  return res.data;
};

export const crearComentarioProyecto = async (proyectoId: number, texto: string): Promise<ComentarioDto> => {
  const res = await api.post<ComentarioDto>(`/proyectos/${proyectoId}/comentarios`, { texto });
  return res.data;
};

export const getComentariosTicket = async (ticketId: number): Promise<ComentarioDto[]> => {
  const res = await api.get<ComentarioDto[]>(`/tickets/${ticketId}/comentarios`);
  return res.data;
};

export const crearComentarioTicket = async (ticketId: number, texto: string): Promise<ComentarioDto> => {
  const res = await api.post<ComentarioDto>(`/tickets/${ticketId}/comentarios`, { texto });
  return res.data;
};
