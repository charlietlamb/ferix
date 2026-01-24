/**
 * Retro Form TUI - Terminal form with retro styling
 * One question at a time, bordered box aesthetic
 */

import type { Question } from "../../types/questions.js";
import { screen } from "../ansi.js";
import { askConfirm, askSelect, askText } from "./inputs/index.js";
import { showIntro } from "./intro.js";
import { showCancelled, showStarting, showSummary } from "./summary.js";

export class RetroForm {
  private readonly answers: Record<string, string | number | boolean> = {};
  private cancelled = false;

  /**
   * Show the intro screen with logo and wait for keypress
   */
  async showIntro(): Promise<void> {
    await showIntro();
  }

  /**
   * Run through all questions and collect answers
   */
  async run(
    questions: Question[]
  ): Promise<Record<string, string | number | boolean> | null> {
    await this.showIntro();

    for (const question of questions) {
      if (this.cancelled) {
        return null;
      }

      // Clear screen and center for each question
      screen.clear();
      screen.home();

      await this.askQuestion(question);
    }

    if (this.cancelled) {
      return null;
    }

    return this.answers;
  }

  /**
   * Ask a single question based on its type
   */
  private askQuestion(question: Question): Promise<void> {
    return new Promise((resolve) => {
      const onCancel = () => {
        this.cancelled = true;
        resolve();
      };

      switch (question.type) {
        case "text":
          askText(
            question,
            (answer) => {
              this.answers[question.id] = answer;
              resolve();
            },
            onCancel,
            () => this.askQuestion(question).then(resolve)
          );
          break;
        case "select":
          askSelect(
            question,
            (value) => {
              this.answers[question.id] = value;
              resolve();
            },
            onCancel
          );
          break;
        case "confirm":
          askConfirm(
            question,
            (value) => {
              this.answers[question.id] = value;
              resolve();
            },
            onCancel
          );
          break;
        default:
          resolve();
          break;
      }
    });
  }

  /**
   * Show a summary box before confirmation
   */
  showSummary(items: Record<string, string>): void {
    showSummary(items);
  }

  /**
   * Show cancelled message
   */
  showCancelled(): void {
    showCancelled();
  }

  /**
   * Show ready to start message
   */
  showStarting(): void {
    showStarting();
  }
}

// Re-export types for consumers
export type { Question } from "../../types/questions.js";
