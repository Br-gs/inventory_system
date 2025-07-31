import { ProductList, MovementForm, Sidebar} from "../components";
import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ProductsPage = () => {
    const navigate = useNavigate();
    const [isMovementSidebarOpen, setMovementSidebarOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleMovementSuccess = () => {
        setMovementSidebarOpen(false);
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
            <ProductList 
            refreshTrigger={refreshTrigger} 
            onRefresh={handleRefresh} />
            <div>
                <button onClick={() => setMovementSidebarOpen(true)}>
                    Add New Movement
                </button>
            </div>

            <Sidebar 
                isOpen={isMovementSidebarOpen} 
                onClose={() => setMovementSidebarOpen(false)} 
                title="Add Movement">
                <MovementForm 
                    onSuccess={handleMovementSuccess} 
                    onClose={() => setMovementSidebarOpen(false)} 
                    refreshTrigger={refreshTrigger} />
            </Sidebar>
        </div>
    );
};

export default ProductsPage;