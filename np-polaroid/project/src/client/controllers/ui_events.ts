import { Events } from "@shared/npx/client";
import { FindPhotoInPhotobook } from "./photobook";
import { FirstPersonThread } from "./polaroid";

export async function InitUI(): Promise<void> { };

RegisterUICallback('np-polaroid-capture:setFilter', async ({ key: pKey }: any, cb: Function) => {
    cb({ data: {}, meta: { ok: true, message: 'done' } });
    pKey?.filter && (FirstPersonThread.data.filter = pKey?.filter);
});

RegisterUICallback('np-polaroid:setDescription', async (data: any, cb: Function) => {
    cb({ data: {}, meta: { ok: true, message: 'done' } });

    let success = false;
    if (data?.description && data.description.length > 0) {
        const [photos, photo] = await FindPhotoInPhotobook(data?.photobookId, data?.id);

        if (photo) {
            photo.description = data.description;

            //Events.emitNet('np-polaroid:setDescription', data?.photobookId, photo.id, photo.description);
            emitNet('np-polaroid:setDescription', data?.photobookId, photo.id, photo.description);

            success = true;
        }
    }
    if (!success) {
        emit('DoLongHudText', 'Could not set description.', 2);
    }
});

RegisterUICallback('np-polaroid:showOthers', async (data: any, cb: Function) => {
    cb({ data: {}, meta: { ok: true, message: 'done' } });

    //Events.emitNet('np-polaroid:showOthers', data?.photoInfo, data?.fromBinder);
    emitNet('np-polaroid:showOthers', data?.photoInfo, data?.fromBinder);
});

RegisterUICallback('np-polaroid:moveToInventory', async (data: any, cb: Function) => {    
    cb({ data: {}, meta: { ok: true, message: 'done' } });

    if (data?.id && data?.photoBookId) {
        const [photos, photo] = await FindPhotoInPhotobook(data?.photoBookId, data?.id);

        if (photo) {
            delete photos[photos.indexOf(photo)];
            delete photo.photobook_id;
            //Events.emitNet('np-polaroid:moveToInventory', data?.id, data?.uuid, data?.photoBookId);
            emitNet('np-polaroid:moveToInventory', data?.id, data?.uuid, data?.photoBookId);
        }
    }
});

RegisterUICallback('np-polaroid:deletePhoto', async (data: any, cb: Function) => {
    cb({ data: {}, meta: { ok: true, message: 'done' } });

    if (data?.id && data?.photoBookId) {
        const [photos, photo] = await FindPhotoInPhotobook(data?.photoBookId, data?.id);

        if (photo) {
            delete photos[photos.indexOf(photo)];
            //Events.emitNet('np-polaroid:deletePhoto', data?.id, data?.uuid, data?.photoBookId);
            emitNet('np-polaroid:deletePhoto', data?.id, data?.uuid, data?.photoBookId);
        }
    }
});

RegisterUICallback('np-polaroid:getConfig', async (data: any, cb: Function) => {
    cb({ data: {}, meta: { ok: true, message: 'done' } });
});