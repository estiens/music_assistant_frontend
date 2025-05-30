<template>
  <v-hover v-slot="{ isHovering, props }">
    <v-card
      v-hold="onMenu"
      v-bind="props"
      tile
      hover
      class="panel-item"
      :class="{ unavailable: !isAvailable }"
      @click="onClick"
      @click.right.prevent="onMenu"
    >
      <v-overlay
        v-if="showCheckboxes"
        :model-value="showCheckboxes"
        contained
        :scrim="
          isSelected
            ? $vuetify.theme.current.dark
              ? 'rgba(0,0,0,.75)'
              : 'rgba(255,255,255,.75)'
            : '#ffffff00'
        "
      >
        <v-checkbox
          class="panel-item-checkbox"
          :ripple="false"
          :model-value="isSelected"
        />
      </v-overlay>

      <MediaItemThumb
        :item="isAvailable ? item : undefined"
        style="height: auto"
      />

      <v-list-item
        variant="text"
        slim
        tile
        density="compact"
        class="panel-item-details"
      >
        <v-list-item-title>
          <span v-if="item.media_type == MediaType.FOLDER">
            <span>{{ getBrowseFolderName(item as BrowseFolder, $t) }}</span>
          </span>
          <span v-else>{{ item.name }}</span>
          <span v-if="'version' in item && item.version">
            - {{ item.version }}</span
          >
        </v-list-item-title>
        <v-list-item-subtitle
          v-if="'artists' in item && item.artists"
          class="line-clamp-1"
        >
          {{ getArtistsString(item.artists, 1) }}
        </v-list-item-subtitle>
        <v-list-item-subtitle
          v-if="'authors' in item && item.authors"
          class="line-clamp-1"
        >
          {{ item.authors.join(" / ") }}
        </v-list-item-subtitle>
        <v-list-item-subtitle
          v-else-if="'publisher' in item && item.publisher"
          class="line-clamp-1"
        >
          {{ item.publisher }}
        </v-list-item-subtitle>
        <v-list-item-subtitle
          v-else-if="'owner' in item && item.owner"
          class="line-clamp-1"
        >
          {{ item.owner }}
        </v-list-item-subtitle>
        <v-list-item-subtitle v-else-if="showMediaType" class="line-clamp-1">
          {{ $t(item.media_type) }}
        </v-list-item-subtitle>
        <v-list-item-subtitle v-else class="line-clamp-1" />
      </v-list-item>

      <!-- play button -->
      <v-btn
        v-if="
          (isHovering || store.isTouchscreen) && isAvailable && item.is_playable
        "
        icon="mdi-play"
        color="primary"
        fab
        :style="`position: absolute; right: 15px; bottom: ${showActions ? 90 : 35}px; opacity: 0.8`"
        @click.stop="onPlayClick"
      />

      <v-card-actions v-if="showActions" class="panel-item-actions">
        <v-item-group style="padding: 0">
          <v-item v-if="parseBool(item.metadata.explicit || false)">
            <v-icon size="30" icon="mdi-alpha-e-box" />
          </v-item>
          <!-- hi res icon -->
          <v-item v-if="HiResDetails">
            <v-icon
              :class="
                $vuetify.theme.current.dark ? 'hiresicon' : 'hiresiconinverted'
              "
            >
              <img :src="iconHiRes" width="30" />
              <v-tooltip activator="parent" location="bottom">
                {{ HiResDetails }}
              </v-tooltip>
            </v-icon>
          </v-item>
          <!-- disc/track number-->
          <v-item
            v-if="
              showTrackNumber && 'track_number' in item && item.track_number
            "
          >
            <v-icon size="small" icon="mdi-music-circle-outline" />
            <span v-if="item.disc_number">{{ item.disc_number }}/</span
            >{{ item.track_number }}
          </v-item>
          <!-- position-->
          <v-item v-else-if="'position' in item && item.position">
            <v-icon size="small" icon="mdi-music-circle-outline" />
            {{ item.position }}
          </v-item>
          <v-item v-if="getBreakpointValue('bp3')">
            <FavouriteButton :item="item" />
          </v-item>
        </v-item-group>
        <v-spacer />
        <MAButton
          v-if="isHovering || $vuetify.display.mobile"
          variant="list"
          icon="mdi-dots-vertical"
          style="padding-right: 0; margin-right: -5px"
          @click.stop="onMenu"
        />
      </v-card-actions>
    </v-card>
  </v-hover>
</template>

<script setup lang="ts">
import { computed } from "vue";
import MediaItemThumb from "./MediaItemThumb.vue";
import MAButton from "./mods/Button.vue";
import {
  BrowseFolder,
  ContentType,
  type MediaItemType,
  MediaType,
} from "@/plugins/api/interfaces";
import {
  getArtistsString,
  getBrowseFolderName,
  handleMediaItemClick,
  handleMenuBtnClick,
  handlePlayBtnClick,
  parseBool,
} from "@/helpers/utils";
import { iconHiRes } from "./QualityDetailsBtn.vue";
import { getBreakpointValue } from "@/plugins/breakpoint";
import FavouriteButton from "@/components/FavoriteButton.vue";
import { store } from "@/plugins/store";

// properties
export interface Props {
  item: MediaItemType;
  size?: number;
  isSelected: boolean;
  showCheckboxes?: boolean;
  showMediaType?: boolean;
  showActions?: boolean;
  showTrackNumber?: boolean;
  isAvailable?: boolean;
  parentItem?: MediaItemType;
}
const compProps = withDefaults(defineProps<Props>(), {
  size: 200,
  showCheckboxes: false,
  showActions: false,
  showTrackNumber: false,
  showMediaType: false,
  isAvailable: true,
  parentItem: undefined,
});

// computed properties
const HiResDetails = computed(() => {
  for (const prov of compProps.item.provider_mappings) {
    if (!prov.audio_format) continue;
    if (prov.audio_format.content_type == undefined) continue;
    if (
      ![
        ContentType.DSF,
        ContentType.FLAC,
        ContentType.AIFF,
        ContentType.WAV,
      ].includes(prov.audio_format.content_type)
    )
      continue;
    if (
      prov.audio_format.sample_rate > 48000 ||
      prov.audio_format.bit_depth > 16
    ) {
      return `${prov.audio_format.sample_rate / 1000}kHz ${
        prov.audio_format.bit_depth
      } bits`;
    }
  }
  return "";
});

// emits
const emit = defineEmits<{
  (e: "select", item: MediaItemType, selected: boolean): void;
}>();

const onMenu = function (evt: PointerEvent | TouchEvent) {
  if (compProps.showCheckboxes) return;
  const posX = "clientX" in evt ? evt.clientX : evt.touches[0].clientX;
  const posY = "clientY" in evt ? evt.clientY : evt.touches[0].clientY;
  handleMenuBtnClick(compProps.item, posX, posY, compProps.parentItem);
};

const onClick = function (evt: PointerEvent) {
  if (compProps.showCheckboxes) {
    emit("select", compProps.item, compProps.isSelected ? false : true);
    return;
  }
  handleMediaItemClick(
    compProps.item,
    evt.clientX,
    evt.clientY,
    compProps.parentItem,
  );
};

const onPlayClick = function (evt: PointerEvent) {
  if (compProps.showCheckboxes) return;
  handlePlayBtnClick(
    compProps.item,
    evt.clientX,
    evt.clientY,
    compProps.parentItem,
  );
};
</script>

<style scoped>
.v-card.unavailable {
  opacity: 0.3;
}

.panel-item {
  height: 100%;
  padding: 10px;
  border: none;
  border-style: none !important;
}

.panel-item-checkbox {
  position: absolute;
  width: 100%;
  height: auto;
  left: 0;
  right: 0;
}

.panel-item-details {
  margin-top: 10px;
  padding-left: 0px !important;
  padding-right: 0px !important;
  height: 40px;
}

.panel-item-actions {
  padding: 0;
  margin: 0;
  margin-top: 10px;
  height: 40px;
  min-height: unset !important;
}

panel-item-details :deep(.v-list-item__content) {
  height: 30px;
}

.v-card--active {
  background-color: red;
}

.hiresicon {
  margin-right: 10px;
}

.hiresiconinverted {
  margin-right: 10px;
  filter: invert(100%);
}
</style>
