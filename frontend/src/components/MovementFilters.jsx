import { useState, useEffect, useContext } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationFilter from "./locations/LocationFilter";
import ProductCombobox from "./ProductCombobox";
import { locationsService } from '../api';
import AuthContext from '../context/authContext';

const MovementFilters = ({
    filters,
    onFilterChange,
    onClearFilters,
    onLocationChange,
    selectedLocation
}) => {
    const { user, userProfile, getCurrentLocation, accessibleLocations } = useContext(AuthContext);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                // For admins, fetch all locations. For regular users, use accessible locations
                if (user?.is_staff) {
                    const response = await locationsService.getLocations();
                    setLocations(response.data.results || response.data);
                } else {
                    // Use accessible locations from context
                    setLocations(accessibleLocations);
                }
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        };

        fetchLocations();
    }, [user?.is_staff, accessibleLocations]);

    // Auto-set location for non-admin users
    useEffect(() => {
        const canUserChangeLocation = user?.is_staff || userProfile?.profile?.can_change_location;
        const currentLocation = getCurrentLocation();

        // If user can't change location and no location is selected, auto-select their default
        if (!canUserChangeLocation && currentLocation && !selectedLocation) {
            if (onLocationChange) {
                onLocationChange(currentLocation.id.toString());
            } else {
                // Fallback to regular filter change
                onFilterChange({ target: { name: 'location', value: currentLocation.id.toString() }});
            }
        }
    }, [user?.is_staff, userProfile?.profile?.can_change_location, getCurrentLocation, selectedLocation, onLocationChange, onFilterChange]);

    const handleLocationChange = (locationId) => {
        // Only allow location change if user has permission
        const canUserChangeLocation = user?.is_staff || userProfile?.profile?.can_change_location;
        if (!canUserChangeLocation) {
            return; // Ignore location change attempts for restricted users
        }

        if (onLocationChange) {
            onLocationChange(locationId);
        } else {
            // Fallback to regular filter change
            onFilterChange({ target: { name: 'location', value: locationId }});
        }
    };

    const handleClearLocation = () => {
        const canUserChangeLocation = user?.is_staff || userProfile?.profile?.can_change_location;
        if (!canUserChangeLocation) {
            return; // Ignore clear attempts for restricted users
        }

        handleLocationChange('');
    };

    const handleClearFilters = () => {
        // Clear all filters except location for restricted users
        const canUserChangeLocation = user?.is_staff || userProfile?.profile?.can_change_location;

        if (canUserChangeLocation) {
            onClearFilters();
        } else {
            // Clear all filters except location
            onFilterChange({ target: { name: 'product', value: '' }});
            onFilterChange({ target: { name: 'movement_type', value: '' }});
            onFilterChange({ target: { name: 'start_date', value: '' }});
            onFilterChange({ target: { name: 'end_date', value: '' }});
            // Keep location as is for restricted users
        }
    };

    return (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            {/* First row - Product and Location on mobile/tablet, all filters on desktop */}
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

                {/* Date range - spans full width on mobile, single column on desktop */}
                <div className="grid gap-2 md:col-span-2 lg:col-span-1">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={onFilterChange}
                            className="text-sm"
                            placeholder="From date"
                        />
                        <Input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={onFilterChange}
                            className="text-sm"
                            placeholder="To date"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button variant="outline" onClick={handleClearFilters} size="sm">
                    Clear All Filters
                </Button>
            </div>
        </div>
    );
};

export default MovementFilters;
