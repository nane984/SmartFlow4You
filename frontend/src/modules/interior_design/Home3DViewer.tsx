import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { isRenderablePlanBackground, loadItemSymbolSurface, pickItemSymbolUrl } from "./planBackground";
import {
    effectiveItemHeight,
    isStructureOpening,
    isStructureWall,
    itemCenterY,
    type LayoutData,
    type PlanPlacedItem,
    type PlanStructureItem,
} from "./types";

const WALL_INSET = 0.12;

function addStructureWallMesh(scene: THREE.Scene, wall: PlanStructureItem, roomHeight: number): THREE.Mesh | null {
    if (!isStructureWall(wall) || wall.x1 == null || wall.x2 == null) return null;
    const dx = wall.x2 - wall.x1;
    const dz = wall.y2! - wall.y1!;
    const len = Math.hypot(dx, dz);
    if (len < 0.05) return null;

    const h = wall.height || roomHeight;
    const thick = wall.depth ?? WALL_INSET;
    const color = new THREE.Color(wall.color || "#d6d3d1");
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
    const geo = new THREE.BoxGeometry(len, h, thick);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
        WALL_INSET + (wall.x1 + wall.x2) / 2,
        h / 2,
        WALL_INSET + (wall.y1! + wall.y2!) / 2
    );
    mesh.rotation.y = Math.atan2(dz, dx);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

function addOpeningMesh(scene: THREE.Scene, item: PlanStructureItem, tex: THREE.Texture | null): THREE.Mesh | null {
    if (!isStructureOpening(item)) return null;
    const w = item.width ?? 1;
    const h = item.height;
    const d = item.depth;
    const geo = new THREE.BoxGeometry(w, h, d);
    const color = new THREE.Color(item.color || (item.partType === "window" ? "#7dd3fc" : "#a8a29e"));
    const mat = new THREE.MeshStandardMaterial({
        color,
        map: tex,
        roughness: 0.5,
        metalness: item.partType === "window" ? 0.2 : 0.05,
        transparent: item.partType === "window",
        opacity: item.partType === "window" ? 0.85 : 1,
    });
    if (tex) mat.color.set(0xffffff);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
        WALL_INSET + (item.x ?? 0) + w / 2,
        (item.elevation ?? 0) + h / 2,
        WALL_INSET + (item.y ?? 0) + d / 2
    );
    mesh.rotation.y = ((item.rotation ?? 0) * Math.PI) / 180;
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
}

type ViewMode = "orbit" | "walk";

type Props = {
    layout: LayoutData;
    showElectrical?: boolean;
};

async function loadItemTexture(item: PlanPlacedItem): Promise<THREE.Texture | null> {
    const picked = pickItemSymbolUrl(item.imageUrl, item.cadUrl);
    if (!picked || !isRenderablePlanBackground(picked.kind)) return null;
    try {
        const canvas = await loadItemSymbolSurface(picked.url, picked.kind, 256, 256);
        if (!canvas) return null;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        return tex;
    } catch {
        return null;
    }
}

function addFurnitureMesh(
    scene: THREE.Scene,
    item: PlanPlacedItem,
    texture: THREE.Texture | null,
    roomHeight: number
): THREE.Mesh {
    const h = effectiveItemHeight(item);
    const geo = new THREE.BoxGeometry(item.width, h, item.depth);
    const color = new THREE.Color(item.color || "#a8a29e");
    const mat = new THREE.MeshStandardMaterial({
        color,
        map: texture,
        roughness: 0.65,
        metalness: 0.05,
    });
    if (texture) {
        mat.color.set(0xffffff);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(item.x + item.width / 2, itemCenterY(item, roomHeight), item.y + item.depth / 2);
    mesh.rotation.y = (item.rotation * Math.PI) / 180;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { label: item.label };
    scene.add(mesh);
    return mesh;
}

export default function Home3DViewer({ layout, showElectrical = false }: Props) {
    const mountRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("orbit");

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const room = layout.room;
        const items = showElectrical ? layout.electrical ?? [] : layout.furniture;

        const w = mount.clientWidth || 800;
        const h = Math.max(480, mount.clientHeight || 520);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xe8e4dc);

        const camera = new THREE.PerspectiveCamera(50, w / h, 0.05, 200);
        camera.position.set(room.width * 0.8, room.height * 1.4, room.depth * 1.2);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(room.width / 2, room.height * 0.35, room.depth / 2);
        controls.enableDamping = true;
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        controls.update();

        scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8278, 0.85));
        const sun = new THREE.DirectionalLight(0xfff5e6, 0.75);
        sun.position.set(room.width, room.height * 2, room.depth);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        scene.add(sun);

        const floorGeo = new THREE.PlaneGeometry(room.width, room.depth);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xfaf6ef, roughness: 0.9 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(room.width / 2, 0, room.depth / 2);
        floor.receiveShadow = true;
        scene.add(floor);

        const grid = new THREE.GridHelper(
            Math.max(room.width, room.depth),
            Math.max(room.width, room.depth),
            0xcfc7ba,
            0xe8e2d8
        );
        grid.position.set(room.width / 2, 0.002, room.depth / 2);
        scene.add(grid);

        const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, side: THREE.DoubleSide });
        const wallH = room.height;
        const wallT = 0.12;

        const back = new THREE.Mesh(new THREE.BoxGeometry(room.width, wallH, wallT), wallMat);
        back.position.set(room.width / 2, wallH / 2, wallT / 2);
        back.receiveShadow = true;
        scene.add(back);

        const front = new THREE.Mesh(new THREE.BoxGeometry(room.width, wallH, wallT), wallMat);
        front.position.set(room.width / 2, wallH / 2, room.depth - wallT / 2);
        scene.add(front);

        const left = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, room.depth), wallMat);
        left.position.set(wallT / 2, wallH / 2, room.depth / 2);
        scene.add(left);

        const right = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, room.depth), wallMat);
        right.position.set(room.width - wallT / 2, wallH / 2, room.depth / 2);
        scene.add(right);

        const interiorMeshes: THREE.Mesh[] = [];
        for (const s of layout.structure ?? []) {
            if (isStructureWall(s)) {
                const m = addStructureWallMesh(scene, s, room.height);
                if (m) interiorMeshes.push(m);
            }
        }

        let cancelled = false;
        const meshes: THREE.Mesh[] = [...interiorMeshes];

        void (async () => {
            for (const item of items) {
                if (cancelled) return;
                const tex = await loadItemTexture(item);
                meshes.push(addFurnitureMesh(scene, item, tex, room.height));
            }
            for (const opening of layout.structure ?? []) {
                if (cancelled || !isStructureOpening(opening)) continue;
                const pseudo: PlanPlacedItem = {
                    id: opening.id,
                    type: opening.partType,
                    label: opening.label,
                    x: opening.x ?? 0,
                    y: opening.y ?? 0,
                    rotation: opening.rotation ?? 0,
                    width: opening.width ?? 1,
                    depth: opening.depth,
                    height: opening.height,
                    color: opening.color,
                    imageUrl: opening.imageUrl,
                    cadUrl: opening.cadUrl,
                };
                const tex = await loadItemTexture(pseudo);
                const m = addOpeningMesh(scene, opening, tex);
                if (m) meshes.push(m);
            }
        })();

        const keys = new Set<string>();
        const onKeyDown = (e: KeyboardEvent) => keys.add(e.code);
        const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        let walkYaw = 0;
        let walkPitch = 0;
        let pointerLocked = false;

        const onClick = () => {
            if (viewMode === "walk") {
                renderer.domElement.requestPointerLock();
            }
        };
        const onLockChange = () => {
            pointerLocked = document.pointerLockElement === renderer.domElement;
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!pointerLocked || viewMode !== "walk") return;
            walkYaw -= e.movementX * 0.002;
            walkPitch -= e.movementY * 0.002;
            walkPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, walkPitch));
        };
        renderer.domElement.addEventListener("click", onClick);
        document.addEventListener("pointerlockchange", onLockChange);
        document.addEventListener("mousemove", onMouseMove);

        let animId = 0;
        const animate = () => {
            animId = requestAnimationFrame(animate);

            if (viewMode === "orbit") {
                controls.enabled = true;
                controls.update();
            } else {
                controls.enabled = false;
                const speed = 0.07;
                const dir = new THREE.Vector3();
                if (keys.has("KeyW") || keys.has("ArrowUp")) dir.z -= 1;
                if (keys.has("KeyS") || keys.has("ArrowDown")) dir.z += 1;
                if (keys.has("KeyA") || keys.has("ArrowLeft")) dir.x -= 1;
                if (keys.has("KeyD") || keys.has("ArrowRight")) dir.x += 1;
                dir.normalize();

                camera.rotation.order = "YXZ";
                camera.rotation.y = walkYaw;
                camera.rotation.x = walkPitch;

                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                forward.y = 0;
                forward.normalize();
                const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

                camera.position.addScaledVector(forward, -dir.z * speed);
                camera.position.addScaledVector(right, dir.x * speed);
                camera.position.x = Math.max(0.3, Math.min(room.width - 0.3, camera.position.x));
                camera.position.z = Math.max(0.3, Math.min(room.depth - 0.3, camera.position.z));
                camera.position.y = 1.6;
            }

            renderer.render(scene, camera);
        };
        animate();

        const ro = new ResizeObserver(() => {
            const nw = mount.clientWidth;
            const nh = Math.max(480, mount.clientHeight || 520);
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            renderer.setSize(nw, nh);
        });
        ro.observe(mount);

        return () => {
            cancelled = true;
            cancelAnimationFrame(animId);
            ro.disconnect();
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            renderer.domElement.removeEventListener("click", onClick);
            document.removeEventListener("pointerlockchange", onLockChange);
            document.removeEventListener("mousemove", onMouseMove);
            if (document.pointerLockElement === renderer.domElement) {
                document.exitPointerLock();
            }
            controls.dispose();
            meshes.forEach((m) => {
                m.geometry.dispose();
                (m.material as THREE.Material).dispose();
            });
            renderer.dispose();
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, [layout, showElectrical, viewMode]);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setViewMode("orbit")}
                    className={
                        viewMode === "orbit"
                            ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
                            : "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                    }
                >
                    3D orbit
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode("walk")}
                    className={
                        viewMode === "walk"
                            ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
                            : "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
                    }
                >
                    Walk through
                </button>
            </div>
            <div
                ref={mountRef}
                className="min-h-[min(70vh,640px)] w-full overflow-hidden rounded-xl border-2 border-slate-300 bg-[#e8e4dc] shadow-inner"
            />
            <p className="text-xs text-slate-600">
                {viewMode === "orbit" ? (
                    <>Drag to rotate · scroll to zoom · Sweet Home 3D–style room preview.</>
                ) : (
                    <>
                        Click the view, then <kbd className="rounded bg-slate-200 px-1">W A S D</kbd> to walk ·
                        mouse to look · Esc to release.
                    </>
                )}
            </p>
        </div>
    );
}
