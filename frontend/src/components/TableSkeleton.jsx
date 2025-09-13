import { TableRow, TableCell } from "@/components/ui/table";

const TableSkeleton = ({ columns = 5, rows = 5 }) => {
    return (
        <>
            {[...Array(rows)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                    {[...Array(columns)].map((_, colIndex) => (
                        <TableCell key={colIndex}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
};

export default TableSkeleton;