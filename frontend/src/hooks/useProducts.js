import { useState, useEffect, useCallback, useRef } from "react";
import { inventoryService } from "../api";

const useProducts = (filters, page, refreshTrigger) => {
    const [data, setData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const previousRequestRef = useRef(null);

    const fetchProducts = useCallback(async (signal, currentFilters, currentPage) => {
        // Create a unique key for this request
        const requestKey = JSON.stringify({ ...currentFilters, page: currentPage });
        
        // Skip if this is the same request as the previous one
        if (previousRequestRef.current === requestKey) {
            return;
        }
        
        previousRequestRef.current = requestKey;
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (currentFilters.search) params.append('search', currentFilters.search);
            if (currentFilters.is_active) params.append('is_active', currentFilters.is_active);
            if (currentFilters.low_stock) params.append('low_stock', currentFilters.low_stock);
            if (currentFilters.location) params.append('location', currentFilters.location);
            if (currentPage) params.append('page', currentPage);

            const response = await inventoryService.getProducts(params, signal);
            
            if (!signal.aborted) {
                setData(response.data);
            }
        } catch (err) {
            if (err.name !== 'CanceledError' && !signal.aborted) {
                setError("Failed to fetch products");
                console.error("Error fetching products:", err);
            }
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        
        // Reset previous request ref when refreshTrigger changes
        if (refreshTrigger > 0) {
            previousRequestRef.current = null;
        }

        const debounceTimer = setTimeout(() => {
            fetchProducts(controller.signal, filters, Math.max(1, page));
        }, filters.search ? 300 : 0); // Only debounce for search, immediate for other filters

        return () => {
            clearTimeout(debounceTimer);
            controller.abort();
        };
    }, [fetchProducts, refreshTrigger, filters, page]);

    return {
        data,
        loading,
        error,
        fetchProducts
    };
};

export default useProducts;

