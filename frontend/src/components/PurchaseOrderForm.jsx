import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {purchasingService} from '../api';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProductCombobox from './ProductCombobox';
import SupplierCombobox from './SupplierCombobox';
import { Trash2 } from 'lucide-react';

const poItemSchema = z.object({
  product_id: z.string().min(1, "Select a product."),
  quantity: z.coerce.number().positive("The amount must be greater than 0."),
  cost_per_unit: z.coerce.number().nonnegative("The cost cannot be negative."),
});

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "Select a provider."),
  items: z.array(poItemSchema).min(1, "You must add at least one product."),
});

const PurchaseOrderForm = ({ onSuccess, onClose }) => {
  const { register, control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: "",
      items: [{ product_id: "", quantity: 1, cost_per_unit: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedSupplier = watch('supplier_id');
  const watchedItems = watch('items');

  const onSubmit = async (data) => {
    try {
      await purchasingService.createPurchaseOrder(data);
      onSuccess();
      toast.success("Purchase order successfully created.");
    } catch (error) {
      toast.error("The purchase order could not be created.");
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Order"}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;