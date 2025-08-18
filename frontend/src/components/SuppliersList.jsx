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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

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
                toast.error("The supplier could not be deleted.", err);
            }
        }
    };

    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {user?.is_staff && <Button onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4" />Add Suppliers</Button>}
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableCaption>A list of your registered suppliers.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name / Company Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            {user?.is_staff && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading suppliers</TableCell></TableRow>
                        ) : suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.contact_person || 'N/A'}</TableCell>
                                    <TableCell>{supplier.email || 'N/A'}</TableCell>
                                    <TableCell>{supplier.phone_number || 'N/A'}</TableCell>
                                    {user?.is_staff && (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(supplier)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(supplier.id)} className="text-red-500 focus:text-red-500">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Don't found suppliers.</TableCell></TableRow>
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
                title={supplierToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                description="Completa la información del proveedor."
            >
                <SupplierForm onSuccess={handleSuccess} onClose={() => setIsSidebarOpen(false)} supplierToEdit={supplierToEdit} />
            </Sidebar>
        </div>
    );
};

export default SupplierList;