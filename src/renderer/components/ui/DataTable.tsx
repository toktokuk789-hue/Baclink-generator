import React from 'react';
import { flexRender, getCoreRowModel, useReactTable, getSortedRowModel, SortingState, getPaginationRowModel } from '@tanstack/react-table';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Button } from './Button';

interface DataTableProps<TData, TValue> {
  columns: any[];
  data: TData[];
  className?: string;
}

export function DataTable<TData, TValue>({ columns, data, className }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting }
  });

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-[var(--border)]">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="h-10 px-4 align-middle font-medium">
                      {header.isPlaceholder ? null : (
                        <div 
                          className={cn("flex items-center gap-1", header.column.getCanSort() && "cursor-pointer select-none hover:text-[var(--text-primary)]")}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ChevronUp className="h-4 w-4" />,
                            desc: <ChevronDown className="h-4 w-4" />
                          }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() ? <ChevronsUpDown className="h-4 w-4 opacity-50" /> : null)}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-elevated)]/50 data-[state=selected]:bg-[var(--surface-elevated)]">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-[var(--text-muted)]">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="secondary" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
        <Button variant="secondary" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
      </div>
    </div>
  );
}