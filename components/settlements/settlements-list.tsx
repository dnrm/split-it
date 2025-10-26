import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import { Settlement } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface SettlementsListProps {
  settlements: Settlement[];
  currency: string;
  usersMap: Map<string, any>;
}

export function SettlementsList({
  settlements,
  currency,
  usersMap,
}: SettlementsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Settlements</CardTitle>
        <CardDescription>
          Review the optimized payment plan for settling all balances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {settlements.map((settlement, index) => {
          const fromUser = usersMap.get(settlement.from);
          const toUser = usersMap.get(settlement.to);

          // Use names from usersMap if available, fallback to settlement names
          const fromName = fromUser?.name || settlement.fromName;
          const toName = toUser?.name || settlement.toName;

          return (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex flex-1 items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {fromName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{fromName}</p>
                  <p className="text-xs text-muted-foreground">Payer</p>
                </div>

                <ArrowRight className="mx-4 h-5 w-5 text-muted-foreground" />

                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {toName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{toName}</p>
                  <p className="text-xs text-muted-foreground">Receiver</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold">
                  {formatCurrency(settlement.amount, currency)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
