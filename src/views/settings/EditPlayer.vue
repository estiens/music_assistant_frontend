<template>
  <section>
    <v-card-text>
      <!-- header -->
      <div
        v-if="
          config &&
          api.getProviderManifest(config.provider)!.domain in
            api.providerManifests
        "
        style="margin-left: -5px; margin-right: -5px"
      >
        <v-card-title>
          {{
            $t("settings.config_player", [
              config.name ||
                api.players[config.player_id]?.name ||
                config.default_name,
            ])
          }}
        </v-card-title>
        <v-card-subtitle>
          <b>{{ $t("settings.player_id") }}: </b>{{ config.player_id }}
        </v-card-subtitle>
        <v-card-subtitle>
          <b>{{ $t("settings.player_provider") }}: </b
          >{{ api.getProviderManifest(config.provider)?.name }}
          <a
            v-if="api.getProviderManifest(config.provider)?.documentation"
            @click="
              openLinkInNewTab(
                api.getProviderManifest(config.provider)?.documentation!,
              )
            "
          >
            [{{ $t("settings.check_docs") }}]</a
          >
        </v-card-subtitle>
        <v-card-subtitle v-if="api.players[config.player_id]">
          <b>{{ $t("settings.player_model") }}: </b
          >{{ api.players[config.player_id].device_info.manufacturer }} /
          {{ api.players[config.player_id].device_info.model }}
        </v-card-subtitle>
        <v-card-subtitle
          v-if="api.players[config.player_id]?.device_info.ip_address"
        >
          <b>{{ $t("settings.player_address") }}: </b
          >{{ api.players[config.player_id].device_info.ip_address }}
        </v-card-subtitle>
        <v-card-subtitle v-if="api.players[config.player_id]">
          <b>{{ $t("settings.player_type_label") }}: </b
          >{{ $t(`player_type.${api.players[config.player_id].type}`) }}
        </v-card-subtitle>
        <br />
        <v-divider />
        <br />
        <br />

        <!-- name field -->
        <v-text-field
          v-if="'name' in config"
          v-model="config.name"
          :placeholder="config?.name"
          :label="$t('settings.player_name')"
          variant="outlined"
          clearable
          class="configcolumnleft"
          style="margin-right: 25px"
        />
        <!-- enable field -->
        <v-switch
          v-if="'enabled' in config"
          v-model="config.enabled"
          :label="$t('settings.enable_player')"
          color="primary"
          :disabled="api.getProviderManifest(config.provider)?.builtin"
        />

        <!-- DSP Config Button -->
        <v-btn
          v-if="
            api.players[config.player_id] &&
            api.players[config.player_id].type !== PlayerType.GROUP
          "
          @click="openDspConfig"
        >
          {{ $t("open_dsp_settings") }}
        </v-btn>
      </div>
      <br />
      <v-divider />
      <edit-config
        v-if="config"
        :disabled="!config.enabled"
        :config-entries="Object.values(config.values)"
        @submit="onSubmit"
      />
    </v-card-text>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/plugins/api";
import {
  ConfigValueType,
  PlayerConfig,
  PlayerType,
} from "@/plugins/api/interfaces";
import EditConfig from "./EditConfig.vue";
import { watch } from "vue";
import { openLinkInNewTab } from "@/helpers/utils";

// global refs
const router = useRouter();
const config = ref<PlayerConfig>();

// props
const props = defineProps<{
  playerId?: string;
}>();

// watchers

watch(
  () => props.playerId,
  async (val) => {
    if (val) {
      config.value = await api.getPlayerConfig(val);
    }
  },
  { immediate: true },
);

// methods
const onSubmit = async function (values: Record<string, ConfigValueType>) {
  values["enabled"] = config.value!.enabled;
  values["name"] = config.value!.name || null;
  api.savePlayerConfig(props.playerId!, values);
  router.push({ name: "playersettings" });
};

const openDspConfig = function () {
  router.push(`/settings/editplayer/${props.playerId}/dsp`);
};
</script>

<style scoped></style>
