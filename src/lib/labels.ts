import type { Schemas } from './api';

type Enum<K extends keyof Schemas> = Extract<Schemas[K], string>;
type AccountType = NonNullable<Schemas['FinancialAccountInput']['type']>;
type PayorType = NonNullable<Schemas['PayorInput']['type']>;
type VendorType = NonNullable<Schemas['VendorInput']['type']>;

export const currencyLabels: Record<Enum<'Currency'>, string> = { USD: 'US Dollar (USD)', COP: 'Colombian Peso (COP)' };

export const accountTypeLabels: Record<AccountType, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'Credit card',
  CASH: 'Cash',
  DIGITAL_WALLET: 'Digital wallet',
  BROKERAGE: 'Brokerage / investment',
  LOAN: 'Loan',
  OTHER: 'Other',
};

export const payorTypeLabels: Record<PayorType, string> = {
  EMPLOYER: 'Employer',
  INVESTMENTS: 'Investments / dividends',
  RENTAL: 'Rental',
  BUSINESS_CLIENT: 'Business / client',
  GOVERNMENT_BENEFITS: 'Government / benefits',
  OTHER: 'Other',
};

export const vendorTypeLabels: Record<VendorType, string> = {
  UTILITY: 'Utility',
  SUBSCRIPTION: 'Subscription / software',
  RETAIL: 'Retail store',
  GROCERIES: 'Groceries',
  RESTAURANT: 'Restaurant',
  HOUSING: 'Housing / landlord',
  HEALTHCARE: 'Healthcare',
  INSURANCE: 'Insurance',
  TRANSPORTATION: 'Transportation',
  GOVERNMENT_TAXES: 'Government / taxes',
  OTHER: 'Other',
};

export const kindLabels: Record<Enum<'FlowKind'>, string> = { INCOME: 'Income', EXPENSE: 'Expense' };

export const frequencyLabels: Record<Enum<'Frequency'>, string> = {
  ONE_TIME: 'One time',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
  CUSTOM: 'Custom',
};

export const themeLabels: Record<Enum<'Theme'>, string> = { SYSTEM: 'Match my device', LIGHT: 'Light', DARK: 'Dark' };

export const options = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));
