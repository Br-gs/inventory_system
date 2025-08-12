import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "../api";

const useMovements = (filters, refreshTrigger, page) => {
    const [data, setData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMovements = useCallback(async (signal, currentFilters, currentPage) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (currentFilters.product) params.append('product', currentFilters.product);
            if (currentFilters.movement_type) params.append('movement_type', currentFilters.movement_type);
            if (currentFilters.start_date) params.append('start_date', currentFilters.start_date);
            if (currentFilters.end_date) params.append('end_date', currentFilters.end_date);
            if (currentPage) params.append('page', currentPage);

            const response = await inventoryService.getInventoryMovements(params, signal);
            setData(response.data.results);
        } catch (err) {
            if (err.name !== 'CancelError') {
                setError("Failed to fetch movements");
                console.error("Error fetching movements:", err);
            }
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchMovements(controller.signal, filters, page); 

        return () => {
            controller.abort();
        }
    }, [fetchMovements, refreshTrigger, filters, page]);

    return {
        data,
        loading,
        error,
    };
}

export default useMovements;