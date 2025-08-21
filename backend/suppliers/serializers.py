from rest_framework import serializers
from .models import Supplier
from inventory_management.serializers import ProductSerializer
from inventory_management.models import Product


class SupplierSerializer(serializers.ModelSerializer):

    products = ProductSerializer(many=True, read_only=True)
    product_ids = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="products",
        many=True,
        write_only=True,
        required=False,
    )

    payment_terms_days = serializers.IntegerField(source='payment_terms', read_only=True)

    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "tax_id",
            "phone_number",
            "email",
            "contact_person",
            "payment_terms",
            "payment_terms_days",
            "last_invoice_date",
            "products",
            "product_ids",
        ]
