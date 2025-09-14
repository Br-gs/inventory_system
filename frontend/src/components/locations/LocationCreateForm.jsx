import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { axiosClient } from '@/api';
import toast from 'react-hot-toast';

const LocationCreateForm = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosClient.post('/api/locations/', formData);
      toast.success(`Location "${formData.name}" created successfully!`);
      onSuccess(response.data);
      setFormData({ name: '', address: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.name?.[0] || 
                          error.response?.data?.detail || 
                          'Failed to create location';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">
          Location Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter location name"
          required
          disabled={loading}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter location address (optional)"
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim()}
        >
          {loading ? 'Creating...' : 'Create Location'}
        </Button>
      </div>
    </form>
  );
};

export default LocationCreateForm;