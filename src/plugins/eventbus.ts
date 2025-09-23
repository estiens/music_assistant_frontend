// Global, simple eventbus

import { ContextMenuItem } from "@/layouts/default/ItemContextMenu.vue";
import mitt, { Emitter } from "mitt";
import { MediaItemType } from "./api/interfaces";

export type PlaylistDialogEvent = {
  items: MediaItemType[];
  parentItem?: MediaItemType;
};

export type ContextMenuDialogEvent = {
  items: ContextMenuItem[];
  posX?: number;
  posY?: number;
  showPlayMenuHeader?: boolean;
};

export type Events = {
  contextmenu: ContextMenuDialogEvent;
  playlistdialog: PlaylistDialogEvent;
  clearSelection: void;
};

export const eventbus: Emitter<Events> = mitt<Events>();
