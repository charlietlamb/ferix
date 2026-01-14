export function LogoSection() {
  return (
    <section className="grid grid-cols-8 border-border border-t">
      <div className="border-border border-r" />
      <div className="relative col-span-6 h-[10vw] overflow-hidden border-border border-r">
        <h2 className="absolute inset-x-0 top-0 select-none text-center font-black text-[20vw] text-foreground uppercase italic leading-[0.8] tracking-tighter">
          Ferix
        </h2>
      </div>
      <div />
    </section>
  );
}
