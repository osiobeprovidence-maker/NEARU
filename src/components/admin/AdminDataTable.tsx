import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  SlidersHorizontal,
  Check,
  X,
  Inbox
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  filters?: {
    id: string;
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
  }[];
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'danger' | 'success';
    action: (selectedIds: string[]) => void;
  }[];
  onRowClick?: (item: T) => void;
  exportFileName?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  actionHeader?: React.ReactNode;
}

export function AdminDataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchFields = [],
  filters = [],
  bulkActions = [],
  onRowClick,
  exportFileName = 'export-data',
  pageSize = 10,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your search query or active filter settings.',
  actionHeader,
}: AdminDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtering & Search
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      
      if (searchFields.length > 0) {
        return searchFields.some((field) => {
          const val = item[field];
          return val ? String(val).toLowerCase().includes(term) : false;
        });
      }

      // Default: search all string / number fields
      return Object.values(item).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(term);
        }
        return false;
      });
    });
  }, [data, searchTerm, searchFields]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string') {
        const comparison = aVal.localeCompare(String(bVal));
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      return sortDirection === 'asc' 
        ? (aVal > bVal ? 1 : -1) 
        : (aVal < bVal ? 1 : -1);
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle Sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('desc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Selection
  const allPageIds = paginatedData.map(keyExtractor);
  const isAllSelected = allPageIds.length > 0 && allPageIds.every(id => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allPageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allPageIds])));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    const itemsToExport = selectedIds.length > 0 
      ? data.filter(item => selectedIds.includes(keyExtractor(item)))
      : sortedData;

    if (itemsToExport.length === 0) return;

    const headers = columns.map(col => col.header).join(',');
    const rows = itemsToExport.map(item => {
      return columns.map(col => {
        const val = item[col.key];
        const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        return `"${stringVal.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFileName}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {filters.map((filter) => (
            <div key={filter.id} className="relative">
              <select
                value={filter.value}
                onChange={(e) => {
                  filter.onChange(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-zinc-200 text-zinc-700 text-xs sm:text-sm font-bold pl-3.5 pr-8 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          ))}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-2xs active:scale-95"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span>Export</span>
          </button>

          {actionHeader}
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.length > 0 && bulkActions.length > 0 && (
        <div className="flex items-center justify-between p-3 px-5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs font-bold text-indigo-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
              {selectedIds.length}
            </span>
            <span>records selected</span>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  action.action(selectedIds);
                  setSelectedIds([]);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 shadow-2xs",
                  action.variant === 'danger'
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : action.variant === 'success'
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50"
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table Surface */}
      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/75 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {bulkActions.length > 0 && (
                  <th className="p-4 pl-6 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      "p-4 py-3.5 text-zinc-500 font-bold",
                      col.sortable && "cursor-pointer select-none hover:text-zinc-900 transition-colors",
                      col.align === 'center' && "text-center",
                      col.align === 'right' && "text-right",
                      col.className
                    )}
                  >
                    <div className={cn(
                      "flex items-center gap-1.5",
                      col.align === 'center' && "justify-center",
                      col.align === 'right' && "justify-end"
                    )}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-zinc-400">
                          {sortKey === col.key ? (
                            sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-3 h-3 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm font-medium text-zinc-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => {
                  const id = keyExtractor(item);
                  const isSelected = selectedIds.includes(id);

                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick && onRowClick(item)}
                      className={cn(
                        "transition-colors",
                        onRowClick && "cursor-pointer hover:bg-zinc-50/80",
                        isSelected && "bg-indigo-50/40"
                      )}
                    >
                      {bulkActions.length > 0 && (
                        <td className="p-4 pl-6 w-12" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectRow(id, e as any)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "p-4 py-3.5",
                            col.align === 'center' && "text-center",
                            col.align === 'right' && "text-right",
                            col.className
                          )}
                        >
                          {col.render ? col.render(item) : (item[col.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900">{emptyTitle}</h4>
                      <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">{emptySubtitle}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 px-6 border-t border-zinc-100 bg-zinc-50/50 text-xs font-bold text-zinc-500">
            <div>
              Showing <span className="text-zinc-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="text-zinc-900">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{' '}
              <span className="text-zinc-900">{sortedData.length}</span> records
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-white border border-zinc-200 rounded-xl text-zinc-900 shadow-2xs">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 transition-colors shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
