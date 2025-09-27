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
  const { user, userProfile, getCurrentLocation } = useContext(AuthContext);

  // Simple permission check - admin OR has can_change_location permission
  const canUserChangeLocation = user?.is_staff || userProfile?.profile?.can_change_location;
  const currentLocation = getCurrentLocation();


  // If user can't change location, show as read-only
  if (!canUserChangeLocation) {
    const displayLocation = currentLocation;

    if (displayLocation) {
      return (
        <div className="grid gap-2 flex-1">
          <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-md border">
            <span className="text-sm">{displayLocation.name}</span>
          </div>
        </div>
      );
    }
  }

  // Show dropdown for admins or users with can_change_location permission
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
