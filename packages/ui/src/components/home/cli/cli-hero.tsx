"use client";

import { Link } from "@ferix/i18n/navigation";
import { Tabs, TabsList, TabsTrigger } from "@ferix/ui/components/ui/tabs";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  CheckIcon,
  CopyIcon,
  TerminalIcon,
  WarningCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Brain } from "./brain";
import { Ralph } from "./ralph";

const INSTALL_COMMAND = "npm i -g ferix-code";

interface CLITab {
  id: "code" | "sync";
  icon: React.ComponentType<{ className?: string }>;
  command: string;
  href: string;
}

const CLI_TABS: CLITab[] = [
  {
    id: "code",
    icon: TerminalIcon,
    command: 'ferix "Complete all tickets under the Linear chatbot project"',
    href: "/code",
  },
  {
    id: "sync",
    icon: ArrowsClockwiseIcon,
    command: "ferix sync",
    href: "/sync",
  },
];

interface HeroState {
  activeTab: "code" | "sync";
  animationKey: number;
}

type HeroAction =
  | { type: "ROTATE" }
  | { type: "SET_TAB"; tab: "code" | "sync" };

function heroReducer(state: HeroState, action: HeroAction): HeroState {
  switch (action.type) {
    case "ROTATE":
      return {
        activeTab: state.activeTab === "code" ? "sync" : "code",
        animationKey: state.animationKey + 1,
      };
    case "SET_TAB":
      return {
        activeTab: action.tab,
        animationKey: state.animationKey + 1,
      };
    default:
      return state;
  }
}

export function CLIHero() {
  const t = useTranslations("cliHero");
  const { copy: copyCommand, copied: commandCopied } = useCopy();
  const { copy: copyInstall, copied: installCopied } = useCopy();
  const [state, dispatch] = useReducer(heroReducer, {
    activeTab: "code",
    animationKey: 0,
  });
  const { activeTab, animationKey } = state;

  const containerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);

  const activeConfig = CLI_TABS.find((tab) => tab.id === activeTab);

  const handleTabChange = useCallback((tabId: string) => {
    dispatch({ type: "SET_TAB", tab: tabId as "code" | "sync" });
  }, []);

  const handleAnimationEnd = useCallback(() => {
    if (!isPausedRef.current) {
      dispatch({ type: "ROTATE" });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleMouseEnter = () => {
      isPausedRef.current = true;
    };

    const handleMouseLeave = () => {
      isPausedRef.current = false;
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!activeConfig) {
    return null;
  }

  return (
    <div
      className="group/cli-hero flex flex-col border-border border-b lg:flex-row"
      ref={containerRef}
    >
      <div className="flex min-w-0 flex-1 flex-col divide-y">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg md:text-xl">{t("title")}</h2>
            <AnimatePresence mode="wait">
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="text-muted-foreground text-sm"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: 4 }}
                key={activeTab}
                transition={{ duration: 0.15 }}
              >
                {t(`description_${activeTab}`)}
              </motion.p>
            </AnimatePresence>
          </div>
          <Link
            className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
            href={activeConfig.href}
          >
            {t("learnMore")}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="relative border-border">
          <Tabs onValueChange={handleTabChange} value={activeTab}>
            <div className="flex px-4">
              <TabsList className="h-auto gap-0 p-0" variant="line">
                {CLI_TABS.map((tab) => (
                  <TabsTrigger
                    className="gap-2 px-3 py-2.5 text-sm after:-bottom-0.5!"
                    key={tab.id}
                    value={tab.id}
                  >
                    <tab.icon className="size-4" />
                    {t(`tab_${tab.id}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>

        <div className="relative flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <button
              className="flex w-fit cursor-pointer items-center gap-2 rounded-md bg-muted/50 px-2 py-1 transition-colors hover:bg-muted"
              onClick={() => copyInstall(INSTALL_COMMAND)}
              type="button"
            >
              <span className="text-muted-foreground text-xs">
                {t("install")}
              </span>
              <code className="font-mono text-xs">{INSTALL_COMMAND}</code>
              {installCopied ? (
                <CheckIcon className="size-3 text-green-500" />
              ) : (
                <CopyIcon className="size-3 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence mode="wait">
              {activeTab === "code" && (
                <motion.span
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-500 text-xs"
                  exit={{ opacity: 0, scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  key="experimental-badge"
                  transition={{ duration: 0.15 }}
                >
                  <WarningCircle className="size-3" weight="fill" />
                  Experimental
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className="flex cursor-pointer items-center gap-3 rounded-md bg-muted px-4 py-3 transition-colors hover:bg-muted/80"
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: 4 }}
              key={activeTab}
              onClick={() => copyCommand(activeConfig.command)}
              transition={{ duration: 0.15 }}
              type="button"
            >
              <TerminalIcon className="size-4 shrink-0 text-muted-foreground" />
              <code className="flex-1 text-left font-mono text-sm">
                {activeConfig.command}
              </code>
              {commandCopied ? (
                <CheckIcon className="size-4 shrink-0 text-green-500" />
              ) : (
                <CopyIcon className="size-4 shrink-0 text-muted-foreground" />
              )}
            </motion.button>
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-background">
            <div
              className="group-hover/cli-hero:paused h-full w-full origin-left animate-[progress_10s_linear] bg-foreground"
              key={animationKey}
              onAnimationEnd={handleAnimationEnd}
            />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <AnimatePresence mode="wait">
            {[1, 2, 3].map((num) => (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex flex-col gap-1 p-4"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={`${activeTab}-${num}`}
                transition={{ duration: 0.15, delay: num * 0.05 }}
              >
                <h3 className="font-medium text-sm">
                  {t(`${activeTab}_feature${num}Title`)}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {t(`${activeTab}_feature${num}Description`)}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="hidden shrink-0 items-center justify-center border-border border-t bg-muted/20 p-6 md:p-8 lg:flex lg:border-t-0 lg:border-l">
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.95 }}
            key={activeTab}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "code" ? (
              <Ralph className="h-auto w-full max-w-[150px] text-foreground transition-colors duration-500 hover:text-primary md:max-w-[200px]" />
            ) : (
              <Brain className="h-auto w-full max-w-[150px] text-foreground transition-colors duration-500 hover:text-primary md:max-w-[200px]" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
