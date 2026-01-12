import { Link } from "@ferix/i18n/navigation";
import { CirclesThreeIcon } from "@phosphor-icons/react";

export function Logo() {
  return (
    <Link className="group/logo flex items-center gap-1" href="/">
      <CirclesThreeIcon weight="bold" />
      <span className="mb-0.5 whitespace-nowrap font-bold italic tracking-tigh group-hover/logo:underline">
        ferix
      </span>
    </Link>
  );
}
