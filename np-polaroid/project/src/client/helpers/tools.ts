const Throttled = new Set<string>();

export function Throttle(pName: string, pTime: number) {
    if (!Throttled.has(pName)) {
        Throttled.add(pName);
        setTimeout(() => Throttled.delete(pName), pTime);
        return false;
    }

    return true;
}

export function IsThrottled(pName: string) {
    return Throttled.has(pName);
}

export const Delay = (ms: any) => new Promise(res => setTimeout(res, ms));

export function taskBar(pTime: number, pText: string, pRunCheck = false) {
    return new Promise(resolve => {
        if (pText) {
            global.exports["np-taskbar"].taskBar(pTime, pText, pRunCheck, true, null, false, resolve);
        } else setTimeout(() => resolve(100), pTime);
    });
}

export function taskBarSkill(pDifficulty: number, pSkillGap: number) {
    return new Promise(resolve => {
        global.exports["np-ui"].taskBarSkill(pDifficulty, pSkillGap, resolve);
    });
}

export async function requestAnimDict(pDict: string) {
    if (!HasAnimDictLoaded(pDict)) {
        RequestAnimDict(pDict);
        let pBool = false;
        setTimeout(() => pBool = true, 60000);
        while (!HasAnimDictLoaded(pDict) && !pBool) {
            await Delay(10);
        }
    }
}

export async function playSound(_0xa6c6bd: any, _0x305c3c: any, _0x485783: any, _0x5a7bcd = 1000) {
    const _0x1678c7 = GetSoundId()
    PlaySoundFromEntity(_0x1678c7, _0x305c3c, _0xa6c6bd, _0x485783, true, 0)
    await Delay(_0x5a7bcd)
    StopSound(_0x1678c7)
    ReleaseSoundId(_0x1678c7)
}