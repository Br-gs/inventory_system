import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin } from 'lucide-react';

const ProductStockCard = ({ product, selectedLocation = null }) => {
    const getLocationStock = () => {
        if (selectedLocation) {
        const locationStock = product.stock_locations?.find(
            stock => stock.location.id.toString() === selectedLocation.toString()
        );
        return locationStock?.quantity || 0;
        }
        return product.total_quantity || 0;
    };

    const getStockStatus = (quantity) => {
        if (quantity === 0) return { variant: 'destructive', text: 'Out of Stock' };
        if (quantity <= 10) return { variant: 'secondary', text: 'Low Stock' };
        return { variant: 'default', text: 'In Stock' };
    };

    const stockQuantity = getLocationStock();
    const stockStatus = getStockStatus(stockQuantity);

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                {product.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Price:</span>
                <span className="font-semibold">${Number(product.price).toFixed(2)}</span>
                </div>
            
                <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                    {selectedLocation ? 'Stock at Location:' : 'Total Stock:'}
                </span>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{stockQuantity}</span>
                    <Badge variant={stockStatus.variant}>{stockStatus.text}</Badge>
                </div>
                </div>

                {selectedLocation && (
                <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Stock by Location:
                    </div>
                    <div className="grid gap-1">
                    {product.stock_locations?.map((stock) => (
                        <div key={stock.location.id} className="flex justify-between text-sm">
                        <span className={stock.location.id.toString() === selectedLocation ? 'font-medium' : ''}>
                            {stock.location.name}
                        </span>
                        <span className={stock.location.id.toString() === selectedLocation ? 'font-medium' : ''}>
                            {stock.quantity}
                        </span>
                        </div>
                    ))}
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProductStockCard;