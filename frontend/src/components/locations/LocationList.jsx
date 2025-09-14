import { useState, useEffect, useCallback } from 'react';
import { axiosClient } from '@/api';
import toast from 'react-hot-toast';
import LocationCreateForm from './LocationCreateForm';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MoreHorizontal, Plus, MapPin, Calendar, Eye, EyeOff } from 'lucide-react';

const LocationList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/api/locations/');
      setLocations(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch locations');
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleToggleActive = async (location) => {
    const action = location.is_active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} "${location.name}"?`)) {
      try {
        await axiosClient.patch(`/api/locations/${location.id}/`, {
          is_active: !location.is_active
        });
        toast.success(`Location "${location.name}" ${action}d successfully.`);
        fetchLocations();
      } catch (error) {
        toast.error(`Failed to ${action} location "${location.name}".`);
        console.error(`Error ${action}ing location:`, error);
      }
    }
  };

  const handleDeleteLocation = async (location) => {
    if (window.confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
      try {
        await axiosClient.delete(`/api/locations/${location.id}/`);
        toast.success(`Location "${location.name}" deleted successfully.`);
        fetchLocations();
      } catch (error) {
        toast.error(`Failed to delete location "${location.name}".`);
        console.error('Error deleting location:', error);
      }
    }
  };

  const handleLocationCreated = () => {
    setShowCreateDialog(false);
    fetchLocations();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Location Management</CardTitle>
            <CardDescription>
              Manage store locations and their availability status.
            </CardDescription>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Location
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Location</DialogTitle>
                <DialogDescription>
                  Add a new location to your store network.
                </DialogDescription>
              </DialogHeader>
              <LocationCreateForm 
                onSuccess={handleLocationCreated}
                onClose={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location Info</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan="5" className="h-24 text-center">
                      Loading locations...
                    </TableCell>
                  </TableRow>
                ) : locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="5" className="h-24 text-center">
                      No locations found. Create your first location!
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map(location => (
                    <TableRow key={location.id}>
                      {/* Location Info */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div className="font-medium">{location.name}</div>
                        </div>
                      </TableCell>

                      {/* Address */}
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {location.address || 'No address provided'}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={location.is_active ? 'default' : 'secondary'}>
                          <div className="flex items-center gap-1">
                            {location.is_active ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            {location.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>

                      {/* Created */}
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(location.created_at)}</span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleToggleActive(location)}
                            >
                              {location.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteLocation(location)} 
                              className="text-red-500 focus:text-red-500"
                            >
                              Delete Location
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationList;