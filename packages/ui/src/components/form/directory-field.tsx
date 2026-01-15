"use client";

import { DirectoryItem } from "@ferix/ui/components/directory/directory-item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ferix/ui/components/ui/select";
import { useFieldContext } from "@ferix/ui/hooks/form-context";
import { directories, getDirectoryById } from "@ferix/ui/lib/directories";
import { useTranslations } from "next-intl";

export function DirectoryField() {
  const field = useFieldContext<string | undefined>();
  const t = useTranslations("promptNew");

  const currentDirectory = field.state.value
    ? getDirectoryById(field.state.value)
    : null;

  const handleChange = (value: string | null) => {
    field.handleChange(value === "none" || value === null ? undefined : value);
  };

  return (
    <Select onValueChange={handleChange} value={field.state.value ?? "none"}>
      <SelectTrigger className="w-full">
        <SelectValue>
          {currentDirectory ? (
            <DirectoryItem directory={currentDirectory} />
          ) : (
            t("noDirectory")
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t("noDirectory")}</SelectItem>
        {directories.map((directory) => (
          <SelectItem key={directory.id} value={directory.id}>
            <DirectoryItem directory={directory} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
