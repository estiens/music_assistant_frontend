<template>
  <section>
    <ItemsListing
      itemtype="browse"
      :show-provider="false"
      :show-library="false"
      :show-favorites-only-filter="false"
      :show-track-number="false"
      :show-select-button="path && path != 'root' ? true : false"
      :load-items="loadItems"
      :sort-keys="['original', 'name', 'name_desc']"
      :title="header"
      :path="path"
      :allow-key-hooks="true"
      icon="mdi-folder-outline"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getBreakpointValue } from "@/plugins/breakpoint";
import api from "@/plugins/api";
import ItemsListing, { LoadDataParams } from "@/components/ItemsListing.vue";

export interface Props {
  path?: string;
}
const props = defineProps<Props>();
const { t } = useI18n();

const header = computed(() => {
  if (!props.path || props.path == "root") return t("browse");
  if (getBreakpointValue("bp6")) return t("browse") + " | " + props.path;
  if (getBreakpointValue("bp3")) return props.path;
  return t("browse");
});

const loadItems = async function (params: LoadDataParams) {
  return await api.browse(props.path);
};
</script>
