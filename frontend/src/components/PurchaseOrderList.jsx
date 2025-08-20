import { useState, useContext } from 'react';
import {usePurchaseOrders} from '../hooks';
import AuthContext from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from 'lucide-react';

import Sidebar from './Sidebar';
import PurchaseOrderForm from './PurchaseOrderForm';

const PAGE_SIZE = 10;

const PurchaseOrderList = ({ refreshTrigger, onRefresh }) => {
    const { user } = useContext(AuthContext);
    const [currentPage, setCurrentPage] = useState(1);
    const { data, loading, error } = usePurchaseOrders(currentPage, refreshTrigger);
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const purchaseOrders = data?.results ?? [];
    const totalPurchaseOrders = data?.count ?? 0;
    const totalPages = Math.ceil(totalPurchaseOrders / PAGE_SIZE);
    
    const handleCreate = () => {
        setIsSidebarOpen(true);
    };

    const handleSuccess = () => {
        setIsSidebarOpen(false);
        onRefresh();
    };

    // Mapeo de colores para los estados
    const statusVariant = {
        pending: 'secondary',
        approved: 'default',
        received: 'success', // Necesitarás definir este estilo en tu tailwind.config.js
        canceled: 'destructive',
    };

    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {user?.is_staff && <Button onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4" />Crear Purchase Orders</Button>}
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Order Date</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Cargando...</TableCell></TableRow>
                        ) : purchaseOrders.map((po) => (
                            <TableRow key={po.id}>
                                <TableCell className="font-medium">PO #{po.id}</TableCell>
                                <TableCell>{po.supplier.name}</TableCell>
                                <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                                <TableCell>${Number(po.total_cost).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={statusVariant[po.status] || 'outline'}>
                                        {po.status_display}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                            <Pagination>
                                <PaginationContent className="space-x-1"> 
                                    <PaginationItem>
                                        <PaginationPrevious 
                                            href="#" 
                                            onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
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
                                            onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                                            disabled={currentPage >= totalPages}
                                            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
            
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                title="Crear Nueva Orden de Compra"
            >
                <PurchaseOrderForm onSuccess={handleSuccess} onClose={() => setIsSidebarOpen(false)} />
            </Sidebar>
        </div>
    );
};

export default PurchaseOrderList;