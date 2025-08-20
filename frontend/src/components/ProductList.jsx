import { useContext, useState} from "react";
import { inventoryService } from "../api";
import AuthContext from "../context/authContext";
import toast from "react-hot-toast";
import ProductFilters from "./ProductFilters";
import {useProducts} from "../hooks";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import TableSkeleton from "./TableSkeleton";
import { MoreHorizontal } from 'lucide-react';

const PAGE_SIZE = 10

const ProductList = ({filters, setFilters, onRefresh, refreshTrigger, onEditProduct}) => {
    const { user } = useContext(AuthContext);
    const [currentPage, setCurrentPage] = useState(1);

    const { data, loading, error } = useProducts(filters, currentPage, refreshTrigger);

    const products = data?.results ?? [];
    const totalProducts = data?.count ?? 0;
    const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

    const handleSearchChange = (searchTerm) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            search: searchTerm
        }));
        setCurrentPage(1); 
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        const filterValue = type === 'checkbox' ? (checked ? 'true' : '') : value;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: filterValue
        }));
        setCurrentPage(1);
    };

    const handleDelete = async (productId) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await inventoryService.deleteProduct(productId);
                toast.success("Product deleted successfully");
                onRefresh();
            } catch (err) {
                const errorMessage = err.response?.data?.detail || "An error occurred while deleting the product.";
                console.error("Error deleting product:", err);
                toast.error(`Error: ${errorMessage}`);
            }
        }
    };

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    return (
        <div className="space-y-4">
                <ProductFilters 
                    filters={filters} 
                    onFilterChange={handleFilterChange} 
                    searchValue={filters.search}
                    onSearchChange={handleSearchChange} 
                />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Quantity</TableHead>
                            { user?.is_staff && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                                <TableSkeleton columnCount={user?.is_staff ? 5 : 4} />
                          
                        ) : products.length > 0 ? (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="hidden md:table-cell max-w-xs truncate">{product.description}</TableCell>
                                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-red-500 focus:text-red-500">
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
                                <TableCell colSpan={user?.is_staff ? 5 : 4} className="text-center">Don't products found</TableCell>
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
        </div>
    );
};

export default ProductList;
    