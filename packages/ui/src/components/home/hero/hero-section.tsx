import { ClaudeCodeIcon } from "@ferix/ui/components/icons/claude-code-icon";
import { CursorIcon } from "@ferix/ui/components/icons/cursor-icon";
import { OpenCodeLogo } from "@ferix/ui/components/icons/open-code-logo";
import {
  PageHeader,
  PageHeaderDescription,
} from "@ferix/ui/components/layout/page-header";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("hero");
  return (
    <PageHeader className="gap-2 border-b p-4">
      <h1 className="text-3xl tracking-tighter md:text-4xl">
        {t("title")}
        <span className="ml-2 inline-flex items-center gap-2 align-middle">
          <CursorIcon className="size-6" />
          <ClaudeCodeIcon className="size-6" />
          <OpenCodeLogo className="size-6" />
        </span>
      </h1>
      <PageHeaderDescription className="text-xs md:text-sm">
        {t("description")}
      </PageHeaderDescription>
    </PageHeader>
  );
}
