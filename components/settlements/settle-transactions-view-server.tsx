import { Settlement } from "@/types";
import { EmptySettlementsState } from "./empty-settlements-state";
import { SettlementInsights } from "./settlement-insights";
import { SettlementsList } from "./settlements-list";
import { ExecuteTransfersButton } from "./execute-transfers-button";

interface SettleTransactionsViewServerProps {
  settlements: Settlement[];
  currency: string;
  groupId: string;
  usersMap: Map<string, any>;
}

export function SettleTransactionsViewServer({
  settlements,
  currency,
  groupId,
  usersMap,
}: SettleTransactionsViewServerProps) {
  const canExecute = settlements.length > 0;

  // Calculate insights
  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
  const transactionCount = settlements.length;

  if (settlements.length === 0) {
    return <EmptySettlementsState />;
  }

  return (
    <div className="space-y-6">
      {/* Insights Cards */}
      <SettlementInsights
        totalAmount={totalAmount}
        transactionCount={transactionCount}
        currency={currency}
      />

      {/* Settlements List */}
      <SettlementsList
        settlements={settlements}
        currency={currency}
        usersMap={usersMap}
      />

      {/* Execute Button */}
      <ExecuteTransfersButton
        settlements={settlements}
        groupId={groupId}
        canExecute={canExecute}
      />
    </div>
  );
}
