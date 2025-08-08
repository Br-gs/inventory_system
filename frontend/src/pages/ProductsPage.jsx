import { ProductList, MovementForm, Sidebar, ProductForm} from "../components";
import { useState, useCallback, useContext} from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AuthContext from '../context/authContext';
import { CardContent, CardDescription, CardHeader, CardTitle, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';

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
                }}
                className="ml-2 p-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">View Movements</button>
                </span>
        ),
            {duration: 5000,}
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Manage Products</CardTitle>
                        <CardDescription>Manage your product catalog and record stock movements.</CardDescription>
                    </div>
                    
                    {user?.is_staff && (
                        <div className="flex gap-2">
                            <Button onClick={openCreateProductSidebar}>
                                <PlusCircle className="mr-2 h-4 w-4" />Add New Product
                            </Button>
                            <Button onClick={openMovementSidebar}>
                                <PlusCircle className="mr-2 h-4 w-4" />Add New Movement
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <ProductList 
                        refreshTrigger={refreshTrigger} 
                        onEditProduct={openEditProductSidebar}
                        onRefresh={handleRefresh} />
                </CardContent>
            </Card>

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