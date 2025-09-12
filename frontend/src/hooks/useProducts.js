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
        if (previousRequestRef.current === requestKey && refreshTrigger === 0) {
            return;
        }
        
        previousRequestRef.current = requestKey;
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            
            // Add filters
            if (currentFilters.search) params.append('search', currentFilters.search);
            if (currentFilters.is_active === 'true') params.append('is_active', 'true');
            if (currentFilters.low_stock === 'true') params.append('low_stock', 'true');
            if (currentFilters.location) params.append('has_stock_at_location', currentFilters.location);
            
            // Add pagination
            if (currentPage > 1) params.append('page', currentPage);

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
    }, [refreshTrigger]);

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
    }, [fetchProducts, filters, page, refreshTrigger]);

    return {
        data,
        loading,
        error,
        fetchProducts
    };
};

export default useProducts;
