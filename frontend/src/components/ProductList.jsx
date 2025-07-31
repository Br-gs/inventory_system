import { useContext, useState } from "react";
import { inventoryService } from "../api";
import AuthContext from "../context/authContext";
import toast from "react-hot-toast";
import ProductFilters from "./ProductFilters";
import {useProducts} from "../hooks";

const ProductList = ({onRefresh, refreshTrigger, onEditProduct}) => {
    const { user } = useContext(AuthContext);
    const [filters, setFilters] = useState({
        search: '',
        is_active: ''
    });

    const { products, loading, error } = useProducts(filters, refreshTrigger);

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

    if (loading && products.length === 0) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div>
            <div>
                <ProductFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                searchValue={filters.search}
                onSearchChange={handleSearchChange} 
                />

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
                                                <button onClick={() => onEditProduct(product)}>Edit</button>
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
            </div>
        </div>
    );
};

export default ProductList;
    