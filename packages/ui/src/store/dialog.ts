import { atom } from "jotai";
import { SignInDialog } from "../components/auth/sign-in/sign-in-dialog";
import { SignUpDialog } from "../components/auth/sign-up/sign-up-dialog";

export interface DialogMap {
  signInDialog: undefined;
  signUpDialog: undefined;
}

export type DialogKey = keyof DialogMap;

export type DialogEntry = {
  [K in keyof DialogMap]: {
    key: K;
    props: DialogMap[K];
  };
}[keyof DialogMap];

export type DialogProps<K extends DialogKey> = DialogMap[K];

export const dialogRegistry: {
  [K in keyof DialogMap]: React.FC<DialogMap[K]>;
} = {
  signInDialog: SignInDialog,
  signUpDialog: SignUpDialog,
};

export const dialogStackAtom = atom<DialogEntry[]>([]);
