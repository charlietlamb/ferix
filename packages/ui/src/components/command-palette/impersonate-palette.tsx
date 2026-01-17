"use client";

import { api } from "@ferix/server/_generated/api";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@ferix/ui/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ferix/ui/components/ui/dialog";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useImpersonation } from "@ferix/ui/hooks/use-impersonation";
import { UserIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ImpersonatePalette() {
  const t = useTranslations("commandPalette");
  const { close, stack } = useDialog();
  const { impersonateUser } = useImpersonation();
  const [search, setSearch] = useState("");

  const users = useQuery(api.users.listForImpersonation, { search });
  const isOpen = stack.some((d) => d.key === "impersonatePalette");

  const handleSelect = async (userId: string) => {
    close();
    setSearch("");
    await impersonateUser(userId);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setSearch("");
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t("impersonateTitle")}</DialogTitle>
        <DialogDescription>{t("impersonateDescription")}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <Command className="border-0" shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder={t("impersonatePlaceholder")}
            value={search}
          />
          <CommandList>
            {users === undefined && (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
                <Spinner />
                <span>{t("loading")}</span>
              </div>
            )}
            {users?.length === 0 && (
              <CommandEmpty>{t("impersonateNoUsers")}</CommandEmpty>
            )}
            {users && users.length > 0 && (
              <CommandGroup heading={t("impersonateUsers")}>
                {users.map((user) => (
                  <CommandItem
                    key={user._id}
                    onSelect={() => handleSelect(user._id)}
                    value={user._id}
                  >
                    {user.image ? (
                      <img
                        alt={user.name}
                        className="size-6 shrink-0 rounded-full"
                        height={24}
                        src={user.image}
                        width={24}
                      />
                    ) : (
                      <UserIcon className="size-6 shrink-0" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-muted-foreground text-xs">
                        {user.username ? `@${user.username}` : user.email}
                      </span>
                    </div>
                    {user.role === "admin" && (
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
                        Admin
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
