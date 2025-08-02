import AuthContext from '../context/authContext';
import {Link, NavLink} from 'react-router-dom';
import {useContext} from 'react';

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 2rem',
  backgroundColor: '#f8f9fa',
  borderBottom: '1px solid #dee2e6',
};
const navStyle = { display: 'flex', gap: '1.5rem', alignItems: 'center' };
const linkStyle = { textDecoration: 'none', color: '#333' };
const activeLinkStyle = { textDecoration: 'underline', fontWeight: 'bold' };

const Header = () => {
  const {user, logoutUser} = useContext(AuthContext);

  return (
    <header style={headerStyle}>
      <Link to="/" style={{ ...linkStyle, fontWeight: 'bold', fontSize: '1.2rem' }}>
        InventoryApp
      </Link>
      
      {user && (
        <nav style={navStyle}>
          <NavLink 
            to="/" 
            style={({ isActive }) => isActive ? { ...linkStyle, ...activeLinkStyle } : linkStyle}
          >
            Home
          </NavLink>
          <NavLink 
            to="/products" 
            style={({ isActive }) => isActive ? { ...linkStyle, ...activeLinkStyle } : linkStyle}
          >
            Products
          </NavLink>
          <NavLink 
            to="/movements" 
            style={({ isActive }) => isActive ? { ...linkStyle, ...activeLinkStyle } : linkStyle}
          >
            Movements
          </NavLink>
          { user.is_staff &&
            <NavLink 
              to="/admin/users"
            >
              User Admin
            </NavLink> }

          { user.is_staff &&
            <NavLink 
              to="/reports"
            >
              Reports
            </NavLink>}
        </nav>
      )}

      <div>
        {user && (
          <>
            <Link to="/profile"> Hello, {user.username}! </Link>
            <button onClick={logoutUser} style={{ marginLeft: '15px' }}>Logout</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;