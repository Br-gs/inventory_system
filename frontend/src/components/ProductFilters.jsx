import SearchSuggestions from './SearchSuggestions';

const ProductFilters = ({filters, onFilterChange, searchValue, onSearchChange}) => {
    return (
        <div>
            <div>
                <SearchSuggestions value={searchValue} onChange={onSearchChange} />
            </div>

            <div>
                <label htmlFor='status-filter'>Status:</label>
                <select
                    id='status-filter'
                    name='is_active'
                    value={filters.is_active}
                    onChange={onFilterChange}
                >
                    <option value=''>All</option>
                    <option value='true'>Active</option>
                    <option value='false'>Inactive</option>
                </select>
            </div>
        </div>
    );
};

export default ProductFilters;