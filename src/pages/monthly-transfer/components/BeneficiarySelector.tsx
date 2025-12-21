import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Input from '../../../components/ui/Input';
import { Beneficiary } from '../types';

interface BeneficiarySelectorProps {
  beneficiaries: Beneficiary[];
  selectedBeneficiary: string;
  onSelect: (beneficiaryId: string) => void;
  error?: string;
}

const BeneficiarySelector = ({
  beneficiaries,
  selectedBeneficiary,
  onSelect,
  error
}: BeneficiarySelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredBeneficiaries = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.accountNumber.includes(searchQuery)
  );

  const selected = beneficiaries.find((b) => b.id === selectedBeneficiary);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-foreground mb-2">
        Select Beneficiary <span className="text-error">*</span>
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 bg-background border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring ${
            error ? 'border-error' : 'border-input hover:border-primary'
          }`}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          {selected ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selected.avatar ? (
                  <Image
                    src={selected.avatar}
                    alt={`${selected.name} profile picture`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Icon name="User" size={20} color="var(--color-primary)" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.accountNumber} • {selected.bankName}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Choose a beneficiary</span>
          )}
          <Icon
            name="ChevronDown"
            size={20}
            className={`transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-dropdown w-full mt-2 bg-popover border border-border rounded-lg shadow-modal max-h-80 overflow-hidden animate-fade-in">
            <div className="p-3 border-b border-border">
              <Input
                type="search"
                placeholder="Search by name or account number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredBeneficiaries.length > 0 ? (
                filteredBeneficiaries.map((beneficiary) => (
                  <button
                    key={beneficiary.id}
                    type="button"
                    onClick={() => {
                      onSelect(beneficiary.id);
                      setIsDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors duration-200 ${
                      selectedBeneficiary === beneficiary.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {beneficiary.avatar ? (
                        <Image
                          src={beneficiary.avatar}
                          alt={`${beneficiary.name} profile picture`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon name="User" size={20} color="var(--color-primary)" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {beneficiary.name}
                        </p>
                        {beneficiary.isVerified && (
                          <Icon name="BadgeCheck" size={16} color="var(--color-success)" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {beneficiary.accountNumber} • {beneficiary.bankName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {beneficiary.accountType.charAt(0).toUpperCase() +
                          beneficiary.accountType.slice(1)}{' '}
                        Account
                      </p>
                    </div>
                    {selectedBeneficiary === beneficiary.id && (
                      <Icon name="Check" size={20} color="var(--color-primary)" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <Icon
                    name="Search"
                    size={40}
                    color="var(--color-muted-foreground)"
                    className="mx-auto mb-2"
                  />
                  <p className="text-sm text-muted-foreground">No beneficiaries found</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
              >
                <Icon name="UserPlus" size={18} />
                <span>Add New Beneficiary</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-error flex items-center gap-1">
          <Icon name="AlertCircle" size={16} />
          {error}
        </p>
      )}
    </div>
  );
};

export default BeneficiarySelector;