# Generated manually
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventory_management', '0008_remove_product_quantity_and_more'),
        ('location', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='inventorymovement',
            name='location',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='inventory_movements', to='location.location'),
        ),
        migrations.AlterField(
            model_name='productlocationstock',
            name='location',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='product_stocks', to='location.location'),
        ),
    ]
