import {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  Home,
  Film,
  ShoppingBag,
  HeartPulse,
  Plane,
  MoreHorizontal,
} from "lucide-react";
import { EXPENSE_CATEGORIES, type CategoryId } from "../../convex/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  Home,
  Film,
  ShoppingBag,
  HeartPulse,
  Plane,
  MoreHorizontal,
};

const COLOR_MAP: Record<string, string> = {
  food: "bg-orange-100 text-orange-700",
  groceries: "bg-green-100 text-green-700",
  transport: "bg-blue-100 text-blue-700",
  housing: "bg-purple-100 text-purple-700",
  entertainment: "bg-pink-100 text-pink-700",
  shopping: "bg-teal-100 text-teal-700",
  health: "bg-red-100 text-red-700",
  travel: "bg-sky-100 text-sky-700",
  other: "bg-gray-100 text-gray-600",
};

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const meta = EXPENSE_CATEGORIES.find((c) => c.id === (category as CategoryId));
  const icon = ICON_MAP[meta?.icon ?? "MoreHorizontal"];
  const Icon = icon ?? MoreHorizontal;
  const color = COLOR_MAP[category] ?? COLOR_MAP.other;

  return (
    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}
