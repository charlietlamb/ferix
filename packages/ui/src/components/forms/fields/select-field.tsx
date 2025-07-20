import { FieldInfo } from '@ferix/ui/components/forms/field-info';
import { Label } from '@ferix/ui/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ferix/ui/components/shadcn/select';
import { useFieldContext } from '@ferix/ui/hooks/form-context';

export type SelectFieldOption = {
  label: string;
  value: string;
};

export function SelectField({
  label,
  options,
  placeholder,
  textAfter,
}: {
  label: string;
  options: SelectFieldOption[];
  placeholder: string;
  textAfter?: string;
}) {
  const field = useFieldContext<string>();
  return (
    <div className="*:not-first:mt-2">
      <Label>{label}</Label>
      <Select onValueChange={field.handleChange} value={field.state.value}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {textAfter && (
        <section
          aria-live="polite"
          className="mt-2 text-muted-foreground text-xs"
        >
          {textAfter}
        </section>
      )}
      <FieldInfo field={field} />
    </div>
  );
}
