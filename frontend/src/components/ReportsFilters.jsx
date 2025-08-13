import ProductCombobox from './ProductCombobox';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ReportFilters = ({ filters, onFilterChange, onClearFilters }) => {
    return (
        <div className="flex flex-col sm:flex-row gap-2 items-center p-4 border rounded-lg">
            <ProductCombobox 
                value={filters.product_id}
                onChange={onFilterChange}
            />
            

            <div className="flex items-center gap-2">
                <Input type="date" name="start_date" value={filters.start_date} onChange={onFilterChange} />
                <span className="text-muted-foreground">To</span>
                <Input type="date" name="end_date" value={filters.end_date} onChange={onFilterChange} />
            </div>
      

            <Button variant="ghost" onClick={onClearFilters}>Clear</Button>
        </div>
    );
};

export default ReportFilters;