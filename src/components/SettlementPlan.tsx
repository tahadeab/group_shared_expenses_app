import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface MemberRef {
  userId: string;
  name?: string;
  email?: string;
}

interface SettlementItem {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

function displayName(m: { name?: string; email?: string } | undefined): string {
  if (!m) return "Member";
  if (m.name) return m.name;
  if (m.email) {
    const at = m.email.indexOf("@");
    return at > 0 ? m.email.slice(0, at) : m.email;
  }
  return "Member";
}

interface SettlementPlanProps {
  plan: SettlementItem[];
  currency: string;
  members: MemberRef[];
}

export function SettlementPlan({ plan, currency, members }: SettlementPlanProps) {
  if (plan.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-10">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">All settled up!</h3>
          <p className="text-sm text-gray-500">
            There are no outstanding balances in this group right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Suggested settlements</CardTitle>
        <CardDescription>
          The most efficient way to settle all balances with {plan.length}{" "}
          {plan.length === 1 ? "payment" : "payments"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3"
          >
            <div className="h-8 w-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-semibold text-sm shrink-0">
              {displayName(members.find((m) => m.userId === item.fromId)).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {displayName(members.find((m) => m.userId === item.fromId))}
                <ArrowRight className="inline h-3.5 w-3.5 mx-1.5 text-gray-400" />
                {displayName(members.find((m) => m.userId === item.toId))}
              </p>
            </div>
            <span className="font-bold text-sm whitespace-nowrap text-gray-900">
              {formatCurrency(item.amount, currency)}
            </span>
          </div>
        ))}
        <p className="text-xs text-gray-400 pt-1">
          Record these payments in the Payments tab as they are completed so that
          balances stay accurate.
        </p>
      </CardContent>
    </Card>
  );
}
