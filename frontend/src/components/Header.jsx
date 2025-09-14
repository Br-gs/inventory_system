import AuthContext from '../context/authContext';
import { Link, NavLink } from 'react-router-dom';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, Menu, Package } from 'lucide-react';

const Header = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  const getNavLinkClass = ({ isActive }) => 
    `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`;

  const getMobileNavLinkClass = ({ isActive }) => 
    `flex items-center text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'} py-2`;

  const navigationItems = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/movements", label: "Movements" },
    { to: "/suppliers", label: "Suppliers" },
    ...(user?.is_staff ? [
      { to: "/purchase-order", label: "Purchases" },
      { to: "/reports", label: "Reports" },
      { to: "/admin/users", label: "Users" }
    ] : [])
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {/* Logo Icon */}
            <svg width="28" height="28" viewBox="0 0 32 32" className="flex-shrink-0">
              <defs>
                <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#1e40af', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              <rect x="10" y="8" width="14" height="10" rx="1" fill="url(#boxGradient)" stroke="#1e40af" strokeWidth="0.5"/>
              <rect x="8" y="10" width="14" height="10" rx="1" fill="#60a5fa" opacity="0.8" stroke="#3b82f6" strokeWidth="0.5"/>
              <rect x="6" y="12" width="14" height="10" rx="1" fill="#93c5fd" opacity="0.6" stroke="#60a5fa" strokeWidth="0.5"/>
              <line x1="12" y1="11" x2="22" y2="11" stroke="white" strokeWidth="1" opacity="0.9"/>
              <line x1="12" y1="13" x2="20" y2="13" stroke="white" strokeWidth="1" opacity="0.9"/>
              <line x1="12" y1="15" x2="22" y2="15" stroke="white" strokeWidth="1" opacity="0.9"/>
              <circle cx="13" cy="12" r="0.8" fill="white"/>
              <circle cx="13" cy="14" r="0.8" fill="white"/>
              <circle cx="13" cy="16" r="0.8" fill="white"/>
            </svg>
            <div className="hidden sm:block">
              <span className="font-bold text-lg">Inventory</span>
              <span className="hidden lg:inline text-xs text-muted-foreground ml-1">Management</span>
            </div>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navigationItems.map(item => (
              <NavLink key={item.to} to={item.to} className={getNavLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Right side content */}
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          {user && (
            <>
              {/* Desktop user info */}
              <div className="hidden sm:flex items-center space-x-2">
                <NavLink to="/profile" className={getNavLinkClass}>
                  <span className="hidden md:inline">Hello, </span>
                  <span className="font-medium">{user.username}!</span>
                </NavLink>
                <Button variant="ghost" size="icon" onClick={logoutUser} title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile menu */}
              <div className="md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <div className="flex flex-col space-y-4 mt-4">
                      {/* Mobile user info */}
                      <div className="flex items-center space-x-2 pb-4 border-b">
                        <Package className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Hello, {user.username}!</p>
                          <p className="text-xs text-muted-foreground">
                            {user.is_staff ? 'Administrator' : 'User'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Mobile navigation */}
                      <nav className="flex flex-col space-y-2">
                        {navigationItems.map(item => (
                          <NavLink 
                            key={item.to} 
                            to={item.to} 
                            className={getMobileNavLinkClass}
                            onClick={handleLinkClick}
                          >
                            {item.label}
                          </NavLink>
                        ))}
                        <NavLink 
                          to="/profile" 
                          className={getMobileNavLinkClass}
                          onClick={handleLinkClick}
                        >
                          Profile Settings
                        </NavLink>
                      </nav>

                      {/* Mobile logout */}
                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          onClick={() => {
                            logoutUser();
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Mobile user info for very small screens */}
              <div className="sm:hidden flex items-center">
                <Button variant="ghost" size="icon" onClick={logoutUser} title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;