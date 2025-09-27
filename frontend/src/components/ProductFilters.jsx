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
    const { user, userProfile, getCurrentLocation } = useContext(AuthContext);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const fetchLocations = async () => {
            try {
                // For admins OR users with can_change_location permission, fetch all locations
                if (user?.is_staff || userProfile?.profile?.can_change_location) {
                    const response = await locationsService.getLocations();
                    if (isMounted) {
                        setLocations(response.data.results || response.data);
                    }
                } else {
                    // Regular users without permission use only their accessible locations
                    if (isMounted) {
                        const userAccessibleLocations = userProfile?.profile?.accessible_locations || [];
                        setLocations(userAccessibleLocations);
                        console.log('User accessible locations (restricted):', userAccessibleLocations);
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
    }, [user?.is_staff, userProfile?.profile?.can_change_location, userProfile?.profile?.accessible_locations]);

    // Auto-set location for non-admin users
    useEffect(() => {
        const canUserChangeLocation = user?.is_staff || userProfile?.profile?.can_change_location;
        const currentLocation = getCurrentLocation();

        // If user can't change location and no location is selected, auto-select their default
        if (!canUserChangeLocation && currentLocation && !selectedLocation) {
            onLocationChange(currentLocation.id.toString());
        }
    }, [user?.is_staff, userProfile?.profile?.can_change_location, getCurrentLocation, selectedLocation, onLocationChange]);

    const handleClearAll = useCallback(() => {
        onSearchChange('');
        onFilterChange({ target: { name: 'is_active', value: '', type: 'checkbox', checked: false }});
        onFilterChange({ target: { name: 'low_stock', value: '', type: 'checkbox', checked: false }});

        // Only clear location if user can change it
        const canUserChangeLocation = user?.is_staff || userProfile?.profile?.can_change_location;
        if (canUserChangeLocation && onClearLocationFilter) {
            onClearLocationFilter();
        }
    }, [onSearchChange, onFilterChange, onClearLocationFilter, user?.is_staff, userProfile?.profile?.can_change_location]);

    const handleLocationChange = useCallback((locationId) => {
        // Only allow location change if user has permission
        const canUserChangeLocation = user?.is_staff || userProfile?.profile?.can_change_location;
        if (canUserChangeLocation && onLocationChange) {
            onLocationChange(locationId);
        }
    }, [user?.is_staff, userProfile?.profile?.can_change_location, onLocationChange]);

    const handleClearLocationFilter = useCallback(() => {
        const canUserChangeLocation = user?.is_staff || userProfile?.profile?.can_change_location;
        if (canUserChangeLocation && onClearLocationFilter) {
            onClearLocationFilter();
        }
    }, [user?.is_staff, userProfile?.profile?.can_change_location, onClearLocationFilter]);

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
