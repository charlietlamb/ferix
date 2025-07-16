export function FormWrapper({
  heading,
  subheading,
  children,
}: {
  heading: string
  subheading: string
  children: React.ReactNode
}) {
  return (
    <form className="flex flex-col gap-4 w-full max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">{heading}</h1>
        <p className="text-muted-foreground">{subheading}</p>
      </div>
      {children}
    </form>
  )
}
