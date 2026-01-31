import { atom } from "jotai";

export type ProviderName = "claude" | "cursor" | "opencode";

export interface SessionState {
  provider: ProviderName;
  debug: boolean;
  yolo: boolean;
  branch?: string;
}

const defaultSession: SessionState = {
  provider: "claude",
  debug: false,
  yolo: false,
};

export const sessionAtom = atom<SessionState>(defaultSession);

export const providerAtom = atom((get) => get(sessionAtom).provider);
export const debugAtom = atom((get) => get(sessionAtom).debug);
export const yoloAtom = atom((get) => get(sessionAtom).yolo);
