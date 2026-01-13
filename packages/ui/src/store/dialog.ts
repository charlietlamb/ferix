import { atom } from "jotai";
import { ForgotPasswordDialog } from "../components/auth/forgot-password/forgot-password-dialog";
import { SignInDialog } from "../components/auth/sign-in/sign-in-dialog";
import { SignUpDialog } from "../components/auth/sign-up/sign-up-dialog";
import { ConfirmDialog } from "../components/dialog/confirm-dialog";
import { CreatePromptDialog } from "../components/prompts/create/create-prompt-dialog";
import { ChangePasswordDialog } from "../components/settings/change-password-dialog";
import { SettingsDialog } from "../components/settings/settings-dialog";
import type { ConfirmDialogProps } from "./dialog-types";
export interface DialogMap {
  signInDialog: undefined;
  signUpDialog: undefined;
  settingsDialog: undefined;
  changePasswordDialog: undefined;
  forgotPasswordDialog: undefined;
  createPromptDialog: undefined;
  confirmDialog: ConfirmDialogProps;
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
  settingsDialog: SettingsDialog,
  changePasswordDialog: ChangePasswordDialog,
  forgotPasswordDialog: ForgotPasswordDialog,
  createPromptDialog: CreatePromptDialog,
  confirmDialog: ConfirmDialog,
};

export const dialogStackAtom = atom<DialogEntry[]>([]);
