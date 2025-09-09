import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationFilter from "./LocationFilter";
import ProductCombobox from "./ProductCombobox";
import { locationsService } from '../api';

const MovementFilters = ({ 
    filters, 
    onFilterChange, 
    onClearFilters,
    onLocationChange,
    selectedLocation 
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

    const handleLocationChange = (locationId) => {
        if (onLocationChange) {
            onLocationChange(locationId);
        } else {
            // Fallback to regular filter change
            onFilterChange({ target: { name: 'location', value: locationId }});
        }
    };

    const handleClearLocation = () => {
        handleLocationChange('');
    };

    return (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="grid gap-2">
                    <Label>Product</Label>
                    <ProductCombobox
                        value={filters.product}
                        onChange={(e) => onFilterChange({ target: { name: 'product', value: e.target.value }})}
                        placeholder="All products"
                    />
                </div>

                <div className="grid gap-2">
                    <LocationFilter
                        locations={locations}
                        selectedLocation={selectedLocation || filters.location}
                        onLocationChange={handleLocationChange}
                        onClearFilter={handleClearLocation}
                        label="Location"
                        showClearButton={false}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Movement Type</Label>
                    <Select 
                        value={filters.movement_type} 
                        onValueChange={(value) => onFilterChange({ target: { name: 'movement_type', value }})}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All types</SelectItem>
                            <SelectItem value="IN">Input</SelectItem>
                            <SelectItem value="OUT">Output</SelectItem>
                            <SelectItem value="ADJ">Adjustment</SelectItem>
                            <SelectItem value="TRF">Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Date Range</Label>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={onFilterChange}
                            className="text-xs"
                        />
                        <Input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={onFilterChange}
                            className="text-xs"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button variant="outline" onClick={onClearFilters} size="sm">
                    Clear All Filters
                </Button>
            </div>
        </div>
    );
};

export default MovementFilters;