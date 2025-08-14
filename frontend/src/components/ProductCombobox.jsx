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
        if (value && products.length === 0) {
        inventoryService.getProductById(value)
            .then(response => setSelectedProduct(response.data))
            .catch(() => setSelectedProduct(null));
        } else if (!value) {
            setSelectedProduct(null);
        }
    }, [value, products]);

    useEffect(() => {
    if (searchTerm.length < 2) {
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
    }, 200);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
    }, [searchTerm]);

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
        <PopoverContent className="w-[200px] p-0">
            <Command>
                <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Searching product..." />
                <CommandList>
                    <CommandEmpty>Don't found product.</CommandEmpty>
                    <CommandGroup>
                        {products.map((product) => (
                            <CommandItem
                             key={product.id}
                             value={product.name}
                             onSelect={() => {
                             onChange({ target: { name: 'product_id', value: String(product.id) } });
                             setSelectedProduct(product);
                             setOpen(false);
                            }}
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