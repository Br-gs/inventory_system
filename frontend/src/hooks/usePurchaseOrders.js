import { useState, useEffect, useCallback } from 'react';
import {purchasingService} from '../api';

const usePurchaseOrders = (page, refreshTrigger) => {
  const [data, setData] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPOs = useCallback(async (signal, currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (currentPage) {
        params.append('page', currentPage);
      }
      const response = await purchasingService.getPurchaseOrders(params, signal);
      setData(response.data); 
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError("The purchase orders could not be loaded.");
        console.error("Error fetching purchase orders:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPOs(controller.signal, Math.max(1, page));
    return () => {
      controller.abort();
    };
  }, [fetchPOs, page, refreshTrigger]);

  return { data, loading, error };
};

export default usePurchaseOrders;