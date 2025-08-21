import { useEffect, useState} from "react";
import { inventoryService } from "@/api";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ProductCombobox = ({ value, onChange, placeholder = "Select a product..." }) => {
    const [open, setOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (value && !selectedProduct) {
            inventoryService.getProductById(value)
                .then(response => setSelectedProduct(response.data))
                .catch(() => setSelectedProduct(null));
        } else if (!value) {
            setSelectedProduct(null);
        }
    }, [value, selectedProduct]);

    useEffect(() => {
        if (!open && searchTerm.length < 2) {
            setProducts([]);
            return;
        }

        const controller = new AbortController();
        const debounceTimer = setTimeout(() => {
            const params = new URLSearchParams({ search: searchTerm });
            inventoryService.getProducts(params, controller.signal)
                .then(response => setProducts(response.data.results))
                .catch(err => {
                    if (err.name !== 'CanceledError') {
                        console.error("Failed to fetch product suggestions", err);
                    }
                });
        }, 300);

        return () => {
            clearTimeout(debounceTimer);
            controller.abort();
        };
    }, [searchTerm, open]);

    const handleSelect = (product) => {
        // Usar el name correcto según el contexto
        const targetName = onChange.toString().includes('product_id') ? 'product_id' : 'product';
        onChange({ target: { name: targetName, value: String(product.id) } });
        setSelectedProduct(product);
        setOpen(false);
        setSearchTerm("");
    };

    const handleClear = () => {
        const targetName = onChange.toString().includes('product_id') ? 'product_id' : 'product';
        onChange({ target: { name: targetName, value: '' } });
        setSelectedProduct(null);
        setSearchTerm("");
    };

    return(
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full sm:w-[200px] justify-between"
                >
                    {selectedProduct ? selectedProduct.name : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput 
                        value={searchTerm} 
                        onValueChange={setSearchTerm} 
                        placeholder="Search product..." 
                    />
                    <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                            {/* Opción para limpiar selección */}
                            {selectedProduct && (
                                <CommandItem
                                    value=""
                                    onSelect={handleClear}
                                    className="text-muted-foreground"
                                >
                                    <Check className="mr-2 h-4 w-4 opacity-0" />
                                    Clear selection
                                </CommandItem>
                            )}
                            {products.map((product) => (
                                <CommandItem
                                    key={product.id}
                                    value={product.name}
                                    onSelect={() => handleSelect(product)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === String(product.id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {product.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default ProductCombobox