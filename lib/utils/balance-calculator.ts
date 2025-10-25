import { Expense, ExpenseSplit, UserBalance } from '@/types';

interface UserBalanceMap {
  [userId: string]: {
    totalPaid: number;
    totalOwed: number;
    userName: string;
  };
}

/**
 * Calculate net balances for all users in a group based on expenses
 * @param expenses - Array of expenses with splits
 * @returns Array of user balances
 */
export function calculateBalances(expenses: Expense[]): UserBalance[] {
  const balanceMap: UserBalanceMap = {};

  // Process each expense
  expenses.forEach((expense) => {
    const payerId = expense.payer_id;
    const payerName = expense.payer?.name || 'Unknown';

    // Initialize payer if not exists
    if (!balanceMap[payerId]) {
      balanceMap[payerId] = {
        totalPaid: 0,
        totalOwed: 0,
        userName: payerName,
      };
    }

    // Add to payer's totalPaid
    balanceMap[payerId].totalPaid += expense.amount;

    // Process splits
    if (expense.splits) {
      expense.splits.forEach((split: ExpenseSplit) => {
        const userId = split.user_id;
        const userName = split.user?.name || 'Unknown';

        // Initialize user if not exists
        if (!balanceMap[userId]) {
          balanceMap[userId] = {
            totalPaid: 0,
            totalOwed: 0,
            userName: userName,
          };
        }

        // Add to user's totalOwed
        balanceMap[userId].totalOwed += split.amount;
      });
    }
  });

  // Convert to UserBalance array with net balance
  const balances: UserBalance[] = Object.entries(balanceMap).map(
    ([userId, data]) => ({
      userId,
      userName: data.userName,
      totalPaid: data.totalPaid,
      totalOwed: data.totalOwed,
      balance: data.totalPaid - data.totalOwed, // positive = owed to them, negative = they owe
    })
  );

  // Sort by balance descending (creditors first)
  balances.sort((a, b) => b.balance - a.balance);

  return balances;
}

/**
 * Get simplified balance information for quick display
 */
export function getSimplifiedBalances(balances: UserBalance[]): {
  creditors: UserBalance[];
  debtors: UserBalance[];
  balanced: UserBalance[];
} {
  const creditors = balances.filter((b) => b.balance > 0.01); // owed to them
  const debtors = balances.filter((b) => b.balance < -0.01); // they owe
  const balanced = balances.filter(
    (b) => b.balance >= -0.01 && b.balance <= 0.01
  ); // balanced

  return { creditors, debtors, balanced };
}

