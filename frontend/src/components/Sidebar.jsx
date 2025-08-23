import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, title, description, children }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024);
          
            if (window.innerWidth >= 1280 && title.includes('Purchase Order')) {
                setIsExpanded(true);
            }
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [title]);
    
    const toggleSize = () => {
        setIsExpanded(!isExpanded);
    };

    const getSidebarWidth = () => {
        if (isMobile) return 'w-full';
        
        if (title.includes('Purchase Order')) {
            if (isExpanded) return 'w-full sm:max-w-6xl';
            return 'w-full sm:max-w-3xl'; 
        }
        
        if (isExpanded) return 'w-full sm:max-w-5xl';
        return 'w-full sm:max-w-2xl';
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent 
                className={`overflow-y-auto ${getSidebarWidth()} transition-all duration-200`}
            >
                <SheetHeader className="flex-row items-start justify-between space-y-0 pb-4">
                    <div className="flex-1 space-y-1">
                        <SheetTitle className="text-lg">{title}</SheetTitle>
                        <SheetDescription className="text-sm">
                            {description || "Complete the form below"}
                        </SheetDescription>
                    </div>
                    {!isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSize}
                            className="ml-2 shrink-0"
                            title={isExpanded ? "Make smaller" : "Make larger"}
                        >
                            {isExpanded ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                </SheetHeader>
                <div className="py-2">
                    {children}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default Sidebar;