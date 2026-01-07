import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('transaction');
  const [showFilters, setShowFilters] = useState(false);

  const transactionTypes = [
    { value: 'all', label: t('filters.types.all') },
    { value: 'credit', label: t('filters.types.credit') },
    { value: 'debit', label: t('filters.types.debit') }
  ];

  const statusOptions = [
    { value: 'all', label: t('filters.statusOptions.all') },
    { value: 'completed', label: t('filters.statusOptions.completed') },
    { value: 'pending', label: t('filters.statusOptions.pending') },
    { value: 'failed', label: t('filters.statusOptions.failed') }
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
    toast.info(t('filters.clearedToast'));
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
              placeholder={t('filters.searchPlaceholder')}
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
            {t('filters.filters')}
          </Button>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t('filters.results', { count: resultsCount })}
          </span>
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            onClick={onExport}
          >
            {t('filters.export')}
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
            label={t('filters.startDate')}
            value={formatDateForInput(filters.dateRange.start)}
            onChange={(e) => handleDateChange('start', e.target.value)}
          />

          <Input
            type="date"
            label={t('filters.endDate')}
            value={formatDateForInput(filters.dateRange.end)}
            onChange={(e) => handleDateChange('end', e.target.value)}
          />

          <Select
            label={t('filters.type')}
            options={transactionTypes}
            value={filters.type}
            onChange={(value) => onFilterChange({ ...filters, type: value as string })}
          />

          <Select
            label={t('filters.status')}
            options={statusOptions}
            value={filters.status}
            onChange={(value) => onFilterChange({ ...filters, status: value as string })}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <span className="text-sm text-muted-foreground lg:hidden">
            {t('filters.results', { count: resultsCount })}
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              iconName="X"
              iconPosition="left"
              onClick={handleClearFilters}
              className="flex-1 sm:flex-none"
            >
              {t('filters.clear')}
            </Button>
            <Button
              variant="outline"
              iconName="Download"
              iconPosition="left"
              onClick={onExport}
              className="flex-1 sm:flex-none lg:hidden"
            >
              {t('filters.export')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;
