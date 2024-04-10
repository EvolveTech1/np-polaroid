import { InitConfig } from "@shared/config";
import { InitEvents } from "./events";

export const Init = async (): Promise<void> => {
    await InitConfig();
    await InitEvents();
}