import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationFilter from "./locations/LocationFilter";
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="grid gap-2">
                    <Label>Product</Label>
                    <ProductCombobox
                        value={filters.product}
                        onChange={(e) => onFilterChange({ target: { name: 'product', value: e.target.value }})}
                        placeholder="All products"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Location</Label>
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
                            <SelectItem value="All">All types</SelectItem>
                            <SelectItem value="IN">Input</SelectItem>
                            <SelectItem value="OUT">Output</SelectItem>
                            <SelectItem value="ADJ">Adjustment</SelectItem>
                            <SelectItem value="TRF">Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2 sm:col-span-1 lg:col-span-1">
                    <Label>Date Range</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={onFilterChange}
                            className="text-xs w-full"
                            placeholder="From"
                        />
                        <Input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={onFilterChange}
                            className="text-xs w-full"
                            placeholder="To"
                        />
                    </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1 flex items-end">
                    <Button variant="outline" onClick={onClearFilters} size="sm" className="w-full lg:w-auto">
                        Clear All Filters
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MovementFilters;