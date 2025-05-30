from rest_framework.test import APITestCase
from django.urls import reverse
from .models import Product, InventoryMovement
from rest_framework import status
from django.core.validators import MinValueValidator
from django.db import transaction
from decimal import Decimal
from django.contrib.auth.models import User

product1_data = {
    'name': 'Laptop Z1 Pro', 'description': 'Potente laptop para desarrollo avanzado', 
    'price': Decimal('1500.75'), 'quantity': 15, 'is_active': True
}
product2_data = {
    'name': 'Mouse Ergo RGB', 'description': 'Mouse ergonómico con iluminación RGB personalizable', 
    'price': Decimal('85.50'), 'quantity': 30, 'is_active': True
}
product_inactive_data = {
    'name': 'Teclado Antiguo', 'description': 'Modelo descontinuado',
    'price': Decimal('20.00'), 'quantity': 5, 'is_active': False
}


class ProductAPITest(APITestCase):
    # Test case for Product API
    def setUp(self):
        self.admin_user = User.objects.create_user(username='inv_admin', password='adminpassword123', is_staff=True)
        self.regular_user = User.objects.create_user(username='inv_user', password='userpassword123', is_staff=False)

        self.product1 = Product.objects.create(**product1_data)
        self.product2 = Product.objects.create(**product2_data)

        self.list_create_url = reverse('products-list') 
        self.detail_url_product1 = reverse('products-detail', kwargs={'pk': self.product1.pk})
    
    # test cases only read for regular user
    def test_list_products_regular_user_api(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['results']), 2)
        #verify that the products are returned in alphabetical order
        self.assertEqual(response.data['results'][0]['name'], self.product1.name) 
        self.assertEqual(response.data['results'][1]['name'], self.product2.name)

    def test_retrieve_product_regular_user_api(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.detail_url_product1)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['name'], self.product1.name)
        self.assertEqual(response.data['price'], f'{self.product1.price:.2f}')
        self.assertEqual(response.data['quantity'], self.product1.quantity)

    # test cases of writing for regular user 
    def test_create_product_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        new_product_data = {'name': 'Tablet Basic', 'description': 'Tablet simple', 'price': '100.00', 'quantity': 5, 'is_active': True}
        response = self.client.post(self.list_create_url, new_product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_update_product_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        updated_data = {'name': 'Laptop Z1 Updated', 'price': '1550.00', 'quantity': 12, 'is_active': True, 'description': self.product1.description}
        response = self.client.put(self.detail_url_product1, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_delete_product_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.delete(self.detail_url_product1)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    # test cases of writing for admin user
    def test_create_product_api(self):
        self.client.force_authenticate(user=self.admin_user)
        new_product_data = {'name': 'Monitor Curvo', 'description': 'Monitor para gaming', 'price': '450.99', 'quantity': 7, 'is_active': True}
        response = self.client.post(self.list_create_url, new_product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Product.objects.count(), 3)
        created_product = Product.objects.get(pk=response.data['id'])
        self.assertEqual(created_product.name, new_product_data['name'])
        self.assertEqual(created_product.quantity, new_product_data['quantity'])
        self.assertEqual(created_product.price, Decimal(new_product_data['price']))
    
    def test_update_product_api(self):
        self.client.force_authenticate(user=self.admin_user)
        updated_product_data = {'name': 'Laptop Z1 Max', 'description': self.product1.description, 'price': '1600.00', 'quantity': 5, 'is_active': True}
        response = self.client.put(self.detail_url_product1, updated_product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.name, updated_product_data['name'])
        self.assertEqual(self.product1.price, Decimal(updated_product_data['price']))
        self.assertEqual(self.product1.quantity, updated_product_data['quantity']) 
    
    def test_partial_update_product_api(self):
        self.client.force_authenticate(user=self.admin_user)
        partial_update_data = {'quantity': 20, 'is_active': False}
        response = self.client.patch(self.detail_url_product1, partial_update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.quantity, partial_update_data['quantity'])
        self.assertEqual(self.product1.is_active, partial_update_data['is_active'])
        self.assertEqual(self.product1.name, product1_data['name'])

    def test_delete_product_api(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.detail_url_product1)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.data)
        self.assertEqual(Product.objects.count(), 1)
        with self.assertRaises(Product.DoesNotExist):
            Product.objects.get(pk=self.product1.pk)

    def test_create_product_invalid_price_admin_user(self):
        self.client.force_authenticate(user=self.admin_user)
        invalid_data = {'name': 'Bad Product', 'price': '-10.00', 'quantity': 1, 'is_active': True}
        response = self.client.post(self.list_create_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn('price', response.data)

class InventoryMovementAPITest(APITestCase):
    # Test case for InventoryMovement API
    def setUp(self):
        self.admin_user = User.objects.create_user(username='mov_admin', password='adminpassword123', is_staff=True)
        self.regular_user = User.objects.create_user(username='mov_user', password='userpassword123', is_staff=False)

        self.product_active = Product.objects.create(name='Camiseta Pro', price=Decimal('30.00'), quantity=100, is_active=True)
        self.product_inactive = Product.objects.create(**product_inactive_data)

        # Create an initial inventory movement for the product
        self.client.force_authenticate(user=self.admin_user)
        self.inventory_movement1 = InventoryMovement.objects.create(product=self.product_active, quantity=10, movement_type=InventoryMovement.MOVEMENT_INPUT)
        self.product_active.refresh_from_db()

        self.list_create_url = reverse('inventory_movements-list')
        self.detail_url_movement1 = reverse('inventory_movements-detail', kwargs={'pk': self.inventory_movement1.pk})
    
    # test cases only read for regular user
    def test_list_inventory_movements_regular_user_api(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['product_name'], self.product_active.name)

    def test_retrieve_movement_regular_user(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.detail_url_movement1)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['quantity'], self.inventory_movement1.quantity)
        self.assertEqual(response.data['movement_type_display'], 'Input')

    # test cases of writing for regular user (should be forbidden)
    def test_create_input_movement_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        new_movement_data = {'product': self.product_active.pk, 'quantity': 5, 'movement_type': InventoryMovement.MOVEMENT_INPUT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    # test cases of writing for admin user
    def test_create_input_inventory_movement_updates_stock(self):
        self.client.force_authenticate(user=self.admin_user)
        initial_quantity = self.product_active.quantity
        new_movement_data = {'product': self.product_active.pk, 'quantity': 5, 'movement_type': InventoryMovement.MOVEMENT_INPUT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(InventoryMovement.objects.count(), 2)
        self.product_active.refresh_from_db()
        expected_quantity = initial_quantity + new_movement_data['quantity']
        self.assertEqual(self.product_active.quantity, expected_quantity)

    def test_create_output_inventory_movement_updates_stock(self):
        self.client.force_authenticate(user=self.admin_user)
        initial_quantity = self.product_active.quantity
        new_movement_data = {'product': self.product_active.pk, 'quantity': 3, 'movement_type': InventoryMovement.MOVEMENT_OUTPUT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(InventoryMovement.objects.count(), 2)
        self.product_active.refresh_from_db()
        expected_quantity = initial_quantity - new_movement_data['quantity']
        self.assertEqual(self.product_active.quantity, expected_quantity)

    def test_create_adjustment_movement_updates_stock(self):
        self.client.force_authenticate(user=self.admin_user)
        new_movement_data = {'product': self.product_active.pk, 'quantity': 23, 'movement_type': InventoryMovement.MOVEMENT_ADJUSTMENT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(InventoryMovement.objects.count(), 2)
        self.product_active.refresh_from_db()
        expected_quantity = new_movement_data['quantity']
        self.assertEqual(self.product_active.quantity, expected_quantity)

    def test_create_movement_inactive_product(self):
        self.client.force_authenticate(user=self.admin_user)
        initial_quantity = self.product_inactive.quantity
        new_movement_data = {'product': self.product_inactive.pk, 'quantity': 5, 'movement_type': InventoryMovement.MOVEMENT_INPUT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertEqual(InventoryMovement.objects.count(), 1)
        self.product_inactive.refresh_from_db()
        self.assertEqual(self.product_inactive.quantity, initial_quantity)
        self.assertIn('This product is not active and can not receive any movement.', str(response.data['product']))
    
    def test_create_output_movement_insufficient_stock(self):
        self.client.force_authenticate(user=self.admin_user)
        initial_quantity = self.product_active.quantity
        new_movement_data = {'product': self.product_active.pk, 'quantity': initial_quantity + 5, 'movement_type': InventoryMovement.MOVEMENT_OUTPUT}
        response = self.client.post(self.list_create_url, new_movement_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertEqual(InventoryMovement.objects.count(), 1)
        self.product_active.refresh_from_db()
        self.assertEqual(self.product_active.quantity, initial_quantity)
        self.assertEqual(InventoryMovement.objects.filter(product=self.product_active, movement_type=InventoryMovement.MOVEMENT_OUTPUT).count(), 0)
        self.assertIn('there is not enought stock for', str(response.data))
    
    
    