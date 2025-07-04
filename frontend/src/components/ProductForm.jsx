import { useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { inventoryService } from "../api";

const productSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    description: z.string().optional(),
    price: z.coerce.number({ invalid_type_error: "Price must be a number" })
        .positive({ message: "Price must be a positive number" }),
    quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number" })
        .int({ message: "Quantity must be an integer" })
        .nonnegative({ message: "Quantity cannot be negative" }),
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
        if (productToEdit) {
            reset(productToEdit);
        }
    }, [productToEdit, reset]);

    const onSubmit = async (data) => {
        try {
            if (productToEdit) {
                await inventoryService.updateProduct(productToEdit.id, data);
            } else {
                await inventoryService.createProduct(data);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving product:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>{productToEdit ? "Edit Product" : "Add New Product"}</h2>

            <div>
                <label htmlFor="name">Name:</label>
                <input
                    id="name"
                    type="text"
                    {...register("name")}
                />
                {errors.name && <p className="error">{errors.name.message}</p>}
            </div>

            <div>
                <label htmlFor="description">Description:</label>
                <textarea
                    id="description"
                    {...register("description")}
                />
                {errors.description && <p className="error">{errors.description.message}</p>}
            </div>

            <div>
                <label htmlFor="price">Price:</label>
                <input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price")}
                />
                {errors.price && <p className="error">{errors.price.message}</p>}
            </div>

            <div>
                <label htmlFor="quantity">Quantity:</label>
                <input
                    id="quantity"
                    type="number"
                    {...register("quantity")}
                />
                {errors.quantity && <p className="error">{errors.quantity.message}</p>}
            </div> 

            <div>
                <label htmlFor="is_active">Active:</label>
                <input
                    id="is_active"
                    type="checkbox"
                    {...register("is_active")}
                />
                {errors.is_active && <p className="error">{errors.is_active.message}</p>}
            </div>

            <div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Product"}
                </button>
                <button type="button" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
