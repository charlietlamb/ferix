'use client';

import { useState } from 'react';

export function TailwindIndicator() {
  const [open, setOpen] = useState(true);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!open) {
    return false;
  }

  return (
    <button
      className="fixed right-1 bottom-1 z-50 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full p-3 font-mono text-white text-xs"
      onClick={() => setOpen(!open)}
      type="button"
    >
      <div className="block sm:hidden">XS</div>
      <div className="hidden sm:block md:hidden">SM</div>
      <div className="hidden md:block lg:hidden">MD</div>
      <div className="hidden lg:block xl:hidden">LG</div>
      <div className="hidden xl:block 2xl:hidden">XL</div>
      <div className="hidden 2xl:block">2XL</div>
    </button>
  );
}
