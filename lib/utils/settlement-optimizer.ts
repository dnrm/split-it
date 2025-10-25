import { UserBalance, Settlement } from '@/types';

/**
 * Optimize settlements to minimize the number of transactions
 * Uses a greedy algorithm to match largest creditors with largest debtors
 * @param balances - Array of user balances
 * @returns Array of settlements
 */
export function optimizeSettlements(balances: UserBalance[]): Settlement[] {
  const settlements: Settlement[] = [];

  // Create working copies and filter out near-zero balances
  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);

  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b, balance: Math.abs(b.balance) }))
    .sort((a, b) => b.balance - a.balance);

  let creditorIndex = 0;
  let debtorIndex = 0;

  // Greedy algorithm: match largest creditor with largest debtor
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    // Determine settlement amount (minimum of what's owed and what's due)
    const settlementAmount = Math.min(creditor.balance, debtor.balance);

    // Create settlement
    settlements.push({
      from: debtor.userId,
      fromName: debtor.userName,
      to: creditor.userId,
      toName: creditor.userName,
      amount: parseFloat(settlementAmount.toFixed(2)),
    });

    // Update balances
    creditor.balance -= settlementAmount;
    debtor.balance -= settlementAmount;

    // Move to next creditor/debtor if current one is settled
    if (creditor.balance < 0.01) {
      creditorIndex++;
    }
    if (debtor.balance < 0.01) {
      debtorIndex++;
    }
  }

  return settlements;
}

/**
 * Calculate total number of transactions needed
 */
export function calculateTransactionCount(settlements: Settlement[]): number {
  return settlements.length;
}

/**
 * Calculate total amount being transferred
 */
export function calculateTotalTransferAmount(settlements: Settlement[]): number {
  return settlements.reduce((sum, settlement) => sum + settlement.amount, 0);
}

/**
 * Group settlements by debtor (useful for "you need to pay" view)
 */
export function groupSettlementsByDebtor(
  settlements: Settlement[]
): Map<string, Settlement[]> {
  const grouped = new Map<string, Settlement[]>();

  settlements.forEach((settlement) => {
    const existing = grouped.get(settlement.from) || [];
    existing.push(settlement);
    grouped.set(settlement.from, existing);
  });

  return grouped;
}

/**
 * Group settlements by creditor (useful for "you will receive" view)
 */
export function groupSettlementsByCreditor(
  settlements: Settlement[]
): Map<string, Settlement[]> {
  const grouped = new Map<string, Settlement[]>();

  settlements.forEach((settlement) => {
    const existing = grouped.get(settlement.to) || [];
    existing.push(settlement);
    grouped.set(settlement.to, existing);
  });

  return grouped;
}

