import { useEffect,useState } from "react";
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

    useEffect(() => {
        inventoryService.getProducts()
            .then(response => setProducts(response.data.results))
            .catch(err => console.error("Failed to fetch products for combobox", err));

    }, []);

    const selectedProduct = products.find(p => String(p.id) === value);

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
                <CommandInput placeholder="Searching product..." />
                <CommandList>
                    <CommandEmpty>Don't found product.</CommandEmpty>
                    <CommandGroup>
                        {products.map((product) => (
                            <CommandItem
                             key={product.id}
                             value={product.name}
                             onSelect={() => {
                             onChange({ target: { name: 'product_id', value: String(product.id) } });
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