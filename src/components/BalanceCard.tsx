import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Users, ExternalLink } from "lucide-react";

interface BalanceCardProps {
  userBalances: {
    name: string;
    paid: number;
    owes: number;
    balance: number;
  }[];
  currency: string;
}

export const BalanceCard = ({ userBalances, currency }: BalanceCardProps) => {
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
        
        <div className="border-t pt-4 space-y-3">
          <div className="text-center text-sm text-muted-foreground">
            Balances are calculated based on equal 3-way splits
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open('https://splitwise.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Access Full Settlement Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};