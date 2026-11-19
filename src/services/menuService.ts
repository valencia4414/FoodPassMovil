// src/services/menuService.ts
import  apiClient from './apiClient';

export interface Categoria {
  id: string | number;
  nombre: string;
}

export interface Platillo {
  id: string | number;
  nombre: string; // O name
  description: string;
  price: string | number;
  image: string;
  category: string;
  disponible?: boolean;
}

export const getCategorias = async (): Promise<Categoria[]> => {
  const response = await apiClient.get('/api/categorias');
  return response.data?.data || response.data || [];
};

export const getPlatillos = async (categoriaId?: string | number): Promise<Platillo[]> => {
  const url = categoriaId ? `/api/platillos?categoria=${categoriaId}` : '/api/platillos';
  const response = await apiClient.get(url);
  return response.data?.data || response.data || [];
};