import { useState, useEffect, useCallback } from "react";
import inventoryService from "../api/inventoryService";

const MovementList = ({ refreshTrigger }) => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMovements = useCallback(async (signal) => {
        setLoading(true);
        setError(null);
        try {
            const response = await inventoryService.getInventoryMovements(null, signal);
            setMovements(response.data.results);
        } catch (err) {
            if (err.name !== 'CanceledError') {
                setError('Failed to fetch movements');
                console.error("Failed to fetch movements:", err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchMovements(controller.signal);
        return () => {
            controller.abort();
        }
    }, [fetchMovements, refreshTrigger]);

    if (loading) return <p>Loading movements...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Inventory Movements</h2>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Movement Type</th>
                        <th>Quantity</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {movements.length > 0 ? (
                        movements.map((movement) => (
                            <tr key={movement.id}>
                                <td>{movement.product_name}</td>
                                <td>{movement.movement_type_display}</td>
                                <td>{movement.quantity}</td>
                                <td>{new Date(movement.date).toLocaleDateString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4">No movements found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MovementList;