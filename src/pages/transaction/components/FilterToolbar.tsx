import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { FilterToolbarProps } from '../types';

const FilterToolbar = ({
  filters,
  onFilterChange,
  resultsCount,
  onExport
}: FilterToolbarProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const transactionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'credit', label: 'Credit' },
    { value: 'debit', label: 'Debit' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    onFilterChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value ? new Date(value) : null
      }
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      dateRange: { start: null, end: null },
      type: 'all',
      searchQuery: '',
      status: 'all'
    });
    toast.info('Filters cleared.');
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon
              name="Search"
              size={20}
              color="var(--color-muted-foreground)"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <Input
              type="search"
              placeholder="Search by description or amount..."
              value={filters.searchQuery}
              onChange={(e) =>
                onFilterChange({ ...filters, searchQuery: e.target.value })
              }
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            iconName="Filter"
            iconPosition="left"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            Filters
          </Button>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
          </span>
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            onClick={onExport}
          >
            Export
          </Button>
        </div>
      </div>

      <div
        className={`${
          showFilters ? 'block' : 'hidden'
        } lg:block mt-4 pt-4 border-t border-border`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            type="date"
            label="Start Date"
            value={formatDateForInput(filters.dateRange.start)}
            onChange={(e) => handleDateChange('start', e.target.value)}
          />

          <Input
            type="date"
            label="End Date"
            value={formatDateForInput(filters.dateRange.end)}
            onChange={(e) => handleDateChange('end', e.target.value)}
          />

          <Select
            label="Transaction Type"
            options={transactionTypes}
            value={filters.type}
            onChange={(value) => onFilterChange({ ...filters, type: value as string })}
          />

          <Select
            label="Status"
            options={statusOptions}
            value={filters.status}
            onChange={(value) => onFilterChange({ ...filters, status: value as string })}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <span className="text-sm text-muted-foreground lg:hidden">
            {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              iconName="X"
              iconPosition="left"
              onClick={handleClearFilters}
              className="flex-1 sm:flex-none"
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              iconName="Download"
              iconPosition="left"
              onClick={onExport}
              className="flex-1 sm:flex-none lg:hidden"
            >
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;
