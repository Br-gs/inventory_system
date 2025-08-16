import { Skeleton } from "@/components/ui/skeleton";
import { TableRow, TableCell } from "@/components/ui/table";

const TableSkeleton = ({ columnCount = 5, rowCount = 5 }) => {
    return (
    <>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
            {Array.from({ length: columnCount }).map((_, cellIndex) => (
            <TableCell key={cellIndex}>
                <Skeleton className="h-6 w-full" />
            </TableCell>
            ))}
        </TableRow>
        ))}
    </>
    );
};

export default TableSkeleton;