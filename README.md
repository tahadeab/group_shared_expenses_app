# ExpenseSplit

**ExpenseSplit** is a modern, full-stack web application for tracking shared expenses within groups of friends, roommates, or travel companions. It automatically calculates each member's balance, suggests the most efficient way to settle up, and keeps everything synchronized in real time.

The app is built with [React](https://react.dev/) 19, [Convex](https://convex.dev/) (database + backend + authentication), [Tailwind CSS](https://tailwindcss.com/) with a [shadcn/ui](https://ui.shadcn.com/) component system, and [Lucide](https://lucide.dev/) icons.

## Features

### Groups
- Create a group and choose a **currency** (USD, EUR, GBP, SAR, EGP, JOD, and more)
- Invite members instantly with a simple **invite code** — one click to copy
- Members can **leave** a group at any time
- All data is private: only group members can see the group's activity

### Expenses
- Record expenses with a **description, amount, category, and optional note**
- Nine built-in categories with colorful icons (Food, Groceries, Transport, Housing, Entertainment, Shopping, Health, Travel, Other)
- Flexible splits: split **equally among everyone** or **only selected members** (perfect for a meal where someone didn't order anything)
- Delete any expense at any time — balances recalculate automatically

### Settlement
- Live-updating **member balances** (positive = owed money, negative = owes money)
- A **smart settlement plan** that suggests the minimum number of payments needed to settle all balances
- Record **payments** between members to keep balances accurate
- Payments can also be deleted if recorded by mistake

### Account
- Secure sign-in with Google or email verification link
- Personal display name shown across all groups

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 3 + shadcn/ui components |
| Backend & Database | Convex (real-time queries, server functions) |
| Authentication | @convex-dev/auth (Google & email magic links) |
| Icons | Lucide React |
| Notifications | Sonner |

## Project Structure

```
├── convex/                  # Convex backend
│   ├── schema.ts            # Database schema (users, groups, groupMembers, expenses, payments)
│   ├── groups.ts            # Group & membership functions + settlement plan computation
│   ├── expenses.ts          # Expenses & payments CRUD
│   ├── users.ts             # User profile functions
│   ├── auth.ts              # Authentication providers
│   ├── utils.ts             # Shared validators, currencies & categories
│   └── auth.config.ts       # Auth JWT config
├── src/
│   ├── App.tsx              # App shell, landing page & auth routing
│   ├── components/
│   │   ├── GroupsList.tsx   # My groups + create/join
│   │   ├── GroupDetails.tsx # Group dashboard with 4 tabs
│   │   ├── SettlementPlan.tsx
│   │   ├── CategoryBadge.tsx
│   │   └── ui/              # shadcn/ui primitives
│   └── lib/format.ts        # Currency & date formatting
├── index.html
├── package.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A free [Convex](https://convex.dev/) account

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/tahadeab/group_shared_expenses_app.git
   cd group_shared_expenses_app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development environment (frontend + backend together):

   ```bash
   npm run dev
   ```

   On the first run, the Convex CLI will ask you to log in and create or select a project. After that, open the local URL shown in the terminal (usually `http://localhost:5173`).

### Production Deployment

Deploy the backend to Convex and build the static frontend:

```bash
npm run build            # builds the frontend
npx convex deploy        # deploys the Convex backend
```

You can also deploy the frontend to any static hosting (Vercel, Netlify, GitHub Pages) after running `npm run build` and pointing `VITE_CONVEX_URL` to your production Convex deployment URL (Convex sets this automatically during `convex deploy`).

## How Balances & Settlement Work

1. Every expense adds its amount to the **payer's credit** and subtracts an equal share from each **split member's balance**.
2. Recording a payment transfers value from the payer to the recipient, reducing both sides.
3. The settlement plan runs a greedy algorithm on the resulting net balances: it repeatedly matches the member who owes the most with the member who is owed the most. This guarantees the minimum number of payments to fully settle a group.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start frontend and backend in development mode |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Typecheck frontend, backend, and run Convex codegen + build |

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Created and maintained by **taha deab**.
