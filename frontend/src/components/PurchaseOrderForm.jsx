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
import { Trash2, ExternalLink } from 'lucide-react';
import { useEffect} from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  status: z.string().optional(),
});

const PurchaseOrderForm = ({ onSuccess, onClose, orderToEdit = null }) => {
  
  const { 
    register, 
    control, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    setValue, 
    watch 
  } = useForm({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: orderToEdit ? {
      supplier_id: orderToEdit.supplier.id.toString() || "",
      items: orderToEdit.items.map(item => ({
        product_id: item.product.id.toString(),
        quantity: item.quantity,
        cost_per_unit: item.cost_per_unit,
      })),
      payment_terms: orderToEdit.payment_terms || 30,
      is_paid: orderToEdit.is_paid || false,
      status: orderToEdit.status || 'pending',
    } : {
      supplier_id: "",
      items: [{ product_id: "", quantity: 1, cost_per_unit: 0 }],
      payment_terms: 30,
      is_paid: false,
      status: 'pending',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedSupplier = watch('supplier_id');
  const watchedItems = watch('items');
  const watchedIsPaid = watch('is_paid');
  const watchedStatus = watch('status');

  // Fetch supplier data when supplier changes
  useEffect(() => {
    const fetchSupplierData = async () => {
      if (watchedSupplier && !orderToEdit) {
        try {
          const response = await suppliersService.getSupplier(watchedSupplier);
          setValue('payment_terms', response.data.payment_terms);
        } catch (error) {
          console.error('Failed to fetch supplier data:', error);
        }
      }
    };
    fetchSupplierData();
  }, [watchedSupplier, setValue, orderToEdit]);

  const onSubmit = async (data) => {
    try {
      console.log('Submitting purchase order data:', data);
      
      let response;
      if (orderToEdit) {
        response = await purchasingService.updatePurchaseOrder(orderToEdit.id, data);
        console.log('Update response:', response.data); // Debug log
        
        if (response.data.inventory_processed) {
          const totalItems = response.data.items_processed || 0;
          toast.success(
            (t) => (
              <div className="flex flex-col gap-2">
                <span className="font-semibold">Purchase order updated successfully!</span>
                <span className="text-sm text-gray-600">
                  {totalItems} items added to inventory with updated prices
                </span>
                <button 
                  onClick={() => {
                    window.open('/movements', '_blank');
                    toast.dismiss(t.id);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors self-start"
                >
                  <ExternalLink size={14} />
                  View Inventory Movements
                </button>
              </div>
            ),
            { duration: 4000 }
          );
        } else {
          toast.success("Purchase order successfully updated.");
        }
      } else {
        response = await purchasingService.createPurchaseOrder(data);
        toast.success("Purchase order successfully created.");
      }
      onSuccess();
    } catch (error) {
      console.error('Error submitting purchase order:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          `The purchase order could not be ${orderToEdit ? 'updated' : 'created'}.`;
      toast.error(errorMessage);
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
      <div className="space-y-3 rounded-md border p-4 max-h-96 overflow-y-auto">
        {/* Desktop Header - only show on larger screens */}
        <div className="hidden lg:grid grid-cols-12 gap-2 text-sm font-medium text-white-600 pb-2 border-b border-gray-200">
          <div className="col-span-5">Product</div>
          <div className="col-span-2 text-center">Quantity</div>
          <div className="col-span-2 text-center">Cost/Unit</div>
          <div className="col-span-2 text-center">Total</div>
          <div className="col-span-1"></div>
        </div>
        
        {fields.map((field, index) => {
          const quantity = watchedItems[index]?.quantity || 0;
          const costPerUnit = watchedItems[index]?.cost_per_unit || 0;
          const itemTotal = quantity * costPerUnit;
          
          return (
            <div key={field.id} className="space-y-3 lg:space-y-0">
              {/* Mobile/Small screens - Stacked layout */}
              <div className="lg:hidden space-y-3 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Product</Label>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <ProductCombobox 
                  value={watchedItems[index]?.product_id}
                  name="product_id"
                  onChange={(e) => setValue(`items.${index}.product_id`, e.target.value, { shouldValidate: true })}
                />
                {errors.items?.[index]?.product_id && (
                  <p className="text-xs text-red-500">{errors.items[index].product_id.message}</p>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Quantity</Label>
                    <Input 
                      type="number" 
                      {...register(`items.${index}.quantity`)}
                      className="text-center"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-xs text-red-500 mt-1">{errors.items[index].quantity.message}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">Cost/Unit</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...register(`items.${index}.cost_per_unit`)}
                      className="text-right"
                    />
                    {errors.items?.[index]?.cost_per_unit && (
                      <p className="text-xs text-red-500 mt-1">{errors.items[index].cost_per_unit.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Item Total:</span>
                  <span className="font-semibold">${itemTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Desktop/Large screens - Grid layout */}
              <div className="hidden lg:grid grid-cols-12 gap-2 items-center py-3 border-b border-gray-100 last:border-b-0">
                <div className="col-span-5">
                  <ProductCombobox 
                    value={watchedItems[index]?.product_id}
                    name="product_id"
                    onChange={(e) => setValue(`items.${index}.product_id`, e.target.value, { shouldValidate: true })}
                  />
                  {errors.items?.[index]?.product_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.items[index].product_id.message}</p>
                  )}
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className="w-20">
                    <Input 
                      type="number" 
                      {...register(`items.${index}.quantity`)}
                      className="text-center"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-xs text-red-500 mt-1 text-center">{errors.items[index].quantity.message}</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className="w-30">
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...register(`items.${index}.cost_per_unit`)}
                      className="text-right text-sm"
                    />
                    {errors.items?.[index]?.cost_per_unit && (
                      <p className="text-xs text-red-500 mt-1 text-center">{errors.items[index].cost_per_unit.message}</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-center font-medium text-sm">
                  ${itemTotal.toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 -mx-4 px-4 py-2 mt-3">
          <div className="text-lg font-bold">
            Total: ${fields.reduce((sum, _, index) => {
              const quantity = watchedItems[index]?.quantity || 0;
              const costPerUnit = watchedItems[index]?.cost_per_unit || 0;
              return sum + (quantity * costPerUnit);
            }, 0).toFixed(2)}
          </div>
        </div>
        
        {errors.items && <p className="text-sm text-red-500">{errors.items.message || errors.items.root?.message}</p>}
        
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ product_id: "", quantity: 1, cost_per_unit: 0 })}
          className="w-full"
        >
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Payment Terms (Days)</Label>
          <Input 
            type="number" 
            {...register('payment_terms')} 
            placeholder="30"
          />
          {errors.payment_terms && <p className="text-sm text-red-500 mt-1">{errors.payment_terms.message}</p>}
        </div>

        {orderToEdit && (
          <div className="grid gap-2">
            <Label>Status</Label>
            {orderToEdit.status === 'received' ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                <span className="text-green-700 font-medium">✓ Received</span>
                <span className="text-sm text-green-600">(Status cannot be changed)</span>
              </div>
            ) : (
              <Select 
                value={watchedStatus} 
                onValueChange={(value) => {
                  if (value === 'received') {
                    if (window.confirm(
                      "⚠️ IMPORTANT: Once you mark this order as 'Received':\n\n" +
                      "• Inventory will be automatically updated\n" +
                      "• Product prices will be recalculated\n" +
                      "• Status CANNOT be changed again\n\n" +
                      "Are you sure you want to mark this order as received?"
                    )) {
                      setValue('status', value);
                    }
                  } else {
                    setValue('status', value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : (orderToEdit ? "Update Order" : "Create Order")}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;