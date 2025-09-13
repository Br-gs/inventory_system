import { useState, useEffect} from "react";
import { inventoryService } from "../api";
const useProducts = (filters, page, refreshTrigger) => {
    const [data, setData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isCancelled = false;
        
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const params = new URLSearchParams();
                
                // Add filters
                if (filters.search) params.append('search', filters.search);
                if (filters.is_active === 'true') params.append('is_active', 'true');
                if (filters.low_stock === 'true') params.append('low_stock', 'true');
                if (filters.location) params.append('location', filters.location);
                
                // Add pagination
                if (page > 1) params.append('page', page);

                const response = await inventoryService.getProducts(params);
                
                if (!isCancelled) {
                    console.log('Products response:', response.data);
                    setData(response.data);
                }
            } catch (err) {
                if (!isCancelled) {
                    setError("Failed to fetch products");
                    console.error("Error fetching products:", err);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        // Debounce search, immediate for other changes
        const timeoutId = setTimeout(fetchProducts, filters.search ? 300 : 0);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [filters.search, filters.is_active, filters.low_stock, filters.location, page, refreshTrigger]);

    return {
        data,
        loading,
        error,
    };
};

export default useProducts;