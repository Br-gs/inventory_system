import { useState } from "react";
import { useMovements } from "../hooks";
import MovementFilters from "./MovementFilters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import TableSkeleton from "./TableSkeleton";
import { ArrowRight, ArrowDown, ArrowUp, ArrowRightLeft, AlertTriangle, Package} from 'lucide-react';

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

    const getMovementTypeIcon = (type) => {
        switch (type) {
            case 'IN': return <ArrowDown className="h-3 w-3" />;
            case 'OUT': return <ArrowUp className="h-3 w-3" />;
            case 'TRF': return <ArrowRightLeft className="h-3 w-3" />;
            case 'ADJ': return <AlertTriangle className="h-3 w-3" />;
            default: return null;
        }
    };

    const getMovementTypeColor = (type) => {
        switch (type) {
            case 'IN': return 'bg-green-100 text-green-800 border-green-200';
            case 'OUT': return 'bg-red-100 text-red-800 border-red-200';
            case 'TRF': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ADJ': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
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
                            <TableHead>Location Flow</TableHead>
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
                            <TableSkeleton columns={8} rows={5} />
                        ) : movements.length > 0 ? (
                            movements.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell className="font-medium">{movement.product_name}</TableCell>
                                    <TableCell className="text-sm">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                {movement.movement_type === 'TRF' ? (
                                                    <>
                                                        <span className="font-medium">{movement.location_name}</span>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-medium text-blue-600">{movement.destination_location_name}</span>
                                                    </>
                                                ) : movement.movement_type === 'IN' && movement.destination_location_name ? (
                                                    <>
                                                        <span className="text-xs text-muted-foreground">From:</span>
                                                        <span className="text-muted-foreground">{movement.destination_location_name}</span>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-medium text-green-600">{movement.location_name}</span>
                                                    </>
                                                ) : movement.movement_type === 'OUT' && movement.destination_location_name ? (
                                                    <>
                                                        <span className="font-medium text-red-600">{movement.location_name}</span>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-muted-foreground">{movement.destination_location_name}</span>
                                                    </>
                                                ) : (
                                                    <span className="font-medium">{movement.location_name}</span>
                                                )}
                                            </div>
                                            {movement.movement_type === 'TRF' && (
                                                <span className="text-xs text-blue-600">Transfer</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="outline" 
                                            className={`inline-flex items-center gap-1 ${getMovementTypeColor(movement.movement_type)}`}
                                        >
                                            {getMovementTypeIcon(movement.movement_type)}
                                            {movement.movement_type_display}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-mono">{movement.quantity}</TableCell>
                                    <TableCell className="text-center">
                                        {formatCurrency(movement.unit_price)}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
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
                                <TableCell 
                                    colSpan={8}
                                    className="text-center py-8"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-12 w-12 text-muted-foreground" />
                                        <p className="text-lg font-medium">No Movements found</p>
                                    </div>
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