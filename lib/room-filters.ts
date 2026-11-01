import type { StudyRoom } from "@/types/room";

export type RoomFilterGroup = "topics" | "moods" | "tags";

export type RoomFilters = Record<RoomFilterGroup, string[]>;

export const emptyRoomFilters: RoomFilters = { topics: [], moods: [], tags: [] };

export interface RoomFilterOption {
  value: string;
  count: number;
}

function countBy(values: string[]): RoomFilterOption[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

/** Filter options come from the rooms themselves, counted over the full list. */
export function getRoomFilterOptions(rooms: StudyRoom[]): Record<RoomFilterGroup, RoomFilterOption[]> {
  return {
    topics: countBy(rooms.map((room) => room.topic).filter(Boolean)),
    moods: countBy(rooms.map((room) => room.mood).filter(Boolean)),
    tags: countBy(rooms.flatMap((room) => room.tags ?? [])),
  };
}

export function countActiveFilters(filters: RoomFilters) {
  return filters.topics.length + filters.moods.length + filters.tags.length;
}

/**
 * Within a group a room matches if it has ANY selected value (OR).
 * Across groups a room must satisfy every group that has a selection (AND).
 */
export function filterRooms(rooms: StudyRoom[], filters: RoomFilters) {
  return rooms.filter(
    (room) =>
      (filters.topics.length === 0 || filters.topics.includes(room.topic)) &&
      (filters.moods.length === 0 || filters.moods.includes(room.mood)) &&
      (filters.tags.length === 0 || (room.tags ?? []).some((tag) => filters.tags.includes(tag)))
  );
}


export interface RoomEmptyState {
  title: string;
  description: string;
  /** What the single "clear" button resets, so the button label can match. */
  clear: "search" | "filters" | "both";
}

const MAX_SHOWN_QUERY = 40;

/** Copy for the "no rooms found" state, based on whether a search, filters, or both are active. */
export function getRoomEmptyState(query: string, activeFilters: number): RoomEmptyState {
  const term = query.trim();
  const shown = term.length > MAX_SHOWN_QUERY ? `${term.slice(0, MAX_SHOWN_QUERY)}…` : term;
  if (term && activeFilters > 0) {
    return {
      title: `No rooms match “${shown}” with these filters`,
      description: "Try a different search, remove a filter, or clear everything to see all rooms.",
      clear: "both",
    };
  }
  if (term) {
    return {
      title: `No rooms match “${shown}”`,
      description: "Check the spelling, or try a shorter or more general word.",
      clear: "search",
    };
  }
  return {
    title: "No rooms match those filters",
    description: "Try removing a filter or two, or clear everything to see all rooms.",
    clear: "filters",
  };
}