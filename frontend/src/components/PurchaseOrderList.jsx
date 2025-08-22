import { useState, useContext } from 'react';
import {usePurchaseOrders} from '../hooks';
import AuthContext from '../context/authContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Sidebar from './Sidebar';
import TableSkeleton from './TableSkeleton';
import PurchaseOrderForm from './PurchaseOrderForm';
import toast from 'react-hot-toast';
import { purchasingService } from '../api';


const PAGE_SIZE = 10;

const PurchaseOrderList = ({ refreshTrigger, onRefresh }) => {
    const { user } = useContext(AuthContext);
    const [currentPage, setCurrentPage] = useState(1);
    const { data, loading, error } = usePurchaseOrders(currentPage, refreshTrigger);
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState(null);

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
    const handleEdit = (po) => {
        setOrderToEdit(po);
        setIsSidebarOpen(true);
    };

     const handleDelete = async (poId) => {
        if (window.confirm("Are you sure you want to delete this purchase order?")) {
            try {
                await purchasingService.deletePurchaseOrder(poId);
                toast.success("Purchase order deleted.");
                onRefresh();
            } catch {
                toast.error("The order could not be deleted.");
            }
        }
    };


    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {user?.is_staff && (
                    <Button onClick={handleCreate}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Purchase Order
                    </Button>
                )}
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Order Date</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableSkeleton columnCount={user?.is_staff ? 5 : 4} />
                        ) : purchaseOrders.length > 0 ? (
                            purchaseOrders.map((po) => (
                                <TableRow key={po.id}>
                                    <TableCell className="font-medium">PO #{po.id}</TableCell>
                                    <TableCell>{po.supplier.name}</TableCell>
                                    <TableCell>{po.payment_due_date ? new Date(po.payment_due_date).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>${Number(po.total_cost).toFixed(2)}</TableCell>
                                    <TableCell><Badge>{po.status_display}</Badge></TableCell>
                                    <TableCell>
                                        <Badge variant={po.is_paid ? 'success' : 'destructive'}>
                                            {po.is_paid ? 'Paid' : 'Pending'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEdit(po)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDelete(po.id)} className="text-red-500">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No purchase orders found.</TableCell>
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
                title={ orderToEdit ? 'Edit Order' : "Create New Purchase Order"}
                description="Fill out the form to create a new purchase order."
            >
                <PurchaseOrderForm onSuccess={handleSuccess} onClose={() => setIsSidebarOpen(false)} orderToEdit={orderToEdit} />
            </Sidebar>
        </div>
    );
};

export default PurchaseOrderList;