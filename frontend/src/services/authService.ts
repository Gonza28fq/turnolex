import api from './api';
import type { ApiResponse, User, Estudio } from '../types/Index';

interface LoginResponse {
  token: string;
  user: User;
  estudio?: Estudio;
}

interface RegisterResponse {
  token: string;
  user: User;
  estudio: Estudio;
}

export const authService = {
  registerEstudio: async (data: {
    nombreEstudio: string;
    nombreAdmin: string;
    email: string;
    password: string;
    telefono?: string;
  }) => {
    const response = await api.post<ApiResponse<RegisterResponse>>('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },
};