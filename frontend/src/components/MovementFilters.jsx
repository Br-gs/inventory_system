import {useState, useEffect} from "react";
import inventoryService from "../api/inventoryService";

const MovementFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const [productList, setProductList] = useState([]);

    useEffect(() => {
        const fetchProductsForFilter = async () => {
            try {
                const response = await inventoryService.getProducts();
                setProductList(response.data.results);
            } catch (error) {
                console.error("Failed to fetch products:", error);
            }
        };
        fetchProductsForFilter();
    }, []);

    return (
        <div className="movement-filters">
            <select name='product' value={filters.product} onChange={onFilterChange}>
                <option value=''>All Products</option>
                {productList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select name='movementType' value={filters.movementType} onChange={onFilterChange}>
                <option value=''>All Movement Types</option>
                <option value='IN'>I</option>
                <option value='OUT'>Output</option>
                <option value='ADJ'>Adjustment</option>
            </select>

            <input type='date' name='start_date' value={filters.start_date} onChange={onFilterChange} />
            <span>to</span>
            <input type='date' name='end_date' value={filters.end_date} onChange={onFilterChange} />

            <button onClick={onClearFilters}>Clear Filters</button>
        </div>
    );
};

export default MovementFilters;