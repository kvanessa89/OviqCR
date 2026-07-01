import { useState, useEffect } from 'react';
import api from '../api/client';
import type { CatalogoDto } from '../types';

export function useCatalogo(tipo: string) {
  const [items, setItems] = useState<CatalogoDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<CatalogoDto[]>(`/${tipo}`)
      .then(res => setItems(res.data))
      .finally(() => setLoading(false));
  }, [tipo]);

  return { items, loading };
}
