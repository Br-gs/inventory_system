import { ProductList, MovementForm, Sidebar, ProductForm} from "../components";
import { useState, useCallback, useContext, useEffect} from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AuthContext from '../context/authContext';
import { useSearchParams } from 'react-router-dom';

import { CardContent, CardDescription, CardHeader, CardTitle, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';

const ProductsPage = () => {
    const { user } = useContext(AuthContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [sidebarContent, setSidebarContent] = useState(null);
    const [productToEdit, setProductToEdit] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        is_active: searchParams.get('is_active') || '',
        low_stock: searchParams.get('low_stock') || '',
    });

    useEffect(() => {
        const activeFilters = Object.fromEntries(
        // eslint-disable-next-line no-unused-vars
        Object.entries(filters).filter(([_, value]) => value)
        );
        setSearchParams(activeFilters, { replace: true });
    }, [filters, setSearchParams]);

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const openCreateProductSidebar = useCallback(() => {
        setProductToEdit(null);
        setSidebarContent('product');
    }, []);

    const openEditProductSidebar = useCallback((product) => {
        setProductToEdit(product);
        setSidebarContent('product');
    }, []);

    const openMovementSidebar = useCallback(() => {
        setSidebarContent('movement');
    }, []);

    const closeSidebar = useCallback(() => {
        setSidebarContent(null);
    }, []);

    const handleProductSuccess = useCallback(() => {
        closeSidebar();
        handleRefresh();
        toast.success(`Product ${productToEdit ? 'update' : 'created'} with succesed.`);
    }, [productToEdit, handleRefresh, closeSidebar]);

    const handleMovementSuccess = useCallback((newMovement) => {
        closeSidebar();
        handleRefresh();

        toast.success(
            (t) => (
                <span>
                    Movement saved successfully!
                <button onClick={() => {
                    navigate(`/movements?product=${newMovement.product}`);
                    toast.dismiss(t.id);
                }}
                className="ml-2 p-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">View Movements</button>
                </span>
        ),
            {duration: 6000,}
        );
    }, [closeSidebar, handleRefresh, navigate]);

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
                        </div>
                    )}

                            <Button onClick={openMovementSidebar}>
                                <PlusCircle className="mr-2 h-4 w-4" />Add New Movement
                            </Button>

                </CardHeader>
                <CardContent>
                    <ProductList
                        filters={filters}
                        setFilters={setFilters}
                        refreshTrigger={refreshTrigger} 
                        onEditProduct={openEditProductSidebar}
                        onRefresh={handleRefresh} />
                </CardContent>
            </Card>

            <Sidebar 
                isOpen={sidebarContent !== null} 
                onClose={closeSidebar}
                title={sidebarContent === 'product' ? (productToEdit ? 'Edit Product' : 'Add Product') : 'Add Movement'}
                description={
                    sidebarContent === 'product' 
                    ? "Complete the product details here." 
                    : "Select a product and register a new stock transaction."
                }
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