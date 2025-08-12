import { useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { inventoryService } from "../api";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const productSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    description: z.string().optional(),
    price: z.coerce.number({ invalid_type_error: "Price must be a number" })
        .positive({ message: "Price must be a positive number" }),
    initial_quantity: z.coerce.number({ invalid_type_error: "Initial quantity must be a number" })
        .int({ message: "Initial quantity must be an integer" })
        .nonnegative({ message: "Initial quantity cannot be negative" })
        .default(0),
    is_active: z.boolean().default(true),
});

const ProductForm = ({ productToEdit, onSuccess, onClose }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(productSchema),
        mode: 'onBlur',
        defaultValues:{
            name: productToEdit?.name || '',
            description: productToEdit?.description || '',
            price: productToEdit?.price || 0,
            quantity: productToEdit?.quantity || 0,
            is_active: productToEdit?.is_active ?? true,
        },
    });

    useEffect(() => {
        const defaultValuesForCreate = {
            name: '',
            description: '',
            price: 0,
            initial_quantity: 0,
            is_active: true,
            };

        reset(productToEdit || defaultValuesForCreate);
    }, [productToEdit, reset]);

    const onSubmit = async (data) => {
        try {
            if (productToEdit) {
                await inventoryService.updateProduct(productToEdit.id, data);
            } else {
                await inventoryService.createProduct(data);
            }
            reset();
            onSuccess();
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "An error occurred while saving the product.";
            console.error("Error saving product:", error);
            toast.error(`Error: ${errorMessage}`);

        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" type="text" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}        
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" step="0.01" {...register('price')} />
                {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
            </div>

            {productToEdit ? (
                <div className="grid gap-2">
                    <Label>Quantity in Stock</Label>
                    <Input value={productToEdit.quantity} readOnly disabled />
                    <p className="text-xs text-muted-foreground">To change the amount, create a transaction.</p>
                </div>
            ) : (
                <div className="grid gap-2">
                    <Label htmlFor="initial_quantity">Initial Quantity</Label>
                    <Input id="initial_quantity" type="number" {...register('initial_quantity')} />
                    {errors.initial_quantity && <p className="text-sm text-red-500 mt-1">{errors.initial_quantity.message}</p>}
                </div>
            )}

            <div className="flex items-center space-x-2">
                <Checkbox id="is_active" {...register('is_active')} defaultChecked={true} />
                <Label htmlFor="is_active" className="text-sm font-medium leading-none">Active Product</Label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Save Product'}
                </Button>
            </div>

            
        </form>
    );
};

export default ProductForm;
