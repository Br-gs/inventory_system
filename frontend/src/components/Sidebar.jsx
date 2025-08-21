import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const Sidebar = ({ isOpen, onClose, title, description, children }) => {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{title}</SheetTitle>
                  <SheetDescription>{description || "Complete the form below"}</SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  {children}
                </div>
            </SheetContent>
        </Sheet>
  );
};

export default Sidebar;