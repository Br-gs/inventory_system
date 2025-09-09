import { TableRow, TableCell } from "@/components/ui/table";

const TableSkeleton = ({ columnCount = 5, rowCount = 5 }) => {
    return (
    <>
        {[...Array(rowCount)].map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {[...Array(columnCount)].map((_, colIndex) => (
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