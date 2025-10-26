import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function EmptySettlementsState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <CheckCircle2 className="mb-4 h-16 w-16 text-chart-5" />
        <h3 className="mb-2 text-lg font-semibold">All Settled Up!</h3>
        <p className="text-center text-sm text-muted-foreground">
          There are no pending settlements in this group.
        </p>
      </CardContent>
    </Card>
  );
}
