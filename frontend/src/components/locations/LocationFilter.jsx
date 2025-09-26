import { useContext } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import AuthContext from '../../context/authContext';

const LocationFilter = ({
  locations = [],
  selectedLocation,
  onLocationChange,
  onClearFilter,
  showClearButton = true,
}) => {
  const { user, canChangeLocation, getCurrentLocation } = useContext(AuthContext);

  // For non-admin users who can't change location, use their default location
  const canUserChangeLocation = user?.is_staff || canChangeLocation();
  const currentLocation = getCurrentLocation();

  // If user can't change location, display their assigned location as read-only
  if (!canUserChangeLocation && currentLocation) {
    return (
      <div className="grid gap-2 flex-1">
        <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-md border">
          <span className="text-sm">{currentLocation.name}</span>
          <span className="text-xs text-muted-foreground">(Default)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-2 flex-1">
        <Select
          value={selectedLocation?.toString() || 'all'}
          onValueChange={(value) => onLocationChange(value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id.toString()}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showClearButton && selectedLocation && canUserChangeLocation && (
        <Button
          variant="outline"
          size="icon"
          onClick={onClearFilter}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default LocationFilter;
