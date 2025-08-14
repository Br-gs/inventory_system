import SearchSuggestions from './SearchSuggestions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
                <Label htmlFor='status-filter' className="text-sm font-medium shrink-0">Status:</Label>
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

            <div className="flex items-center space-x-2">
                <Checkbox 
                id="low_stock"
                name="low_stock"
                checked={filters.low_stock === 'true'}
                onCheckedChange={(checked) => onFilterChange({ target: { name: 'low_stock', type: 'checkbox', checked } })}
                />
                <Label htmlFor="low_stock" className="text-sm font-medium">Low Stock</Label>
            </div>

        </div>
    );
};

export default ProductFilters;