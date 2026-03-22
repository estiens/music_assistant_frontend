<template>
  <div>
    <!-- Controls -->
    <div class="flex items-center gap-3 border-b px-6 py-3">
      <div class="relative max-w-xs">
        <Search
          class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input v-model="searchQuery" :placeholder="$t('search')" class="pl-9" />
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
              {{ toSentenceCase($t("genre_name")) }}
            </th>
            <th class="h-10 w-10 px-6"></th>
          </tr>
        </thead>
        <tbody class="[&_tr:last-child]:border-0">
          <tr
            v-for="exclusion in filteredExclusions"
            :key="exclusion.id"
            class="group border-b transition-colors hover:bg-muted/50"
          >
            <td class="pl-6 pr-2 py-3 align-middle">
              <div class="flex size-8 items-center justify-center">
                <img
                  v-if="exclusion.metadata?.images?.[0]"
                  :src="getMediaItemImageUrl(exclusion.metadata.images[0], 40)"
                  class="size-8 rounded object-cover"
                />
                <GenreIcon v-else class="size-4 text-muted-foreground" />
              </div>
            </td>
            <td class="px-6 py-3 align-middle font-medium">
              {{
                getGenreDisplayName(
                  exclusion.name,
                  exclusion.translation_key,
                  t,
                  te,
                )
              }}
            </td>
            <td class="px-6 py-3 align-middle">
              <Button
                variant="ghost"
                size="icon"
                class="size-7 opacity-0 group-hover:opacity-100"
                :disabled="pendingId === exclusion.id"
                @click="restoreGenre(exclusion)"
              >
                <Spinner v-if="pendingId === exclusion.id" class="size-3.5" />
                <RefreshCw v-else class="size-3.5 text-primary" />
              </Button>
            </td>
          </tr>

          <tr v-if="!loading && filteredExclusions.length === 0">
            <td colspan="3" class="px-6 py-8 text-center text-muted-foreground">
              {{ $t("no_content") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination footer -->
    <div class="flex items-center justify-between border-t px-6 py-3">
      <span class="text-sm text-muted-foreground">
        {{
          $t("settings.genre_table_page_info", [firstRow, lastRow, totalCount])
        }}
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

<script setup lang="ts">
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { refDebounced } from "@vueuse/core";

import GenreIcon from "@/components/icons/GenreIcon.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  getGenreDisplayName,
  getMediaItemImageUrl,
  toSentenceCase,
} from "@/helpers/utils";
import { api } from "@/plugins/api";
import type { GlobalGenreExclusion } from "@/plugins/api/interfaces";

interface Props {
  /** Increment to force a data refresh (e.g. after a genre is excluded). */
  version?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{ restored: [] }>();

const { t, te } = useI18n();

const searchQuery = ref("");
const debouncedSearch = refDebounced(searchQuery, 300);
const page = ref(1);
const rowsPerPage = 25;

const exclusions = ref<GlobalGenreExclusion[]>([]);
const loading = ref(false);
const pendingId = ref<number | null>(null);

const filteredExclusions = computed(() => {
  const list = debouncedSearch.value
    ? exclusions.value.filter((e) =>
        e.name.toLowerCase().includes(debouncedSearch.value.toLowerCase()),
      )
    : exclusions.value;
  const start = (page.value - 1) * rowsPerPage;
  return list.slice(start, start + rowsPerPage);
});

const totalCount = computed(() => {
  if (!debouncedSearch.value) return exclusions.value.length;
  const q = debouncedSearch.value.toLowerCase();
  return exclusions.value.filter((e) => e.name.toLowerCase().includes(q))
    .length;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / rowsPerPage)),
);
const firstRow = computed(() =>
  totalCount.value === 0 ? 0 : (page.value - 1) * rowsPerPage + 1,
);
const lastRow = computed(() =>
  Math.min(page.value * rowsPerPage, totalCount.value),
);
const hasNextPage = computed(() => page.value * rowsPerPage < totalCount.value);

const loadData = async () => {
  loading.value = true;
  try {
    exclusions.value = await api.getGlobalGenreExclusions();
  } finally {
    loading.value = false;
  }
};

const restoreGenre = async (exclusion: GlobalGenreExclusion) => {
  pendingId.value = exclusion.id;
  try {
    await api.removeGlobalGenreExclusion(exclusion.id);
    exclusions.value = exclusions.value.filter((e) => e.id !== exclusion.id);
    emit("restored");
  } finally {
    pendingId.value = null;
  }
};

watch(searchQuery, () => {
  page.value = 1;
});

watch(() => props.version, loadData, { immediate: true });
</script>
