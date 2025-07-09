import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import AuthContext from './context/authContext';
import { LoginPage, RegisterPage, DashboardPage } from './pages';
import { Toaster } from 'react-hot-toast';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Toaster 
      position="top-right" 
      toastOptions={{
        duration: 3000,
      }}
      />
      <Routes>
        <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" replace/>} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<p>404: Page not found</p>} />
      </Routes>
    </Router>
  );
}


export default App;