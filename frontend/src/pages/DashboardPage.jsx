import { useContext, useState, useCallback } from "react";
import AuthContext from "../context/authContext";
import {ProductList, MovementList, MovementForm, Modal } from "../components";
import toast from "react-hot-toast";

const DashboardPage = () => {
    const {user, logoutUser} = useContext(AuthContext);
    const [isMovementModalOpen, setMovementModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const handleMovementSuccess = () => {
        setMovementModalOpen(false);
        handleRefresh();
        toast.success("Movement saved successfully!");
    };

    return (
        <div className="dashboard-page">
            <header >
                <h1>Inventory Dashboard</h1>
                <div>
                    <span>¡Welcome, {user?.username}! ({user?.is_staff ? 'Admin' : 'User'}) </span>
                    <button onClick={logoutUser}>Logout</button>
                </div>
            </header>

            <hr />

            <main>
                <ProductList refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
                <MovementList refreshTrigger={refreshTrigger} />
            </main>

            {user?.is_staff && (
                <div>
                    <button onClick={() => setMovementModalOpen(true)}>Add New Movement</button>
                </div>
            )}

            <Modal isOpen={isMovementModalOpen} onClose={() => setMovementModalOpen(false)}>
                <MovementForm onSuccess={handleMovementSuccess} onClose={() => setMovementModalOpen(false)}
                refreshTrigger={refreshTrigger} />
            </Modal>
        </div>
    );
};

export default DashboardPage;