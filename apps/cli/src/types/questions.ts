/**
 * Question types for the interactive form TUI
 */

/** Available question types */
export type QuestionType = "text" | "select" | "confirm";

/** Text input question */
export interface TextQuestion {
  type: "text";
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  validate?: (value: string) => string | undefined;
  /** Initial value to pre-fill the input */
  initial?: string;
}

/** Option for select questions */
export interface SelectOption {
  value: string | number;
  label: string;
  hint?: string;
}

/** Select (dropdown) question */
export interface SelectQuestion {
  type: "select";
  id: string;
  label: string;
  options: SelectOption[];
  /** Initial value to pre-select (matches against option values) */
  initial?: string | number;
}

/** Yes/No confirmation question */
export interface ConfirmQuestion {
  type: "confirm";
  id: string;
  label: string;
  initial?: boolean;
}

/** Union of all question types */
export type Question = TextQuestion | SelectQuestion | ConfirmQuestion;
