import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "../api";

const useProducts = (filters, page, refreshTrigger) => {
    const [data, setData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProducts = useCallback(async (signal, currentFilters, currentPage) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (currentFilters.search) params.append('search', currentFilters.search);
            if (currentFilters.is_active) params.append('is_active', currentFilters.is_active);
            if (currentFilters.low_stock) params.append('low_stock', currentFilters.low_stock);
            if (currentPage) params.append('page', currentPage);

            const response = await inventoryService.getProducts(params, signal);
            setData(response.data); 
        } catch (err) {
            if (err.name !== 'CanceledError') {
                setError("Failed to fetch products");
                console.error("Error fetching products:", err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const debounceTimer = setTimeout(() => {
            fetchProducts(controller.signal, filters, Math.max(1, page));
        }, 300);

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

