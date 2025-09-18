import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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

const ProductCombobox = ({ 
  value, 
  onChange, 
  placeholder = "Select a product...", 
  name = "product",
  disabled = false,
  className = ""
}) => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  // Reset selectedProduct when value changes externally
  useEffect(() => {
    if (!value) {
      setSelectedProduct(null);
      return;
    }

    // Only fetch if we don't have the product or it's different
    if (!selectedProduct || selectedProduct.id.toString() !== value.toString()) {
      setLoading(true);
      inventoryService.getProductById(value)
        .then(response => {
          setSelectedProduct(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching product:', error);
          setSelectedProduct(null);
          setLoading(false);
        });
    }
  }, [value, selectedProduct]);

  // Debounced search with cleanup
  useEffect(() => {
    if (!open && searchTerm.length < 2) {
      setProducts([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;

    const debounceTimer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ search: searchTerm });
      
      inventoryService.getProducts(params, controller.signal)
        .then(response => {
          if (!controller.signal.aborted) {
            setProducts(response.data.results || []);
            setLoading(false);
          }
        })
        .catch(error => {
          if (!controller.signal.aborted && error.name !== 'AbortError') {
            console.error("Failed to fetch product suggestions", error);
            setProducts([]);
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [searchTerm, open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSelect = useCallback((product) => {
    const newValue = String(product.id);
    onChange({ target: { name, value: newValue } });
    setSelectedProduct(product);
    setOpen(false);
    setSearchTerm("");
  }, [onChange, name]);

  const handleClear = useCallback(() => {
    onChange({ target: { name, value: '' } });
    setSelectedProduct(null);
    setSearchTerm("");
  }, [onChange, name]);

  const handleOpenChange = useCallback((newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchTerm("");
    }
  }, []);

  // Memoize display value to prevent unnecessary re-renders
  const displayValue = useMemo(() => {
    if (loading) return "Loading...";
    return selectedProduct ? selectedProduct.name : placeholder;
  }, [selectedProduct, placeholder, loading]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select product"
          disabled={disabled}
          className={cn("w-full sm:w-[200px] justify-between", className)}
        >
          <span className="truncate">{displayValue}</span>
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
            {loading ? (
              <CommandEmpty>Loading products...</CommandEmpty>
            ) : (
              <CommandEmpty>No products found.</CommandEmpty>
            )}
            <CommandGroup>
              {selectedProduct && !loading && (
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
                  <span className="truncate">{product.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductCombobox;