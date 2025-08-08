import SearchSuggestions from './SearchSuggestions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

const ProductFilters = ({filters, onFilterChange, searchValue, onSearchChange}) => {
      const handleStatusChange = (value) => {
        onFilterChange({ target: { name: 'is_active', value } });
    };

     const clearStatusFilter = (e) => {
        e.stopPropagation();
        onFilterChange({ target: { name: 'is_active', value: '' } });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex-grow">
                <SearchSuggestions value={searchValue} onChange={onSearchChange} />
            </div>

            <div className="flex items-center gap-2">
                <label htmlFor='status-filter' className="text-sm font-medium shrink-0">Status:</label>
                <Select value={filters.is_active} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                {filters.is_active && (
                    <Button variant="ghost" size="icon" onClick={clearStatusFilter}>
                        <X className="h-4 w-4" />
                    </Button>
                )}    
            </div>
        </div>
    );
};

export default ProductFilters;