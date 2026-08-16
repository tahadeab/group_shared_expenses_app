import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { GroupsList } from "./components/GroupsList";
import { GroupDetails } from "./components/GroupDetails";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { ArrowRight, Users, Receipt, Landmark, ShieldCheck, Smartphone } from "lucide-react";

export default function App() {
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedGroupId(null)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">ExpenseSplit</span>
          </button>
          {selectedGroupId && (
            <button
              onClick={() => setSelectedGroupId(null)}
              className="hidden sm:inline-flex text-sm text-primary hover:text-primary-hover font-medium"
            >
              ← My groups
            </button>
          )}
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <Content
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
        />
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

function Content({
  selectedGroupId,
  setSelectedGroupId,
}: {
  selectedGroupId: Id<"groups"> | null;
  setSelectedGroupId: (id: Id<"groups"> | null) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        <LandingPage />
      </Unauthenticated>
    </div>
  );
}

function LandingPage() {
  const features = [
    {
      icon: Users,
      title: "Share with anyone",
      description:
        "Create a group and invite friends with a simple code. No complicated account setup required for guests.",
    },
    {
      icon: Receipt,
      title: "Track every expense",
      description:
        "Record expenses with categories, notes, and flexible splits — split equally among everyone or only selected members.",
    },
    {
      icon: Landmark,
      title: "Automatic balances",
      description:
        "Balances update in real time as expenses are added and payments are recorded. Always know who owes what.",
    },
    {
      icon: ArrowRight,
      title: "Smart settlement",
      description:
        "Get a suggested payment plan that settles all balances with the minimum number of transactions.",
    },
    {
      icon: ShieldCheck,
      title: "Secure & private",
      description:
        "Your data is protected with secure authentication. Only group members can see the group's activity.",
    },
    {
      icon: Smartphone,
      title: "Works everywhere",
      description:
        "A responsive web app that works great on your phone, tablet, or desktop — no install needed.",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16 sm:py-24 px-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Receipt className="h-4 w-4" />
          Split expenses, effortlessly
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight mb-6">
          Split expenses with
          <span className="text-primary"> friends & family</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          ExpenseSplit helps groups of friends, roommates, and travelers track shared
          expenses, see who owes what, and settle up fairly — without the awkward
          calculations.
        </p>
        <div className="max-w-md mx-auto">
          <SignInForm />
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to settle up</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Built for real groups — trips, apartments, offices, and everything in between.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-lg border p-6 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        <p>
          ExpenseSplit — built with React, Convex & Tailwind CSS.
        </p>
      </footer>
    </div>
  );
}
