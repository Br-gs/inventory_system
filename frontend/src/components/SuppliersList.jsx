import { useState, useContext } from 'react';
import {useSuppliers} from '../hooks';
import {suppliersService} from '../api';
import AuthContext from '../context/authContext';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import SupplierForm from './SupplierForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, AlertCircle, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

const statusIcons = {
  overdue: AlertCircle,
  due_today: Clock,
  due_soon: Calendar, 
  due_week: Calendar,
  current: CheckCircle,
  no_invoices: Calendar,
};

const statusVariants = {
  overdue: 'destructive',
  due_today: 'destructive', 
  due_soon: 'default',
  due_week: 'secondary',
  current: 'outline',
  no_invoices: 'outline',
};

const PaymentStatusBadge = ({ paymentStatus }) => {
  if (!paymentStatus || !paymentStatus.status) {
    return <span className="text-gray-500">N/A</span>;
  }

  const Icon = statusIcons[paymentStatus.status] || Calendar;
  const variant = statusVariants[paymentStatus.status] || 'outline';

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {paymentStatus.text}
    </Badge>
  );
};

const SupplierList = ({ refreshTrigger, onRefresh }) => {
    const { user } = useContext(AuthContext);
    const [currentPage, setCurrentPage] = useState(1);
    const { data, loading, error } = useSuppliers(currentPage, refreshTrigger);
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState(null);

    const suppliers = data?.results ?? [];
    const totalSuppliers = data?.count ?? 0;
    const totalPages = Math.ceil(totalSuppliers / PAGE_SIZE);

    const handleCreate = () => {
        setSupplierToEdit(null);
        setIsSidebarOpen(true);
    };
    
    const handleEdit = (supplier) => {
        setSupplierToEdit(supplier);
        setIsSidebarOpen(true);
    };

    const handleSuccess = () => {
        setIsSidebarOpen(false);
        onRefresh();
        toast.success(`Supplier ${supplierToEdit ? 'Updated' : 'created'} successfully.`);
    };

    const handleDelete = async (supplierId) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            try {
                await suppliersService.deleteSupplier(supplierId); 
                toast.success("Supplier successfully deleted.");
                onRefresh();
            } catch (err) {
                toast.error("The supplier could not be deleted.");
                console.error(err);
            }
        }
    };

    const paymentSummary = suppliers.reduce((acc, supplier) => {
        const status = supplier.payment_status?.status;
        if (status === 'overdue') acc.overdue++;
        else if (status === 'due_today' || status === 'due_soon') acc.dueSoon++;
        return acc;
    }, { overdue: 0, dueSoon: 0 });

    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

    return (
        <div className="space-y-4">
            {/* Payment Summary Alert */}
            {(paymentSummary.overdue > 0 || paymentSummary.dueSoon > 0) && (
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    {paymentSummary.overdue > 0 && (
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">{paymentSummary.overdue} overdue payments</span>
                        </div>
                    )}
                    {paymentSummary.dueSoon > 0 && (
                        <div className="flex items-center gap-2 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{paymentSummary.dueSoon} due soon</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end">
                {user?.is_staff && (
                    <Button onClick={handleCreate}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Supplier
                    </Button>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name / Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Payment Terms</TableHead>
                            <TableHead>Payment Status</TableHead>
                            {user?.is_staff && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={user?.is_staff ? 7 : 6} className="h-24 text-center">
                                    Loading suppliers...
                                </TableCell>
                            </TableRow>
                        ) : suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.contact_person || 'N/A'}</TableCell>
                                    <TableCell>{supplier.email || 'N/A'}</TableCell>
                                    <TableCell>{supplier.phone_number || 'N/A'}</TableCell>
                                    <TableCell>{supplier.payment_terms} days</TableCell>
                                    <TableCell>
                                        <PaymentStatusBadge paymentStatus={supplier.payment_status} />
                                    </TableCell>
                                    {user?.is_staff && (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(supplier.id)} 
                                                        className="text-red-500 focus:text-red-500"
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={user?.is_staff ? 7 : 6} className="h-24 text-center">
                                    No suppliers found.
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
                onClose={() => setIsSidebarOpen(false)} 
                title={supplierToEdit ? 'Edit Supplier' : 'New Supplier'}
                description="Complete the supplier information."
            >
                <SupplierForm 
                    onSuccess={handleSuccess} 
                    onClose={() => setIsSidebarOpen(false)} 
                    supplierToEdit={supplierToEdit} 
                />
            </Sidebar>
        </div>
    );
};

export default SupplierList;