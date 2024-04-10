export let Delay = (ms:any) => new Promise(res => setTimeout(res, ms));

export async function loadAnimDict(dict: string) {
    while(!HasAnimDictLoaded(dict)) {
        RequestAnimDict(dict)
        await Delay(5)
    }
}

export const genNumbers = (length: number) => {
    let result = '';
    let characters = '0123456789';
    let charactersLength = characters.length;
    for (let i = 1; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}