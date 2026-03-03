import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PaymentMode = 'Cash' | 'Bank Transfer' | 'UPI' | 'Card' | 'Other';
export type InvestmentType = 'Mutual Fund' | 'Gold' | 'Fixed Deposit' | 'Stock' | 'Other';
export type LiabilityStatus = 'Active' | 'Closed';
export type LendingStatus = 'Active' | 'Settled' | 'Overdue';

export interface FamilyMember {
  id: string;
  name: string;
  relationship?: string;
  notes?: string;
}

export interface SalaryIncome {
  id: string;
  memberId: string;
  employer?: string;
  amount: number;
  frequency: 'Monthly' | 'One-time';
  dateReceived: string;
  monthTag: string;
  paymentMode: PaymentMode;
  notes?: string;
}

export interface RentalProperty {
  id: string;
  name: string;
  address?: string;
  tenantName?: string;
  rentStartDate: string;
  rentAmount: number;
  incrementRule: 'Fixed' | 'Percentage';
  incrementValue: number;
  incrementEveryMonths: number;
  nextIncrementDate: string;
  depositAmount: number;
  depositDate: string;
  notes?: string;
}

export interface RentalPayment {
  id: string;
  propertyId: string;
  amountPaid: number;
  dueDate: string;
  paidDate: string;
  monthFor: string;
  status: 'Paid' | 'Pending' | 'Late';
  paymentMode: PaymentMode;
  invoiceDate: string;
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  subcategories: string[];
  budget?: number;
}

export interface Expense {
  id: string;
  date: string;
  categoryId: string;
  subcategory?: string;
  amount: number;
  paymentMode: PaymentMode;
  memberId?: string;
  isSubscription?: boolean;
  notes?: string;
}

export interface Liability {
  id: string;
  type: string;
  lender: string;
  principal?: number;
  emiAmount: number;
  emiDueDateMonthly: number;
  startDate: string;
  endDate?: string;
  interestRate?: number;
  status: LiabilityStatus;
  paymentModeDefault: PaymentMode;
  notes?: string;
}

export interface Investment {
  id: string;
  memberId: string;
  type: InvestmentType;
  name: string;
  folio?: string;
  strategy: 'SIP' | 'Lumpsum';
  amount: number;
  dateInvested: string;
  frequency?: string;
  platform?: string;
  notes?: string;
}

export interface Lending {
  id: string;
  borrowerName: string;
  amount: number;
  dateGiven: string;
  expectedReturnDate?: string;
  interestType: 'None' | 'Fixed' | 'Percentage';
  interestValue: number;
  status: LendingStatus;
  repayments: { date: string; amount: number; notes?: string }[];
  notes?: string;
}

export interface ProfitShare {
  id: string;
  source: string;
  propertyId?: string;
  totalAmount: number;
  distributionDate: string;
  splits: { memberId: string; amount: number; paymentMode: PaymentMode; notes?: string }[];
}

interface FinanceState {
  members: FamilyMember[];
  salaries: SalaryIncome[];
  properties: RentalProperty[];
  rentalPayments: RentalPayment[];
  categories: ExpenseCategory[];
  expenses: Expense[];
  liabilities: Liability[];
  investments: Investment[];
  lending: Lending[];
  profitShares: ProfitShare[];
  
  // Actions
  addMember: (member: FamilyMember) => void;
  updateMember: (member: FamilyMember) => void;
  deleteMember: (id: string) => void;
  
  addSalary: (salary: SalaryIncome) => void;
  deleteSalary: (id: string) => void;
  
  addProperty: (property: RentalProperty) => void;
  updateProperty: (property: RentalProperty) => void;
  deleteProperty: (id: string) => void;
  
  addRentalPayment: (payment: RentalPayment) => void;
  deleteRentalPayment: (id: string) => void;
  
  addCategory: (category: ExpenseCategory) => void;
  deleteCategory: (id: string) => void;
  
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  
  addLiability: (liability: Liability) => void;
  updateLiability: (liability: Liability) => void;
  deleteLiability: (id: string) => void;
  
  addInvestment: (investment: Investment) => void;
  deleteInvestment: (id: string) => void;
  
  addLending: (lending: Lending) => void;
  updateLending: (lending: Lending) => void;
  deleteLending: (id: string) => void;
  
  addProfitShare: (share: ProfitShare) => void;
  deleteProfitShare: (id: string) => void;

  importData: (data: any) => void;
  resetData: () => void;
}

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: '1', name: 'Groceries', subcategories: [] },
  { id: '2', name: 'Utilities', subcategories: ['Electricity', 'Water', 'Gas', 'Internet'] },
  { id: '3', name: 'Travel', subcategories: ['Fuel', 'Public Transport', 'Flights'] },
  { id: '4', name: 'Medical', subcategories: ['Medicines', 'Consultation', 'Insurance'] },
  { id: '5', name: 'Education', subcategories: [] },
  { id: '6', name: 'Household', subcategories: ['Rent', 'Maintenance', 'Cleaning'] },
  { id: '7', name: 'Shopping', subcategories: ['Clothes', 'Electronics'] },
  { id: '8', name: 'Subscriptions', subcategories: ['Netflix', 'Spotify', 'iCloud'] },
  { id: '9', name: 'Other', subcategories: [] },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      members: [],
      salaries: [],
      properties: [],
      rentalPayments: [],
      categories: DEFAULT_CATEGORIES,
      expenses: [],
      liabilities: [],
      investments: [],
      lending: [],
      profitShares: [],

      addMember: (member) => set((state) => ({ members: [...state.members, member] })),
      updateMember: (member) => set((state) => ({ members: state.members.map(m => m.id === member.id ? member : m) })),
      deleteMember: (id) => set((state) => ({ members: state.members.filter(m => m.id !== id) })),

      addSalary: (salary) => set((state) => ({ salaries: [...state.salaries, salary] })),
      deleteSalary: (id) => set((state) => ({ salaries: state.salaries.filter(s => s.id !== id) })),

      addProperty: (property) => set((state) => ({ properties: [...state.properties, property] })),
      updateProperty: (property) => set((state) => ({ properties: state.properties.map(p => p.id === property.id ? property : p) })),
      deleteProperty: (id) => set((state) => ({ properties: state.properties.filter(p => p.id !== id) })),

      addRentalPayment: (payment) => set((state) => ({ rentalPayments: [...state.rentalPayments, payment] })),
      deleteRentalPayment: (id) => set((state) => ({ rentalPayments: state.rentalPayments.filter(p => p.id !== id) })),

      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      deleteCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),

      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
      deleteExpense: (id) => set((state) => ({ expenses: state.expenses.filter(e => e.id !== id) })),

      addLiability: (liability) => set((state) => ({ liabilities: [...state.liabilities, liability] })),
      updateLiability: (liability) => set((state) => ({ liabilities: state.liabilities.map(l => l.id === liability.id ? liability : l) })),
      deleteLiability: (id) => set((state) => ({ liabilities: state.liabilities.filter(l => l.id !== id) })),

      addInvestment: (investment) => set((state) => ({ investments: [...state.investments, investment] })),
      deleteInvestment: (id) => set((state) => ({ investments: state.investments.filter(i => i.id !== id) })),

      addLending: (lending) => set((state) => ({ lending: [...state.lending, lending] })),
      updateLending: (lending) => set((state) => ({ lending: state.lending.map(l => l.id === lending.id ? lending : l) })),
      deleteLending: (id) => set((state) => ({ lending: state.lending.filter(l => l.id !== id) })),

      addProfitShare: (share) => set((state) => ({ profitShares: [...state.profitShares, share] })),
      deleteProfitShare: (id) => set((state) => ({ profitShares: state.profitShares.filter(s => s.id !== id) })),

      importData: (data) => set(() => ({ ...data })),
      resetData: () => set(() => ({
        members: [],
        salaries: [],
        properties: [],
        rentalPayments: [],
        categories: DEFAULT_CATEGORIES,
        expenses: [],
        liabilities: [],
        investments: [],
        lending: [],
        profitShares: [],
      })),
    }),
    {
      name: 'family-finance-storage',
    }
  )
);
