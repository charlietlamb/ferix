import { hasCredentialAccountAtom } from "@ferix/ui/store/auth";
import { useAtomValue } from "jotai";

export function useHasCredentialAccount() {
  return useAtomValue(hasCredentialAccountAtom);
}
