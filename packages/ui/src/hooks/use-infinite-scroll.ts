"use client";

import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Hook for infinite scroll pagination using IntersectionObserver.
 * Returns a ref to attach to the loader element.
 *
 * @example
 * const loaderRef = useInfiniteScroll({
 *   hasMore: !results.isDone,
 *   isLoading: results.isLoading,
 *   onLoadMore: () => loadMore(20),
 * });
 *
 * return (
 *   <>
 *     {items.map(...)}
 *     <div ref={loaderRef} />
 *   </>
 * );
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = "0px",
}: UseInfiniteScrollOptions) {
  const loaderRef = useRef<T>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!(loader && hasMore) || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold, rootMargin]);

  return loaderRef;
}
