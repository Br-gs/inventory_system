import {useContext, useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import inventoryService from "../api/inventoryService";
import toast from "react-hot-toast";
import AuthContext from '../context/authContext';
import ProductCombobox from "./ProductCombobox";
import LocationSelector from "./locations/LocationSelector";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

const movementSchema = z.object({
    product: z.string().min(1, "Product is required"),
    location: z.string().min(1, "Location is required"),
    quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number" })
        .int({ message: "Quantity must be an integer" })
        .positive({ message: "Quantity must be positive" }),
    movement_type: z.enum(['IN', 'OUT', 'ADJ', 'TRF'], { 
        required_error: "Movement type is required" 
    }),
    destination_location: z.string().optional(),
    unit_price: z.coerce.number().optional(),
    notes: z.string().optional(),
});

const MovementForm = ({ onSuccess, onClose, preselectedLocation = null }) => {
    const { user } = useContext(AuthContext);
    const [productStock, setProductStock] = useState(null);
    const [availableStock, setAvailableStock] = useState(0);

    const {
        register,
        setValue,
        watch,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(movementSchema),
        mode: 'onBlur',
        defaultValues: {
            product: '',
            location: preselectedLocation || (user?.default_location_id?.toString() || ''),
            quantity: 1,
            movement_type: user?.is_staff ? '' : 'OUT',
            destination_location: '',
            unit_price: '',
            notes: '',
        },
    });

    const watchedProduct = watch('product');
    const watchedLocation = watch('location');
    const watchedMovementType = watch('movement_type');
    const watchedQuantity = watch('quantity');

    // Fetch product stock information when product or location changes
    useEffect(() => {
        const fetchProductStock = async () => {
            if (watchedProduct && watchedLocation) {
                try {
                    const response = await inventoryService.getProductById(watchedProduct);
                    const product = response.data;
                    setProductStock(product);
                    
                    // Find stock at selected location
                    const locationStock = product.stock_locations?.find(
                        stock => stock.location.id.toString() === watchedLocation
                    );
                    setAvailableStock(locationStock?.quantity || 0);
                } catch (error) {
                    console.error('Error fetching product stock:', error);
                    setAvailableStock(0);
                }
            } else {
                setAvailableStock(0);
                setProductStock(null);
            }
        };

        fetchProductStock();
    }, [watchedProduct, watchedLocation]);

    const onSubmit = async (data) => {
        try {
            const movementData = {
                ...data,
                product: Number(data.product),
                location: Number(data.location),
                movement_type: data.movement_type.startsWith('TRF_') ? 'TRF' : data.movement_type,
                destination_location: data.destination_location ? Number(data.destination_location) : undefined,
                unit_price: data.unit_price ? Number(data.unit_price) : undefined,
            };
            
            // Remove undefined fields
            Object.keys(movementData).forEach(key => {
                if (movementData[key] === undefined) {
                    delete movementData[key];
                }
            });

            const response = await inventoryService.createInventoryMovement(movementData);
            reset();
            onSuccess(response.data);
            toast.success('Movement created successfully!');
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 
                               error.response?.data?.non_field_errors?.[0] ||
                               (typeof error.response?.data === 'object' ? 
                                JSON.stringify(error.response.data) : 
                                'Could not create movement.');
            console.error("Error saving movement:", error.response?.data || error.message);
            toast.error(`Failed to save movement: ${errorMessage}`);
        }
    };

    const isTransfer = watchedMovementType === 'TRF';
    const isOutput = watchedMovementType === 'OUT';
    const isAdjustment = watchedMovementType === 'ADJ';
    
    // Check if there's insufficient stock for output/transfer
    const hasInsufficientStock = isOutput && 
                                watchedQuantity > availableStock && 
                                availableStock >= 0

    // User can override location if admin or has permission
    const canChangeLocation = user?.is_staff || user?.can_change_location;


     return (
         <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="product">Product *</Label>
                <ProductCombobox
                    value={watchedProduct}
                    onChange={(e) => setValue('product', e.target.value, { shouldValidate: true })}
                />
                {errors.product && (
                    <p className="text-sm text-red-500 mt-1">{errors.product.message}</p>
                )}
            </div>
            
            <div className="grid gap-2">
                <LocationSelector
                    label="Location"
                    value={watchedLocation}
                    onChange={(value) => setValue('location', value, { shouldValidate: true })}
                    disabled={!canChangeLocation}
                    required={true}
                />
                {errors.location && (
                    <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>
                )}
                {!canChangeLocation && (
                    <p className="text-xs text-muted-foreground">
                        Using your default location. Contact admin to change.
                    </p>
                )}
            </div>

            {/* Stock Information Display */}
            {productStock && watchedLocation && (
                <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                        <span>Available at this location:</span>
                        <span className={`font-semibold ${availableStock <= 10 ? 'text-orange-600' : availableStock === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {availableStock} units
                        </span>
                    </div>
                    {productStock.total_quantity !== availableStock && (
                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                            <span>Total across all locations:</span>
                            <span>{productStock.total_quantity} units</span>
                        </div>
                    )}
                </div>
            )}
            
            <div className="grid gap-2">
                <Label htmlFor="movement_type">Movement Type *</Label>
                <Select 
                    onValueChange={(value) => setValue('movement_type', value, { shouldValidate: true })}
                    value={watchedMovementType}
                    disabled={!user?.is_staff && watchedMovementType === 'OUT'}
                >
                    <SelectTrigger id="movement_type">
                        <SelectValue placeholder="-- Select Movement Type --" />
                    </SelectTrigger>
                    <SelectContent>
                        {user?.is_staff ? (
                            <>
                                <SelectItem value="IN">Input (Receive)</SelectItem>
                                <SelectItem value="OUT">Output (Sale/Use)</SelectItem>
                                <SelectItem value="ADJ">Adjustment</SelectItem>
                                <SelectItem value="TRF_OUT">
                                    <div className="flex items-center gap-2">
                                        <ArrowUp className="h-3 w-3" />
                                        Transfer Out
                                    </div>
                                </SelectItem>
                                <SelectItem value="TRF_IN">
                                    <div className="flex items-center gap-2">
                                        <ArrowDown className="h-3 w-3" />
                                        Transfer In
                                    </div>
                                </SelectItem>
                            </>
                        ) : (
                            <SelectItem value="OUT">Sale</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                {errors.movement_type && (
                    <p className="text-sm text-red-500 mt-1">{errors.movement_type.message}</p>
                )}
            </div>

            {/* Transfer destination */}
            {isTransfer && (
                <div className="grid gap-2">
                    <LocationSelector
                        label={watchedMovementType === 'TRF_OUT' ? "Transfer to Location" : "Transfer from Location"}
                        value={watch('destination_location')}
                        onChange={(value) => setValue('destination_location', value, { shouldValidate: true })}
                        required={true}
                    />
                    {errors.destination_location && (
                        <p className="text-sm text-red-500 mt-1">{errors.destination_location.message}</p>
                    )}
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="quantity">
                    Quantity *
                    {isAdjustment && <span className="text-xs text-muted-foreground ml-2">(Set to this amount)</span>}
                </Label>
                <Input 
                    type="number" 
                    id="quantity" 
                    min="1"
                    {...register("quantity")} 
                />
                {errors.quantity && (
                    <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
                )}
                
                {/* Stock warning */}
                {hasInsufficientStock && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Insufficient stock! Available: {availableStock} units, Requested: {watchedQuantity} units.
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Unit Price - only for inputs and adjustments, not for sales */}
            {(watchedMovementType === 'IN' || watchedMovementType === 'ADJ' || watchedMovementType === 'TRF_IN') && user?.is_staff && (
                <div className="grid gap-2">
                    <Label htmlFor="unit_price">
                        Unit Price
                        {watchedMovementType === 'IN' && <span className="text-xs text-muted-foreground ml-2">(Will update product price)</span>}
                    </Label>
                    <Input 
                        type="number" 
                        step="0.01"
                        id="unit_price" 
                        {...register("unit_price")} 
                        placeholder={productStock ? `Current: ${productStock.price}` : "0.00"}
                    />
                    {errors.unit_price && (
                        <p className="text-sm text-red-500 mt-1">{errors.unit_price.message}</p>
                    )}
                </div>
            )}

            {/* Show current price for sales (read-only) */}
            {(watchedMovementType === 'OUT' || watchedMovementType === 'TRF_OUT') && productStock && (
                <div className="grid gap-2">
                    <Label>Sale Price</Label>
                    <Input 
                        value={`${Number(productStock.price || 0).toFixed(2)}`}
                        readOnly 
                        disabled
                        className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                        Sales use the current product price and cannot be modified.
                    </p>
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                    id="notes" 
                    {...register("notes")} 
                    placeholder="Optional notes about this movement..."
                    rows={3}
                />
                {errors.notes && (
                    <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={isSubmitting || hasInsufficientStock}
                >
                    {isSubmitting ? "Creating..." : "Create Movement"}
                </Button>
            </div>
        </form>
    );
};


export default MovementForm;