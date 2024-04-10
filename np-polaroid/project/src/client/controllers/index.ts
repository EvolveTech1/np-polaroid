import { InitConfig } from "@shared/config";
import { InitEvents } from "./events";
import { InitPolaroid } from "./polaroid";
import { InitPhotobook } from "./photobook";
import { InitUI } from "./ui_events";

export const Init = async (): Promise<void> => {
    await InitConfig();
    await InitEvents();
    await InitPolaroid();
    await InitPhotobook();
    await InitUI();
}