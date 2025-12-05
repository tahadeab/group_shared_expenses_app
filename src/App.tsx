import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { GroupsList } from "./components/GroupsList";
import { GroupDetails } from "./components/GroupDetails";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">ExpenseShare</h2>
          {selectedGroupId && (
            <button
              onClick={() => setSelectedGroupId(null)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Groups
            </button>
          )}
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4">
        <Content selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId} />
      </main>
      <Toaster />
    </div>
  );
}

function Content({ 
  selectedGroupId, 
  setSelectedGroupId 
}: { 
  selectedGroupId: Id<"groups"> | null;
  setSelectedGroupId: (id: Id<"groups"> | null) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
        {selectedGroupId ? (
          <GroupDetails groupId={selectedGroupId} />
        ) : (
          <GroupsList onSelectGroup={setSelectedGroupId} />
        )}
      </Authenticated>
      <Unauthenticated>
        <div className="max-w-md mx-auto mt-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">ExpenseShare</h1>
            <p className="text-xl text-gray-600">Split expenses with friends and family</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
