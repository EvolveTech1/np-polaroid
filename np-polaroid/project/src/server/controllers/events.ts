import { Events } from "@shared/npx/client";
import { Base, Procedures } from "@shared/npx/server";
import { Repository } from "server/database/repository";

export async function InitEvents(): Promise<void> { };

RegisterCommand('givephotobook', async (src: number) => {
    const binderId = await Repository.createPhotobook(src);
    if (!binderId) return;

    emitNet('player:receiveItem', src, 'npolaroid_photobook', 1, false, {
        id: binderId,
        _hideKeys: ['id']
    });
}, false);

//Events.onNet
onNet('np-polaroid-capture:polaroidCaptured', async (pPolaroidResponse: {
    id: string,
    image: string,
    senderServerId: number
}) => {
    const _source = +global.source;
    const providedSource = Number(pPolaroidResponse.senderServerId);

    if (_source !== providedSource) {
        emitNet('DoLongHudText', _source, 'You did not take this photo!', 2);
        console.log(`[POLAROID] Player ${_source} tried to take a photo that was not theirs!`);
        return;
    }

    const userInfo = Base.getModule<PlayerModule>('Player').GetUser(_source);
    if (!userInfo || !userInfo?.character) return false;

    const inventoryPhotobooks = await Repository.getPhotobooks(userInfo.character.id);

    const binderIdsFromInventory: Set<number> = new Set();
    for (const inventoryPhotobook of inventoryPhotobooks) {
        const inventoryPhotobookData = JSON.parse(inventoryPhotobook.information) as ItemInfoPhotobook;
        binderIdsFromInventory.add(inventoryPhotobookData.id);
    }

    const hasOnePhotobook = binderIdsFromInventory.size == 1;

    if (
        await Repository.createPhoto(
            userInfo.character.id,
            pPolaroidResponse.id,
            hasOnePhotobook ? binderIdsFromInventory.keys().next().value : null,
            pPolaroidResponse.image
        )
    ) {
        console.log(`[POLAROID] Photo with UUID: ${pPolaroidResponse.id} saved!`)

        if (!hasOnePhotobook) {
            emitNet('player:receiveItem', _source, 'npolaroid_photo', 1, false, {
                _description: '',
                _image_url: pPolaroidResponse.image,
                _uuid: pPolaroidResponse.id,
                _created: new Date().getTime() / 1000,
                _hideKeys: ['_description', '_image_url', '_uuid', '_created']
            });
        } else {
            //Events.emitNet('np-polaroid:bustPhotobooks', _source);
            emitNet('np-polaroid:bustPhotobooks', _source);
        }
        emitNet('inventory:removeItem', _source, 'npolaroid_paper', 1);
    } else {
        emitNet('DoLongHudText', _source, 'Failed to save photo!', 2);

        console.log(`[POLAROID] Photo with UUID: ${pPolaroidResponse.id} failed to save!`)
    }
});

//Events.onNet
onNet('np-polaroid:setDescription', (pPhotobookId: number, pPhotoId: number, pDescription: string) => {
    Repository.updatePhoto(pPhotobookId, pPhotoId, pDescription);
});

//Events.onNet
onNet('np-polaroid:showOthers', (pData: any, pFromBinder = false) => {
    const _source = global.source;
    emitNet('np-polaroid:showOthers', -1, _source, pData, pFromBinder);
});

//Events.onNet
onNet('np-polaroid:moveToInventory', async (pPhotoId: number, pPhotoUuid: string, pPhotobookId: number) => {
    const _source = global.source;
    const userInfo = Base.getModule<PlayerModule>('Player').GetUser(_source);
    if (!userInfo || !userInfo?.character) return false;

    const photo = await Repository.getPhoto(pPhotoId);

    if (
        await Repository.removeFromPhotobook(pPhotoId, pPhotoUuid, pPhotobookId)
    ) {
        console.log(`[POLAROID] Photo with UUID: ${pPhotoUuid} moved from photobook with ID: ${pPhotobookId}`)

        emitNet('player:receiveItem', _source, 'npolaroid_photo', 1, false, {
            _description: photo.description,
            _image_url: photo.photo_url,
            _uuid: photo.uuid,
            _created: photo.created,
            _hideKeys: ['_description', '_image_url', '_uuid', '_created']
        });

        emitNet('DoLongHudText', _source, 'Photo moved to inventory!', 1);
        //Events.emitNet('np-polaroid:bustPhotobooks', _source);
        emitNet('np-polaroid:bustPhotobooks', _source);
    } else {
        console.log(`[POLAROID] Photo with UUID: ${pPhotoUuid} failed to move from photobook with ID: ${pPhotobookId}`)
    }
});

//Events.onNet
onNet('np-polaroid:deletePhoto', async (pPhotoId: number, pPhotoUuid: string, pPhotobookId: number) => {
    const _source = global.source;
    const userInfo = Base.getModule<PlayerModule>('Player').GetUser(_source);
    if (!userInfo || !userInfo?.character) return false;

    if (
        await Repository.deletePhoto(pPhotoId, pPhotoUuid, pPhotobookId)
    ) {
        console.log(`[POLAROID] Photo with UUID: ${pPhotoUuid} deleted from photobook with ID: ${pPhotobookId}`)

        emitNet('DoLongHudText', _source, 'Photo deleted!', 1);

        //Events.emitNet('np-polaroid:bustPhotobooks', _source);
        emitNet('np-polaroid:bustPhotobooks', _source);
    } else {
        console.log(`[POLAROID] Photo with UUID: ${pPhotoUuid} failed to delete from photobook with ID: ${pPhotobookId}`)
    }
});

//Procedures.register
RPC.register('np-polaroid:insertCardIntoPhotoBook', async (pSource: number, pPhotobookId: number, pPhotoUuid: string) => {
    const result = await Repository.insertCardIntoPhotoBook(pPhotobookId, pPhotoUuid);
    if (result.success) {
        emitNet('DoLongHudText', pSource, 'Photo book updated!', 1);

        console.log(`[POLAROID] Photo with UUID: ${pPhotoUuid} inserted into photobook with ID: ${pPhotobookId}`)

        //Events.emitNet('np-polaroid:bustPhotobooks', pSource);

        return [result.success, result.photo];
    } else {
        return [result.success, []];
    }
});

//Procedures.register
RPC.register('npolaroid:getPhotobook', (pSource: number, pPhotobookId: number) => {
    console.log("npolaroid:getPhotobook", pPhotobookId);
    return Repository.getPhotobook(pPhotobookId);
});

//Procedures.register
RPC.register('np-polaroid:getApiKey', () => {
    return 'ace4ebe5902624d';
});

onNet('np-polaroid:shutterSound', () => {
    const _source = global.source;

    const entityCoords = GetEntityCoords(GetPlayerPed(_source));

    emitNet('np-polaroid:shutterSound', -1, entityCoords[0], entityCoords[1], entityCoords[2]);
});

RegisterCommand('getPhoto', async (src: number, args: number[]) => {
    const photo = await Repository.getPhoto(args[0]);

    console.log("photo", photo);
}, false);