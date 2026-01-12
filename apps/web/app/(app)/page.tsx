import { PopularPrompts } from "@ferix/ui/components/prompts/popular-prompts";

export default function DashboardPage() {
  return (
    <div className="scrollbar-none space-y-8">
      <PopularPrompts />
    </div>
  );
}
