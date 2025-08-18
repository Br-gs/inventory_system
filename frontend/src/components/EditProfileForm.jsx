import { useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {z} from 'zod'
import { axiosClient } from "@/api";
import toast from 'react-hot-toast'
import AuthContext from "@/context/authContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email("Must be a valid email"),
});

const EditProfileForm = () => {
    const { user, updateUserContext } = useContext(AuthContext);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(profileSchema),
        mode: onblur,
        defaultValues: {
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        },
    });

    const onSubmit = async (data) => {
    try {
      const response = await axiosClient.patch('/api/user/profile/', data);
      toast.success('Profile successfully updated.');

      updateUserContext(response.data);
    } catch (error) {
      toast.error('The profile could not be updated..');
      console.error("Error updating profile:", error);
    }
  };

  return  (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="first_name">Name</Label>
          <Input id="first_name" {...register("first_name")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" {...register("last_name")} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
};

export default EditProfileForm;
