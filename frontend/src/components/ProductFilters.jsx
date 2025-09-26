import SearchSuggestions from './SearchSuggestions';
import { useState, useEffect, useCallback, memo, useContext } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import LocationFilter from "./locations/LocationFilter";
import { locationsService } from '@/api';
import AuthContext from '../context/authContext';

const ProductFilters = memo(({
    filters,
    onFilterChange,
    searchValue,
    onSearchChange,
    onLocationChange,
    selectedLocation,
    onClearLocationFilter
}) => {
    const { user, canChangeLocation, getCurrentLocation, accessibleLocations } = useContext(AuthContext);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const fetchLocations = async () => {
            try {
                // For admins, fetch all locations. For regular users, use accessible locations
                if (user?.is_staff) {
                    const response = await locationsService.getLocations();
                    if (isMounted) {
                        setLocations(response.data.results || response.data);
                    }
                } else {
                    // Use accessible locations from context
                    if (isMounted) {
                        setLocations(accessibleLocations);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error fetching locations:', error);
                }
            }
        };

        fetchLocations();

        return () => {
            isMounted = false;
        };
    }, [user?.is_staff, accessibleLocations]);

    // Auto-set location for non-admin users
    useEffect(() => {
        const userCanChangeLocation = user?.is_staff || canChangeLocation();
        const currentLocation = getCurrentLocation();

        // If user can't change location and no location is selected, auto-select their default
        if (!userCanChangeLocation && currentLocation && !selectedLocation) {
            onLocationChange(currentLocation.id.toString());
        }
    }, [user?.is_staff, canChangeLocation, getCurrentLocation, selectedLocation, onLocationChange]);

    const handleClearAll = useCallback(() => {
        onSearchChange('');
        onFilterChange({ target: { name: 'is_active', value: '', type: 'checkbox', checked: false }});
        onFilterChange({ target: { name: 'low_stock', value: '', type: 'checkbox', checked: false }});

        // Only clear location if user can change it
        const userCanChangeLocation = user?.is_staff || canChangeLocation();
        if (userCanChangeLocation && onClearLocationFilter) {
            onClearLocationFilter();
        }
    }, [onSearchChange, onFilterChange, onClearLocationFilter, user?.is_staff, canChangeLocation]);

    const handleLocationChange = useCallback((locationId) => {
        // Only allow location change if user has permission
        const userCanChangeLocation = user?.is_staff || canChangeLocation();
        if (userCanChangeLocation && onLocationChange) {
            onLocationChange(locationId);
        }
    }, [user?.is_staff, canChangeLocation, onLocationChange]);

    const handleClearLocationFilter = useCallback(() => {
        const userCanChangeLocation = user?.is_staff || canChangeLocation();
        if (userCanChangeLocation && onClearLocationFilter) {
            onClearLocationFilter();
        }
    }, [user?.is_staff, canChangeLocation, onClearLocationFilter]);

    return (
       <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <SearchSuggestions value={searchValue} onChange={onSearchChange} />
                </div>

                {locations.length > 0 && (
                    <div className="flex-1">
                        <LocationFilter
                            locations={locations}
                            selectedLocation={selectedLocation}
                            onLocationChange={handleLocationChange}
                            onClearFilter={handleClearLocationFilter}
                            label="Filter by Location"
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
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

                <Button variant="outline" onClick={handleClearAll} size="sm" className="ml-auto">
                    Clear All Filters
                </Button>
            </div>
        </div>
    );
});

ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;
