import { useState } from "react";
import { useMovements } from "../hooks";
import MovementFilters from "./MovementFilters";

const MovementList = ({ refreshTrigger }) => {
    const [filters, setFilters] = useState({
        product: '',
        movementType: '',
        start_date: '',
        end_date: ''
    });
    
    const { movements, loading, error} = useMovements(filters, refreshTrigger);

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
                                    <td>{new Date(movement.date).toLocaleDateString('es-CO', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                        })}
                                    </td>
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