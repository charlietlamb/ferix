"use client";

import type { Id } from "@ferix/server/_generated/dataModel";
import { useCallback, useEffect, useRef, useState } from "react";

interface UsePromptDraftOptions {
  promptId?: Id<"prompts">;
  serverContent: string;
  debounceMs?: number;
}

interface UsePromptDraftReturn {
  content: string;
  setContent: (value: string) => void;
  hasLocalChanges: boolean;
  hasUnsavedChanges: boolean;
  clearDraft: () => void;
  resetToServer: () => void;
}

export function usePromptDraft({
  promptId,
  serverContent,
  debounceMs = 1000,
}: UsePromptDraftOptions): UsePromptDraftReturn {
  const storageKey = promptId ? `prompt-draft-${promptId}` : "prompt-draft-new";

  // Initialize from localStorage or server content
  const [content, setContent] = useState(() => {
    if (typeof window === "undefined") {
      return serverContent;
    }
    return localStorage.getItem(storageKey) ?? serverContent;
  });

  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Track previous server content to sync after saves (ref-based, no effect needed)
  const prevServerContent = useRef(serverContent);
  if (prevServerContent.current !== serverContent) {
    prevServerContent.current = serverContent;
    // If no draft exists, sync with new server content
    if (typeof window !== "undefined" && !localStorage.getItem(storageKey)) {
      setContent(serverContent);
    }
  }

  // Single effect: debounced localStorage sync
  useEffect(() => {
    if (content === serverContent) {
      localStorage.removeItem(storageKey);
      setHasLocalChanges(false);
      return;
    }

    const timeout = setTimeout(() => {
      localStorage.setItem(storageKey, content);
      setHasLocalChanges(true);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [content, serverContent, storageKey, debounceMs]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasLocalChanges(false);
  }, [storageKey]);

  const resetToServer = useCallback(() => {
    setContent(serverContent);
    localStorage.removeItem(storageKey);
    setHasLocalChanges(false);
  }, [serverContent, storageKey]);

  return {
    content,
    setContent,
    hasLocalChanges,
    hasUnsavedChanges: content !== serverContent,
    clearDraft,
    resetToServer,
  };
}
