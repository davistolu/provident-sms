import React from 'react';
import { ChevronLeft, ChevronRight, Inbox, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { normalizeApiError } from '@/services/errorService';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  error?: any;
  onRetry?: () => void;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  filterComponent?: React.ReactNode;
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  searchValue?: string;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  totalCount,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  filterComponent,
  searchPlaceholder,
  onSearchChange,
  searchValue,
  emptyMessage = 'No records found matching your selection.',
}: DataTableProps<T>) {
  const normalizedErr = isError && error ? normalizeApiError(error) : null;

  return (
    <div className="bg-white rounded-xl border border-[#e6e4dc] shadow-2xs overflow-hidden">
      {/* Header Toolbar */}
      {(filterComponent || onSearchChange) && (
        <div className="p-3.5 border-b border-[#e6e4dc] bg-[#fbfbfa] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#8896a4] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || 'Filter records...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs text-[#141d24] bg-white border border-[#d8d5cb] rounded-lg placeholder:text-[#8896a4] focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]"
              />
            </div>
          )}
          {filterComponent && <div className="flex items-center gap-2">{filterComponent}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e6e4dc] bg-[#f4f3ef]/70">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-[11px] font-bold text-[#52606d] uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0eee6]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-3.5">
                      <div className="h-3.5 bg-[#eae8e1] rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={columns.length} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                    <div className="w-10 h-10 rounded-full bg-[#fff1f2] border border-[#fecdd3] flex items-center justify-center text-[#e11d48]">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#141d24]">
                        {normalizedErr?.title || 'Unable to Load Records'}
                      </p>
                      <p className="text-xs text-[#52606d]">
                        {normalizedErr?.message || 'A network or server error occurred while retrieving data.'}
                      </p>
                    </div>
                    {onRetry && (
                      <Button
                        variant="outline"
                        size="xs"
                        icon={RefreshCw}
                        onClick={onRetry}
                        className="mt-1"
                      >
                        Retry Query
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="hover:bg-[#fbfbfa] transition-colors duration-100 group"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-3 text-xs text-[#141d24] align-middle ${col.className || ''}`}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-[#8896a4]">
                    <div className="w-10 h-10 rounded-full bg-[#f4f3ef] border border-[#e6e4dc] flex items-center justify-center">
                      <Inbox className="w-5 h-5 text-[#52606d]" />
                    </div>
                    <p className="text-xs font-medium text-[#52606d]">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="px-4 py-3 border-t border-[#e6e4dc] bg-[#fbfbfa] flex items-center justify-between text-xs text-[#52606d]">
          <p>
            Showing page <span className="font-bold text-[#141d24]">{currentPage}</span> of{' '}
            <span className="font-bold text-[#141d24]">{totalPages}</span>
            {totalCount !== undefined && ` (${totalCount} total)`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="xs"
              icon={ChevronLeft}
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              icon={ChevronRight}
              iconPosition="right"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
