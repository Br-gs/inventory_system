import {useState, useEffect} from "react";
import inventoryService from "../api/inventoryService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"

const MovementFilters = ({ filters, onFilterChange, onClearFilters}) => {
    const [productList, setProductList] = useState([]);

    useEffect(() => {
        inventoryService.getProducts()
        .then(response => setProductList(response.data.results))
        .catch(err => console.error("Failed to fetch products for filter.", err));
    }, []);

    const handleProductChange = (value) => onFilterChange({ target: { name: 'product', value } });
    const handleTypeChange = (value) => onFilterChange({ target: { name: 'movementType', value } });

    return (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
            <Select value={filters.product} onValueChange={handleProductChange}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                    {productList.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
            </Select>

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