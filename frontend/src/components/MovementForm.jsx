import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import inventoryService from "../api/inventoryService";
import toast from "react-hot-toast";

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

const MovementForm = ({ onSuccess, onClose, refreshTrigger }) => {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

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
            movement_type: '',
        },
    });

    const fetchProductsForSelect = async () => {
            try {
                const response = await inventoryService.getProducts();
                const activatedProducts = response.data.results.filter(p => p.is_active);
                setProducts(activatedProducts);
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoadingProducts(false);
            }
        };

    useEffect(() => {
        fetchProductsForSelect();
    }, [refreshTrigger]);

    const onSubmit = async (data) => {
        try {
            const movementData = {...data, product : Number(data.product)};
            await inventoryService.createInventoryMovement(movementData);
            reset();
            onSuccess();
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 
                           (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : 'No se pudo crear el movimiento.');
            console.error("Error saving movement:", error.response?.data?.detail || error.message);
            toast.error(`Failed to save movement. Please try again. ${errorMessage}`);
        }
    };

    if (loadingProducts) {
        return <p>Loading products...</p>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Select onValueChange={(value) => setValue('product', value)} disabled={loadingProducts}>
                    <SelectTrigger id="product">
                        <SelectValue placeholder="-- Select a product --" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map(product => (
                            <SelectItem key={product.id} value={String(product.id)}>
                                {product.name} (Stock: {product.quantity})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.product && <p className="text-sm text-red-500 mt-1">{errors.product.message}</p>}
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