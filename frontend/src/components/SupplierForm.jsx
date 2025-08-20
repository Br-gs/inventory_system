import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suppliersService } from '../api';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const supplierSchema = z.object({
  name: z.string().min(3, { message: 'Name is required.' }),
  tax_id: z.string().min(1, { message: 'Identification is required.' }),
  contact_person: z.string().optional(),
  email: z.string().email({ message: 'It must be a valid email address..' }).optional().or(z.literal('')),
  phone_number: z.string().optional(),
  payment_terms_days: z.coerce.number().int().nonnegative(),
  last_invoice_date: z.string().optional(),
});

const SupplierForm = ({ supplierToEdit, onSuccess, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
  });

  useEffect(() => {
    if (supplierToEdit) {
      const formattedSupplier = {
        ...supplierToEdit,
        last_invoice_date: supplierToEdit.last_invoice_date ? supplierToEdit.last_invoice_date.split('T')[0] : '',
      };
      reset(formattedSupplier);
    } else {
      reset({ name: '', tax_id: '', contact_person: '', email: '', phone_number: '', payment_terms_days: 30, last_invoice_date: '' });
    }
  }, [supplierToEdit, reset]);

  const onSubmit = async (data) => {
    try {
      if (supplierToEdit) {
        await suppliersService.updateSupplier(supplierToEdit.id, data);
      } else {
        await suppliersService.createSupplier(data);
      }
      onSuccess();
    } catch (error) {
      const apiErrors = error.response?.data;
      if (apiErrors) {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          toast.error(`${field}: ${Array.isArray(messages) ? messages.join(' ') : messages}`);
        });
      } else {
        toast.error('The supplier could not be saved.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name / Company Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tax_id">NIT / Identification</Label>
        <Input id="tax_id" {...register('tax_id')} />
        {errors.tax_id && <p className="text-sm text-red-500 mt-1">{errors.tax_id.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="contact_person">Main Contact Name</Label>
        <Input id="contact_person" {...register('contact_person')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone_number">Phone</Label>
          <Input id="phone_number" {...register('phone_number')} />
        </div>

      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="payment_terms_days">Payment Terms</Label>
        <Select onValueChange={(value) => setValue('payment_terms_days', parseInt(value))} defaultValue="30">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Cash</SelectItem>
            <SelectItem value="15">15 Days</SelectItem>
            <SelectItem value="30">30 Days</SelectItem>
            <SelectItem value="60">60 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="last_invoice_date">Date of Last Invoice (Simulation)</Label>
        <Input id="last_invoice_date" type="date" {...register('last_invoice_date')} />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;