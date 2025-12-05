import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface GroupsListProps {
  onSelectGroup: (groupId: Id<"groups">) => void;
}

export function GroupsList({ onSelectGroup }: GroupsListProps) {
  const groups = useQuery(api.groups.getUserGroups);
  const createGroup = useMutation(api.groups.createGroup);
  const joinGroup = useMutation(api.groups.joinGroup);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    try {
      const groupId = await createGroup({ name: groupName.trim() });
      setGroupName("");
      setShowCreateForm(false);
      toast.success("Group created successfully!");
      onSelectGroup(groupId);
    } catch (error) {
      toast.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      const groupId = await joinGroup({ inviteCode: inviteCode.trim().toUpperCase() });
      setInviteCode("");
      setShowJoinForm(false);
      toast.success("Joined group successfully!");
      onSelectGroup(groupId);
    } catch (error) {
      toast.error("Failed to join group. Check the invite code.");
    } finally {
      setLoading(false);
    }
  };

  if (groups === undefined) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Your Groups</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Group
          </button>
          <button
            onClick={() => setShowJoinForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Join Group
          </button>
        </div>
      </div>

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setGroupName("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Join Group Form */}
      {showJoinForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Join Group</h2>
          <form onSubmit={handleJoinGroup} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
                Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Joining..." : "Join"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowJoinForm(false);
                  setInviteCode("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No groups yet. Create or join a group to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.filter((group): group is NonNullable<typeof group> => group !== null).map((group) => (
            <div
              key={group._id}
              onClick={() => onSelectGroup(group._id)}
              className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h3>
              <p className="text-sm text-gray-500">Invite Code: {group.inviteCode}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
