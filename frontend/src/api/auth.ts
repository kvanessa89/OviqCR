import api from './client';
import type { LoginDto, AuthResponse } from '../types';

export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/Auth/login', dto);
  return res.data;
};
