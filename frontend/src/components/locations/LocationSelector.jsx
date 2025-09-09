import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { axiosClient } from '@/api';

const LocationSelector = ({ 
    value, 
    onChange, 
    label = "Location", 
    disabled = false, 
    required = false,
    showLabel = true 
    }) => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
        try {
            const response = await axiosClient.get('/api/locations/');
            setLocations(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching locations:', error);
        } finally {
            setLoading(false);
        }
        };

        fetchLocations();
    }, []);

    return (
        <div className="grid gap-2">
        {showLabel && <Label>{label} {required && "*"}</Label>}
        <Select 
            value={value?.toString() || ''} 
            onValueChange={onChange}
            disabled={disabled || loading}
        >
            <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading..." : "Select location"} />
            </SelectTrigger>
            <SelectContent>
            {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                {location.name}
                </SelectItem>
            ))}
            </SelectContent>
        </Select>
        </div>
    );
};

export default LocationSelector;