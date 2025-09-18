import AuthContext from '../context/authContext';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, Menu, Package } from 'lucide-react';

const Header = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  const navigationItems = [
    { to: "/", label: "Home", exact: true },
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

  // Custom function to determine if a nav item is active
  const isNavItemActive = (itemPath, exact = false) => {
    if (exact) {
      return location.pathname === itemPath;
    }
    
    // Special handling for purchase-order vs suppliers conflict
    if (itemPath === '/suppliers' && location.pathname.startsWith('/purchase-order')) {
      return false;
    }
    if (itemPath === '/purchase-order' && location.pathname.startsWith('/suppliers')) {
      return false;
    }
    
    return location.pathname.startsWith(itemPath);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {/*  Logo Icon with gradient and animation */}
            <div className="relative">
              <svg width="32" height="32" viewBox="0 0 40 40" className="flex-shrink-0">
                <defs>
                  <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 1}} />
                    <stop offset="50%" style={{stopColor: '#2563EB', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#1E40AF', stopOpacity: 1}} />
                  </linearGradient>
                  <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#60A5FA', stopOpacity: 0.8}} />
                    <stop offset="100%" style={{stopColor: '#93C5FD', stopOpacity: 0.4}} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Background circle with subtle glow */}
                <circle cx="20" cy="20" r="18" fill="url(#premiumGradient)" opacity="0.1" />
                
                {/* Main cube structure */}
                <g transform="translate(20, 20)">
                  {/* Back face */}
                  <path d="M -8,-8 L 0,-12 L 8,-8 L 8,0 L 0,4 L -8,0 Z" 
                        fill="url(#premiumGradient)" 
                        opacity="0.7"
                        transform="translate(0, -2)"/>
                  
                  {/* Middle face */}
                  <path d="M -8,-4 L 0,-8 L 8,-4 L 8,4 L 0,8 L -8,4 Z" 
                        fill="url(#premiumGradient)" 
                        opacity="0.85"/>
                  
                  {/* Front face with shine */}
                  <path d="M -8,0 L 0,-4 L 8,0 L 8,8 L 0,12 L -8,8 Z" 
                        fill="url(#premiumGradient)" 
                        filter="url(#glow)"
                        transform="translate(0, 2)"/>
                  
                  {/* Top shine effect */}
                  <path d="M -8,0 L 0,-4 L 8,0 L 0,4 Z" 
                        fill="url(#shineGradient)" 
                        transform="translate(0, 2)"/>
                  
                  {/* Data lines on the cube */}
                  <g stroke="white" strokeWidth="0.8" opacity="0.9">
                    <line x1="-4" y1="3" x2="4" y2="3" />
                    <line x1="-4" y1="5" x2="2" y2="5" />
                    <line x1="-4" y1="7" x2="4" y2="7" />
                  </g>
                </g>
              </svg>
              
              {/* Animated pulse effect */}
              <div className="absolute inset-0 -z-10 animate-pulse">
                <div className="h-full w-full rounded-full bg-primary/20 blur-xl"></div>
              </div>
            </div>
            
            <div className="hidden sm:block">
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  InvenTrack
                </span>
                <span className="hidden lg:block text-[10px] text-muted-foreground uppercase tracking-wider">
                  Professional Inventory
                </span>
              </div>
            </div>
          </div>
        </Link>
        
        {/* Desktop Navigation - Fixed */}
        {user && (
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navigationItems.map(item => {
              const isActive = isNavItemActive(item.to, item.exact);
              return (
                <Link 
                  key={item.to} 
                  to={item.to} 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side content */}
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          {user && (
            <>
              {/* Desktop user info */}
              <div className="hidden sm:flex items-center space-x-2">
                <Link 
                  to="/profile" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <span className="hidden md:inline">Hello, </span>
                  <span className="font-medium">{user.username}!</span>
                </Link>
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
                        {navigationItems.map(item => {
                          const isActive = isNavItemActive(item.to, item.exact);
                          return (
                            <Link 
                              key={item.to} 
                              to={item.to} 
                              className={`flex items-center text-sm font-medium transition-colors hover:text-primary py-2 ${
                                isActive ? 'text-primary' : 'text-muted-foreground'
                              }`}
                              onClick={handleLinkClick}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                        <Link 
                          to="/profile" 
                          className={`flex items-center text-sm font-medium transition-colors hover:text-primary py-2 ${
                            location.pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'
                          }`}
                          onClick={handleLinkClick}
                        >
                          Profile Settings
                        </Link>
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