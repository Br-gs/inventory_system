import React, {useEffect} from 'react';
import axiosClient from './api/axiosClient';

function App() {
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        const response = await axiosClient.get('/api/schema/');
        console.log('API Connection Successful:', response.data);
      } catch (error) {
        console.error('API Connection Failed:', error);
     }
    };

    testApiConnection();
  }, []);

return (
    <div>
      <h1>Sistema de Inventario</h1>
      <p>Revisa la consola del navegador</p>
    </div>
  );
}

export default App;