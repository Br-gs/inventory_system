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

const getPaymentBadgeVariant = (paymentDueDate, isPaid) => {
    if (isPaid) return 'success';
    
    if (!paymentDueDate) return 'secondary';
    
    const today = new Date();
    const dueDate = new Date(paymentDueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'destructive';
    if (diffDays <= 7) return 'destructive';
    return 'secondary'; // Más de 7 días
};

const getPaymentBadgeText = (paymentDueDate, isPaid) => {
    if (isPaid) return 'Paid';
    
    if (!paymentDueDate) return 'No due date';
    
    const today = new Date();
    const dueDate = new Date(paymentDueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return `Due ${dueDate.toLocaleDateString()}`;
};

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
        setOrderToEdit(null);
        setIsSidebarOpen(true);
    };

    const handleSuccess = () => {
        setIsSidebarOpen(false);
        setOrderToEdit(null);
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

    const handleReceive = async (poId) => {
        if (window.confirm("Mark this order as received?")) {
            try {
                await purchasingService.receivePurchaseOrder(poId);
                toast.success("Order marked as received.");
                onRefresh();
            } catch (error) {
                toast.error("Could not update order status.", error);
            }
        }
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
        setOrderToEdit(null);
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
                            <TableSkeleton columnCount={7} />
                        ) : purchaseOrders.length > 0 ? (
                            purchaseOrders.map((po) => (
                                <TableRow key={po.id}>
                                    <TableCell className="font-medium">PO #{po.id}</TableCell>
                                    <TableCell>{po.supplier.name}</TableCell>
                                    <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                                    <TableCell>${Number(po.total_cost).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={po.status === 'received' ? 'success' : 'secondary'}>
                                            {po.status_display}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getPaymentBadgeVariant(po.payment_due_date, po.is_paid)}>
                                            {getPaymentBadgeText(po.payment_due_date, po.is_paid)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEdit(po)}>
                                                    Edit
                                                </DropdownMenuItem>
                                                {po.status === 'approved' && (
                                                    <DropdownMenuItem onSelect={() => handleReceive(po.id)}>
                                                        Mark as Received
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem 
                                                    onSelect={() => handleDelete(po.id)} 
                                                    className="text-red-500"
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No purchase orders found.
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
                onClose={handleCloseSidebar} 
                title={orderToEdit ? 'Edit Order' : "Create New Purchase Order"}
                description="Fill out the form to create a new purchase order."
            >
                <PurchaseOrderForm 
                    onSuccess={handleSuccess} 
                    onClose={handleCloseSidebar} 
                    orderToEdit={orderToEdit} 
                />
            </Sidebar>
        </div>
    );
};

export default PurchaseOrderList;