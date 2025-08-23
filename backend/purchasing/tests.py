from django.test import TestCase
from decimal import Decimal
from purchasing.services import calculate_weighted_average_cost


class WeightedAverageCostTest(TestCase):
    
    def test_weighted_average_calculation(self):
        """Test the example scenario from the requirements"""
        
        current_quantity = 100
        current_price = Decimal('10.00')
        new_quantity = 50
        new_price = Decimal('8.00')
        
        result = calculate_weighted_average_cost(
            current_quantity, current_price, new_quantity, new_price
        )
        
       
        expected = Decimal('9.33')
        self.assertEqual(result, expected)
    
    def test_no_current_stock(self):
        """Test when starting with no stock"""
        result = calculate_weighted_average_cost(
            current_quantity=0,
            current_price=Decimal('0.00'),
            new_quantity=100,
            new_price=Decimal('15.50')
        )
        
        expected = Decimal('15.50')
        self.assertEqual(result, expected)
    
    def test_precision_rounding(self):
        """Test precise decimal calculations and rounding"""
    
        result = calculate_weighted_average_cost(
            current_quantity=10,
            current_price=Decimal('3.33'),
            new_quantity=5,
            new_price=Decimal('2.67')
        )

        expected = Decimal('3.11')
        self.assertEqual(result, expected)

