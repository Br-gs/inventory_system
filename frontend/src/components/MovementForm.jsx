import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import inventoryService from "../api/inventoryService";
import toast from "react-hot-toast";

const movementSchema = z.object({
    product_id: z.string().min(1, "Product is required"),
    quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number" })
        .int({ message: "Quantity must be an integer" })
        .nonnegative({ message: "Quantity cannot be negative" }),
    movement_type: z.enum(['IN', 'OUT', 'ADJ'], { required_error: "Movement type must be required" }),
});

const MovementForm = ({ onSuccess, onClose }) => {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const {
        register,
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
    }, []);

    const onSubmit = async (data) => {
        try {
            const movementData = {...data, product : Number(data.product)};
            await inventoryService.createInventoryMovement(movementData);
            reset();
            onSuccess();
        } catch (error) {
            console.error("Error saving movement:", error.response?.data?.detail || error.message);
            toast.error("Failed to save movement. Please try again.");
        }
    };

    if (loadingProducts) {
        return <p>Loading products...</p>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <fieldset disabled={isSubmitting}>
            <h2>Add New Movement</h2>

            <div>
                <label htmlFor="product">Product</label>
                <select id="product" {...register("product")}>
                    <option value="">-- Select a product --</option>
                    {products.map(product => (
                        <option key={product.id} value={product.id}>
                            {product.name} (Stock actual: {product.quantity})
                        </option>
                    ))}
                </select>
                {errors.product && <p className="error">{errors.product.message}</p>}
            </div>

            <div>
                <label htmlFor="quantity">Quantity</label>
                <input type="number" id="quantity" {...register("quantity")} />
                {errors.quantity && <p className="error">{errors.quantity.message}</p>}
            </div>

            <div>
                <label htmlFor="movement_type">Movement Type</label>
                <select id="movement_type" {...register("movement_type")}>
                    <option value="">-- Select movement type--</option>
                    <option value="IN">Input</option>
                    <option value="OUT">Output</option>
                    <option value="ADJ">Adjustment</option>
                </select>
                {errors.movement_type && <p className="error">{errors.movement_type.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Movement"}
            </button>
            <button type="button" onClick={onClose}>Cancel</button>
            </fieldset>
        </form>
    );
};

export default MovementForm;