import api from './client';
import type { ClienteDto } from '../types';

export const getClientes = async (): Promise<ClienteDto[]> => {
  const res = await api.get<ClienteDto[]>('/Clientes');
  return res.data;
};

export const getCliente = async (id: number): Promise<ClienteDto> => {
  const res = await api.get<ClienteDto>(`/Clientes/${id}`);
  return res.data;
};
