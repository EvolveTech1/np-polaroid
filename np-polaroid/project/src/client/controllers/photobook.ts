import { Procedures } from "@shared/npx/client";

export const Photobooks = new Map<number, Photobook[]>();

export async function InitPhotobook(): Promise<void> { };

export async function GetPhotobookPhotos(pPhotobookId: number) {
    console.log("GetPhotobookPhotos ID", pPhotobookId);
    if (!pPhotobookId) return undefined;
    if (Photobooks.has(pPhotobookId)) return Photobooks.get(pPhotobookId);

    //const photos = await Procedures.execute('npolaroid:getPhotobook', pPhotobookId);
    const photos = await RPC.execute<any>("npolaroid:getPhotobook", pPhotobookId);

    console.log("photos", photos);

    if (photos) {
        Photobooks.set(pPhotobookId, photos);
    }

    return photos;
}

export async function FindPhotoInPhotobook(pPhotobookId: number, pPhotoId: number) {
    if (!pPhotobookId || !pPhotoId) return [undefined, undefined];

    const photos = await GetPhotobookPhotos(pPhotobookId);
    if (!photos) return [undefined, undefined];

    return [photos, photos.find((photo: any) => photo.id === pPhotoId)];
}