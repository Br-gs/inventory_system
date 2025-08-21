import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { suppliersService } from "../api";

const SupplierCombobox = ({ value, onChange, placeholder = "Select a supplier..." }) => {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    if (value && !selectedSupplier) {
      suppliersService.getSupplierById(value)
        .then(response => setSelectedSupplier(response.data))
        .catch(() => setSelectedSupplier(null));
    } else if (!value) {
      setSelectedSupplier(null);
    }
  }, [value, selectedSupplier]);

  useEffect(() => {
    if (!open) {
        setSuppliers([]);
        return;
    }

    const controller = new AbortController();
    const debounceTimer = setTimeout(() => {
      const params = new URLSearchParams({ search: searchTerm });
      suppliersService.getSuppliers(params, controller.signal)
        .then(response => setSuppliers(response.data.results))
        .catch(err => {
          if (err.name !== 'CanceledError') {
            console.error("Failed to fetch supplier suggestions", err);
          }
        });
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [searchTerm, open]);

  const handleSelect = (supplier) => {
    onChange({ target: { name: 'supplier_id', value: String(supplier.id) } });
    setSelectedSupplier(supplier);
    setOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onChange({ target: { name: 'supplier_id', value: '' } });
    setSelectedSupplier(null);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedSupplier ? selectedSupplier.name : placeholder}
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
            <CommandEmpty>No suppliers found.</CommandEmpty>
            <CommandGroup>
              {selectedSupplier && (
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
                  {supplier.name}
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