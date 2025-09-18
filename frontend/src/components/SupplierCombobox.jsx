import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { suppliersService } from "../api";

const SupplierCombobox = ({ 
  value, 
  onChange, 
  placeholder = "Select a supplier...", 
  id,
  disabled = false,
  className = ""
}) => {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  // Reset selectedSupplier when value changes externally
  useEffect(() => {
    if (!value) {
      setSelectedSupplier(null);
      return;
    }
    
    // Only fetch if we don't have the supplier or it's different
    if (!selectedSupplier || selectedSupplier.id.toString() !== value.toString()) {
      setLoading(true);
      suppliersService.getSupplierById(value)
        .then(response => {
          setSelectedSupplier(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching supplier:', error);
          setSelectedSupplier(null);
          setLoading(false);
        });
    }
  }, [value, selectedSupplier]);

  // Debounced search with cleanup
  useEffect(() => {
    if (!open) {
      setSuppliers([]);
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
      
      suppliersService.getSuppliers(params, controller.signal)
        .then(response => {
          if (!controller.signal.aborted) {
            setSuppliers(response.data.results || []);
            setLoading(false);
          }
        })
        .catch(error => {
          if (!controller.signal.aborted && error.name !== 'AbortError') {
            console.error("Failed to fetch supplier suggestions", error);
            setSuppliers([]);
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

  const handleSelect = useCallback((supplier) => {
    const newValue = String(supplier.id);
    onChange(newValue);
    setSelectedSupplier(supplier);
    setOpen(false);
    setSearchTerm("");
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setSelectedSupplier(null);
    setSearchTerm("");
  }, [onChange]);

  const handleOpenChange = useCallback((newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchTerm("");
    }
  }, []);

  // Memoize display value to prevent unnecessary re-renders
  const displayValue = useMemo(() => {
    if (loading) return "Loading...";
    return selectedSupplier ? selectedSupplier.name : placeholder;
  }, [selectedSupplier, placeholder, loading]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select supplier"
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Search suppliers..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <CommandEmpty>Loading suppliers...</CommandEmpty>
            ) : (
              <CommandEmpty>No suppliers found.</CommandEmpty>
            )}
            <CommandGroup>
              {selectedSupplier && !loading && (
                <CommandItem
                  value=""
                  onSelect={handleClear}
                  className="text-muted-foreground"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Clear selection
                </CommandItem>
              )}
              {suppliers.map((supplier) => (
                <CommandItem
                  key={supplier.id}
                  value={supplier.name}
                  onSelect={() => handleSelect(supplier)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === String(supplier.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{supplier.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SupplierCombobox;