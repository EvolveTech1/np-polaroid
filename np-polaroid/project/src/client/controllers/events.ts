import { Events, Interface, Procedures, Streaming } from "@shared/npx/client";
import { Delay } from "@shared/utils/tools";
import { GetPhotobookPhotos, Photobooks } from "./photobook";
import { FirstPersonThread } from "./polaroid";

export async function InitEvents(): Promise<void> { };

RegisterNuiCallbackType('polaroidCaptured')
on('__cfx_nui:polaroidCaptured', (data: any, cb: Function) => {
    if (data.meta.ok) {
        //Events.emitNet('np-polaroid-capture:polaroidCaptured', data.data);
        emitNet('np-polaroid-capture:polaroidCaptured', data.data);
        TriggerEvent('inventory:DegenItemType', 5, 'npolaroid_camera');
        TriggerEvent('client:newStress', false, 300);
    }
});

//Events.onNet
onNet('np-polaroid-capture:camera:start', () => {
    console.log("np-polaroid-capture:camera:start");
    if (!FirstPersonThread.isActive) {
        console.log("FirstPersonThread is not active, starting...");
        FirstPersonThread.start();

        console.log("Sending NUI message...");
        SendNuiMessage(JSON.stringify({
            type: 'polaroidViewMode',
            show: true,
            picturesLeft: global.exports['np-inventory'].getQuantity('npolaroid_paper') ?? 0
        }));
    }
});

//Events.onNet
onNet('np-polaroid-capture:camera:stop', () => {
    console.log("np-polaroid-capture:camera:stop");
    if (FirstPersonThread.isActive) {
        console.log("FirstPersonThread is active, stopping...");
        FirstPersonThread.stop();

        console.log("Sending NUI message...");
        SendNuiMessage(JSON.stringify({
            type: 'polaroidViewMode',
            show: false
        }));
    }
});

on('np-inventory:itemUsed', async (pItemId: string, pItemInfo: any) => {
    if (pItemId === 'npolaroid_photo') {
        console.log("Using npolaroid_photo");
        const itemInfo = JSON.parse(pItemInfo);
        if (itemInfo) {
            // Events.emitNet('np-polaroid:showOthers', {
            //     description: itemInfo?._description,
            //     created: itemInfo?._created,
            //     uuid: itemInfo?._uuid,
            //     photoUrl: itemInfo?._image_url
            // });
            emitNet('np-polaroid:showOthers', {
                description: itemInfo?._description,
                created: itemInfo?._created,
                uuid: itemInfo?._uuid,
                photoUrl: itemInfo?._image_url
            });
        }
    } else if (pItemId == 'npolaroid_photobook') {
        console.log("Using npolaroid_photobook");
        const itemInfo = JSON.parse(pItemInfo);
        if (itemInfo.id) {
            await Interface.taskBar(1000, 'Opening photobook', true);
            const photobookPhotos = await GetPhotobookPhotos(itemInfo.id);

            console.log("photobookPhotos: ", photobookPhotos);

            if (photobookPhotos) {
                ClearPedTasksImmediately(PlayerPedId());
                await Streaming.loadAnim('amb@code_human_in_bus_passenger_idles@female@tablet@base');
                TriggerEvent('attachItemPhone', 'npolaroid_photobook');
                TaskPlayAnim(
                    PlayerPedId(),
                    'amb@code_human_in_bus_passenger_idles@female@tablet@base',
                    'base',
                    3,
                    3,
                    -1,
                    49,
                    0,
                    false,
                    false,
                    false
                );

                global.exports['np-ui'].openApplication('npolaroid-photobook', {
                    id: itemInfo.id,
                    photos: photobookPhotos
                        .filter((photo: any) => photo)
                        .reduce((a: any, b: any) => {
                            if (b !== null) {
                                return Object.assign(
                                    Object.assign({}, a),
                                    {
                                        [b.uuid]: {
                                            id: b.id,
                                            description: b.description,
                                            created: b.created,
                                            photoUrl: b.photo_url
                                        }
                                    }
                                )
                            }
                        }, {})
                });
            }
        }
    }
});

on('npolaroid_photobook:insert', async (
    originInventory: string,
    targetInventory: string,
    originSlot: number,
    targetSlot: number,
    originItemId: string,
    targetItemId: string,
    originItemInfo: any,
    targetItemInfo: any
) => {
    if (originInventory !== targetInventory) {
        TriggerEvent(
            'DoLongHudText',
            'The photobook must be in your inventory.',
            2
        );
        return;
    }
    if (originItemId === 'npolaroid_photo') {
        const parsedOriginItemInfo = JSON.parse(originItemInfo || '{}');
        const parsedTargetItemInfo = JSON.parse(targetItemInfo || '{}');
        if (parsedOriginItemInfo['_uuid'] && parsedTargetItemInfo.id) {
            //const [success, photo] = await Procedures.execute('np-polaroid:insertCardIntoPhotoBook', parsedTargetItemInfo.id, parsedOriginItemInfo['_uuid']);
            const [success, photo] = await RPC.execute<[boolean, unknown]>('np-polaroid:insertCardIntoPhotoBook', parsedTargetItemInfo.id, parsedOriginItemInfo['_uuid']);

            if (success) {
                console.log("Insert success into photobook with ID: ", parsedTargetItemInfo.id);
                //const photos = Photobooks.get(parsedTargetItemInfo.id);
                //await GetPhotobookPhotos(parsedTargetItemInfo.id); //??
                //const photos = await Photobooks.get(parsedTargetItemInfo.id);
                //photos && photos.push(photo);
                
                Photobooks.clear();
                
                emit(
                    'inventory:removeItemByMetaKV',
                    'npolaroid_photo',
                    1,
                    '_uuid',
                    parsedOriginItemInfo['_uuid']
                );
            }
        }
    }
});

on('npolaroid_camera:insert', async (
    originInventory: string,
    targetInventory: string,
    originSlot: number,
    targetSlot: number,
    originItemId: string,
    targetItemId: string,
    originItemInfo: any,
    targetItemInfo: any
) => {
    if (originInventory !== targetInventory) {
        TriggerEvent(
            'DoLongHudText',
            'The camera must be in your inventory.',
            2
        );
        return;
    }
    if (originItemId === 'npolaroid_battery') {
        const cameras = global.exports['np-inventory'].getItemsOfType(
            'npolaroid_camera',
            1,
            false
        );
        if (cameras.length > 0) {
            const camera = cameras[0];
            const cid = global.exports.isPed.isPed('cid');
            emitNet(
                'inventory:repairItem',
                camera.id,
                100,
                camera.item_id,
                cid
            );
            emit('inventory:removeItemBySlot', 'npolaroid_battery', 1, originSlot);
        }
    }
});

on('np-ui:application-closed', (app: string) => {
    if (app === 'npolaroid-photobook') {
        ClearPedTasksImmediately(PlayerPedId())
        TriggerEvent('destroyPropPhone')
    }
});

onNet('np-polaroid:shutterSound', (x: number, y: number, z: number) => {
    PlaySoundFromCoord(
        -1,
        'Camera_Shoot',
        x,
        y,
        z,
        'Phone_Soundset_Franklin',
        false,
        1,
        false
    )
});

onNet('np-polaroid:showOthers', async (pServerId: number, pPhoto: any, pFromBinder = false) => {
    const isExecutor = GetPlayerServerId(PlayerId()) == pServerId;
    if (pFromBinder && isExecutor) return;

    if (pPhoto) {
        global.exports['np-ui'].openApplication('npolaroid-photo', {
            description: pPhoto.description,
            created: pPhoto.created,
            uuid: pPhoto.uuid,
            photoUrl: pPhoto.photoUrl,
            showSelf: !pFromBinder
        }, false);
    }

    if (isExecutor) {
        TriggerEvent('attachItem', 'npolaroid_photo');
        ClearPedTasksImmediately(PlayerPedId());
        await Streaming.loadAnim('paper_1_rcm_alt1-9');
        TaskPlayAnim(
            PlayerPedId(),
            'paper_1_rcm_alt1-9',
            'player_one_dual-9',
            3,
            3,
            -1,
            54,
            0,
            false,
            false,
            false
        );

        await Delay(3250);

        StopAnimTask(
            PlayerPedId(),
            'paper_1_rcm_alt1-9',
            'player_one_dual-9',
            1
        );

        TriggerEvent('destroyProp');
    }
});

//Events.onNet
onNet('np-polaroid:bustPhotobooks', () => {
    Photobooks.clear()
});

//Events.onNet
onNet('np-polaroid:addPhotoToBook', async (pData: any) => {
    const photos = Photobooks.get(pData.photobook_id);
    photos && photos.push(pData);
});

on('onResourceStop', (resource: string) => {
    if (resource === GetCurrentResourceName()) {
        global.exports['np-taskbar'].forceTaskbarDisableInventory(false);
        global.exports['np-inventory'].disableActionBar(false);
    }
});