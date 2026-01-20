"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { Button } from "@ferix/ui/components/ui/button";
import { getGithubAvatarUrl } from "@ferix/ui/lib/repositories";
import {
  DotsSixVerticalIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";

interface Repository {
  _id: Id<"directories">;
  owner: string;
  repo: string;
  name?: string;
  promptCount: number;
}

function RepositoryRow({
  repository,
  action,
  dragHandle,
}: {
  repository: Repository;
  action: React.ReactNode;
  dragHandle?: React.ReactNode;
}) {
  return (
    <div className="flex h-full gap-3 p-4">
      {dragHandle}
      <img
        alt={repository.owner}
        className="size-10 shrink-0 border border-border"
        height={40}
        src={getGithubAvatarUrl(repository.owner)}
        width={40}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm">{repository.name || repository.repo}</div>
        <div className="text-muted-foreground text-xs">
          {repository.owner}/{repository.repo}
        </div>
      </div>
      {action}
    </div>
  );
}

function SortableItem({
  repository,
  onRemove,
}: {
  repository: Repository;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: repository._id });

  return (
    <div
      className="border-border border-r border-b transition-colors hover:bg-muted/50"
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <RepositoryRow
        action={
          <button
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onRemove(repository._id)}
            type="button"
          >
            <TrashIcon size={16} />
          </button>
        }
        dragHandle={
          <button
            className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
            type="button"
            {...attributes}
            {...listeners}
          >
            <DotsSixVerticalIcon size={16} />
          </button>
        }
        repository={repository}
      />
    </div>
  );
}

function AvailableItem({
  repository,
  onAdd,
}: {
  repository: Repository;
  onAdd: (id: string) => void;
}) {
  return (
    <div className="border-border border-r border-b transition-colors hover:bg-muted/50">
      <RepositoryRow
        action={
          <button
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onAdd(repository._id)}
            type="button"
          >
            <PlusIcon size={16} />
          </button>
        }
        repository={repository}
      />
    </div>
  );
}

export function FeaturedRepositoriesManager() {
  const [featuredIds, setFeaturedIds] = useState<string[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const savedFeaturedIds = useQuery(api.settings.get, {
    key: "featuredRepositories",
  }) as string[] | null;

  const setSetting = useMutation(api.settings.set);

  const { results: allRepositories } = usePaginatedQuery(
    api.directories.list,
    { orderBy: "popular" },
    { initialNumItems: 100 }
  );

  const currentIds = featuredIds ?? savedFeaturedIds ?? [];

  const featuredRepositories = currentIds
    .map((id) => allRepositories?.find((d) => d._id === id))
    .filter((d) => d !== undefined);

  const availableRepositories = allRepositories?.filter(
    (d) => !currentIds.includes(d._id)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentIds.indexOf(active.id as string);
      const newIndex = currentIds.indexOf(over.id as string);
      setFeaturedIds(arrayMove(currentIds, oldIndex, newIndex));
    }
  };

  const handleAdd = (id: string) => setFeaturedIds([...currentIds, id]);
  const handleRemove = (id: string) =>
    setFeaturedIds(currentIds.filter((i) => i !== id));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setSetting({ key: "featuredRepositories", value: currentIds });
      setFeaturedIds(null);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    featuredIds !== null &&
    JSON.stringify(featuredIds) !== JSON.stringify(savedFeaturedIds ?? []);

  return (
    <div className="flex flex-col">
      {hasChanges && (
        <div className="flex justify-end border-border border-b p-4">
          <Button disabled={isSaving} onClick={handleSave} size="sm">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}

      <div className="border-border border-b p-4">
        <span className="text-muted-foreground text-xs">
          Current Order ({featuredRepositories.length})
        </span>
      </div>

      {featuredRepositories.length === 0 ? (
        <div className="border-border border-b p-4 text-center text-muted-foreground text-sm">
          No featured repositories. Add some below.
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={currentIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="-mr-px grid auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {featuredRepositories.map((repo) => (
                <SortableItem
                  key={repo._id}
                  onRemove={handleRemove}
                  repository={repo}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="border-border border-b p-4">
        <span className="text-muted-foreground text-xs">
          Available Repositories
        </span>
      </div>

      <div className="-mr-px grid auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {availableRepositories?.slice(0, 20).map((repo) => (
          <AvailableItem key={repo._id} onAdd={handleAdd} repository={repo} />
        ))}
      </div>
    </div>
  );
}
