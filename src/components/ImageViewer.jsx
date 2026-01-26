import { useEffect, useRef, useState } from "react";
import { X, Plus, Minus, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
}

export default function ImageViewer({
    images,
    idx,
    setIdx,
    setViewerOpen,
    watermarkText
}) {
    const [zoom, setZoom] = useState(1);
    const offset = useRef({ x: 0, y: 0 });
    const raf = useRef(null);
    const [dragging, setDragging] = useState(false);

    const frameRef = useRef(null);
    const imgRef = useRef(null);
    const start = useRef({ x: 0, y: 0 });
    const pointers = useRef(new Map());
    const pinchStartDist = useRef(0);
    const pinchStartZoom = useRef(1);
    const current = images[idx];

    useEffect(() => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    }, [idx]);

    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.current.size === 2) {
            const pts = [...pointers.current.values()];
            pinchStartDist.current = Math.hypot(
                pts[0].x - pts[1].x,
                pts[0].y - pts[1].y
            );
            pinchStartZoom.current = zoom;
        } else if (zoom > 1) {
            setDragging(true);
            start.current = {
                x: e.clientX - offset.x,
                y: e.clientY - offset.y
            };
        }
    };


    const onPointerMove = (e) => {
        if (!frameRef.current || !imgRef.current) return;
        if (!pointers.current.has(e.pointerId)) return;

        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // 🔍 Pinch zoom
        if (pointers.current.size === 2) {
            const pts = [...pointers.current.values()];
            const dist = Math.hypot(
                pts[0].x - pts[1].x,
                pts[0].y - pts[1].y
            );

            const scale = dist / pinchStartDist.current;
            const newZoom = clamp(pinchStartZoom.current * scale, 1, 3);
            setZoom(newZoom);
            return;
        }

        // ✋ Drag (single pointer)
        if (!dragging) return;

        const frame = frameRef.current.getBoundingClientRect();
        const img = imgRef.current.getBoundingClientRect();

        const maxX = Math.max(0, (img.width - frame.width) / 2);
        const maxY = Math.max(0, (img.height - frame.height) / 2);

        const nextX = clamp(e.clientX - start.current.x, -maxX, maxX);
        const nextY = clamp(e.clientY - start.current.y, -maxY, maxY);

        offset.current = { x: nextX, y: nextY };

        if (!raf.current) {
            raf.current = requestAnimationFrame(() => {
                imgRef.current.style.transform =
                    `translate(${offset.current.x}px, ${offset.current.y}px) scale(${zoom})`;
                raf.current = null;
            });
        }

    };


    const stopDragging = (e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) {
            pinchStartDist.current = 0;
        }
        setDragging(false);
    };

    const onWheel = (e) => {
        if (!frameRef.current || !imgRef.current) return;

        e.preventDefault();        // ⛔ stop page scroll
        e.stopPropagation();

        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        const newZoom = clamp(zoom + delta, 1, 3);
        if (newZoom === zoom) return;

        const frame = frameRef.current.getBoundingClientRect();
        const img = imgRef.current.getBoundingClientRect();

        // Cursor position relative to frame center
        const cx = e.clientX - (frame.left + frame.width / 2);
        const cy = e.clientY - (frame.top + frame.height / 2);

        const k = newZoom / zoom;

        let newOffset = {
            x: k * offset.x + (1 - k) * cx,
            y: k * offset.y + (1 - k) * cy
        };

        // Clamp pan bounds
        const widthNew = img.width * (newZoom / zoom);
        const heightNew = img.height * (newZoom / zoom);

        const maxX = Math.max(0, (widthNew - frame.width) / 2);
        const maxY = Math.max(0, (heightNew - frame.height) / 2);

        newOffset = {
            x: clamp(newOffset.x, -maxX, maxX),
            y: clamp(newOffset.y, -maxY, maxY)
        };

        setZoom(newZoom);
        setOffset(newOffset);
    };

    return (
        <div
            className="fixed inset-0 z-[3000] bg-black/80 flex items-center justify-center"
            onClick={() => setViewerOpen(false)}
        >
            <div
                className="relative w-full max-w-5xl"
                style={{ height: "80vh" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* FRAME */}
                <div
                    ref={frameRef}
                    onWheel={onWheel}
                    className="relative h-full w-full bg-black rounded-xl overflow-hidden flex items-center justify-center"
                >

                    {/* IMAGE */}
                    <div
                        ref={imgRef}
                        className={`relative select-none touch-none ${zoom > 1 ? "cursor-grab" : "cursor-zoom-in"
                            }`}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={stopDragging}
                        onPointerLeave={stopDragging}
                        onPointerCancel={stopDragging}

                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transition: "none"
                        }}
                    >

                        <img
                            src={current}
                            draggable={false}
                            className="block max-w-full max-h-full pointer-events-none"
                        />
                    </div>

                    {/* FRAME-LOCKED WATERMARK */}
                    <div className="
            absolute left-2 top-1/2 -translate-y-1/2 rotate-[-90deg]
            px-4 py-1 rounded-full
            bg-white/40 backdrop-blur
            text-xs font-semibold tracking-wide text-black
            pointer-events-none select-none whitespace-nowrap
          ">
                        {watermarkText}
                    </div>

                    {/* CLOSE */}
                    <button
                        onClick={() => setViewerOpen(false)}
                        className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full"
                    >
                        <X size={18} />
                    </button>

                    {/* NAV */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => setIdx(idx === 0 ? images.length - 1 : idx - 1)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                            >
                                <ChevronLeft size={22} />
                            </button>

                            <button
                                onClick={() => setIdx((idx + 1) % images.length)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                            >
                                <ChevronRight size={22} />
                            </button>
                        </>
                    )}
                </div>

                {/* BOTTOM CONTROLS */}
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-white/95 rounded-xl px-4 py-2 flex items-center gap-4 shadow-lg">
                    <button onClick={() => setZoom(z => clamp(z - 0.25, 1, 3))}>
                        <Minus size={18} />
                    </button>
                    <span className="font-medium">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => clamp(z + 0.25, 1, 3))}>
                        <Plus size={18} />
                    </button>
                    <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
