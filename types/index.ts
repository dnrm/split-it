// Database Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  user?: User;
}

export type InvitationUsageType = 'single' | 'multi';
export type InvitationExpiration = '24h' | '7d' | '30d';

export interface GroupInvitation {
  id: string;
  group_id: string;
  code: string;
  usage_type: InvitationUsageType;
  expires_at: string;
  created_by: string;
  created_at: string;
  used_count: number;
}

export interface Expense {
  id: string;
  group_id: string;
  payer_id: string;
  amount: number;
  description: string;
  category?: string;
  raw_input?: string;
  created_at: string;
  payer?: User;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  created_at: string;
  user?: User;
}

// AI Parsing Types
export interface ParsedExpense {
  amount: number;
  payer: string;
  participants: string[];
  description: string;
  category?: string;
  confidence: number;
}

// Balance & Settlement Types
export interface UserBalance {
  userId: string;
  userName: string;
  balance: number; // positive = owed to them, negative = they owe
  totalPaid: number;
  totalOwed: number;
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

// Group with extended data
export interface GroupWithMembers extends Group {
  members?: GroupMember[];
  memberCount?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ExpenseWithDetails extends Expense {
  payer: User;
  splits: (ExpenseSplit & { user?: User })[];
}

// Summary Types
export type SummaryTone = 'formal' | 'casual' | 'sarcastic';

export interface GroupSummary {
  totalSpend: number;
  topSpender: {
    userId: string;
    name: string;
    amount: number;
  };
  expenseCount: number;
  averagePerPerson: number;
  summary: string;
  tone: SummaryTone;
}

