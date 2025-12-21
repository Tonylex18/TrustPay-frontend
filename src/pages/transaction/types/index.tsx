export interface Transaction {
    id: string;
    date: Date;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    status: 'completed' | 'pending' | 'failed';
    category: string;
    referenceNumber: string;
    currency?: string;
    note?: string;
    counterparty?: string;
    merchantDetails?: {
      name: string;
      location: string;
      contact: string;
    };
}

export type SortableTransactionField =
  | 'date'
  | 'description'
  | 'type'
  | 'amount'
  | 'status';

export interface TransactionFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  type: string;
  searchQuery: string;
  status: string;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface SortConfig {
  field: SortableTransactionField;
  direction: 'asc' | 'desc';
}

export interface TransactionTableProps {
  transactions: Transaction[];
  onSort: (field: SortableTransactionField) => void;
  sortConfig: SortConfig;
  onRowClick: (transaction: Transaction) => void;
  expandedRow: string | null;
}

export interface FilterToolbarProps {
  filters: TransactionFilters;
  onFilterChange: (filters: TransactionFilters) => void;
  resultsCount: number;
  onExport: () => void;
}

export interface TransactionCardProps {
  transaction: Transaction;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface PaginationControlsProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}
