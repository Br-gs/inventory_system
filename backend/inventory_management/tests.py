from django.test import TestCase
from django.urls import reverse
from .models import Product

# models test

class ProductModelTest(TestCase):
    def setUp(self):
        Product.objects.create(name = 'product1', description ='description1', price = 10, quantity = 100)
    def testNameProduct(self):
        product = Product.objects.get(id = 1)
        expectedProduct = f'{product.name}'
        self.assertEqual(expectedProduct, 'product1')

# view test

class ProductViewTest(TestCase):
    def setUp(self):
        Product.objects.create(name = 'product2', description ='description2', price = 20, quantity = 200)
    def testViewExistProperLocation(self):
        response = self.client.get('/products/')
        self.assertEqual(response.status_code, 200)
    def testViewCorrectTemplate(self):
        response = self.client.get(reverse('list_products'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'list_products.html')