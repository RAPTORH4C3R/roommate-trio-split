import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  user_id: string;
}

interface RepaymentFormProps {
  profiles: Profile[];
  currentUserId?: string;
  onRepaymentAdded?: () => void;
}

export const RepaymentForm = ({ profiles, currentUserId, onRepaymentAdded }: RepaymentFormProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserProfile = profiles.find(p => p.user_id === currentUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserProfile) {
      toast.error("You must be logged in to add a repayment");
      return;
    }

    if (!amount || !toUserId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (toUserId === currentUserProfile.id) {
      toast.error("You cannot repay yourself");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('repayments')
        .insert({
          from_user_id: currentUserProfile.id,
          to_user_id: toUserId,
          amount: parseFloat(amount),
          description: description.trim() || null,
        });

      if (error) throw error;

      toast.success("Repayment added successfully!");
      setAmount("");
      setToUserId("");
      setDescription("");
      setOpen(false);
      onRepaymentAdded?.();
    } catch (error) {
      console.error('Error adding repayment:', error);
      toast.error("Failed to add repayment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Add Repayment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Repayment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toUser">Repaying To *</Label>
            <Select value={toUserId} onValueChange={setToUserId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select who you're repaying" />
              </SelectTrigger>
              <SelectContent>
                {profiles
                  .filter(profile => profile.id !== currentUserProfile?.id)
                  .map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this repayment for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Adding..." : "Confirm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};