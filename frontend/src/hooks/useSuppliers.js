import { useState, useEffect, useCallback } from 'react';
import suppliersService from '../api/suppliersService';

const useSuppliers = (page, refreshTrigger) => {
  const [data, setData] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuppliers = useCallback(async (signal, currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (currentPage) {
        params.append('page', currentPage);
      }
      
      const response = await suppliersService.getSuppliers(params, signal);
      setData(response.data); 
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError("No se pudieron cargar los proveedores.");
        console.error("Error fetching suppliers:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    
    fetchSuppliers(controller.signal, Math.max(1, page));

    return () => {
      controller.abort();
    };
  }, [fetchSuppliers, page, refreshTrigger]);

  return { data, loading, error };
};

export default useSuppliers;