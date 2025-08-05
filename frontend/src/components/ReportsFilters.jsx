import {useProducts} from '../hooks'

const ReportFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const {products, loadingProducts} = useProducts({is_active: 'true'});

    return (
        <div className="filters" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select 
                name="product_id" 
                value={filters.product_id} 
                onChange={onFilterChange}
                disabled={loadingProducts}
            >
                <option value="">Filter by product... </option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <input 
                type="date" 
                name="start_date" 
                value={filters.start_date} 
                onChange={onFilterChange} 
            />
            <span>hasta</span>
            <input 
                type="date" 
                name="end_date" 
                value={filters.end_date} 
                onChange={onFilterChange} 
            />
      
            <button onClick={onClearFilters}>Limpiar Filtros</button>
        </div>
    );
};

export default ReportFilters;