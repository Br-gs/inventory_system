import { inventoryService } from '../api';
import {useState, useEffect, useCallback } from 'react'

const ReportFilters = ({ filters, onFilterChange, onApplyFilters, onClearFilters }) => {
    
    const [productList, setProductList] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const fetchProductsForFilter = useCallback(async () => {
      setLoadingProducts(true);
      try {
        const response = await inventoryService.getProducts();
        setProductList(response.data.results);
      } catch (err) {
        console.error("No se pudieron cargar los productos para el filtro.", err);
      } finally {
        setLoadingProducts(false);
      }
    }, []);

    useEffect (() => {
        fetchProductsForFilter();
    },[fetchProductsForFilter]);

    return (
        <div className="filters" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select 
                name="product_id" 
                value={filters.product_id} 
                onChange={onFilterChange}
                disabled={loadingProducts}
            >
                <option value="">Filter by product... </option>
                {productList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <input 
                type="date" 
                name="start_date" 
                value={filters.start_date} 
                onChange={onFilterChange} 
            />
            <span>TO</span>
            <input 
                type="date" 
                name="end_date" 
                value={filters.end_date} 
                onChange={onFilterChange} 
            />
      
            <button onClick={onApplyFilters}>Apply</button>
            <button onClick={onClearFilters}>Clean</button>
        </div>
    );
};

export default ReportFilters;