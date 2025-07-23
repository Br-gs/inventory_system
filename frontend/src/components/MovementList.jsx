import { useState, useEffect, useCallback } from "react";
import inventoryService from "../api/inventoryService";
import MovementFilters from "./MovementFilters";

const MovementList = ({ refreshTrigger }) => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        product: '',
        movementType: '',
        start_date: '',
        end_date: ''
    });
    
    const fetchMovements = useCallback(async (signal, currentFilters) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (currentFilters.product) params.append('product', currentFilters.product);
            if (currentFilters.movement_type) params.append('movement_type', currentFilters.movement_type);
            if (currentFilters.start_date) params.append('start_date', currentFilters.start_date);
            if (currentFilters.end_date) params.append('end_date', currentFilters.end_date);

            const response = await inventoryService.getInventoryMovements(params, signal);
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
        fetchMovements(controller.signal, filters);
        return () => {
            controller.abort();
        }
    }, [fetchMovements, refreshTrigger, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            product: '',
            movementType: '',
            start_date: '',
            end_date: ''
        });
    };

    if (loading) return <p>Loading movements...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Inventory Movements</h2>
            <MovementFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                onClearFilters={handleClearFilters}
            />
            
            {loading && <p>Loading movements...</p>}
            {!loading && (
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
            )}
        </div>
    );
};

export default MovementList;