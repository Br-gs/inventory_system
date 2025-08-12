import { inventoryService } from '../api';
import {useState, useEffect, useCallback } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ReportFilters = ({ filters, onFilterChange, onClearFilters}) => {
    
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

    const handleInputChange = (e) => {
        onFilterChange(e);
    };

    const handleSelectChange = (value) => {
        onFilterChange({
            target: {
                name: 'product_id',
                value: value
            }
        });
    };

    if(loadingProducts) return <p>Loading...</p>
     
    return (
        <div className="flex flex-col sm:flex-row gap-2 items-center p-4 border rounded-lg">
            <Select value={filters.product_id || ''} onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Product..." />
                </SelectTrigger>
                <SelectContent>
                    {productList.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
            </Select>
            

            <div className="flex items-center gap-2">
                <Input type="date" name="start_date" value={filters.start_date} onChange={handleInputChange} />
                <span className="text-muted-foreground">hasta</span>
                <Input type="date" name="end_date" value={filters.end_date} onChange={handleInputChange} />
            </div>
      

            <Button variant="ghost" onClick={onClearFilters}>Limpiar</Button>
        </div>
    );
};

export default ReportFilters;