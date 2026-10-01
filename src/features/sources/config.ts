import type { LucideIcon } from 'lucide-react';
import { Building2, Download, Landmark } from 'lucide-react';
import { accountTypeLabels, payorTypeLabels, vendorTypeLabels } from '@/lib/labels';

export type SourceKind = 'accounts' | 'payors' | 'vendors';

export interface SourceConfig {
  kind: SourceKind;
  apiPath: string;
  title: string;
  singular: string;
  description: string;
  icon: LucideIcon;
  typeLabels: Record<string, string>;
  hasBalance: boolean;
}

export const SOURCES: Record<SourceKind, SourceConfig> = {
  accounts: {
    kind: 'accounts',
    apiPath: '/financial-accounts',
    title: 'Accounts',
    singular: 'account',
    description: 'Where your money is kept: bank accounts, cards, wallets and cash.',
    icon: Landmark,
    typeLabels: accountTypeLabels,
    hasBalance: true,
  },
  payors: {
    kind: 'payors',
    apiPath: '/payors',
    title: 'Payors',
    singular: 'payor',
    description: 'Where your income comes from: employers, investments, rentals.',
    icon: Download,
    typeLabels: payorTypeLabels,
    hasBalance: false,
  },
  vendors: {
    kind: 'vendors',
    apiPath: '/vendors',
    title: 'Vendors',
    singular: 'vendor',
    description: 'Where your money goes: utilities, subscriptions, stores.',
    icon: Building2,
    typeLabels: vendorTypeLabels,
    hasBalance: false,
  },
};
