import { useState, useEffect, useContext, useCallback } from "react";
import { inventoryService } from "../api";
import { Modal } from "./modal";
import { ProductForm } from "./productForm";
import { AuthContext } from "../context/AuthContext";

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);

    const fetchProducts = useCallback(async (signal) => {
        setLoading(true);
        setError(null);
        try {
            const response = await inventoryService.getProducts(null, signal);
            setProducts(response.data.results);
        } catch (err) {
            if (err.name !== 'CancelError'){
                setError("Failed to fetch products");
                console.error("Error fetching products:", err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchProducts(controller.signal);

        return () => {
            controller.abort(); // Cancel the fetch request on unmount
        };
    }, [fetchProducts]);

    const handleCreate = () => {
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (productId) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await inventoryService.deleteProduct(productId);
                alert("Product deleted successfully");
                fetchProducts(new AbortController().signal);
            } catch (err) {
                setError("Failed to delete product");
                console.error("Error deleting product:", err);
            }
        }
    };

    const handleSuccess = () => {
        setIsModalOpen(true);
        fetchProducts(new AbortController().signal);
        alert("Product saved successfully");
    };

    if (loading && products.length === 0) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div>
            <div>
                <h2>Product List</h2>
                {user?.is_staff && (
                    <button onClick={handleCreate}>Add New Product</button>
                )}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        { user?.is_staff && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.description}</td>
                            <td>${Number(product.price).toFixed(2)}</td>
                            <td>{product.quantity}</td>
                                {user?.is_staff && (
                                    <td>
                                        <button onClick={() => handleEdit(product)}>Edit</button>
                                        <button onClick={() => handleDelete(product.id)}>Delete</button>
                                    </td>
                                )}
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ProductForm
                    productToEdit={productToEdit}
                    onSuccess={handleSuccess}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default ProductList;
    