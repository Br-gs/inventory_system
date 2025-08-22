import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suppliersService } from '../api';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const supplierSchema = z.object({
  name: z.string().min(3, { message: 'Name is required.' }),
  tax_id: z.string().min(1, { message: 'Identification is required.' }),
  contact_person: z.string().optional(),
  email: z.string().email({ message: 'It must be a valid email address..' }).optional().or(z.literal('')),
  phone_number: z.string().optional(),
  payment_terms: z.coerce.number().int().nonnegative({ message: 'Payment terms must be a positive number.' }),
});

const PAYMENT_TERMS_OPTIONS = [
  { value: 0, label: 'Cash (0 days)' },
  { value: 7, label: '7 days' },
  { value: 15, label: '15 days' },
  { value: 30, label: '30 days' },
  { value: 45, label: '45 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

const SupplierForm = ({ supplierToEdit, onSuccess, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
  });

  const currentPaymentTerms = watch('payment_terms');

  useEffect(() => {
    if (supplierToEdit) {
      const formData = {
        name: supplierToEdit.name || '',
        tax_id: supplierToEdit.tax_id || '',
        contact_person: supplierToEdit.contact_person || '',
        email: supplierToEdit.email || '',
        phone_number: supplierToEdit.phone_number || '',
        payment_terms: supplierToEdit.payment_terms || 30,
      };
      reset(formData);
    } else {
      reset({ 
        name: '', 
        tax_id: '', 
        contact_person: '', 
        email: '', 
        phone_number: '', 
        payment_terms: 30 
      });
    }

  }, [supplierToEdit, reset]);

  const onSubmit = async (data) => {
    try {
      if (supplierToEdit) {
        await suppliersService.updateSupplier(supplierToEdit.id, data);
        toast.success('Supplier updated successfully.');
      } else {
        await suppliersService.createSupplier(data);
        toast.success('Supplier created successfully.');
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
    <div className="space-y-6">
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
          <Label htmlFor="payment_terms">Payment Terms</Label>
          <Select 
            onValueChange={(value) => setValue('payment_terms', parseInt(value))} 
            value={currentPaymentTerms?.toString() || "30"}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_TERMS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.payment_terms && <p className="text-sm text-red-500 mt-1">{errors.payment_terms.message}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (supplierToEdit ? 'Update Supplier' : 'Create Supplier')}
          </Button>
        </div>
      </form>

      {supplierToEdit && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Payment Information</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Purchase Date:</span>
              <span>
                {supplierToEdit.last_purchase_date 
                  ? new Date(supplierToEdit.last_purchase_date).toLocaleDateString()
                  : 'No purchases yet'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Due Date:</span>
              <span>
                {supplierToEdit.payment_due_date 
                  ? new Date(supplierToEdit.payment_due_date).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status:</span>
              <span className={supplierToEdit.payment_status?.css_class || ''}>
                {supplierToEdit.payment_status?.text || 'N/A'}
              </span>
            </div>
            {supplierToEdit.total_outstanding_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding Amount:</span>
                <span className="font-medium">
                  ${Number(supplierToEdit.total_outstanding_amount).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierForm;