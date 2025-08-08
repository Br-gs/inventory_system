import SearchSuggestions from './SearchSuggestions';

const ProductFilters = ({filters, onFilterChange, searchValue, onSearchChange}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex-grow">
                <SearchSuggestions value={searchValue} onChange={onSearchChange} />
            </div>

            <div className="flex items-center gap-2">
                <label htmlFor='status-filter' className="text-sm font-medium">Status:</label>
                <select
                    id='status-filter'
                    name='is_active'
                    value={filters.is_active}
                    onChange={onFilterChange}
                    className="p-2 border rounded-md bg-transparent"
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