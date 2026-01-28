import type { ReactNode } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  keyField?: keyof T;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  onEdit,
  onDelete,
  keyField = 'id' as keyof T,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-background-surface rounded-lg shadow border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider"
              >
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-background-surface divide-y divide-neutral-200 dark:divide-neutral-800">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                className="px-6 py-4 text-center text-sm text-text-secondary"
              >
                No hay datos disponibles
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={String(item[keyField])}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                {columns.map((col, index) => (
                  <td
                    key={index}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-text-primary ${col.className || ''}`}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                        ? (item[col.accessorKey] as unknown as ReactNode)
                        : null}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-primary hover:text-primary/80 transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-error hover:text-error/80 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
