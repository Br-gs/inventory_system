import { useState } from "react";
import { useMovements } from "../hooks";
import MovementFilters from "./MovementFilters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import TableSkeleton from "./TableSkeleton";

const PAGE_SIZE = 10

const MovementList = ({ refreshTrigger, initialProductFilter = null }) => {
    const [filters, setFilters] = useState({
        product: initialProductFilter || '',
        movement_type: '',
        start_date: '',
        end_date: '',
        location: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    
    const { data, loading, error} = useMovements(filters, currentPage, refreshTrigger);

    const movements = data?.results ?? [];
    const totalMovements = data?.count ?? 0;
    const totalPages = Math.ceil(totalMovements / PAGE_SIZE);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value
        }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handleLocationChange = (locationId) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            location: locationId
        }));
        setCurrentPage(1); // Reset to first page when location changes
    };

    const handleClearFilters = () => {
        setFilters({
            product: '',
            movement_type: '',
            start_date: '',
            end_date: '',
            location: ''
        });
        setCurrentPage(1); // Reset to first page
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return `$${Number(value).toFixed(2)}`;
    };

    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

    return (
        <div className="space-y-4">
            <MovementFilters 
                filters={filters} 
                onFilterChange={handleFilterChange}
                onLocationChange={handleLocationChange}
                selectedLocation={filters.location}
                onClearFilters={handleClearFilters}
            />
            
            <div className="rounded-md border">
               <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Type of Movement</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-center">Unit Price</TableHead>
                            <TableHead className="text-center">Total Value</TableHead>
                            <TableHead>Date and Time</TableHead>
                            <TableHead>Made By</TableHead> 
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableSkeleton columns={8} />
                        ) : movements.length > 0 ? (
                            movements.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell className="font-medium">{movement.product_name}</TableCell>
                                    <TableCell className="text-sm">
                                        {movement.location_name}
                                        {movement.destination_location_name && (
                                            <span className="text-muted-foreground">
                                                {' → ' + movement.destination_location_name}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                            ${movement.movement_type === 'IN' 
                                                ? 'bg-green-100 text-green-800' 
                                                : movement.movement_type === 'OUT' 
                                                ? 'bg-red-100 text-red-800'
                                                : movement.movement_type === 'TRF'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {movement.movement_type_display}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center font-mono">{movement.quantity}</TableCell>
                                    <TableCell className="text-center font-mono">
                                        {formatCurrency(movement.unit_price)}
                                    </TableCell>
                                    <TableCell className="text-center font-mono font-semibold">
                                        {formatCurrency(movement.total_value)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(movement.date).toLocaleString('es-CO', {
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit', hour12: true,
                                        })}
                                    </TableCell>
                                    <TableCell>{movement.user_username || 'System'}</TableCell>

                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan="8" className="h-24 text-center">
                                    Don't found movements.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent className="space-x-1"> 
                        <PaginationItem>
                            <PaginationPrevious 
                                href="#" 
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    if (currentPage > 1) {
                                        setCurrentPage(p => p - 1); 
                                    }
                                }}
                                disabled={currentPage === 1}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                        
                        <PaginationItem>
                            <PaginationLink href="#" isActive>
                                {currentPage}
                            </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <span className="p-2 text-sm text-muted-foreground">of {totalPages}</span>
                        </PaginationItem>

                        <PaginationItem>
                            <PaginationNext 
                                href="#" 
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    if (currentPage < totalPages) {
                                        setCurrentPage(p => p + 1); 
                                    }
                                }}
                                disabled={currentPage >= totalPages}
                                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

        </div>
    );
};

export default MovementList;