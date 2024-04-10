import { Base, DB } from "@shared/npx/server";

export abstract class Repository {
    static async createPhotobook(pSource: number): Promise<number | null> {
        const user = Base.getModule<PlayerModule>('Player').GetUser(pSource);
        const result = await DB.execute<SQLInsertResult>('INSERT INTO _polaroid_photobook (created, creator) VALUES (@created, @creator)', {
            created: new Date().getTime() / 1000,
            creator: user.character.id
        });

        return result ? result.insertId : null;
    }
    
    static async getPhotobook(pPhotobookId: number): Promise<any[]> {
        console.log("getPhotobook", pPhotobookId);
        const result = await DB.execute<any[]>('SELECT * FROM _polaroid_photo WHERE binder_id = @binder_id', {
            binder_id: Number(pPhotobookId)
        });

        console.log("getPhotobook result", result);

        return result ? result : [];
    }

    static async getPhotobooks(pCharacterId: number): Promise<any> {
        const player = `ply-${pCharacterId}`;
        const result = await DB.execute('SELECT * FROM user_inventory2 WHERE name = @name AND item_id = @item_id', {
            name: player,
            item_id: 'npolaroid_photobook'
        });

        return result ? result : [];
    }

    static async createPhoto(pCharacterId: number, pId: string, pBinderId: number, pUrl: string): Promise<boolean> {
        const result = await DB.execute('INSERT INTO _polaroid_photo (uuid, photo_url, binder_id, description, creator, created) VALUES (@uuid, @photo_url, @binder_id, @description, @creator, @created)', {
            uuid: pId,
            photo_url: pUrl,
            binder_id: pBinderId,
            description: null,
            creator: pCharacterId,
            created: new Date().getTime() / 1000
        });

        return result ? true : false;
    }

    static async deletePhoto(pPhotoId: number, pPhotoUuid: string, pPhotobookId: number): Promise<boolean> {
        const result = await DB.execute('DELETE FROM _polaroid_photo WHERE id = @id AND uuid = @uuid AND binder_id = @binder_id', {
            id: pPhotoId,
            uuid: pPhotoUuid,
            binder_id: pPhotobookId
        });

        return result ? true : false;
    }

    static async updatePhoto(pPhotobookId: number, pPhotoId: number, pDescription: string): Promise<boolean> {
        const result = await DB.execute('UPDATE _polaroid_photo SET description = @description WHERE id = @id AND binder_id = @binder_id', {
            description: pDescription,
            id: pPhotoId,
            binder_id: pPhotobookId
        });

        return result ? true : false;
    }

    static async getPhoto(pPhotoId: number): Promise<any> {
        const result = await DB.execute<any>('SELECT * FROM _polaroid_photo WHERE id = @id', {
            id: pPhotoId
        });

        return result ? result[0] : [];
    }

    static async removeFromPhotobook(pPhotoId: number, pPhotoUuid: string, pPhotobookId: number): Promise<boolean> {
        const result = await DB.execute('UPDATE _polaroid_photo SET binder_id = @new_binder_id WHERE id = @id AND uuid = @uuid AND binder_id = @binder_id', {
            new_binder_id: null,
            id: pPhotoId,
            uuid: pPhotoUuid,
            binder_id: pPhotobookId
        });

        return result ? true : false;
    }

    static async insertCardIntoPhotoBook(pPhotobookId: number, pPhotoUuid: string): Promise<any> {
        const result = await DB.execute('UPDATE _polaroid_photo SET binder_id = @binder_id WHERE uuid = @uuid', {
            binder_id: pPhotobookId,
            uuid: pPhotoUuid
        });

        const photoData = await DB.execute<any>('SELECT * FROM _polaroid_photo WHERE uuid = @uuid', {
            uuid: pPhotoUuid
        });

        return result ? {
            success: true,
            photo: photoData
        } : {
            success: false,
            photo: null
        }
    }
}