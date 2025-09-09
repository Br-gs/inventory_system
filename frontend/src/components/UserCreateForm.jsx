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

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  is_staff: z.boolean().default(false),
  profile: z.object({
    role: z.enum(['admin', 'manager', 'employee']).default('employee'),
    default_location: z.string().optional(),
    can_change_location: z.boolean().default(false),
    phone_number: z.string().optional(),
  }).optional(),
});

const UserCreateForm = ({ onSuccess, onClose }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      // Clean up the data
      const userData = {
        ...data,
        profile: {
          ...data.profile,
          default_location: data.profile.default_location ? Number(data.profile.default_location) : undefined,
        }
      };

      // Remove empty optional fields
      Object.keys(userData.profile).forEach(key => {
        if (userData.profile[key] === undefined || userData.profile[key] === '') {
          delete userData.profile[key];
        }
      });

      await authService.createUser(userData);
      toast.success(`User ${data.username} created successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.username?.[0] ||
                          error.response?.data?.email?.[0] ||
                          'Failed to create user. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Role</Label>
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
            label="Default Location"
            value={watch('profile.default_location')}
            onChange={(value) => setValue('profile.default_location', value)}
            required={false}
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
          <Label htmlFor="is_staff">Administrator privileges</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="can_change_location"
            checked={watch('profile.can_change_location')}
            onCheckedChange={(checked) => setValue('profile.can_change_location', checked)}
          />
          <Label htmlFor="can_change_location">Can change location during operations</Label>
        </div>
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