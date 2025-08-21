import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"
import ProductCombobox from './ProductCombobox';

const MovementFilters = ({ filters, onFilterChange, onClearFilters}) => {
    const handleTypeChange = (value) => onFilterChange({ target: { name: 'movement_type', value } });

    return (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
            <ProductCombobox 
                value={filters.product}
                onChange={onFilterChange}
            />

            <Select value={filters.movementType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Types"/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value='IN'>Input</SelectItem>
                    <SelectItem value='OUT'>Output</SelectItem>
                    <SelectItem value='ADJ'>Adjustment</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
                <Input type="date" name="start_date" value={filters.start_date} onChange={onFilterChange} />
                <span className="text-muted-foreground">To</span>
                <Input type="date" name="end_date" value={filters.end_date} onChange={onFilterChange} />
            </div>

            <Button variant="ghost" onClick={onClearFilters}>Clear Filters</Button>
        </div>
    );
};

export default MovementFilters;