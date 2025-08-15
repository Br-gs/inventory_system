import {useContext} from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import inventoryService from "../api/inventoryService";
import toast from "react-hot-toast";
import AuthContext from '../context/authContext';
import ProductCombobox from "./ProductCombobox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const movementSchema = z.object({
    product: z.string().min(1, "Product is required"),
    quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number" })
        .int({ message: "Quantity must be an integer" })
        .nonnegative({ message: "Quantity cannot be negative" }),
    movement_type: z.enum(['IN', 'OUT', 'ADJ'], { required_error: "Movement type must be required" }),
});

const MovementForm = ({ onSuccess, onClose}) => {
    const { user } = useContext(AuthContext);

    const {
        register,
        setValue,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(movementSchema),
        mode: 'onBlur',
        defaultValues: {
            product: '',
            quantity: 0,
            movement_type: user?.is_staff ? '' : 'OUT',
        },
    });

    const onSubmit = async (data) => {
        try {
            const movementData = {...data, product : Number(data.product)};
            const response = await inventoryService.createInventoryMovement(movementData);
            reset();
            onSuccess(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 
                           (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : 'No se pudo crear el movimiento.');
            console.error("Error saving movement:", error.response?.data?.detail || error.message);
            toast.error(`Failed to save movement. Please try again. ${errorMessage}`);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <ProductCombobox
                 value={register('product').value}
                 onChange={(e) => setValue('product', e.target.value, { shouldValidate: true })}
                />
                {errors.product && <p className="text-sm text-red-500 mt-1">{errors.product.message}</p>}
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="movement_type">Movement Type</Label>
                <Select 
                 onValueChange={(value) => setValue('movement_type', value, {shouldValidate: true })}
                 defaultValue={user?.is_staff ? '' : 'OUT'}
                 disabled={!user?.is_staff}
                >
                    <SelectTrigger id="movement_type">
                        <SelectValue placeholder="-- Select a Movement --" />
                    </SelectTrigger>
                    <SelectContent>
                        {user?.is_staff ? (
                            <>
                                <SelectItem value="IN">Input</SelectItem>
                                <SelectItem value="OUT">Sale</SelectItem>
                                <SelectItem value="ADJ">Adjustment</SelectItem>
                            </>
                        ) : (
                            <SelectItem value="OUT">Sale</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                {errors.movement_type && <p className="text-sm text-red-500 mt-1">{errors.movement_type.message}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input type="number" id="quantity" {...register("quantity")} />
                {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Save Movement"}
                </Button>
            </div>
        </form>
    );
};

export default MovementForm;