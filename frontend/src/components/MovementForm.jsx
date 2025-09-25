import {useContext, useState, useEffect } from "react";
import inventoryService from "../api/inventoryService";
import toast from "react-hot-toast";
import AuthContext from '../context/authContext';
import ProductCombobox from "./ProductCombobox";
import LocationSelector from "./locations/LocationSelector";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowRightLeft, ShoppingCart, Package } from 'lucide-react';

const MovementForm = ({ onSuccess, onClose, preselectedLocation = null }) => {
    const { user } = useContext(AuthContext);
    
    const [product, setProduct] = useState('');
    const [location, setLocation] = useState(preselectedLocation || user?.default_location_id?.toString() || '');
    const [quantity, setQuantity] = useState(1);
    const [movementType, setMovementType] = useState(user?.is_staff ? '' : 'OUT');
    const [outputReason, setOutputReason] = useState(user?.is_staff ? '' : 'SALE');
    const [destinationLocation, setDestinationLocation] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Product stock info
    const [productStock, setProductStock] = useState(null);
    const [availableStock, setAvailableStock] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch product stock when product or location changes
    useEffect(() => {
        const fetchProductStock = async () => {
            if (!product || !location) {
                setProductStock(null);
                setAvailableStock(0);
                return;
            }

            setLoading(true);
            try {
                const response = await inventoryService.getProductById(product);
                const productData = response.data;
                setProductStock(productData);
                
                // Find stock at selected location
                const locationStock = productData.stock_locations?.find(
                    stock => stock.location.id.toString() === location.toString()
                );
                setAvailableStock(locationStock?.quantity || 0);
            } catch (error) {
                console.error('Error fetching product stock:', error);
                setAvailableStock(0);
                setProductStock(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProductStock();
    }, [product, location]);

    // Reset output_reason when movement type changes
    useEffect(() => {
        if (movementType !== 'OUT') {
            setOutputReason('');
        } else if (movementType === 'OUT' && !outputReason) {
            setOutputReason(user?.is_staff ? '' : 'SALE');
        }
    }, [movementType, user?.is_staff, outputReason]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!product) {
            toast.error('Please select a product');
            return;
        }
        if (!location) {
            toast.error('Please select a location');
            return;
        }
        if (!movementType) {
            toast.error('Please select movement type');
            return;
        }
        if (quantity <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        // Transfer validation
        if (movementType === 'TRF') {
            if (!destinationLocation) {
                toast.error('Please select destination location for transfer');
                return;
            }
            if (destinationLocation === location) {
                toast.error('Source and destination locations must be different');
                return;
            }
        }

        // Output validation
        if (movementType === 'OUT' && !outputReason) {
            toast.error('Please select output reason');
            return;
        }

        // Stock validation
        if ((movementType === 'OUT' || movementType === 'TRF') && quantity > availableStock) {
            toast.error(`Insufficient stock! Available: ${availableStock} units, Requested: ${quantity} units`);
            return;
        }

        setIsSubmitting(true);

        try {
            const movementData = {
                product: Number(product),
                location: Number(location),
                quantity: Number(quantity),
                movement_type: movementType,
            };

            // Add destination location for transfers
            if (movementType === 'TRF' && destinationLocation) {
                movementData.destination_location = Number(destinationLocation);
            }

            // Add unit price if provided
            if (unitPrice) {
                movementData.unit_price = Number(unitPrice);
            }

            // Add output reason to notes for better tracking
            let finalNotes = notes;
            if (outputReason) {
                const reasonText = outputReason === 'SALE' ? 'Sale' : 'Damage/Loss';
                finalNotes = notes ? `${reasonText} - ${notes}` : reasonText;
            }
            if (finalNotes) {
                movementData.notes = finalNotes;
            }

            const response = await inventoryService.createInventoryMovement(movementData);
            
            // Reset form
            setProduct('');
            setLocation(user?.default_location_id?.toString() || '');
            setQuantity(1);
            setMovementType(user?.is_staff ? '' : 'OUT');
            setOutputReason(user?.is_staff ? '' : 'SALE');
            setDestinationLocation('');
            setUnitPrice('');
            setNotes('');
            
            toast.success('Movement created successfully!');
            onSuccess(response.data);
            
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 
                               error.response?.data?.non_field_errors?.[0] ||
                               'Could not create movement.';
            toast.error(`Failed to save movement: ${errorMessage}`);
            console.error("Error saving movement:", error.response?.data || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isTransfer = movementType === 'TRF';
    const isOutput = movementType === 'OUT';
    const isAdjustment = movementType === 'ADJ';
    const isInput = movementType === 'IN';
    const isSale = outputReason === 'SALE';
    
    // Check if there's insufficient stock for output/transfer
    const hasInsufficientStock = (isOutput || isTransfer) && 
                                quantity > availableStock && 
                                availableStock >= 0;

    // User can override location if admin or has permission
    const canChangeLocation = user?.is_staff || user?.can_change_location;

    return (
        <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="product">Product *</Label>
                <ProductCombobox
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="Select a product"
                />
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="movement_type">Movement Type *</Label>
                <Select 
                    value={movementType}
                    onValueChange={(value) => {
                        setMovementType(value);
                        // Clear destination location when changing movement type
                        setDestinationLocation('');
                        // Reset output reason
                        setOutputReason(value === 'OUT' ? (user?.is_staff ? '' : 'SALE') : '');
                    }}
                    disabled={!user?.is_staff && movementType === 'OUT'}
                >
                    <SelectTrigger id="movement_type">
                        <SelectValue placeholder="-- Select Movement Type --" />
                    </SelectTrigger>
                    <SelectContent>
                        {user?.is_staff ? (
                            <>
                                <SelectItem value="IN">
                                    <div className="flex items-center gap-2">
                                        <ArrowDown className="h-3 w-3 text-green-600" />
                                        Input (Receive Stock)
                                    </div>
                                </SelectItem>
                                <SelectItem value="OUT">
                                    <div className="flex items-center gap-2">
                                        <ArrowUp className="h-3 w-3 text-red-600" />
                                        Output
                                    </div>
                                </SelectItem>
                                <SelectItem value="ADJ">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                        Adjustment
                                    </div>
                                </SelectItem>
                                <SelectItem value="TRF">
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="h-3 w-3 text-blue-600" />
                                        Transfer Between Locations
                                    </div>
                                </SelectItem>
                            </>
                        ) : (
                            <SelectItem value="OUT">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-3 w-3 text-red-600" />
                                    Sale
                                </div>
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Output Reason - Only for Output movements */}
            {isOutput && (
                <div className="grid gap-2">
                    <Label htmlFor="output_reason">Reason for Output *</Label>
                    <Select 
                        value={outputReason}
                        onValueChange={setOutputReason}
                    >
                        <SelectTrigger id="output_reason">
                            <SelectValue placeholder="-- Select Reason --" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SALE">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-3 w-3 text-green-600" />
                                    Sale
                                </div>
                            </SelectItem>
                            {user?.is_staff && (
                                <SelectItem value="DAMAGE">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-3 w-3 text-red-600" />
                                        Damage/Loss
                                    </div>
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Location Configuration Based on Movement Type */}
            {isTransfer ? (
                // Transfer: Show both source and destination clearly
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                        <ArrowRightLeft className="h-4 w-4" />
                        Transfer Between Locations
                    </div>
                    
                    <div className="grid gap-2">
                        <LocationSelector
                            label="From Location (Source)"
                            value={location}
                            onChange={setLocation}
                            disabled={!canChangeLocation}
                            required={true}
                            showLabel={true}
                        />
                    </div>

                    <div className="grid gap-2">
                        <LocationSelector
                            label="To Location (Destination)"
                            value={destinationLocation}
                            onChange={setDestinationLocation}
                            required={true}
                            showLabel={true}
                        />
                        {location && destinationLocation && location === destinationLocation && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Source and destination locations must be different.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            ) : (
                // Input/Output/Adjustment: Show primary location and optional destination
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <LocationSelector
                            label={isInput ? "Receive at Location" : isOutput ? "From Location" : "Location"}
                            value={location}
                            onChange={setLocation}
                            disabled={!canChangeLocation}
                            required={true}
                            showLabel={true}
                        />
                        {!canChangeLocation && (
                            <p className="text-xs text-muted-foreground">
                                Using your default location. Contact admin to change.
                            </p>
                        )}
                    </div>
                    
                    {/* Destination for outputs (only for damage/loss, not for sales) and inputs - only for admins */}
                    {((isOutput && outputReason === 'DAMAGE') || isInput) && user?.is_staff && (
                        <div className="grid gap-2">
                            <LocationSelector
                                label={isInput ? "From Location/Supplier (Optional)" : "To Location (Optional)"}
                                value={destinationLocation}
                                onChange={setDestinationLocation}
                                allowEmpty={true}
                                placeholder={isInput ? "Select source (optional)" : "Select destination (optional)"}
                                showLabel={true}
                            />
                            <p className="text-xs text-muted-foreground">
                                {isInput 
                                    ? "Optionally specify where this stock is coming from" 
                                    : "Optionally specify where this damaged stock is going (disposal, return, etc.)"
                                }
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Stock Information Display */}
            {productStock && location && (
                <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                        <span>Available at {isInput ? 'receiving' : 'source'} location:</span>
                        <span className={`font-semibold ${loading ? 'text-gray-500' : 
                            availableStock <= 10 ? 'text-orange-600' : 
                            availableStock === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {loading ? 'Loading...' : `${availableStock} units`}
                        </span>
                    </div>
                    {productStock.total_quantity !== availableStock && !loading && (
                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                            <span>Total across all locations:</span>
                            <span>{productStock.total_quantity} units</span>
                        </div>
                    )}
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="quantity">
                    Quantity *
                    {isAdjustment && <span className="text-xs text-muted-foreground ml-2">(Set to this amount)</span>}
                </Label>
                <Input 
                    type="number" 
                    id="quantity" 
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                />
                
                {/* Stock warning */}
                {hasInsufficientStock && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Insufficient stock! Available: {availableStock} units, Requested: {quantity} units.
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Unit Price - only for inputs and adjustments */}
            {(isInput || isAdjustment) && user?.is_staff && (
                <div className="grid gap-2">
                    <Label htmlFor="unit_price">
                        Unit Price
                        {isInput && <span className="text-xs text-muted-foreground ml-2">(Will update product price)</span>}
                    </Label>
                    <Input 
                        type="number" 
                        step="0.01"
                        id="unit_price" 
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder={productStock ? `Current: ${productStock.price}` : "0.00"}
                    />
                </div>
            )}

            {/* Show current price for sales/transfers (read-only) */}
            {(isOutput || isTransfer) && productStock && (
                <div className="grid gap-2">
                    <Label>Unit Price</Label>
                    <Input 
                        value={`${Number(productStock.price || 0).toFixed(2)}`}
                        readOnly 
                        disabled
                        className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                        {isOutput ? 
                            (isSale ? 'Sales use the current product price.' : 'Damage/loss uses current product price for valuation.') :
                            'Transfers use the current product price for valuation.'
                        }
                    </p>
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                    id="notes" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes about this movement..."
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={isSubmitting || hasInsufficientStock || (isTransfer && location === destinationLocation)}
                >
                    {isSubmitting ? "Creating..." : "Create Movement"}
                </Button>
            </div>
        </form>
    );
};

export default MovementForm;