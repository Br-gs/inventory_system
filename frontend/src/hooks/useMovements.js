import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "../api";

const useMovements = (filters, page, refreshTrigger) => {
    const [data, setData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMovements = useCallback(async (signal, currentFilters, currentPage) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            
            // Add filters
            if (currentFilters.product) params.append('product', currentFilters.product);
            if (currentFilters.movement_type && currentFilters.movement_type !== 'All') {
                params.append('movement_type', currentFilters.movement_type);
            }
            if (currentFilters.start_date) params.append('start_date', currentFilters.start_date);
            if (currentFilters.end_date) params.append('end_date', currentFilters.end_date);
            if (currentFilters.location) params.append('location', currentFilters.location);
            
            // Add pagination
            if (currentPage > 1) params.append('page', currentPage);

            const response = await inventoryService.getInventoryMovements(params);
            if (!signal.aborted) {
                setData(response.data);
            }
        } catch (err) {
            if (err.name !== 'CanceledError' && !signal.aborted) {
                setError("Failed to fetch movements");
                console.error("Error fetching movements:", err);
            }
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchMovements(controller.signal, filters, Math.max(1, page)); 

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