import {
    OrthographicCamera,
    Scene,
    WebGLRenderTarget,
    LinearFilter,
    NearestFilter,
    RGBAFormat,
    UnsignedByteType,
    CfxTexture,
    ShaderMaterial,
    PlaneBufferGeometry,
    Mesh,
    WebGLRenderer
} from '@citizenfx/three';

function updatePicturesLeft() {
    var t;
    document.getElementById("overlay-top-right-text")!.innerText = `📷 ${null !== (t = ScreenshotHandler.picturesLeft) && void 0 !== t ? t : 0}  left`
}

function showOutOfFilm() {
    document.getElementById("out-of-film")!.style.display = "flex";

    setTimeout(() => {
        document.getElementById("out-of-film")!.style.display = "none";
    }, 1000)
}

class ScreenshotHandler {
    screenshotUI: ScreenshotUI;
    polaroidViewMode: PolaroidViewMode;
    static picturesLeft: number;
    initialize() {
        console.log("[UI] Initializing UI...")
        this.screenshotUI = new ScreenshotUI();
        this.screenshotUI.initialize();

        this.polaroidViewMode = new PolaroidViewMode();
        window.addEventListener('message', (event: any) => {
            if (event.data.type === 'polaroidViewMode') {
                console.log("polaroidViewMode messageHandler")
                this.polaroidViewMode.messageHandler(event);
            } else if (event.data.type === 'polaroidCapture') {
                console.log("polaroidCapture messageHandler")
                this.screenshotUI.messageHandler(event);
            } else if (event.data.type === 'polaroidOutOfFilm') {
                console.log("polaroidOutOfFilm messageHandler")
                showOutOfFilm();
            }
        });
        window.addEventListener('resize', (event: any) => {
            this.screenshotUI.resize();
        });

        console.log("[UI] UI Initialized");
    }
}

class PolaroidViewMode {
    show: boolean;
    constructor() {
        console.log("[UI] Initializing Polaroid View Mode...")
    }

    messageHandler(event: any) {
        console.log("PolaroidViewMode messageHandler")

        this.show = event.data.show;
        ScreenshotHandler.picturesLeft = event.data.picturesLeft;
        this.show || (document.getElementById("out-of-film")!.style.display = "none");
        document.getElementById("view-container")!.style.display = this.show ? "grid" : "none";
        document.getElementById("overlay-bottom-left-text")!.innerText = `${innerHeight}x${innerHeight}px`;
        updatePicturesLeft()
    }
}

class ScreenshotUI {
    renderer: any;
    rtTexture: any;
    sceneRTT: any;
    cameraRTT: any;
    material: any;
    request: any;

    messageHandler(event: any) {
        this.request = event.data.request
    }

    initialize() {
        console.log("[UI] Initializing Screenshot UI...")

        const cameraRTT: any = new OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);
        cameraRTT.position.z = 100;

        const sceneRTT: any = new Scene();

        const rtTexture = new WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat, type: UnsignedByteType });
        const gameTexture: any = new CfxTexture();
        gameTexture.needsUpdate = true;

        const material = new ShaderMaterial({

            uniforms: { "tDiffuse": { value: gameTexture } },
            vertexShader: `
			varying vec2 vUv;
			void main() {
				vUv = vec2(uv.x, 1.0-uv.y); // fuck gl uv coords
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
`,
            fragmentShader: `
			varying vec2 vUv;
			uniform sampler2D tDiffuse;
			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );
			}
`

        });

        this.material = material;

        const plane = new PlaneBufferGeometry(window.innerWidth, window.innerHeight);
        const quad: any = new Mesh(plane, material);
        quad.position.z = -100;
        sceneRTT.add(quad);

        const renderer = new WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.autoClear = false;

        document.getElementById('app')!.appendChild(renderer.domElement);
        document.getElementById('app')!.style.display = 'none';

        this.renderer = renderer;
        this.rtTexture = rtTexture;
        this.sceneRTT = sceneRTT;
        this.cameraRTT = cameraRTT;

        this.animate = this.animate.bind(this);

        requestAnimationFrame(this.animate);
    }

    resize() {
        const cameraRTT: any = new OrthographicCamera( window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000 );
        cameraRTT.position.z = 100;

        this.cameraRTT = cameraRTT;

        const sceneRTT: any = new Scene();

        const plane = new PlaneBufferGeometry( window.innerWidth, window.innerHeight );
        const quad: any = new Mesh( plane, this.material );
        quad.position.z = -100;
        sceneRTT.add( quad );

        this.sceneRTT = sceneRTT;

        this.rtTexture = new WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat, type: UnsignedByteType } );

        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    animate() {
        requestAnimationFrame(this.animate);

        this.renderer.clear();
        this.renderer.render(this.sceneRTT, this.cameraRTT, this.rtTexture, true);

        if (this.request) {
            const request = this.request;
            this.request = null;

            this.handleRequest(request);
        }
    }

    handleRequest(t: any) {
        const screen = new Uint8Array(window.innerHeight * window.innerHeight * 4);
        this.renderer.readRenderTargetPixels(this.rtTexture, (window.innerWidth - window.innerHeight) / 2, 0, window.innerHeight, window.innerHeight, screen);

        const canvas = document.createElement("canvas") as any;
        canvas.style.display = "inline";
        canvas.width = window.innerHeight;
        canvas.height = window.innerHeight;
        const data = new Uint8ClampedArray(screen.buffer);

        canvas.getContext("2d").putImageData(new ImageData(data, window.innerHeight, window.innerHeight), 0, 0);

        let imageType = "image/png";
        switch (t.options.encoding) {
            case "jpg":
                imageType = "image/jpeg";
                break;
            case "png":
                imageType = "image/png";
                break;
            case "webp":
                imageType = "image/webp"
        }
        t.options.quality || (t.options.quality = .92);
        const image = canvas.toDataURL(imageType, t.options.quality);

        const replacedImg = image.replace(`data:${imageType};base64,`, "");

        const formData = new FormData();
        formData.append('image', replacedImg);
        formData.append('type', 'base64');

        fetch("https://api.imgur.com/3/image/", {
            method: "POST",
            headers: {
                Authorization: 'Client-ID ' + t.apiKey,
            },
            body: formData
        }).then((t => t.json())).then((r => {
            if (t.resultURL) {
                fetch(t.resultURL, {
                    method: "POST",
                    body: JSON.stringify({
                        data: {                            
                            id: t.id,
                            image: r.data.link,
                            senderServerId: t.senderServerId
                        },
                        meta: { ok: true }
                    })
                }).then((r) => {
                    ScreenshotHandler.picturesLeft--;
                    updatePicturesLeft();
                })
            }
        })).catch((e => {
            console.log("fetch error", e)
        }));
    }
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("[UI] Dom content loaded");
    new ScreenshotHandler().initialize();
});