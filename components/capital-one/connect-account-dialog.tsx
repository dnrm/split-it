"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface ConnectAccountDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ConnectAccountDialog({
  trigger,
  onSuccess,
}: ConnectAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId.trim()) {
      toast.error("Please enter your Capital One Account ID");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/capital-one/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId: accountId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect account");
      }

      toast.success("Capital One account connected successfully!");
      setAccountId("");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error connecting account:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to connect account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="rounded-xl border-primary text-primary hover:bg-primary/10"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Connect Capital One
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect Capital One Account</DialogTitle>
            <DialogDescription>
              Enter your Capital One Account ID to enable automatic settlements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                type="text"
                placeholder="Enter your Capital One Account ID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                You can find your Account ID in your Capital One dashboard.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connect Account
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
