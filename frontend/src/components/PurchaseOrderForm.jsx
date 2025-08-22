import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {purchasingService, suppliersService} from '../api';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ProductCombobox from './ProductCombobox';
import SupplierCombobox from './SupplierCombobox';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const poItemSchema = z.object({
  product_id: z.string().min(1, "Select a product."),
  quantity: z.coerce.number().positive("The amount must be greater than 0."),
  cost_per_unit: z.coerce.number().nonnegative("The cost cannot be negative."),
});

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "Select a provider."),
  items: z.array(poItemSchema).min(1, "You must add at least one product."),
  payment_terms: z.coerce.number().positive("Payment terms must be positive").optional(),
  is_paid: z.boolean().optional(),
});

const PurchaseOrderForm = ({ onSuccess, onClose, orderToEdit = null }) => {
  const [supplierDefaultTerms, setSupplierDefaultTerms] = useState(null);
  const [useCustomTerms, setUseCustomTerms] = useState(false);
  
  const { register, control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: orderToEdit ? {
      supplier_id: orderToEdit.supplier.id.toString(),
      items: orderToEdit.items.map(item => ({
        product_id: item.product.id.toString(),
        quantity: item.quantity,
        cost_per_unit: item.cost_per_unit,
      })),
      payment_terms: orderToEdit.payment_terms,
      is_paid: orderToEdit.is_paid,
    } : {
      supplier_id: "",
      items: [{ product_id: "", quantity: 1, cost_per_unit: 0 }],
      payment_terms: undefined,
      is_paid: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedSupplier = watch('supplier_id');
  const watchedItems = watch('items');
  const watchedPaymentTerms = watch('payment_terms');
  const watchedIsPaid = watch('is_paid');

  // Initialize useCustomTerms based on whether editing and has custom terms
  useEffect(() => {
    if (orderToEdit && orderToEdit.payment_terms !== orderToEdit.supplier.payment_terms) {
      setUseCustomTerms(true);
    }
  }, [orderToEdit]);

  // Fetch supplier data when supplier changes
  useEffect(() => {
    const fetchSupplierData = async () => {
      if (watchedSupplier) {
        try {
          const response = await suppliersService.getSupplier(watchedSupplier);
          setSupplierDefaultTerms(response.data.payment_terms);
          // Set payment terms to supplier default if not using custom terms
          if (!useCustomTerms && !orderToEdit) {
            setValue('payment_terms', response.data.payment_terms);
          }
        } catch (error) {
          console.error('Failed to fetch supplier data:', error);
        }
      }
    };
    fetchSupplierData();
  }, [watchedSupplier, setValue, useCustomTerms, orderToEdit]);

  const onSubmit = async (data) => {
    try {
      // If not using custom terms, ensure we use supplier default
      if (!useCustomTerms) {
        data.payment_terms = supplierDefaultTerms;
      }
      
      if (orderToEdit) {
        await purchasingService.updatePurchaseOrder(orderToEdit.id, data);
        toast.success("Purchase order successfully updated.");
      } else {
        await purchasingService.createPurchaseOrder(data);
        toast.success("Purchase order successfully created.");
      }
      onSuccess();
    } catch (error) {
      toast.error(`The purchase order could not be ${orderToEdit ? 'updated' : 'created'}.`);
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Supplier</Label>
        <SupplierCombobox 
          value={watchedSupplier}
          onChange={(e) => setValue('supplier_id', e.target.value, { shouldValidate: true })} 
        />
        {errors.supplier_id && <p className="text-sm text-red-500 mt-1">{errors.supplier_id.message}</p>}
      </div>

      <Label>Items in the Order</Label>
      <div className="space-y-4 rounded-md border p-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-end">
            <div className="flex-grow">
              <Label>Product</Label>
              <ProductCombobox 
                value={watchedItems[index]?.product_id}
                name="product_id"
                onChange={(e) => setValue(`items.${index}.product_id`, e.target.value, { shouldValidate: true })}
              />
              {errors.items?.[index]?.product_id && (
                <p className="text-sm text-red-500 mt-1">{errors.items[index].product_id.message}</p>
              )}
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" {...register(`items.${index}.quantity`)} />
              {errors.items?.[index]?.quantity && (
                <p className="text-sm text-red-500 mt-1">{errors.items[index].quantity.message}</p>
              )}
            </div>
            <div>
              <Label>Cost/Unit</Label>
              <Input type="number" step="0.01" {...register(`items.${index}.cost_per_unit`)} />
              {errors.items?.[index]?.cost_per_unit && (
                <p className="text-sm text-red-500 mt-1">{errors.items[index].cost_per_unit.message}</p>
              )}
            </div>
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              onClick={() => remove(index)}
              disabled={fields.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.items && <p className="text-sm text-red-500">{errors.items.message || errors.items.root?.message}</p>}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ product_id: "", quantity: 1, cost_per_unit: 0 })}
        >
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="custom-terms"
              checked={useCustomTerms}
              onCheckedChange={setUseCustomTerms}
              disabled={!watchedSupplier}
            />
            <Label htmlFor="custom-terms">Use custom payment terms</Label>
          </div>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              {...register('payment_terms')}
              placeholder={supplierDefaultTerms ? `Default: ${supplierDefaultTerms} days` : 'Payment terms'}
              disabled={!useCustomTerms || !watchedSupplier}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          {errors.payment_terms && <p className="text-sm text-red-500">{errors.payment_terms.message}</p>}
        </div>

        {orderToEdit && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is-paid"
              checked={watchedIsPaid}
              onCheckedChange={(checked) => setValue('is_paid', checked)}
            />
            <Label htmlFor="is-paid">Mark as paid</Label>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (orderToEdit ? "Updating..." : "Creating...") : (orderToEdit ? "Update Order" : "Create Order")}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;