export interface Directory {
  id: string;
  name: string;
  lightImageUrl: string;
  darkImageUrl: string;
  link: string;
}

export const directories: Directory[] = [
  {
    id: "cursor-directory",
    name: "cursor.directory",
    lightImageUrl: "/icons/cursor-light.svg",
    darkImageUrl: "/icons/cursor-dark.svg",
    link: "https://cursor.directory",
  },
];

export function getDirectoryById(id: string): Directory | undefined {
  return directories.find((directory) => directory.id === id);
}

export function directoriesToOptions() {
  return directories.map((directory) => ({
    label: directory.name,
    value: directory.id,
  }));
}
