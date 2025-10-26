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
  settled_at?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  user?: User;
}

export type InvitationUsageType = "single" | "multi";
export type InvitationExpiration = "24h" | "7d" | "30d";

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
export type SummaryTone = "formal" | "casual" | "sarcastic" | "roast";

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

// Capital One Integration Types
export interface CapitalOneAccount {
  id: string;
  type: string;
  balance: number;
}

export interface Transaction {
  id: string;
  group_id: string;
  settlement_from: string;
  settlement_to: string;
  amount: number;
  transfer_id: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export interface CapitalOneTransfer {
  transferId: string;
  status: string;
  amount: number;
  fromAccountId: string;
  toAccountId: string;
}

// Legacy type kept for backwards compatibility
// Previously used for Capital One integration
export interface UserWithAccount extends User {}

// Ticket Vision Parser Types
export type TicketStatus = 'processing' | 'ready' | 'finalized' | 'error';

export interface SharedTicket {
  id: string;
  group_id: string;
  uploaded_by: string;
  image_url: string;
  merchant_name?: string;
  total_amount?: number;
  parsed_data?: any; // JSONB from database
  status: TicketStatus;
  created_at: string;
  uploaded_by_user?: User;
  items?: TicketItem[];
}

export interface TicketItem {
  id: string;
  ticket_id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  line_number: number;
  created_at: string;
  claims?: TicketItemClaim[];
}

export interface TicketItemClaim {
  id: string;
  item_id: string;
  user_id: string;
  quantity_claimed: number;
  custom_amount?: number;
  created_at: string;
  user?: User;
}

export interface ParsedTicket {
  merchantName: string;
  total: number;
  tax?: number;
  tip?: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  confidence: number;
}

export interface TicketItemWithClaims extends TicketItem {
  total_claimed: number;
  remaining_quantity: number;
  is_fully_claimed: boolean;
  claims: (TicketItemClaim & { user?: User })[];
}

export interface TicketClaimSummary {
  item_id: string;
  item_name: string;
  item_price: number;
  item_quantity: number;
  total_claimed: number;
  remaining_quantity: number;
  is_fully_claimed: boolean;
}

export interface TicketFinalizationSummary {
  ticketId: string;
  merchantName: string;
  totalAmount: number;
  userTotals: Array<{
    userId: string;
    userName: string;
    total: number;
    items: Array<{
      itemName: string;
      quantity: number;
      amount: number;
    }>;
  }>;
  unclaimedItems: Array<{
    itemName: string;
    quantity: number;
    amount: number;
  }>;
}

// Extended types for API responses
export interface SharedTicketWithDetails extends SharedTicket {
  items: TicketItemWithClaims[];
  group?: Group;
}

export interface TicketUploadResponse {
  ticketId: string;
  status: TicketStatus;
  message: string;
}

export interface TicketClaimRequest {
  itemId: string;
  quantityClaimed: number;
  customAmount?: number;
}

export interface TicketClaimResponse {
  success: boolean;
  message: string;
  remainingQuantity: number;
}
