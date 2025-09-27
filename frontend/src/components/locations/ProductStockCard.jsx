import { useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin } from 'lucide-react';
import AuthContext from '../../context/authContext';

const ProductStockCard = ({ product, selectedLocation = null }) => {
    const { user, userProfile } = useContext(AuthContext);

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

    // Filter stock locations based on user access
    const getAccessibleStockLocations = () => {
        if (user?.is_staff || userProfile?.profile?.can_change_location) {
            // Admins and users with can_change_location can see all locations
            return product.stock_locations || [];
        } else {
            // Regular users can only see their accessible locations
            const accessibleLocationIds = (userProfile?.profile?.accessible_locations || []).map(loc => loc.id);
            return (product.stock_locations || []).filter(stock =>
                accessibleLocationIds.includes(stock.location.id)
            );
        }
    };

    const stockQuantity = getLocationStock();
    const stockStatus = getStockStatus(stockQuantity);
    const visibleStockLocations = getAccessibleStockLocations();

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

                {/* Show stock breakdown only if user has access to multiple locations */}
                {visibleStockLocations.length > 1 && (
                    <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Stock by Location:
                        </div>
                        <div className="grid gap-1">
                            {visibleStockLocations.map((stock) => (
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

                {/* Show simple location info for users with single location access */}
                {visibleStockLocations.length === 1 && !selectedLocation && (
                    <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Location: {visibleStockLocations[0].location.name}
                        </div>
                    </div>
                )}

                {product.description && (
                    <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProductStockCard;
