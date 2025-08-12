import { useState } from "react";
import { useMovements } from "../hooks";
import MovementFilters from "./MovementFilters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const PAGE_SIZE = 20

const MovementList = ({ refreshTrigger }) => {
    const [filters, setFilters] = useState({
        product: '',
        movementType: '',
        start_date: '',
        end_date: ''
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
    };

    const handleClearFilters = () => {
        setFilters({
            product: '',
            movementType: '',
            start_date: '',
            end_date: ''
        });
    };

    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

    return (
        <div className="space-y-4">
            <MovementFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                onClearFilters={handleClearFilters}
            />
            
            <div className="rounded-md border">
               <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Type of Movement</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Date and Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan="4" className="h-24 text-center">
                                    Loading history...
                                </TableCell>
                            </TableRow>
                        ) : movements.length > 0 ? (
                            movements.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell className="font-medium">{movement.product_name}</TableCell>
                                    <TableCell>{movement.movement_type_display}</TableCell>
                                    <TableCell>{movement.quantity}</TableCell>
                                    <TableCell>
                                        {new Date(movement.date).toLocaleString('es-CO', {
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit', hour12: true,
                                        })}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan="4" className="h-24 text-center">
                                    Don't found movements.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious 
                                        href="#" 
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                                        disabled={currentPage === 1}
                                    />
                                </PaginationItem>
                                
                                <PaginationItem>
                                    <PaginationLink href="#">
                                        Page {currentPage} of {totalPages}
                                    </PaginationLink>
                                </PaginationItem>
            
                                <PaginationItem>
                                    <PaginationNext 
                                        href="#" 
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                                        disabled={currentPage === totalPages}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>

        </div>
    );
};

export default MovementList;