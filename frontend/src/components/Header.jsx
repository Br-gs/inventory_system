import AuthContext from '../context/authContext';
import {Link, NavLink} from 'react-router-dom';
import {useContext} from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Header = () => {
  const {user, logoutUser} = useContext(AuthContext);

  const getNavLinkClass = ({ isActive }) => 
    `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-lg">InventoryApp</span>
        </Link>
        
        {user && (
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <NavLink to="/" className={getNavLinkClass}>
              Home
            </NavLink>

            <NavLink to="/products" className={getNavLinkClass}>
              Products
            </NavLink>

            <NavLink to="/movements" className={getNavLinkClass}>
              Movements
            </NavLink>

            <NavLink to="/suppliers" className={getNavLinkClass}>
              Suppliers
            </NavLink>
            {user.is_staff && (
                <>
                  <NavLink to="/reports" className={getNavLinkClass}>Reports</NavLink>
                  <NavLink to="/admin/users" className={getNavLinkClass}>Users</NavLink>
                </>
              )}
            </nav>
          )}

        <div className="flex flex-1 items-center justify-end space-x-4">
          {user && (
            <>
              <NavLink to="/profile" className={getNavLinkClass}>
                Hello, {user.username}!
              </NavLink>
              <Button variant="ghost" size="icon" onClick={logoutUser}>
                  <LogOut className="h-4 w-4" />
                </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;