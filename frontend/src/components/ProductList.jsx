import { useContext, useState} from "react";
import { inventoryService } from "../api";
import AuthContext from "../context/authContext";
import toast from "react-hot-toast";
import ProductFilters from "./ProductFilters";
import ProductStockCard from "./locations/ProductStockCard";
import { useProducts } from "../hooks";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import TableSkeleton from "./TableSkeleton";
import { MoreHorizontal, Package } from 'lucide-react';

const PAGE_SIZE = 10;

const ProductList = ({ filters, setFilters, onRefresh, refreshTrigger, onEditProduct }) => {
    const { user } = useContext(AuthContext);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

    const { data, loading, error } = useProducts(
        { ...filters, location: selectedLocation }, 
        currentPage, 
        refreshTrigger
    );

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

    const handleLocationChange = (locationId) => {
        setSelectedLocation(locationId);
        setCurrentPage(1);
    };

    const handleClearLocationFilter = () => {
        setSelectedLocation('');
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

    const getStockDisplay = (product) => {
        if (selectedLocation) {
            const locationStock = product.stock_locations?.find(
                stock => stock.location.id.toString() === selectedLocation
            );
            return {
                quantity: locationStock?.quantity || 0,
                locationName: locationStock?.location.name || 'N/A'
            };
        }
        return {
            quantity: product.total_quantity || 0,
            locationName: 'All Locations'
        };
    };

    const getStockBadgeVariant = (quantity) => {
        if (quantity === 0) return 'destructive';
        if (quantity <= 10) return 'secondary';
        return 'default';
    };

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Products</h2>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                    >
                        Table
                    </Button>
                    <Button
                        variant={viewMode === 'cards' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('cards')}
                    >
                        Cards
                    </Button>
                </div>
            </div>

            <ProductFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                searchValue={filters.search}
                onSearchChange={handleSearchChange}
                onLocationChange={handleLocationChange}
                selectedLocation={selectedLocation}
                onClearLocationFilter={handleClearLocationFilter}
            />

            {loading ? (
                <div className="space-y-4">
                    {viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="border rounded-lg p-4 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 rounded"></div>
                                        <div className="h-3 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden md:table-cell">Description</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                                        {user?.is_staff && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableSkeleton columnCount={user?.is_staff ? 6 : 5} />
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <div key={product.id} className="relative">
                                        <ProductStockCard 
                                            product={product} 
                                            selectedLocation={selectedLocation}
                                        />
                                        {user?.is_staff && (
                                            <div className="absolute top-2 right-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDelete(product.id)} 
                                                            className="text-red-500 focus:text-red-500"
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-12">
                                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium mb-2">No products found</p>
                                    <p className="text-sm text-muted-foreground text-center">
                                        {selectedLocation 
                                            ? "No products available at the selected location"
                                            : "Try adjusting your search criteria"
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden md:table-cell">Description</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>
                                            {selectedLocation ? 'Location Stock' : 'Total Stock'}
                                        </TableHead>
                                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                                        {user?.is_staff && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.length > 0 ? (
                                        products.map((product) => {
                                            const stockInfo = getStockDisplay(product);
                                            return (
                                                <TableRow key={product.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Package className="h-4 w-4 text-muted-foreground" />
                                                            {product.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                                                        {product.description}
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        ${Number(product.price).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-semibold">
                                                                {stockInfo.quantity}
                                                            </span>
                                                            <Badge variant={getStockBadgeVariant(stockInfo.quantity)}>
                                                                {stockInfo.quantity === 0 
                                                                    ? 'Out of Stock' 
                                                                    : stockInfo.quantity <= 10 
                                                                    ? 'Low Stock' 
                                                                    : 'In Stock'
                                                                }
                                                            </Badge>
                                                        </div>
                                                        {selectedLocation && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Total: {product.total_quantity}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                                            {product.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
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
                                                                    <DropdownMenuItem onClick={() => onEditProduct(product)}>
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleDelete(product.id)} 
                                                                        className="text-red-500 focus:text-red-500"
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell 
                                                colSpan={user?.is_staff ? 6 : 5} 
                                                className="text-center py-8"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Package className="h-12 w-12 text-muted-foreground" />
                                                    <p className="text-lg font-medium">No products found</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {selectedLocation 
                                                            ? "No products available at the selected location"
                                                            : "Try adjusting your search criteria"
                                                        }
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </>
            )}

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent className="space-x-1">
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    setCurrentPage(p => Math.max(1, p - 1)); 
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
                                    setCurrentPage(p => Math.min(totalPages, p + 1)); 
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

export default ProductList;
    