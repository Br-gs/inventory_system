import React, {useState, useEffect } from 'react';
import axios from '../axiosConfig';
 function Products() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        axios.get('/products')
            .then(response => {
                setProducts(response.data);
            })
            .catch(error => {
            console.log(error);
            });
    }, []);

    return (
        <div>
            <h1>Productos</h1>
            <ul>
                {products.map(product => (
                    <li key={product.id}>{product.name}</li>
                ))}
            </ul>
        </div>
    )
 }
 export default Products;