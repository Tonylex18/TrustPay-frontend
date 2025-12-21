import React from 'react';

import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { PaginationControlsProps } from '../types';

const PaginationControls = ({
  pagination,
  onPageChange,
  onItemsPerPageChange
}: PaginationControlsProps) => {
  const { currentPage, totalPages, itemsPerPage, totalItems } = pagination;

  const itemsPerPageOptions = [
    { value: 10, label: '10 per page' },
    { value: 25, label: '25 per page' },
    { value: 50, label: '50 per page' },
    { value: 100, label: '100 per page' }
  ];

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-card">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {startItem}-{endItem} of {totalItems}
          </span>

          <div className="w-full sm:w-40">
            <Select
              options={itemsPerPageOptions}
              value={itemsPerPage}
              onChange={(value) => onItemsPerPageChange(value as number)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            iconName="ChevronLeft"
            aria-label="Previous page"
          />

          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-sm text-muted-foreground">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="sm:hidden">
            <span className="px-3 py-2 text-sm text-foreground font-medium">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            iconName="ChevronRight"
            aria-label="Next page"
          />
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;