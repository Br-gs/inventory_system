import SearchSuggestions from './SearchSuggestions';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import LocationFilter from "./locations/LocationFilter";
import { locationsService } from '@/api';

const ProductFilters = ({ 
    filters, 
    onFilterChange, 
    searchValue, 
    onSearchChange,
    onLocationChange,
    selectedLocation,
    onClearLocationFilter 
}) => {
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await locationsService.getLocations();
                setLocations(response.data.results || response.data);
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        };
        fetchLocations();
    }, []);

    const handleClearAll = () => {
        onSearchChange('');
        onFilterChange({ target: { name: 'is_active', value: '', type: 'checkbox', checked: false }});
        onFilterChange({ target: { name: 'low_stock', value: '', type: 'checkbox', checked: false }});
        if (onClearLocationFilter) {
            onClearLocationFilter();
        }
    };

    return (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <SearchSuggestions value={searchValue} onChange={onSearchChange} />
                </div>
                
                {locations.length > 0 && onLocationChange && (
                    <div className="flex-1">
                        <LocationFilter
                            locations={locations}
                            selectedLocation={selectedLocation}
                            onLocationChange={onLocationChange}
                            onClearFilter={onClearLocationFilter}
                            label="Filter by Location"
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is_active"
                        checked={filters.is_active === 'true'}
                        onCheckedChange={(checked) => onFilterChange({
                            target: { name: 'is_active', value: checked ? 'true' : '', type: 'checkbox', checked }
                        })}
                    />
                    <Label htmlFor="is_active">Active Products Only</Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="low_stock"
                        checked={filters.low_stock === 'true'}
                        onCheckedChange={(checked) => onFilterChange({
                            target: { name: 'low_stock', value: checked ? 'true' : '', type: 'checkbox', checked }
                        })}
                    />
                    <Label htmlFor="low_stock">Low Stock Products</Label>
                </div>

                <Button variant="outline" onClick={handleClearAll} size="sm">
                    Clear All Filters
                </Button>
            </div>
        </div>
    );
};

export default ProductFilters;