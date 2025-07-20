import type { AnyFormApi } from '@tanstack/react-form';

export function FormWrapper({
  form,
  heading,
  subheading,
  children,
  labels = true,
}: {
  form: AnyFormApi;
  heading: string;
  subheading: string;
  children: React.ReactNode;
  labels?: boolean;
}) {
  return (
    <form
      className="flex w-full max-w-xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {labels && (
        <div>
          <h1 className="font-bold text-2xl">{heading}</h1>
          <p className="text-muted-foreground">{subheading}</p>
        </div>
      )}
      {children}
    </form>
  );
}
