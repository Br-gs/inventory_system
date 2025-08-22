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
    last_purchase_date = serializers.DateField(read_only=True)
    payment_due_date = serializers.DateField(read_only=True)
    payment_status = serializers.SerializerMethodField()
    total_outstanding_amount = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )

    def get_payment_status(self, obj):
        """Return payment status information"""
        return obj.payment_status

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
            "last_purchase_date",
            "payment_due_date", 
            "payment_status",
            "total_outstanding_amount",
            "products",
            "product_ids",
            "created_at",
            "updated_at",
        ]
