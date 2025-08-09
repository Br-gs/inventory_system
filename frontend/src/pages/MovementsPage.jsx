import { MovementList } from "../components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MovementsPage = () => {
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
                    <MovementList />
                </CardContent>
            </Card>
        </div>
    );
}

export default MovementsPage;