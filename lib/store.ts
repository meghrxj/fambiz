import { create } from 'zustand';

export type PaymentMode = 'Cash' | 'Bank Transfer' | 'UPI' | 'Card' | 'Other';
export type InvestmentType = 'Mutual Fund' | 'Gold' | 'Fixed Deposit' | 'Stock' | 'Bond' | 'Other';
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
  currentValue?: number;
  quantity?: number;
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
  updateInvestment: (investment: Investment) => void;
  deleteInvestment: (id: string) => void;
  
  addLending: (lending: Lending) => void;
  updateLending: (lending: Lending) => void;
  deleteLending: (id: string) => void;
  
  addProfitShare: (share: ProfitShare) => void;
  deleteProfitShare: (id: string) => void;

  // Global Data Actions
  importData: (data: any) => void;
  resetData: () => void;
  loadFromServer: () => Promise<void>;
  saveToServer: () => Promise<void>;
  isLoaded: boolean;
  serverStatus: 'connected' | 'error' | 'loading';
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
  (set, get) => {
    const saveToServer = async () => {
      const state = get();
      if (!state.isLoaded) return;

      const dataToSave = {
        members: state.members,
        salaries: state.salaries,
        properties: state.properties,
        rentalPayments: state.rentalPayments,
        categories: state.categories,
        expenses: state.expenses,
        liabilities: state.liabilities,
        investments: state.investments,
        lending: state.lending,
        profitShares: state.profitShares,
      };
      try {
        const response = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dataToSave }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server returned ${response.status}`);
        }
        
        set({ serverStatus: 'connected' });
      } catch (error) {
        console.error('Failed to save to server:', error);
        set({ serverStatus: 'error' });
      }
    };

    const autoSet = (fn: (state: FinanceState) => any) => {
      set(fn);
      saveToServer();
    };

    return {
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
      isLoaded: false,
      serverStatus: 'loading',

      addMember: (member) => autoSet((state) => ({ members: [...state.members, member] })),
      updateMember: (member) => autoSet((state) => ({ members: state.members.map(m => m.id === member.id ? member : m) })),
      deleteMember: (id) => autoSet((state) => ({ members: state.members.filter(m => m.id !== id) })),

      addSalary: (salary) => autoSet((state) => ({ salaries: [...state.salaries, salary] })),
      deleteSalary: (id) => autoSet((state) => ({ salaries: state.salaries.filter(s => s.id !== id) })),

      addProperty: (property) => autoSet((state) => ({ properties: [...state.properties, property] })),
      updateProperty: (property) => autoSet((state) => ({ properties: state.properties.map(p => p.id === property.id ? property : p) })),
      deleteProperty: (id) => autoSet((state) => ({ properties: state.properties.filter(p => p.id !== id) })),

      addRentalPayment: (payment) => autoSet((state) => ({ rentalPayments: [...state.rentalPayments, payment] })),
      deleteRentalPayment: (id) => autoSet((state) => ({ rentalPayments: state.rentalPayments.filter(p => p.id !== id) })),

      addCategory: (category) => autoSet((state) => ({ categories: [...state.categories, category] })),
      deleteCategory: (id) => autoSet((state) => ({ categories: state.categories.filter(c => c.id !== id) })),

      addExpense: (expense) => autoSet((state) => ({ expenses: [...state.expenses, expense] })),
      deleteExpense: (id) => autoSet((state) => ({ expenses: state.expenses.filter(e => e.id !== id) })),

      addLiability: (liability) => autoSet((state) => ({ liabilities: [...state.liabilities, liability] })),
      updateLiability: (liability) => autoSet((state) => ({ liabilities: state.liabilities.map(l => l.id === liability.id ? liability : l) })),
      deleteLiability: (id) => autoSet((state) => ({ liabilities: state.liabilities.filter(l => l.id !== id) })),

      addInvestment: (investment) => autoSet((state) => ({ investments: [...state.investments, investment] })),
      updateInvestment: (investment) => autoSet((state) => ({ investments: state.investments.map(i => i.id === investment.id ? investment : i) })),
      deleteInvestment: (id) => autoSet((state) => ({ investments: state.investments.filter(i => i.id !== id) })),

      addLending: (lending) => autoSet((state) => ({ lending: [...state.lending, lending] })),
      updateLending: (lending) => autoSet((state) => ({ lending: state.lending.map(l => l.id === lending.id ? lending : l) })),
      deleteLending: (id) => autoSet((state) => ({ lending: state.lending.filter(l => l.id !== id) })),

      addProfitShare: (share) => autoSet((state) => ({ profitShares: [...state.profitShares, share] })),
      deleteProfitShare: (id) => autoSet((state) => ({ profitShares: state.profitShares.filter(s => s.id !== id) })),

      importData: (data) => autoSet(() => ({ 
        members: data.members || [],
        categories: data.categories || [],
        salaries: data.salaries || [],
        expenses: data.expenses || [],
        liabilities: data.liabilities || [],
        investments: data.investments || [],
        lending: data.lending || [],
        profitShares: data.profitShares || [],
        properties: data.properties || [],
        rentalPayments: data.rentalPayments || [],
      })),

      resetData: () => {
        set(() => ({
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
        }));
        fetch('/api/data', { method: 'DELETE' }).catch(console.error);
      },

      loadFromServer: async () => {
        try {
          set({ serverStatus: 'loading' });
          // Add timestamp to bust cache
          const response = await fetch(`/api/data?t=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
          });
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('Server returned non-JSON response');
            set({ isLoaded: true, serverStatus: 'error' });
            return;
          }

          if (!response.ok) {
            console.error('Server error response');
            set({ isLoaded: true, serverStatus: 'error' });
            return;
          }

          const result = await response.json();
          if (result.data) {
            set(() => ({ 
              members: result.data.members || [],
              categories: result.data.categories || [],
              salaries: result.data.salaries || [],
              expenses: result.data.expenses || [],
              liabilities: result.data.liabilities || [],
              investments: result.data.investments || [],
              lending: result.data.lending || [],
              profitShares: result.data.profitShares || [],
              properties: result.data.properties || [],
              rentalPayments: result.data.rentalPayments || [],
              isLoaded: true,
              serverStatus: 'connected',
            }));
          } else {
            set({ isLoaded: true, serverStatus: 'connected' });
          }
        } catch (error) {
          console.error('Failed to load from server:', error);
          set({ isLoaded: true, serverStatus: 'error' });
        }
      },

      saveToServer: async () => {
        await saveToServer();
      },
    };
  }
);
