/** Sweet Home 3D–inspired plan colors and drawing helpers. */

import { planBackgroundKind } from "./planBackground";
import type { PlanPlacedItem, PlanStructureItem, RoomSpec } from "./types";
import { resolveMountFrom } from "./types";

export const SH3D = {
    outside: "#ddd8cf",
    floor: "#faf6ef",
    floorElectrical: "#fffbeb",
    wall: "#2b2b2b",
    wallElectrical: "#78350f",
    gridMinor: "#e8e2d8",
    gridMajor: "#cfc7ba",
    gridElectricalMinor: "#fde68a",
    gridElectricalMajor: "#fbbf24",
    selection: "#5cb85c",
    selectionGlow: "rgba(92, 184, 92, 0.25)",
    dimension: "#6b6560",
    shadow: "rgba(0,0,0,0.12)",
    labelBg: "rgba(255,255,255,0.92)",
} as const;

export const WALL_THICKNESS_M = 0.12;
export const RULER_SIZE_PX = 28;

export function snapToGrid(meters: number, step = 0.1): number {
    return Math.round(meters / step) * step;
}

type DrawRoomOpts = {
    scale: number;
    room: RoomSpec;
    isElectrical: boolean;
    backgroundSurface: HTMLCanvasElement | null;
    showBackground: boolean;
    backgroundOpacity: number;
};

export function drawSweetHomeRoom(ctx: CanvasRenderingContext2D, opts: DrawRoomOpts): void {
    const { scale, room, isElectrical, backgroundSurface, showBackground, backgroundOpacity } = opts;
    const roomW = room.width * scale;
    const roomH = room.depth * scale;
    const wallPx = WALL_THICKNESS_M * scale;

    ctx.fillStyle = SH3D.outside;
    ctx.fillRect(0, 0, roomW, roomH);

    if (showBackground && backgroundSurface) {
        ctx.save();
        ctx.globalAlpha = backgroundOpacity;
        ctx.drawImage(backgroundSurface, wallPx, wallPx, roomW - wallPx * 2, roomH - wallPx * 2);
        ctx.restore();
    } else {
        ctx.fillStyle = isElectrical ? SH3D.floorElectrical : SH3D.floor;
        ctx.fillRect(wallPx, wallPx, roomW - wallPx * 2, roomH - wallPx * 2);
    }

    drawGrid(ctx, room, scale, isElectrical, wallPx);

    ctx.fillStyle = isElectrical ? SH3D.wallElectrical : SH3D.wall;
    ctx.fillRect(0, 0, roomW, wallPx);
    ctx.fillRect(0, roomH - wallPx, roomW, wallPx);
    ctx.fillRect(0, 0, wallPx, roomH);
    ctx.fillRect(roomW - wallPx, 0, wallPx, roomH);
}

type DrawWallsOpts = {
    scale: number;
    items: PlanStructureItem[];
    selectedId: string | null;
    wallInsetM: number;
    draft?: { x1: number; y1: number; x2: number; y2: number; color?: string; depth?: number } | null;
    openingSymbols?: Map<string, HTMLCanvasElement>;
};

export function drawStructureLayer(ctx: CanvasRenderingContext2D, opts: DrawWallsOpts): void {
    const { scale, items, selectedId, wallInsetM, draft, openingSymbols } = opts;
    const inset = wallInsetM * scale;

    for (const item of items) {
        if (item.partType === "wall" && item.x1 != null && item.x2 != null) {
            drawWallSegment(ctx, item, scale, inset, item.id === selectedId, false);
        }
    }
    if (draft) {
        drawWallSegment(
            ctx,
            {
                id: "__draft",
                partType: "wall",
                label: "",
                color: draft.color ?? "#57534e",
                height: 2.7,
                depth: draft.depth ?? WALL_THICKNESS_M,
                elevation: 0,
                x1: draft.x1,
                y1: draft.y1,
                x2: draft.x2,
                y2: draft.y2,
            },
            scale,
            inset,
            true,
            false,
            true
        );
    }
    for (const item of items) {
        if (item.partType === "window" || item.partType === "door") {
            drawStructureOpening(ctx, {
                scale,
                item: { ...item, x: (item.x ?? 0) + wallInsetM, y: (item.y ?? 0) + wallInsetM },
                isSelected: item.id === selectedId,
                symbol: openingSymbols?.get(item.id) ?? null,
            });
        }
    }
}

function drawStructureOpening(
    ctx: CanvasRenderingContext2D,
    opts: {
        scale: number;
        item: PlanStructureItem;
        isSelected: boolean;
        symbol: HTMLCanvasElement | null;
    }
): void {
    const { scale, item, isSelected, symbol } = opts;
    const w = (item.width ?? 1) * scale;
    const h = item.depth * scale;
    const x = (item.x ?? 0) * scale;
    const y = (item.y ?? 0) * scale;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(((item.rotation ?? 0) * Math.PI) / 180);

    if (isSelected) {
        ctx.shadowColor = SH3D.selectionGlow;
        ctx.shadowBlur = 10;
    }

    if (symbol) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.drawImage(symbol, -w / 2, -h / 2, w, h);
    } else {
        ctx.fillStyle = item.color || (item.partType === "window" ? "#7dd3fc" : "#a8a29e");
        ctx.globalAlpha = item.partType === "window" ? 0.75 : 0.9;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.font = "600 9px system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.partType === "window" ? "WIN" : "DR", 0, 0);
    }

    ctx.strokeStyle = isSelected ? SH3D.selection : "#44403c";
    ctx.lineWidth = isSelected ? 2.5 : 1.2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.restore();
}

/** @deprecated use drawStructureLayer */
export function drawInteriorWalls(ctx: CanvasRenderingContext2D, opts: DrawWallsOpts): void {
    drawStructureLayer(ctx, opts);
}

function drawWallSegment(
    ctx: CanvasRenderingContext2D,
    wall: PlanStructureItem,
    scale: number,
    inset: number,
    selected: boolean,
    _isElectrical: boolean,
    dashed = false
): void {
    if (wall.x1 == null || wall.y1 == null || wall.x2 == null || wall.y2 == null) return;
    const x1 = inset + wall.x1 * scale;
    const y1 = inset + wall.y1 * scale;
    const x2 = inset + wall.x2 * scale;
    const y2 = inset + wall.y2 * scale;
    const thick = (wall.depth ?? WALL_THICKNESS_M) * scale;

    ctx.save();
    ctx.strokeStyle = selected ? SH3D.selection : wall.color || SH3D.wall;
    ctx.lineWidth = thick;
    ctx.lineCap = "square";
    if (dashed) ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

function drawGrid(
    ctx: CanvasRenderingContext2D,
    room: RoomSpec,
    scale: number,
    isElectrical: boolean,
    inset: number
): void {
    const roomW = room.width * scale;
    const roomH = room.depth * scale;
    const minor = isElectrical ? SH3D.gridElectricalMinor : SH3D.gridMinor;
    const major = isElectrical ? SH3D.gridElectricalMajor : SH3D.gridMajor;

    ctx.save();
    ctx.beginPath();
    ctx.rect(inset, inset, roomW - inset * 2, roomH - inset * 2);
    ctx.clip();

    for (let i = 0; i <= room.width * 10; i++) {
        const x = inset + (i / 10) * scale;
        ctx.strokeStyle = i % 10 === 0 ? major : minor;
        ctx.lineWidth = i % 10 === 0 ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x, inset);
        ctx.lineTo(x, roomH - inset);
        ctx.stroke();
    }
    for (let j = 0; j <= room.depth * 10; j++) {
        const y = inset + (j / 10) * scale;
        ctx.strokeStyle = j % 10 === 0 ? major : minor;
        ctx.lineWidth = j % 10 === 0 ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(inset, y);
        ctx.lineTo(roomW - inset, y);
        ctx.stroke();
    }
    ctx.restore();
}

export function drawDimensionRulers(
    ctx: CanvasRenderingContext2D,
    room: RoomSpec,
    scale: number,
    offsetX: number,
    offsetY: number
): void {
    const roomW = room.width * scale;
    const roomH = room.depth * scale;
    const rs = RULER_SIZE_PX;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = "#f0ebe3";
    ctx.fillRect(-rs, -rs, roomW + rs, rs);
    ctx.fillRect(-rs, 0, rs, roomH);
    ctx.strokeStyle = SH3D.dimension;
    ctx.fillStyle = SH3D.dimension;
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let m = 0; m <= room.width; m++) {
        const x = m * scale;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rs - 4);
        ctx.stroke();
        if (m < room.width) {
            ctx.fillText(`${m}`, x + scale / 2, rs / 2);
        }
    }
    ctx.textAlign = "right";
    for (let m = 0; m <= room.depth; m++) {
        const y = m * scale;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rs - 4, y);
        ctx.stroke();
        if (m < room.depth) {
            ctx.fillText(`${m}`, rs / 2, y + scale / 2);
        }
    }
    ctx.fillStyle = "#888";
    ctx.font = "9px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("m", rs / 2, rs - 6);
    ctx.restore();
}

type DrawItemOpts = {
    scale: number;
    item: PlanPlacedItem;
    isSelected: boolean;
    isElectrical: boolean;
    symbol: HTMLCanvasElement | null;
};

export function drawSweetHomeItem(ctx: CanvasRenderingContext2D, opts: DrawItemOpts): void {
    const { scale, item, isSelected, isElectrical, symbol } = opts;
    const w = item.width * scale;
    const h = item.depth * scale;
    const x = item.x * scale;
    const y = item.y * scale;
    const isWire = item.partType === "wire";

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((item.rotation * Math.PI) / 180);

    if (isSelected) {
        ctx.shadowColor = SH3D.selectionGlow;
        ctx.shadowBlur = 12;
    }

    if (!isWire) {
        ctx.fillStyle = SH3D.shadow;
        ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w, h);
    }
    ctx.shadowBlur = 0;

    if (isWire) {
        ctx.fillStyle = item.color || "#854d0e";
        ctx.globalAlpha = isSelected ? 0.95 : 0.8;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = isSelected ? SH3D.selection : "#78350f";
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.globalAlpha = 1;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.setLineDash([]);
    } else if (symbol) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.drawImage(symbol, -w / 2, -h / 2, w, h);
    } else {
        const base = item.color || (isElectrical ? "#eab308" : "#a8a29e");
        ctx.fillStyle = base;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.globalAlpha = 1;
        if (item.cadUrl) {
            const cadKind = planBackgroundKind(item.cadUrl);
            const tag = cadKind === "dwg" || cadKind === "dxf" ? cadKind.toUpperCase() : "CAD";
            ctx.fillStyle = "#fff";
            ctx.font = "9px system-ui,sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(tag, 0, 0);
        }
    }

    ctx.strokeStyle = isSelected ? SH3D.selection : isElectrical ? "#92400e" : "#57534e";
    ctx.lineWidth = isSelected ? 2.5 : 1.2;
    if (isSelected) {
        ctx.setLineDash([6, 3]);
    }
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.setLineDash([]);

    if (!isWire) {
        const mount = resolveMountFrom(item);
        if (mount === "ceiling") {
            drawCeilingIndicator(ctx, w, h, isSelected);
        } else {
            drawFrontIndicator(ctx, w, h, isSelected);
        }
        drawItemLabel(ctx, item, w, h, isElectrical);
    } else {
        ctx.fillStyle = "#422006";
        ctx.font = "9px system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.label, 0, 0);
    }

    ctx.restore();
}

function drawCeilingIndicator(ctx: CanvasRenderingContext2D, _w: number, h: number, selected: boolean): void {
    ctx.fillStyle = selected ? SH3D.selection : "#78716c";
    ctx.beginPath();
    ctx.moveTo(0, h / 2 + 2);
    ctx.lineTo(-5, h / 2 + 10);
    ctx.lineTo(5, h / 2 + 10);
    ctx.closePath();
    ctx.fill();
}

function drawFrontIndicator(ctx: CanvasRenderingContext2D, _w: number, h: number, selected: boolean): void {
    ctx.fillStyle = selected ? SH3D.selection : "#78716c";
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 - 2);
    ctx.lineTo(-5, -h / 2 - 10);
    ctx.lineTo(5, -h / 2 - 10);
    ctx.closePath();
    ctx.fill();
}

function drawItemLabel(
    ctx: CanvasRenderingContext2D,
    item: PlanPlacedItem,
    _w: number,
    h: number,
    isElectrical: boolean
): void {
    const label = item.label.length > 14 ? `${item.label.slice(0, 12)}…` : item.label;
    ctx.font = "600 9px system-ui,sans-serif";
    const tw = ctx.measureText(label).width + 8;
    const ly = h / 2 - 10;
    ctx.fillStyle = SH3D.labelBg;
    ctx.fillRect(-tw / 2, ly - 7, tw, 14);
    ctx.fillStyle = isElectrical ? "#422006" : "#292524";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, ly);
}

export function contentOffsetPx(): { ox: number; oy: number } {
    return { ox: RULER_SIZE_PX, oy: RULER_SIZE_PX };
}

export function totalCanvasSizePx(room: RoomSpec, scale: number): { w: number; h: number } {
    return { w: room.width * scale + RULER_SIZE_PX, h: room.depth * scale + RULER_SIZE_PX };
}
