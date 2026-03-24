<template>
  <tr class="group border-b transition-colors hover:bg-muted/50 opacity-50">
    <td class="pl-6 pr-2 py-3 align-middle">
      <div class="flex size-8 items-center justify-center">
        <img
          v-if="thumbSrc"
          :alt="
            getGenreDisplayName(
              exclusion.name,
              exclusion.translation_key,
              t,
              te,
            )
          "
          :src="thumbSrc"
          class="size-8 rounded object-cover grayscale"
        />
        <GenreIcon v-else class="size-4 text-muted-foreground" />
      </div>
    </td>
    <td class="px-6 py-3 align-middle font-medium line-through">
      {{
        getGenreDisplayName(exclusion.name, exclusion.translation_key, t, te)
      }}
    </td>
    <td
      v-for="n in 6"
      :key="n"
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
            :disabled="pending"
            @click="emit('restore')"
          >
            <Spinner v-if="pending" class="size-3.5" />
            <RefreshCw v-else class="size-3.5 text-primary" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{{ $t("restore_genre") }}</TooltipContent>
      </Tooltip>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";
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
  exclusion: Genre;
  thumbSrc: string | undefined;
  pending: boolean;
}

defineProps<Props>();
const emit = defineEmits<{ restore: [] }>();

const { t, te } = useI18n();
</script>
