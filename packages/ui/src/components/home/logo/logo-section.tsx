"use client";

import { SiGithub, SiX } from "@icons-pack/react-simple-icons";

const githubLink = "https://github.com/charlietlamb/ferix";
const xLink = "https://x.com/charlietlamb";
const linkClassNames =
  "flex cursor-pointer items-center justify-center border-border border-r transition-colors hover:bg-muted";
const iconClassNames = "sm:size-6 md:size-8 lg:size-10";

export function LogoSection() {
  return (
    <section className="grid grid-cols-8">
      <a className={linkClassNames} href={githubLink} target="_blank">
        <SiGithub className={iconClassNames} />
      </a>
      <div className="relative col-span-6 h-[10vw] overflow-hidden border-border border-r">
        <h2 className="absolute inset-x-0 top-0 select-none text-center font-black text-[20vw] text-foreground uppercase italic leading-[0.8] tracking-tighter">
          Ferix
        </h2>
      </div>
      <a className={linkClassNames} href={xLink} target="_blank">
        <SiX className={iconClassNames} />
      </a>
    </section>
  );
}
