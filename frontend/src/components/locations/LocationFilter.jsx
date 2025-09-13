import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

const LocationFilter = ({ 
  locations = [], 
  selectedLocation, 
  onLocationChange, 
  onClearFilter,
  showClearButton = true 
}) => {
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
      
      {showClearButton && selectedLocation && (
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