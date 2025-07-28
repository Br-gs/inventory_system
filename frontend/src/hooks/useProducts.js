import { useState, useEffect, useCallback } from "react";
import { inventoryService } from "../api";

const useProducts = (filters, refreshTrigger) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProducts = useCallback(async (signal, currentFilters) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (currentFilters.search) params.append('search', currentFilters.search);
            if (currentFilters.is_active) params.append('is_active', currentFilters.is_active);
            const response = await inventoryService.getProducts(params, signal);
            setProducts(response.data.results);
        } catch (err) {
            if (err.name !== 'CancelError') {
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
            fetchProducts(controller.signal, filters);
        }, 300);

        return () => {
            clearTimeout(debounceTimer);
            controller.abort();
        };
    }, [fetchProducts, refreshTrigger, filters]);

    return {
        products,
        loading,
        error,
        fetchProducts
    };
};

export default useProducts;

