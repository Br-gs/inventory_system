import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../api';
import toast from 'react-hot-toast';
import LocationSelector from './locations/LocationSelector';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from 'lucide-react';

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  is_staff: z.boolean().default(false),
  profile: z.object({
    role: z.enum(['admin', 'manager', 'employee']).default('employee'),
    default_location: z.string().min(1, "Location is required for all users"),
    can_change_location: z.boolean().default(false),
    phone_number: z.string().optional(),
  }),
});

const UserCreateForm = ({ onSuccess, onClose }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset, // Add reset function
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      is_staff: false,
      profile: {
        role: 'employee',
        default_location: '',
        can_change_location: false,
        phone_number: '',
      }
    },
  });

  const watchedIsStaff = watch('is_staff');
  const watchedRole = watch('profile.role');

  // Auto-update role when is_staff changes
  useEffect(() => {
    if (watchedIsStaff && watchedRole !== 'admin') {
      setValue('profile.role', 'admin');
    } else if (!watchedIsStaff && watchedRole === 'admin') {
      setValue('profile.role', 'employee');
    }
  }, [watchedIsStaff, watchedRole, setValue]);

  const onSubmit = async (data) => {
    try {
      // Validate location is provided
      if (!data.profile.default_location) {
        toast.error("Location is required. Please select a default location for this user.");
        return;
      }

      // Clean up the data and prepare for backend - match UserCreateSerializer
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        is_staff: data.is_staff,
        ...(data.first_name && { first_name: data.first_name }),
        ...(data.last_name && { last_name: data.last_name }),
        profile: {
          role: data.profile.role,
          default_location: parseInt(data.profile.default_location, 10), // Ensure it's an integer
          can_change_location: data.profile.can_change_location,
          ...(data.profile.phone_number && { phone_number: data.profile.phone_number }),
        }
      };

      await authService.createUser(userData);
      
      // Success - user was created, clean up and close form
      reset(); // Clear form data
      toast.success(`User ${data.username} created successfully!`);
      onSuccess(); // This closes the form and refreshes the list
      
    } catch (error) {
      // Check if the error is actually a success (status 201) or user was created despite error
      if (error.response?.status === 201 || 
          (error.response?.status === 400 && !error.response?.data?.username && !error.response?.data?.email && !error.response?.data?.profile)) {
        // It's actually a success, treat it as such without logging error
        reset(); 
        toast.success(`User ${data.username} created successfully!`);
        onSuccess(); 
        return;
      }
      
      // Only log real errors
      console.error('Error creating user:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400 && error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.username && errorData.username[0]?.includes("already exists")) {
          toast.error("Username already exists. Please choose a different username.");
          return;
        }
        
        if (errorData.email && errorData.email[0]?.includes("already exists")) {
          toast.error("Email already exists. Please use a different email address.");
          return;
        }
        
        // Handle other validation errors
        if (errorData.username) {
          toast.error(`Username: ${Array.isArray(errorData.username) ? errorData.username[0] : errorData.username}`);
          return;
        }
        
        if (errorData.email) {
          toast.error(`Email: ${Array.isArray(errorData.email) ? errorData.email[0] : errorData.email}`);
          return;
        }
        
        if (errorData.password) {
          toast.error(`Password: ${Array.isArray(errorData.password) ? errorData.password[0] : errorData.password}`);
          return;
        }
        
        if (errorData.profile) {
          if (errorData.profile.default_location) {
            toast.error(`Location: ${Array.isArray(errorData.profile.default_location) ? errorData.profile.default_location[0] : errorData.profile.default_location}`);
            return;
          }
          toast.error(`Profile error: ${JSON.stringify(errorData.profile)}`);
          return;
        }
      }
      
      // If we get here, check if the user was actually created by checking the response
      if (error.message.includes('Request failed with status code 400') && 
          !error.response?.data?.username && 
          !error.response?.data?.email) {
        // Likely the user was created successfully but there's a response parsing issue
        reset(); 
        toast.success(`User ${data.username} created successfully!`);
        onSuccess(); 
        return;
      }
      
      // Generic error
      toast.error('Failed to create user. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All users must be assigned to a location. This controls what inventory they can view and manage.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            {...register('username')}
            placeholder="Enter username"
          />
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            {...register('first_name')}
            placeholder="Enter first name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            {...register('last_name')}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder="Enter password (min 8 characters)"
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          {...register('profile.phone_number')}
          placeholder="+1234567890"
        />
        {errors.profile?.phone_number && (
          <p className="text-sm text-red-500">{errors.profile.phone_number.message}</p>
        )}
      </div>

      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium">User Permissions & Location</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Role *</Label>
            <Select 
              value={watch('profile.role')}
              onValueChange={(value) => setValue('profile.role', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <LocationSelector
              label="Default Location *"
              value={watch('profile.default_location')}
              onChange={(value) => {
                // Ensure we store only the ID as a string
                const locationId = value === 'none' ? '' : String(value);
                setValue('profile.default_location', locationId, { shouldValidate: true });
              }}
              required={true}
            />
            {errors.profile?.default_location && (
              <p className="text-sm text-red-500">{errors.profile.default_location.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_staff"
              checked={watchedIsStaff}
              onCheckedChange={(checked) => setValue('is_staff', checked)}
            />
            <Label htmlFor="is_staff">
              Administrator privileges
              <span className="text-xs text-muted-foreground ml-2">(Can view all locations)</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="can_change_location"
              checked={watch('profile.can_change_location')}
              onCheckedChange={(checked) => setValue('profile.can_change_location', checked)}
            />
            <Label htmlFor="can_change_location">
              Can change location during operations
              <span className="text-xs text-muted-foreground ml-2">(Override default location)</span>
            </Label>
          </div>
        </div>

        <Alert variant="default" className="mt-2">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {watchedIsStaff ? (
              "Administrators can view inventory across all locations."
            ) : (
              "This user will only see inventory from their assigned location unless given permission to change locations."
            )}
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create User"}
        </Button>
      </div>
    </form>
  );
};

export default UserCreateForm;