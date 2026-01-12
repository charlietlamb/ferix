import { PopularPrompts } from "@ferix/ui/components/prompts/popular-prompts";
import { RecentPrompts } from "@ferix/ui/components/prompts/recent-prompts";

export default function DashboardPage() {
  return (
    <div className="scrollbar-none space-y-8">
      <PopularPrompts />
      <RecentPrompts />
    </div>
  );
}
