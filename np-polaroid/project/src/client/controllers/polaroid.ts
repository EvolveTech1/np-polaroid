import { Procedures } from "@shared/npx/client";
import { Delay } from "@shared/utils/tools";
import { AnimationTask } from "client/classes/animationTask";
import { Thread } from "client/classes/thread";
import { IsThrottled, playSound, Throttle } from "client/helpers/tools";
import { v4 as uuidv4 } from 'uuid';

export const FirstPersonThread = new Thread(function () { }, 0);

let camFov = 80;
let camHeading = 0;
let camHeading2 = 0;
let camCamera = 0;
let camFilter: any = null;
let playerPed = PlayerPedId();

const camFilters = [
    {
        filterValue: 'REMOVE_FILTER',
        filterName: 'Remove Filter',
    },
    {
        filterValue: 'SPECIAL_NOIR',
        filterName: 'Special Noir',
    },
    {
        filterValue: 'NG_filmic01',
        filterName: 'Retro',
    },
    {
        filterValue: 'NG_filmic02',
        filterName: 'The 70s',
    },
    {
        filterValue: 'NG_filmic03',
        filterName: 'Retro Fuzzed',
    },
    {
        filterValue: 'NG_filmic04',
        filterName: 'Black and White',
    },
    {
        filterValue: 'CopsSPLASH',
        filterName: 'Blue Hue',
    },
    {
        filterValue: 'Damage',
        filterName: 'Red Vignette',
    },
    {
        filterValue: 'Dying',
        filterName: 'Desaturated',
    },
    {
        filterValue: 'Sniper',
        filterName: 'Fisheye',
    },
    {
        filterValue: 'traffic_skycam',
        filterName: 'Cold Vintage',
    },
    {
        filterValue: 'sunglasses',
        filterName: 'Sunset',
    },
    {
        filterValue: 'ufo_deathray',
        filterName: 'Bad Trip',
    },
    {
        filterValue: 'glasses_darkblue',
        filterName: 'Ocean',
    },
    {
        filterValue: 'Barry1_Stoned',
        filterName: 'Heatwave',
    },
    {
        filterValue: 'shades_yellow',
        filterName: 'Sepia',
    },
    {
        filterValue: 'player_transition_no_scanlines',
        filterName: 'Snowblind',
    },
    {
        filterValue: 'hud_def_desatcrunch',
        filterName: 'Noir',
    },
    {
        filterValue: 'drug_flying_base',
        filterName: 'Digital Vibrance',
    },
    {
        filterValue: 'drug_2_drive',
        filterName: 'Vintage Fisheye',
    },
    {
        filterValue: 'drug_drive_blend02',
        filterName: 'Pink Haze',
    },
];

export async function InitPolaroid(): Promise<void> { };

const disableControls = (pToggle: boolean) => {
    DisableControlAction(0, 21, pToggle)
    DisableControlAction(0, 22, pToggle)
    DisableControlAction(0, 24, pToggle)
    DisableControlAction(0, 25, pToggle)
    DisableControlAction(0, 47, pToggle)
    DisableControlAction(0, 58, pToggle)
    DisablePlayerFiring(playerPed, pToggle)
}

FirstPersonThread.addHook('active', async function (this: Thread) {
    if (camFilter !== this.data.filter) {
        if (this.data.filter) {
            switch (this.data.filter) {
                case 'REMOVE_FILTER':
                    ClearExtraTimecycleModifier();
                    break;
                case 'SPECIAL_NOIR':
                    this.data.runNoir = true;
                    RegisterNoirScreenEffectThisFrame();
                    SetExtraTimecycleModifier('NG_filmnoir_BW01');
                    break;
                default:
                    camFilter == 'SPECIAL_NOIR' && (this.data.runNoir = false)
                    SetExtraTimecycleModifier(this.data.filter)
                    break
            }
        }
        camFilter = this.data.filter;
    }

    disableControls(true);

    if (IsDisabledControlJustReleased(0, 24)) {
        SetCursorLocation(0.5, 0.5);
        global.exports["np-ui"].showContextMenu([
            {
                title: 'Filter',
                description: 'Change filter',
                children: camFilters.map(
                    ({ filterName: name, filterValue: value }) => ({
                        title: name,
                        action: 'np-polaroid-capture:setFilter',
                        key: { filter: value },
                    })
                ),
            }
        ]);
    }

    if (!IsThrottled('npolaroid-capture') && IsDisabledControlJustReleased(0, 38)) {
        const hasPaper = global.exports['np-inventory'].hasEnoughOfItem(
            'npolaroid_paper',
            1,
            false,
            true
        );

        if (hasPaper && !this.data.isPrinting) {
            emitNet('np-polaroid:shutterSound');

            //const apiKey = await Procedures.execute('np-polaroid:getApiKey');
            const apiKey = await RPC.execute<string>('np-polaroid:getApiKey');

            SendNuiMessage(JSON.stringify({
                type: 'polaroidCapture',
                request: {
                    id: uuidv4(),
                    resultURL: 'https://' + GetCurrentResourceName() + '/polaroidCaptured',
                    senderServerId: GetPlayerServerId(PlayerId()),
                    apiKey: apiKey,
                    options: {
                        encoding: 'jpg'
                    }
                }
            }));

            await Delay(1000);

            SendNuiMessage(JSON.stringify({
                type: 'polaroidViewMode',
                show: false
            }));

            this.stop();

            const anim = new AnimationTask(
                playerPed,
                'normal',
                'Printing...',
                10000,
                'friends@fra@ig_1',
                'base_idle',
                1
            );
            await anim.start()
        } else {
            SendNuiMessage(JSON.stringify({
                type: 'polaroidOutOfFilm'
            }));
            playSound(playerPed, 'Creator_Snap', 'DLC_Stunt_Race_Frontend_Sounds');
        }
        Throttle('npolaroid-capture', 1000);
    }

    this.data.runNoir && RegisterNoirScreenEffectThisFrame();
    IsDisabledControlJustReleased(0, 177) && this.stop();

    _0x5847dd(camCamera, 0.76);
    HandleCamFov(camCamera);
    let gamePlayHeading = GetGameplayCamRelativeHeading();
    let gamePlayPitch = GetGameplayCamRelativePitch();
    if (gamePlayPitch < -70) {
        gamePlayPitch = -70
    } else {
        gamePlayPitch > 42 && (gamePlayPitch = 42)
    }
    gamePlayPitch = (gamePlayPitch + 70) / 112
    if (gamePlayHeading < -180) {
        gamePlayHeading = -180
    } else {
        if (gamePlayHeading > 180) {
            gamePlayHeading = 180
        }
    }
    gamePlayHeading = (gamePlayHeading + 180) / 360;
    SetTaskMoveNetworkSignalFloat(playerPed, 'Pitch', gamePlayPitch);
    SetTaskMoveNetworkSignalFloat(playerPed, 'Heading', gamePlayHeading * -1 + 1);
});

FirstPersonThread.addHook('preStart', function (this: Thread) {
    this.data.filter = null;
    playerPed = PlayerPedId();
    camCamera = CreateCam('DEFAULT_SCRIPTED_FLY_CAMERA', true);
    AttachCamToEntity(camCamera, playerPed, 0, 0.4, 0.7, true);
    SetCamRot(camCamera, 0, 0, GetEntityHeading(playerPed), 0);
    SetCamFov(camCamera, camFov);
    RenderScriptCams(true, false, 0, true, false);
    SetCamShakeAmplitude(camCamera, 0);
    global.exports['np-taskbar'].forceTaskbarDisableInventory(true);
    global.exports['np-inventory'].disableActionBar(true);
});

FirstPersonThread.addHook('afterStop', function (this: Thread) {
    ClearExtraTimecycleModifier();
    this.data.runNoir = false;
    RenderScriptCams(false, false, 0, true, false);
    DestroyCam(camCamera, false);
    DetachEntity(playerPed, false, false);
    ClearPedTasks(playerPed);
    SendNuiMessage(JSON.stringify({
        type: 'polaroidViewMode',
        show: false
    }));
    this.data.isPrinting = false;
    global.exports['np-taskbar'].forceTaskbarDisableInventory(false);
    global.exports['np-inventory'].disableActionBar(false);
});

function HandleCamFov(pCam: number) {
    if (IsControlJustPressed(0, 241)) {
        camFov = Math.max(camFov - 7, 45)
    } else {
        IsControlJustPressed(0, 242) && (camFov = Math.min(camFov + 7, 80))
    }
    const pCamFov = GetCamFov(pCam)
    Math.abs(camFov - pCamFov) < 0.1 && (camFov = pCamFov)
    SetCamFov(pCam, pCamFov + (camFov - pCamFov) * 0.05)
}

function _0x5847dd(pCam: number, pValue: number) {
    const _0x2647b6 = GetDisabledControlNormal(0, 220),
        _0x580504 = GetDisabledControlNormal(0, 221),
        pCamRot = GetCamRot(pCam, 2)
    if (_0x2647b6 != 0 || _0x580504 != 0) {
        camHeading2 = camHeading
        camHeading = pCamRot[2] + _0x2647b6 * -1 * 8 * (pValue + 0.1)
        const _0x1ab029 = Math.max(
            Math.min(30, pCamRot[0] + _0x580504 * -1 * 8 * (pValue + 0.1)),
            -89.5
        )
        SetCamRot(pCam, _0x1ab029, 0, camHeading, 2)
            ; (camHeading2 - camHeading > 1 || camHeading - camHeading2 > 1) &&
                (SetEntityRotation(playerPed, 0, 0, camHeading, 2, true),
                    SetEntityHeading(playerPed, camHeading))
    }
}