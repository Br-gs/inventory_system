import { inventoryService } from '../api';
import {useState, useEffect, useCallback } from 'react'

const ReportFilters = ({ filters, onFilterChange, onApplyFilters, onClearFilters}) => {
    
    const [productList, setProductList] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const fetchProductsForFilter = useCallback(async () => {
      setLoadingProducts(true);
      try {
        const response = await inventoryService.getProducts();
        setProductList(response.data.results);
      } catch (err) {
        console.error("The products for the filter could not be loaded.", err);
      } finally {
        setLoadingProducts(false);
      }
    }, []);

    useEffect (() => {
        fetchProductsForFilter();
    },[fetchProductsForFilter]);

    const handleFilterChange = (e) => {
        onFilterChange(e);
    };

    return (
        <div className="filters" style={{ 
            display: 'flex', 
            gap: '15px', 
            alignItems: 'center', 
            marginBottom: '20px', 
            flexWrap: 'wrap',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffffff' }}>
                    Product Filter
                </label>
                <select 
                    name="product_id" 
                    value={filters.product_id || ''} 
                    onChange={handleFilterChange}
                    disabled={loadingProducts}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        backgroundColor: 'grey',
                        minWidth: '200px'
                    }}
                >
                    <option value="">All products</option>
                    {productList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffffff' }}>
                    Start Date
                </label>
                <input 
                    type="date" 
                    name="start_date" 
                    value={filters.start_date || ''} 
                    onChange={handleFilterChange}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        backgroundColor: 'grey'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffffff' }}>
                    End Date
                </label>
                <input 
                    type="date" 
                    name="end_date" 
                    value={filters.end_date || ''} 
                    onChange={handleFilterChange}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        backgroundColor: 'grey'
                    }}
                />
            </div>
      
            <div style={{ display: 'flex', gap: '10px', alignItems: 'end', paddingTop: '20px' }}>
                <button 
                    onClick={onApplyFilters}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Apply Filters
                </button>
                <button 
                    onClick={onClearFilters}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
};

export default ReportFilters;