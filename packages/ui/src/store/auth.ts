import type { Account, User } from "better-auth";
import { atom } from "jotai";

export const userAtom = atom<User | undefined>(undefined);
export const accountsAtom = atom<Account[] | undefined>(undefined);

export const hasCredentialAccountAtom = atom((get) => {
  const accounts = get(accountsAtom);
  return accounts?.some((a) => a.providerId === "credential") ?? false;
});
