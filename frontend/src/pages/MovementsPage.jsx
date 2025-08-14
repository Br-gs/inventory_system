import { MovementList } from "../components";
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MovementsPage = () => {
    const [searchParams] = useSearchParams();
    const productFilterFromUrl = searchParams.get('product');
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Movement History</CardTitle>
                    <CardDescription>
                        Review and filter all incoming, outgoing, and stock adjustment transactions..
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MovementList initialProductFilter={productFilterFromUrl} />
                </CardContent>
            </Card>
        </div>
    );
}

export default MovementsPage;