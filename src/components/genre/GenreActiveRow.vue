<template>
  <tr class="group border-b transition-colors hover:bg-muted/50">
    <td class="pl-6 pr-2 py-3 align-middle">
      <div class="flex size-8 items-center justify-center">
        <img
          v-if="thumbSrc"
          :src="thumbSrc"
          class="size-8 rounded object-cover"
        />
        <GenreIcon v-else class="size-4 text-muted-foreground" />
      </div>
    </td>
    <td
      class="cursor-pointer px-6 py-3 align-middle font-medium hover:underline"
      @click="emit('navigate')"
    >
      {{ getGenreDisplayName(genre.name, genre.translation_key, t, te) }}
    </td>
    <td
      class="hidden px-6 py-3 align-middle text-right text-muted-foreground sm:table-cell"
    >
      {{ genre.genre_aliases?.length ?? 0 }}
    </td>
    <td
      class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
      @click="emit('navigate-library', 'track')"
    >
      {{ countFor("track") }}
    </td>
    <td
      class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
      @click="emit('navigate-library', 'album')"
    >
      {{ countFor("album") }}
    </td>
    <td
      class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
      @click="emit('navigate-library', 'artist')"
    >
      {{ countFor("artist") }}
    </td>
    <td
      class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
      @click="emit('navigate-library', 'podcast')"
    >
      {{ countFor("podcast") }}
    </td>
    <td
      class="hidden cursor-pointer px-6 py-3 align-middle text-right tabular-nums text-muted-foreground hover:text-foreground sm:table-cell"
      @click="emit('navigate-library', 'audiobook')"
    >
      {{ countFor("audiobook") }}
    </td>
    <td class="px-6 py-3 align-middle">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="size-7 opacity-0 group-hover:opacity-100"
            :disabled="pending"
            @click="emit('exclude')"
          >
            <Spinner v-if="pending" class="size-3.5" />
            <Trash2 v-else class="size-3.5 text-destructive" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{{ $t("exclude_genre") }}</TooltipContent>
      </Tooltip>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

import GenreIcon from "@/components/icons/GenreIcon.vue";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGenreDisplayName } from "@/helpers/utils";
import type { Genre } from "@/plugins/api/interfaces";

interface Props {
  genre: Genre;
  thumbSrc: string | undefined;
  pending: boolean;
  countFor: (mediaType: string) => string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  navigate: [];
  "navigate-library": [mediaType: string];
  exclude: [];
}>();

const { t, te } = useI18n();
</script>
