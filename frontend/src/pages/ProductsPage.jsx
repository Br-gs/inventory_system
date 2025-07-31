import { ProductList, MovementForm, Sidebar, ProductForm} from "../components";
import { useState, useCallback, useContext} from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AuthContext from '../context/authContext';

const ProductsPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [sidebarContent, setSidebarContent] = useState(null);
    const [productToEdit, setProductToEdit] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const openCreateProductSidebar = () => {
        setProductToEdit(null);
        setSidebarContent('product');
    };

    const openEditProductSidebar = (product) => {
        setProductToEdit(product);
        setSidebarContent('product');
    };

    const openMovementSidebar = () => {
        setSidebarContent('movement');
    };

    const closeSidebar = () => {
        setSidebarContent(null);
    };

    const handleProductSuccess = () => {
        closeSidebar();
        handleRefresh();
        toast.success(`Product ${productToEdit ? 'update' : 'created'} with succesed.`);
    };

    const handleMovementSuccess = () => {
        closeSidebar();
        handleRefresh();

        toast.success(
            (t) => (
                <span>
                    Movement saved successfully!
                <button onClick={() => {
                    navigate("/movements");
                    toast.dismiss(t.id);
                }}>View Movements</button>
                </span>
        ),
            {duration: 5000,}
        );
    };

    return (
        <div>
            <div>
                <h1>Manage Products</h1>
                {user?.is_staff && (
                    <div>
                        <button onClick={openCreateProductSidebar}>
                            Add New Product
                        </button>
                        <button onClick={openMovementSidebar}>
                            Add New Movement
                        </button>
                    </div>
                )}
            </div>

            <ProductList 
                refreshTrigger={refreshTrigger} 
                onEditProduct={openEditProductSidebar}
                onRefresh={handleRefresh} />

            <Sidebar 
                isOpen={sidebarContent !== null} 
                onClose={closeSidebar}
                title={sidebarContent === 'product' ? (productToEdit ? 'Edit Product' : 'Add Product') : 'Add Movement'}
            >
                {sidebarContent === 'product' && (
                    <ProductForm
                        productToEdit={productToEdit}
                        onSuccess={handleProductSuccess}
                        onClose={closeSidebar}
                    />
                )}
                {sidebarContent === 'movement' && (
                    <MovementForm 
                        onSuccess={handleMovementSuccess} 
                        onClose={closeSidebar} 
                        refreshTrigger={refreshTrigger} />
                )}
            </Sidebar>
        </div>
    );
};

export default ProductsPage;