import { ProductList, MovementList, MovementForm, Modal } from "../components";
import { useState, useCallback } from "react";
import toast from "react-hot-toast";

const DashboardPage = () => {
    const [isMovementModalOpen, setMovementModalOpen] = useState(false);
        const [refreshTrigger, setRefreshTrigger] = useState(0);
    
        const handleRefresh = useCallback(() => {
            setRefreshTrigger(prev => prev + 1);
        }, []);
    
        const handleMovementSuccess = () => {
            setMovementModalOpen(false);
            handleRefresh();
            toast.success("Movement saved successfully!");
        }
    return (
        <main>
            <ProductList refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
            <MovementList refreshTrigger={refreshTrigger} />

         {/*   {user?.is_staff && (
                <div>
                    <button onClick={() => setMovementModalOpen(true)}>Add New Movement</button>
                </div>
            )} */}

            <Modal isOpen={isMovementModalOpen} onClose={() => setMovementModalOpen(false)}>
                <MovementForm onSuccess={handleMovementSuccess} onClose={() => setMovementModalOpen(false)}
                refreshTrigger={refreshTrigger} />
            </Modal>
        </main>
    );
};

export default DashboardPage;