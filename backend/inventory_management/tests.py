from rest_framework.test import APITestCase
from django.urls import reverse
from .models import Product, InventoryMovement
from rest_framework import status
from django.core.validators import MinValueValidator
from django.db import transaction
from decimal import Decimal

class ProductAPITest(APITestCase):
    # Test case for Product API
    def setUp(self):
        self.product1 = Product.objects.create(name='Laptop X1', description='Potente laptop para desarrollo', price=1200, quantity=10)
        self.product2 = Product.objects.create(name='Mouse Gamer', description='Mouse ergonómico con RGB', price=Decimal('1200'), quantity=25)
        self.list_create_url = reverse('products-list') 
        self.detail_url_product1 = reverse('products-detail', kwargs={'pk': self.product1.pk})
    
    def test_list_products_api(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], self.product1.name)
        self.assertEqual(response.data[1]['name'], self.product2.name)

    def test_create_product_api(self):
        new_product_data = {'name': 'teclado Mecánico', 'description': 'Teclado con switches azules', 'price': '100.00', 'quantity': 5, 'is_active': True}
        response = self.client.post(self.list_create_url, new_product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 3)
        created_product = Product.objects.get(pk=response.data['id'])
        self.assertEqual(created_product.name, new_product_data['name'])
        self.assertEqual(created_product.quantity, new_product_data['quantity'])
        self.assertEqual(created_product.price, Decimal(new_product_data['price']))
    
    def test_retrieve_product_api(self):
        response = self.client.get(self.detail_url_product1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.product1.name)
        self.assertEqual(response.data['description'], self.product1.description)
        self.assertEqual(response.data['price'], f'{self.product1.price:.2f}')
        self.assertEqual(response.data['quantity'], self.product1.quantity)
    
    def test_update_product_api(self):
        updated_product_data = {'name': 'Laptop X1 Pro', 'description': 'Potente laptop para desarrollo', 'price': '1300.00', 'quantity': 8, 'is_active': self.product1.is_active}
        response = self.client.put(self.detail_url_product1, updated_product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.name, updated_product_data['name'])
        self.assertEqual(self.product1.price, Decimal(updated_product_data['price']))
        self.assertEqual(self.product1.quantity, updated_product_data['quantity']) 
    
    def test_partial_update_product_api(self):
        partial_update_data = {'price': '1100.50'}
        response = self.client.patch(self.detail_url_product1, partial_update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.price, Decimal(partial_update_data['price']))
        self.assertEqual(self.product1.name, 'Laptop X1')
        self.assertEqual(self.product1.quantity, self.product1.quantity)

    def test_delete_product_api(self):
        response = self.client.delete(self.detail_url_product1)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Product.objects.count(), 1)
        with self.assertRaises(Product.DoesNotExist):
            Product.objects.get(pk=self.product1.pk)

class InventoryMovementAPITest(APITestCase):
    # Test case for InventoryMovement API
    def setUp(self):
        self.product = Product.objects.create(name='Laptop X1', description='Potente laptop para desarrollo', price=1200, quantity=10, is_active=True)
        self.product_inactive = Product.objects.create(name='Monitor', description='Monitor con excelente resolución', price=400, quantity=17, is_active=False)
        self.inventory_movement1 = InventoryMovement.objects.create(product=self.product, quantity=5, movement_type=InventoryMovement.MOVEMENT_INPUT)
        self.product.refresh_from_db()
        self.list_create_url = reverse('inventory_movements-list')
        self.detail_url_movement1 = reverse('inventory_movements-detail', kwargs={'pk': self.inventory_movement1.pk})
    
    def test_list_inventory_movements_api(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['product'], self.product.pk)
        self.assertEqual(response.data[0]['quantity'], self.inventory_movement1.quantity)

    def test_create_input_inventory_movement_updates_stock(self):
        initial_quantity = self.product.quantity
        new_movement_data = {'product': self.product.pk, 'quantity': 5, 'movement_type': InventoryMovement.MOVEMENT_INPUT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(InventoryMovement.objects.count(), 2)
        self.product.refresh_from_db()
        expected_quantity = initial_quantity + new_movement_data['quantity']
        self.assertEqual(self.product.quantity, expected_quantity)

    def test_create_output_inventory_movement_updates_stock(self):
        initial_quantity = self.product.quantity
        new_movement_data = {'product': self.product.pk, 'quantity': 3, 'movement_type': InventoryMovement.MOVEMENT_OUTPUT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(InventoryMovement.objects.count(), 2)
        self.product.refresh_from_db()
        expected_quantity = initial_quantity - new_movement_data['quantity']
        self.assertEqual(self.product.quantity, expected_quantity)

    def test_create_movement_inactive_product(self):
        initial_quantity = self.product_inactive.quantity
        new_movement_data = {'product': self.product_inactive.pk, 'quantity': 5, 'movement_type': InventoryMovement.MOVEMENT_INPUT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertEqual(InventoryMovement.objects.count(), 1)
        self.product_inactive.refresh_from_db()
        self.assertEqual(self.product_inactive.quantity, initial_quantity)
        self.assertIn('This product is not active and can not receive any movement.', str(response.data['product']))
    
    def test_create_output_movement_insufficient_stock(self):
        initial_quantity = self.product.quantity
        new_movement_data = {'product': self.product.pk, 'quantity': initial_quantity + 5, 'movement_type': InventoryMovement.MOVEMENT_OUTPUT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertEqual(InventoryMovement.objects.count(), 1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, initial_quantity)
        self.assertEqual(InventoryMovement.objects.filter(product=self.product, movement_type=InventoryMovement.MOVEMENT_OUTPUT).count(), 0)
        self.assertIn('there is not enought stock for', str(response.data))
    
    def test_create_adjustment_movement_updates_stock(self):
        new_movement_data = {'product': self.product.pk, 'quantity': 5, 'movement_type': InventoryMovement.MOVEMENT_ADJUSTMENT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(InventoryMovement.objects.count(), 2)
        self.product.refresh_from_db()
        expected_quantity = new_movement_data['quantity']
        self.assertEqual(self.product.quantity, expected_quantity)
    
    def test_retrieve_inventory_movement_api(self):
        response = self.client.get(self.detail_url_movement1)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['product'], self.inventory_movement1.product.pk)
        self.assertEqual(response.data['quantity'], self.inventory_movement1.quantity)
        self.assertEqual(response.data['movement_type'], self.inventory_movement1.movement_type)
        self.assertEqual(response.data['product_name'], self.product.name) 
        self.assertEqual(response.data['movement_type_display'], self.inventory_movement1.get_movement_type_display())