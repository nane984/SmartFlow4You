import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { LayoutData } from "./types";
import { effectiveItemHeight, itemCenterY } from "./types";

type Props = {
    layout: LayoutData;
};

export default function WalkthroughViewer({ layout }: Props) {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const w = mount.clientWidth;
        const h = 420;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f5f9);

        const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
        camera.position.set(2, 1.6, 2);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
        scene.add(light);
        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(5, 10, 5);
        scene.add(dir);

        const room = layout.room;
        const floorGeo = new THREE.PlaneGeometry(room.width, room.depth);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(room.width / 2, 0, room.depth / 2);
        scene.add(floor);

        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            side: THREE.DoubleSide,
        });
        const wallH = room.height;
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(room.width, wallH), wallMat);
        backWall.position.set(room.width / 2, wallH / 2, 0);
        scene.add(backWall);
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(room.depth, wallH), wallMat);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(0, wallH / 2, room.depth / 2);
        scene.add(leftWall);

        for (const item of layout.furniture) {
            const h = effectiveItemHeight(item);
            const geo = new THREE.BoxGeometry(item.width, h, item.depth);
            const color = new THREE.Color(item.color || "#64748b");
            const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
            mesh.position.set(
                item.x + item.width / 2,
                itemCenterY(item, room.height),
                item.y + item.depth / 2
            );
            mesh.rotation.y = (item.rotation * Math.PI) / 180;
            scene.add(mesh);
        }

        const keys = new Set<string>();
        const onKeyDown = (e: KeyboardEvent) => keys.add(e.code);
        const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        let yaw = 0;
        let pitch = 0;
        let locked = false;

        const onClick = () => {
            renderer.domElement.requestPointerLock();
        };
        const onLockChange = () => {
            locked = document.pointerLockElement === renderer.domElement;
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!locked) return;
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
        };

        renderer.domElement.addEventListener("click", onClick);
        document.addEventListener("pointerlockchange", onLockChange);
        document.addEventListener("mousemove", onMouseMove);

        const velocity = new THREE.Vector3();
        const direction = new THREE.Vector3();
        let animId = 0;

        const animate = () => {
            animId = requestAnimationFrame(animate);
            const speed = 0.08;
            direction.set(0, 0, 0);
            if (keys.has("KeyW") || keys.has("ArrowUp")) direction.z -= 1;
            if (keys.has("KeyS") || keys.has("ArrowDown")) direction.z += 1;
            if (keys.has("KeyA") || keys.has("ArrowLeft")) direction.x -= 1;
            if (keys.has("KeyD") || keys.has("ArrowRight")) direction.x += 1;
            direction.normalize();

            velocity.x = direction.x * speed;
            velocity.z = direction.z * speed;

            camera.rotation.order = "YXZ";
            camera.rotation.y = yaw;
            camera.rotation.x = pitch;

            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            forward.y = 0;
            forward.normalize();
            const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

            camera.position.addScaledVector(forward, -velocity.z);
            camera.position.addScaledVector(right, velocity.x);

            camera.position.x = Math.max(0.3, Math.min(room.width - 0.3, camera.position.x));
            camera.position.z = Math.max(0.3, Math.min(room.depth - 0.3, camera.position.z));
            camera.position.y = 1.6;

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            renderer.domElement.removeEventListener("click", onClick);
            document.removeEventListener("pointerlockchange", onLockChange);
            document.removeEventListener("mousemove", onMouseMove);
            if (document.pointerLockElement === renderer.domElement) {
                document.exitPointerLock();
            }
            mount.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, [layout]);

    return (
        <div className="space-y-2">
            <div
                ref={mountRef}
                className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            />
            <p className="text-xs text-slate-600">
                Click the view to capture the mouse, then use <kbd className="rounded bg-slate-200 px-1">W A S D</kbd>{" "}
                or arrow keys to walk through the space. Move the mouse to look around. Press Esc to release.
            </p>
        </div>
    );
}
