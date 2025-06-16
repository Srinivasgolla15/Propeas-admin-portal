
import React from 'react';
import { TableColumn } from '../../types'; // Ensure this path is correct

interface TableProps<T extends object> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyStateMessage?: string;
}

const Table = <T extends object,>({
  data,
  columns,
  isLoading = false,
  emptyStateMessage = "No data available.",
}: TableProps<T>): React.ReactNode => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10 text-foreground dark:text-dark-foreground">
        Loading data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-10 text-foreground/70 dark:text-dark-foreground/70">
        {emptyStateMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-secondary dark:divide-dark-secondary/50 bg-card dark:bg-dark-card">
        <thead className="bg-secondary/50 dark:bg-dark-secondary/20">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-foreground/80 dark:text-dark-foreground/80 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary dark:divide-dark-secondary/50">
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-secondary/30 dark:hover:bg-dark-secondary/10 transition-colors">
              {columns.map((column) => (
                <td
                  key={`${String(column.key)}-${rowIndex}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-dark-foreground"
                >
                  {column.render
                    ? column.render(item)
                    : String(item[column.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
    