import { NavCategories } from "./nav-categories";
import { NavMain } from "./nav-main";
import { NavPersonal } from "./nav-personal";

export function SidebarMainContent() {
  return (
    <>
      <NavMain />
      <NavCategories />
      <NavPersonal />
    </>
  );
}
