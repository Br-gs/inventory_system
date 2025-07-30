import AuthContext from '../context/authContext';
import {Link} from 'react-router-dom';
import {useContext} from 'react';

const Header = () => {
  const {user, logoutUser} = useContext(AuthContext);

  return (
    <header>
      <Link to="/" >
      InventoryApp
      </Link>
      <nav>
        {user && (
            <>
                <span>Welcome, {user.username}</span>
                <button onClick={logoutUser}>Logout</button>
            </>
        )}
        </nav>
    </header>
  );
}

export default Header;