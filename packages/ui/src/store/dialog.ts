import { atom } from "jotai";

// Add dialog components here as they are created
// Example: import { ExampleDialog } from "../components/dialog/example-dialog";

// biome-ignore lint/complexity/noBannedTypes: Empty type is intentional - dialogs are added here as they are created
// biome-ignore lint/style/useConsistentTypeDefinitions: Using type for extensibility with augmentation
export type DialogMap = {};

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
  // Register dialog components here
  // Example: exampleDialog: ExampleDialog,
};

export const dialogStackAtom = atom<DialogEntry[]>([]);
