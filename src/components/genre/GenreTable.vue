<template>
  <div>
    <TableControls
      v-model:search="searchQuery"
      v-model:filter="filter"
      v-model:rows-per-page="rowsPerPage"
      :filter-options="filterOptions"
      :rows-per-page-label="$t('settings.genre_table_rows_per_page')"
    />

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
              {{ toSentenceCase($t("genre_name")) }}
            </th>
            <SortableHeader
              :label="toSentenceCase($t('aliases'))"
              :active="sortColumn === 'aliases'"
              :dir="sortDir"
              @sort="toggleSort('aliases')"
            />
            <SortableHeader
              :label="toSentenceCase($t('tracks'))"
              :active="sortColumn === 'track'"
              :dir="sortDir"
              @sort="toggleSort('track')"
            />
            <SortableHeader
              :label="toSentenceCase($t('albums'))"
              :active="sortColumn === 'album'"
              :dir="sortDir"
              @sort="toggleSort('album')"
            />
            <SortableHeader
              :label="toSentenceCase($t('artists'))"
              :active="sortColumn === 'artist'"
              :dir="sortDir"
              @sort="toggleSort('artist')"
            />
            <SortableHeader
              :label="toSentenceCase($t('podcasts'))"
              :active="sortColumn === 'podcast'"
              :dir="sortDir"
              @sort="toggleSort('podcast')"
            />
            <SortableHeader
              :label="toSentenceCase($t('audiobooks'))"
              :active="sortColumn === 'audiobook'"
              :dir="sortDir"
              @sort="toggleSort('audiobook')"
            />
            <th class="h-10 w-10 px-6"></th>
          </tr>
        </thead>
        <tbody class="[&_tr:last-child]:border-0">
          <GenreActiveRow
            v-for="genre in pagedItems"
            :key="genre.item_id"
            :genre="genre"
            :thumb-src="thumbMap[genre.item_id]"
            :pending="pendingId === genre.item_id"
            :count-for="(type) => countFor(genre.item_id, type)"
            @navigate="navigateToGenre(genre)"
            @navigate-library="(type) => navigateToLibraryByGenre(genre, type)"
            @exclude="excludeGenre(genre.item_id)"
          />

          <tr
            v-if="
              !loading &&
              pagedItems.length === 0 &&
              filteredExclusions.length === 0
            "
          >
            <td colspan="9" class="px-6 py-8 text-center text-muted-foreground">
              {{ $t("no_content") }}
            </td>
          </tr>

          <GenreExcludedRow
            v-for="exclusion in filteredExclusions"
            :key="`excl-${exclusion.item_id}`"
            :exclusion="exclusion"
            :thumb-src="thumbMap[exclusion.item_id]"
            :pending="restorePendingId === exclusion.item_id"
            @restore="restoreGenre(exclusion)"
          />
        </tbody>
      </table>
    </div>

    <TablePagination
      :info="
        $t('settings.genre_table_page_info', [firstRow, lastRow, totalCount])
      "
      :page="page"
      :total-pages="totalPages"
      :has-next-page="hasNextPage"
      @prev="page--"
      @next="page++"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { refDebounced } from "@vueuse/core";

import GenreActiveRow from "@/components/genre/GenreActiveRow.vue";
import GenreExcludedRow from "@/components/genre/GenreExcludedRow.vue";
import SortableHeader from "@/components/genre/SortableHeader.vue";
import { TableControls } from "@/components/ui/table-controls";
import { TablePagination } from "@/components/ui/table-pagination";
import { Spinner } from "@/components/ui/spinner";
import { scheduleGenreScan } from "@/helpers/genre";
import { getImageThumbForItem, toSentenceCase } from "@/helpers/utils";
import { EventType, ImageType } from "@/plugins/api/interfaces";
import { api } from "@/plugins/api";
import type { EventMessage, Genre } from "@/plugins/api/interfaces";
import { useTablePagination } from "@/composables/useTablePagination";

interface Props {
  /** Increment to force a data refresh (e.g. after a restore operation). */
  version?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{ "data-changed": [] }>();

const router = useRouter();
const { t } = useI18n();

type FilterMode = "all" | "non_empty" | "default";

const searchQuery = ref("");
const debouncedSearch = refDebounced(searchQuery, 300);
const rowsPerPage = ref("25");
const filter = ref<FilterMode>("all");

const filterOptions = [
  { value: "all", label: t("tooltip.show_all_genres") },
  { value: "non_empty", label: t("tooltip.hide_empty_genres") },
  { value: "default", label: t("tooltip.show_only_default_genres") },
];

const allGenres = ref<Genre[]>([]);
const globalExclusions = ref<Genre[]>([]);
const allMediaCounts = ref<Record<string, Record<string, number>> | null>(null);
const countsLoading = ref(false);
const loading = ref(false);
const pendingId = ref<string | null>(null);
const restorePendingId = ref<string | null>(null);

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

const thumbMap = computed(() => {
  const map: Record<string, string | undefined> = {};
  for (const g of allGenres.value)
    map[g.item_id] = getImageThumbForItem(g, ImageType.THUMB, 40) ?? undefined;
  for (const e of globalExclusions.value)
    map[e.item_id] = getImageThumbForItem(e, ImageType.THUMB, 40) ?? undefined;
  return map;
});

const filteredExclusions = computed(() => {
  if (!debouncedSearch.value) return globalExclusions.value;
  const q = debouncedSearch.value.toLowerCase();
  return globalExclusions.value.filter((e) => e.name.toLowerCase().includes(q));
});

const {
  page,
  totalCount,
  totalPages,
  firstRow,
  lastRow,
  hasNextPage,
  pagedItems,
} = useTablePagination(filteredActiveGenres, rowsPerPageNum);

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
  return (
    (allMediaCounts.value[genreId] ?? {})[mediaType] ?? 0
  ).toLocaleString();
};

const excludeGenre = async (itemId: string) => {
  pendingId.value = itemId;
  try {
    await api.removeGenreFromLibrary(itemId);
    allGenres.value = allGenres.value.filter((g) => g.item_id !== itemId);
    globalExclusions.value = await api.getGlobalGenreExclusions();
    scheduleGenreScan();
  } finally {
    pendingId.value = null;
  }
};

let tableReloadTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleTableReload = () => {
  if (tableReloadTimer) clearTimeout(tableReloadTimer);
  tableReloadTimer = setTimeout(async () => {
    tableReloadTimer = null;
    await loadData();
    emit("data-changed");
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
      if (evt.object_id?.startsWith("library://genre")) scheduleTableReload();
    },
  );
  onBeforeUnmount(() => {
    if (tableReloadTimer) clearTimeout(tableReloadTimer);
    unsub();
  });
});

const restoreGenre = async (exclusion: Genre) => {
  restorePendingId.value = exclusion.item_id;
  try {
    const restored = await api.removeGlobalGenreExclusion(exclusion.item_id);
    globalExclusions.value = globalExclusions.value.filter(
      (e) => e.item_id !== exclusion.item_id,
    );
    allGenres.value = [...allGenres.value, restored].sort((a, b) =>
      (a.sort_name ?? a.name).localeCompare(b.sort_name ?? b.name),
    );
    emit("data-changed");
    scheduleGenreScan();
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

// Reload all data when version prop changes (e.g. after restore)
watch(() => props.version, loadData, { immediate: true });
</script>
