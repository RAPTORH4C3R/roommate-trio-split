import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Users } from "lucide-react";

interface BalanceCardProps {
  userBalances: {
    name: string;
    paid: number;
    owes: number;
    balance: number;
    repaymentsMade?: number;
    repaymentsReceived?: number;
  }[];
  currency: string;
  repayments?: {
    id: string;
    from_user_id: string;
    to_user_id: string;
    amount: number;
    description?: string;
    repayment_date: string;
    from_user: {
      id: string;
      name: string;
    };
    to_user: {
      id: string;
      name: string;
    };
  }[];
}

export const BalanceCard = ({ userBalances, currency, repayments = [] }: BalanceCardProps) => {
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return "Gets back";
    if (balance < 0) return "Owes";
    return "Even";
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Settlement Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userBalances.map((user) => (
          <div key={user.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{user.name}</h4>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Paid: {user.paid.toFixed(2)} {currency}
                </div>
                <div className="flex items-center gap-1">
                  <ArrowDownLeft className="h-3 w-3" />
                  Share: {user.owes.toFixed(2)} {currency}
                </div>
              </div>
              {(user.repaymentsMade || user.repaymentsReceived) && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  {user.repaymentsMade ? (
                    <span>Repaid: {user.repaymentsMade.toFixed(2)} {currency}</span>
                  ) : null}
                  {user.repaymentsReceived ? (
                    <span>Received: {user.repaymentsReceived.toFixed(2)} {currency}</span>
                  ) : null}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold ${getBalanceColor(user.balance)}`}>
                {Math.abs(user.balance).toFixed(2)} {currency}
              </div>
              <Badge 
                variant={user.balance > 0 ? "default" : user.balance < 0 ? "destructive" : "secondary"}
                className="text-xs"
              >
                {getBalanceStatus(user.balance)}
              </Badge>
            </div>
          </div>
        ))}
        
        <div className="border-t pt-4 text-center text-sm text-muted-foreground">
          Balances are calculated based on equal 3-way splits including repayments
        </div>
      </CardContent>
    </Card>
  );
};