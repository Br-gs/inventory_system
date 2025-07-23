import { useState, useEffect, useContext, useCallback } from "react";
import { inventoryService } from "../api";
import Modal from "./modal";
import ProductForm from "./ProductForm";
import AuthContext from "../context/authContext";
import toast from "react-hot-toast";
import ProductFilters from "./ProductFilters";

const ProductList = ({onRefresh, refreshTrigger}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        is_active: ''
    });

    const fetchProducts = useCallback(async (signal, currentFilters) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (currentFilters.search) params.append('search', currentFilters.search);
            if (currentFilters.is_active) params.append('is_active', currentFilters.is_active);
            const response = await inventoryService.getProducts(params, signal);
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

        const devounceTimer = setTimeout(() => {
            fetchProducts(controller.signal, filters);
        }, 300);

        return () => {
            clearTimeout(devounceTimer);
            controller.abort(); // Cancel the fetch request on unmount
        };
    }, [fetchProducts, refreshTrigger, filters]);

    const handleSearchChange = (searchTerm) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            search: searchTerm
        }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value
        }));
    };

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
                toast.success("Product deleted successfully");
                onRefresh();
            } catch (err) {
                const errorMessage = err.response?.data?.detail || "An error occurred while deleting the product.";
                console.error("Error deleting product:", err);
                toast.error(`Error: ${errorMessage}`);
            }
        }
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        onRefresh();
        toast.success(`Product ${productToEdit ? "updated" : "created"} successfully`);
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

            <ProductFilters filters={filters} onFilterChange={handleFilterChange} onSearch={handleSearchChange} />

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
                    {loading ? (
                        <tr>
                            <td colSpan={user?.is_staff ? 5 : 4}>Loading products...</td>
                        </tr>
                    ) : products.length > 0 ? (
                        products.map((product) => (
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
                        ))
                    ) : (
                        <tr>
                            <td colSpan={user?.is_staff ? 5 : 4}>No products found</td>
                        </tr>
                    )}
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
    