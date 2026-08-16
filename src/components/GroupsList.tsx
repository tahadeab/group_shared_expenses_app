import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  DoorOpen,
  Coins,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { CURRENCIES } from "../../convex/utils";
import { formatCurrency } from "@/lib/format";

interface GroupsListProps {
  onSelectGroup: (groupId: Id<"groups">) => void;
}

export function GroupsList({ onSelectGroup }: GroupsListProps) {
  const groups = useQuery(api.groups.getUserGroups);
  const createGroup = useMutation(api.groups.createGroup);
  const joinGroup = useMutation(api.groups.joinGroup);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    void (async () => {
      setLoading(true);
      try {
        const groupId = await createGroup({ name: groupName.trim(), currency });
        setGroupName("");
        setCreateOpen(false);
        toast.success("Group created successfully!");
        onSelectGroup(groupId);
      } catch (error: any) {
        toast.error("Failed to create group", { description: error?.message });
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    void (async () => {
      setLoading(true);
      try {
        const groupId = await joinGroup({ inviteCode: inviteCode.trim() });
        setInviteCode("");
        setJoinOpen(false);
        toast.success("You joined the group!");
        onSelectGroup(groupId);
      } catch (error: any) {
        toast.error("Failed to join group", { description: error?.message });
      } finally {
        setLoading(false);
      }
    })();
  };

  if (groups === undefined) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Groups</h1>
          <p className="text-gray-500 mt-1">
            Manage your shared expenses, track balances, and settle up.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
          <Button variant="outline" onClick={() => setJoinOpen(true)}>
            <DoorOpen className="h-4 w-4" />
            Join Group
          </Button>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new group</DialogTitle>
            <DialogDescription>
              Create a group to start tracking shared expenses with your friends,
              roommates, or travel companions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group name</Label>
              <Input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Summer Trip, Apartment 4B"
                required
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a group</DialogTitle>
            <DialogDescription>
              Enter the invite code shared with you by a group member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite code</Label>
              <Input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. A3F9K2"
                required
                maxLength={20}
                className="uppercase"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setJoinOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Joining..." : "Join group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No groups yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              Create a group to start splitting expenses, or join an existing one
              with an invite code.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                <DoorOpen className="h-4 w-4" />
                Join Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups
            .filter(Boolean)
            .map(({ group, memberCount, totalSpent }: any) => (
              <Card
                key={group._id}
                onClick={() => onSelectGroup(group._id)}
                className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1">
                      {group.currency}
                    </span>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {memberCount} {memberCount === 1 ? "member" : "members"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Total spent</span>
                    </div>
                    <span className="text-lg font-semibold flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {formatCurrency(totalSpent, group.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Invite code: <span className="font-mono font-medium">{group.inviteCode}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
