<template>
  <div>
    <!-- Controls -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
      <div
        class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3"
      >
        <div class="relative w-full sm:max-w-xs">
          <Search
            class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            :placeholder="$t('search')"
            class="w-full pl-9"
          />
        </div>
        <NativeSelect v-model="filter">
          <option
            v-for="opt in filterOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </NativeSelect>
      </div>
      <div class="hidden shrink-0 items-center gap-2 sm:flex">
        <span class="text-sm text-muted-foreground">
          {{ $t("settings.genre_table_rows_per_page") }}
        </span>
        <NativeSelect v-model="rowsPerPage" class="w-20">
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </NativeSelect>
      </div>
    </div>

    <!-- Table -->
    <div class="relative overflow-x-auto">
      <div
        v-if="loading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-background/60"
      >
        <Spinner class="size-5" />
      </div>

      <table class="w-full caption-bottom text-sm">
        <thead>
          <tr class="border-b">
            <th class="h-10 w-14 pl-6 pr-2"></th>
            <th
              class="h-10 px-6 text-left align-middle font-medium text-muted-foreground"
            >
              {{ toSentenceCase($t("name")) }}
            </th>
            <th
              class="hidden h-10 cursor-pointer select-none px-6 text-right align-middle font-medium text-muted-foreground hover:text-foreground sm:table-cell"
              @click="toggleSort('aliases')"
            >
              <span class="inline-flex items-center justify-end gap-1">
                {{ toSentenceCase($t("aliases")) }}
                <ChevronUp
                  v-if="sortColumn === 'aliases' && sortDir === 'asc'"
                  class="size-3.5"
                />
                <ChevronDown
                  v-else-if="sortColumn === 'aliases' && sortDir === 'desc'"
                  class="size-3.5"
                />
                <ChevronsUpDown v-else class="size-3.5 opacity-40" />
              </span>
            </th>
            <th
              class="hidden h-10 cursor-pointer select-none px-6 text-right align-middle font-medium text-muted-foreground hover:text-foreground sm:table-cell"
              @click="toggleSort('track')"
            >
              <span class="inline-flex items-center justify-end gap-1">
                {{ toSentenceCase($t("tracks")) }}
                <ChevronUp
                  v-if="sortColumn === 'track' && sortDir === 'asc'"
                  class="size-3.5"
                />
                <ChevronDown
                  v-else-if="sortColumn === 'track' && sortDir === 'desc'"
                  class="size-3.5"
                />
                <ChevronsUpDown v-else class="size-3.5 opacity-40" />
              </span>
            </th>
            <th
              class="hidden h-10 cursor-pointer select-none px-6 text-right align-middle font-medium text-muted-foreground hover:text-foreground sm:table-cell"
              @click="toggleSort('album')"
            >
              <span class="inline-flex items-center justify-end gap-1">
                {{ toSentenceCase($t("albums")) }}
                <ChevronUp
                  v-if="sortColumn === 'album' && sortDir === 'asc'"
                  class="size-3.5"
                />
                <ChevronDown
                  v-else-if="sortColumn === 'album' && sortDir === 'desc'"
                  class="size-3.5"
                />
                <ChevronsUpDown v-else class="size-3.5 opacity-40" />
              </span>
            </th>
            <th
              class="hidden h-10 cursor-pointer select-none px-6 text-right align-middle font-medium text-muted-foreground hover:text-foreground sm:table-cell"
              @click="toggleSort('artist')"
            >
              <span class="inline-flex items-center justify-end gap-1">
                {{ toSentenceCase($t("artists")) }}
                <ChevronUp
                  v-if="sortColumn === 'artist' && sortDir === 'asc'"
                  class="size-3.5"
                />
                <ChevronDown
                  v-else-if="sortColumn === 'artist' && sortDir === 'desc'"
                  class="size-3.5"
                />
                <ChevronsUpDown v-else class="size-3.5 opacity-40" />
              </span>
            </th>
            <th
              class="hidden h-10 cursor-pointer select-none px-6 text-right align-middle font-medium text-muted-foreground hover:text-foreground sm:table-cell"
              @click="toggleSort('podcast')"
            >
              <span class="inline-flex items-center justify-end gap-1">
                {{ toSentenceCase($t("podcasts")) }}
                <ChevronUp
                  v-if="sortColumn === 'podcast' && sortDir === 'asc'"
                  class="size-3.5"
                />
                <ChevronDown
                  v-else-if="sortColumn === 'podcast' && sortDir === 'desc'"
                  class="size-3.5"
                />
                <ChevronsUpDown v-else class="size-3.5 opacity-40" />
              </span>
            </th>
            <th
              class="hidden h-10 cursor-pointer select-none px-6 text-right align-middle font-medium text-muted-foreground hover:text-foreground sm:table-cell"
              @click="toggleSort('audiobook')"
            >
              <span class="inline-flex items-center justify-end gap-1">
                {{ toSentenceCase($t("audiobooks")) }}
                <ChevronUp
                  v-if="sortColumn === 'audiobook' && sortDir === 'asc'"
                  class="size-3.5"
                />
                <ChevronDown
                  v-else-if="sortColumn === 'audiobook' && sortDir === 'desc'"
                  class="size-3.5"
                />
                <ChevronsUpDown v-else class="size-3.5 opacity-40" />
              </span>
            </th>
            <th class="h-10 w-10 px-6"></th>
          </tr>
        </thead>
        <tbody class="[&_tr:last-child]:border-0">
          <tr
            v-for="genre in activeGenresPage"
            :key="genre.item_id"
            class="group border-b transition-colors hover:bg-muted/50"
          >
            <td class="pl-6 pr-2 py-3 align-middle">
              <div class="flex size-8 items-center justify-center">
                <img
                  v-if="getImageThumbForItem(genre, ImageType.THUMB, 40)"
                  :src="getImageThumbForItem(genre, ImageType.THUMB, 40)"
                  class="size-8 rounded object-cover"
                />
                <GenreIcon v-else class="size-4 text-muted-foreground" />
              </div>
            </td>
            <td
              class="cursor-pointer px-6 py-3 align-middle font-medium hover:underline"
              @click="navigateToGenre(genre)"
            >
              {{ toSentenceCase(genre.name) }}
            </td>
            <td
              class="hidden px-6 py-3 align-middle text-right text-muted-foreground sm:table-cell"
            >
              {{ genre.genre_aliases?.length ?? 0 }}
            </td>
            <td
              class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
              @click="navigateToLibraryByGenre(genre, 'track')"
            >
              {{ countFor(genre.item_id, "track") }}
            </td>
            <td
              class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
              @click="navigateToLibraryByGenre(genre, 'album')"
            >
              {{ countFor(genre.item_id, "album") }}
            </td>
            <td
              class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
              @click="navigateToLibraryByGenre(genre, 'artist')"
            >
              {{ countFor(genre.item_id, "artist") }}
            </td>
            <td
              class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
              @click="navigateToLibraryByGenre(genre, 'podcast')"
            >
              {{ countFor(genre.item_id, "podcast") }}
            </td>
            <td
              class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
              @click="navigateToLibraryByGenre(genre, 'audiobook')"
            >
              {{ countFor(genre.item_id, "audiobook") }}
            </td>
            <td class="px-6 py-3 align-middle">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-7 opacity-0 group-hover:opacity-100"
                    :disabled="pendingId === genre.item_id"
                    @click="excludeGenre(genre.item_id)"
                  >
                    <Spinner
                      v-if="pendingId === genre.item_id"
                      class="size-3.5"
                    />
                    <Trash2 v-else class="size-3.5 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{{ $t("exclude_genre") }}</TooltipContent>
              </Tooltip>
            </td>
          </tr>

          <tr
            v-if="
              !loading &&
              activeGenresPage.length === 0 &&
              filteredExclusions.length === 0
            "
          >
            <td
              colspan="3"
              class="px-6 py-8 text-center text-muted-foreground sm:hidden"
            ></td>
            <td
              colspan="9"
              class="hidden px-6 py-8 text-center text-muted-foreground sm:table-cell"
            >
              {{ $t("no_content") }}
            </td>
          </tr>

          <tr
            v-for="exclusion in filteredExclusions"
            :key="`excl-${exclusion.id}`"
            class="group border-b transition-colors hover:bg-muted/50 opacity-50"
          >
            <td class="pl-6 pr-2 py-3 align-middle">
              <div class="flex size-8 items-center justify-center">
                <img
                  v-if="exclusion.metadata?.images?.[0]"
                  :src="getMediaItemImageUrl(exclusion.metadata.images[0], 40)"
                  class="size-8 rounded object-cover grayscale"
                />
                <GenreIcon v-else class="size-4 text-muted-foreground" />
              </div>
            </td>
            <td class="px-6 py-3 align-middle font-medium line-through">
              {{
                getGenreDisplayName(
                  exclusion.name,
                  exclusion.translation_key,
                  t,
                  te,
                )
              }}
            </td>
            <td
              class="hidden px-6 py-3 align-middle text-right text-muted-foreground sm:table-cell"
            >
              —
            </td>
            <td
              class="hidden px-6 py-3 align-middle text-right tabular-nums text-muted-foreground sm:table-cell"
            >
              —
            </td>
            <td
              class="hidden px-6 py-3 align-middle text-right tabular-nums text-muted-foreground sm:table-cell"
            >
              —
            </td>
            <td
              class="hidden px-6 py-3 align-middle text-right tabular-nums text-muted-foreground sm:table-cell"
            >
              —
            </td>
            <td
              class="hidden px-6 py-3 align-middle text-right tabular-nums text-muted-foreground sm:table-cell"
            >
              —
            </td>
            <td
              class="hidden px-6 py-3 align-middle text-right tabular-nums text-muted-foreground sm:table-cell"
            >
              —
            </td>
            <td class="px-6 py-3 align-middle">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-7 opacity-0 group-hover:opacity-100"
                    :disabled="restorePendingId === exclusion.id"
                    @click="restoreGenre(exclusion)"
                  >
                    <Spinner
                      v-if="restorePendingId === exclusion.id"
                      class="size-3.5"
                    />
                    <RefreshCw v-else class="size-3.5 text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{{ $t("restore_genre") }}</TooltipContent>
              </Tooltip>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination footer -->
    <div class="flex items-center justify-between border-t px-6 py-3">
      <span class="text-sm text-muted-foreground">
        {{ $t("settings.genre_table_page_info", [firstRow, lastRow, totalCount]) }}
      </span>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          :disabled="page <= 1"
          @click="page--"
        >
          <ChevronLeft class="size-4" />
        </Button>
        <span class="min-w-[4rem] text-center text-sm text-muted-foreground">
          {{ page }} / {{ totalPages }}
        </span>
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          :disabled="!hasNextPage"
          @click="page++"
        >
          <ChevronRight class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Module-level timer so the debounce survives component unmount / navigation.
let scanDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function triggerGenreScanDebounced(
  triggerFn: () => void,
  delay = 10_000,
) {
  if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
  scanDebounceTimer = setTimeout(() => {
    scanDebounceTimer = null;
    triggerFn();
  }, delay);
}
</script>

<script setup lang="ts">
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { refDebounced } from "@vueuse/core";

import GenreIcon from "@/components/icons/GenreIcon.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getGenreDisplayName,
  getImageThumbForItem,
  getMediaItemImageUrl,
  toSentenceCase,
} from "@/helpers/utils";
import { EventType, ImageType } from "@/plugins/api/interfaces";
import { api } from "@/plugins/api";
import { store } from "@/plugins/store";
import type {
  EventMessage,
  Genre,
  GlobalGenreExclusion,
} from "@/plugins/api/interfaces";

interface Props {
  /** Increment to force a data refresh (e.g. after a restore operation). */
  version?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{ excluded: [] }>();

const router = useRouter();
const { t, te } = useI18n();

type FilterMode = "all" | "non_empty" | "default";

const searchQuery = ref("");
const debouncedSearch = refDebounced(searchQuery, 300);
const rowsPerPage = ref("25");
const page = ref(1);
const filter = ref<FilterMode>("all");

const filterOptions: { value: FilterMode; label: string }[] = [
  { value: "all", label: t("tooltip.show_all_genres") },
  { value: "non_empty", label: t("tooltip.hide_empty_genres") },
  { value: "default", label: t("tooltip.show_only_default_genres") },
];

const allGenres = ref<Genre[]>([]);
const globalExclusions = ref<GlobalGenreExclusion[]>([]);
const allMediaCounts = ref<Record<string, Record<string, number>> | null>(null);
const countsLoading = ref(false);
const loading = ref(false);
const pendingId = ref<string | null>(null);
const restorePendingId = ref<number | null>(null);

type SortColumn =
  | "aliases"
  | "track"
  | "album"
  | "artist"
  | "podcast"
  | "audiobook";
const sortColumn = ref<SortColumn | null>(null);
const sortDir = ref<"asc" | "desc">("desc");

const toggleSort = (col: SortColumn) => {
  if (sortColumn.value === col) {
    sortDir.value = sortDir.value === "desc" ? "asc" : "desc";
  } else {
    sortColumn.value = col;
    sortDir.value = "desc";
  }
  page.value = 1;
};

const rowsPerPageNum = computed(() => Number(rowsPerPage.value));

const filteredActiveGenres = computed(() => {
  let list = allGenres.value;
  if (debouncedSearch.value) {
    const q = debouncedSearch.value.toLowerCase();
    list = list.filter((g) => g.name.toLowerCase().includes(q));
  }
  if (!sortColumn.value) return list;
  const col = sortColumn.value;
  const dir = sortDir.value === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const aVal =
      col === "aliases"
        ? (a.genre_aliases?.length ?? 0)
        : ((allMediaCounts.value?.[a.item_id] ?? {})[col] ?? 0);
    const bVal =
      col === "aliases"
        ? (b.genre_aliases?.length ?? 0)
        : ((allMediaCounts.value?.[b.item_id] ?? {})[col] ?? 0);
    return (aVal - bVal) * dir;
  });
});

const filteredExclusions = computed(() => {
  if (!debouncedSearch.value) return globalExclusions.value;
  const q = debouncedSearch.value.toLowerCase();
  return globalExclusions.value.filter((e) => e.name.toLowerCase().includes(q));
});

const activeGenresPage = computed(() => {
  const start = (page.value - 1) * rowsPerPageNum.value;
  return filteredActiveGenres.value.slice(start, start + rowsPerPageNum.value);
});

const totalCount = computed(() => filteredActiveGenres.value.length);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / rowsPerPageNum.value)),
);
const firstRow = computed(() =>
  totalCount.value === 0 ? 0 : (page.value - 1) * rowsPerPageNum.value + 1,
);
const lastRow = computed(() =>
  Math.min(page.value * rowsPerPageNum.value, totalCount.value),
);
const hasNextPage = computed(
  () => page.value * rowsPerPageNum.value < totalCount.value,
);

const loadData = async () => {
  loading.value = true;
  allMediaCounts.value = null;
  try {
    const hideEmpty =
      filter.value === "non_empty"
        ? true
        : filter.value === "default"
          ? null
          : false;
    [allGenres.value, globalExclusions.value] = await Promise.all([
      api.getLibraryGenres(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        hideEmpty,
      ),
      api.getGlobalGenreExclusions(),
    ]);
  } finally {
    loading.value = false;
  }
  loadCounts();
};

const loadCounts = async () => {
  if (allGenres.value.length === 0) return;
  countsLoading.value = true;
  try {
    allMediaCounts.value = await api.getGenreMediaCounts(
      allGenres.value.map((g) => g.item_id),
    );
  } catch {
    // Endpoint not yet available — counts will show as '—'
  } finally {
    countsLoading.value = false;
  }
};

const navigateToGenre = (genre: Genre) => {
  router.push({
    name: "genre",
    params: { provider: genre.provider, itemId: genre.item_id },
  });
};

const navigateToLibraryByGenre = (genre: Genre, mediaType: string) => {
  router.push({ name: `${mediaType}s`, query: { genre_ids: genre.item_id } });
};

const countFor = (genreId: string, mediaType: string): string => {
  if (countsLoading.value) return "…";
  if (!allMediaCounts.value) return "—";
  return ((allMediaCounts.value[genreId] ?? {})[mediaType] ?? 0).toLocaleString();
};

const excludeGenre = async (itemId: string) => {
  pendingId.value = itemId;
  try {
    await api.deleteGenre(itemId);
    allGenres.value = allGenres.value.filter((g) => g.item_id !== itemId);
    globalExclusions.value = await api.getGlobalGenreExclusions();
    emit("excluded");
  } finally {
    pendingId.value = null;
  }
};

let tableReloadTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleTableReload = () => {
  // Debounce reloads so a burst of scan events causes only one refresh.
  if (tableReloadTimer) clearTimeout(tableReloadTimer);
  tableReloadTimer = setTimeout(async () => {
    tableReloadTimer = null;
    await loadData();
    store.libraryGenresCount = await api.getLibraryGenresCount();
    if (store.prevState?.path === "librarygenres") {
      store.prevState = undefined;
    }
  }, 1500);
};

onMounted(() => {
  const unsub = api.subscribe_multi(
    [
      EventType.MEDIA_ITEM_ADDED,
      EventType.MEDIA_ITEM_UPDATED,
      EventType.MEDIA_ITEM_DELETED,
    ],
    (evt: EventMessage) => {
      if (evt.object_id?.startsWith("library://genre")) {
        scheduleTableReload();
      }
    },
  );

  onBeforeUnmount(() => {
    if (tableReloadTimer) clearTimeout(tableReloadTimer);
    unsub();
  });
});

const restoreGenre = async (exclusion: GlobalGenreExclusion) => {
  restorePendingId.value = exclusion.id;
  try {
    const restored = await api.removeGlobalGenreExclusion(exclusion.id);
    globalExclusions.value = globalExclusions.value.filter(
      (e) => e.id !== exclusion.id,
    );
    allGenres.value = [...allGenres.value, restored].sort((a, b) =>
      (a.sort_name ?? a.name).localeCompare(b.sort_name ?? b.name),
    );
    if (store.prevState?.path === "librarygenres") {
      store.prevState = undefined;
    }
    triggerGenreScanDebounced(() => {
      api.triggerGenreScan().catch(() => {
        // fire-and-forget; table and library view refresh via genre event subscription
      });
    });
  } finally {
    restorePendingId.value = null;
  }
};

// Reset to page 1 when search, filter, or page size changes
watch([searchQuery, filter, rowsPerPage], () => {
  page.value = 1;
});

// Reload genres when filter changes (hide_empty is handled server-side)
watch(filter, loadData);

// Reload all data when version changes (e.g. after restore)
watch(() => props.version, loadData, { immediate: true });
</script>
