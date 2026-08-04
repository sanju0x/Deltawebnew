"use client";

import Image from "next/image";
import { BadgeCheck, Move } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

export function RubberLogo() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Point>({ x: 0, y: 42 });
  const velocityRef = useRef<Point>({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<Point>({ x: 0, y: 0 });
  const [position, setPosition] = useState<Point>(positionRef.current);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let frame = 0;

    const animate = () => {
      if (!draggingRef.current) {
        const position = positionRef.current;
        const velocity = velocityRef.current;
        const spring = 0.035;
        const damping = 0.88;

        velocity.x = (velocity.x - position.x * spring) * damping;
        velocity.y = (velocity.y - (position.y - 42) * spring) * damping;
        position.x += velocity.x;
        position.y += velocity.y;

        if (
          Math.abs(velocity.x) > 0.05 ||
          Math.abs(velocity.y) > 0.05 ||
          Math.abs(position.x) > 0.1 ||
          Math.abs(position.y - 42) > 0.1
        ) {
          setPosition({ ...position });
        }
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    setDragging(true);
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    velocityRef.current = { x: 0, y: 0 };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !stageRef.current || !cardRef.current) return;

    const stage = stageRef.current.getBoundingClientRect();
    const card = cardRef.current.getBoundingClientRect();
    const deltaX = event.clientX - lastPointerRef.current.x;
    const deltaY = event.clientY - lastPointerRef.current.y;
    const maxX = Math.max(40, stage.width / 2 - card.width / 2 - 12);
    const maxY = Math.max(80, stage.height - card.height - 50);
    const next = {
      x: Math.max(-maxX, Math.min(maxX, positionRef.current.x + deltaX)),
      y: Math.max(0, Math.min(maxY, positionRef.current.y + deltaY)),
    };

    velocityRef.current = { x: deltaX * 0.8, y: deltaY * 0.8 };
    positionRef.current = next;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    setPosition(next);
  };

  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    draggingRef.current = false;
    setDragging(false);
  };

  const ropeLength = Math.hypot(position.x, position.y + 54);
  const ropeAngle = Math.atan2(position.x, position.y + 54) * (180 / Math.PI);
  const speed = Math.hypot(velocityRef.current.x, velocityRef.current.y);
  const stretch = dragging ? Math.min(speed / 90, 0.09) : Math.min(speed / 130, 0.05);

  return (
    <div
      ref={stageRef}
      className="rubber-stage"
      aria-label="Interactive Delta logo. Drag it and release to watch it bounce."
    >
      <div className="rubber-anchor" aria-hidden="true" />
      <div
        className="rubber-rope"
        aria-hidden="true"
        style={{
          height: `${ropeLength}px`,
          transform: `translateX(-50%) rotate(${-ropeAngle}deg)`,
        }}
      />
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        className={`rubber-card ${dragging ? "is-dragging" : ""}`}
        style={{
          transform: `translate3d(calc(-50% + ${position.x}px), ${position.y}px, 0) rotate(${position.x / 22}deg) scale(${1 - stretch}, ${1 + stretch})`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(event) => {
          const amount = event.shiftKey ? 24 : 10;
          const movement: Record<string, Point> = {
            ArrowLeft: { x: -amount, y: 0 },
            ArrowRight: { x: amount, y: 0 },
            ArrowUp: { x: 0, y: -amount },
            ArrowDown: { x: 0, y: amount },
          };
          const delta = movement[event.key];
          if (!delta) return;
          event.preventDefault();
          positionRef.current = {
            x: positionRef.current.x + delta.x,
            y: Math.max(0, positionRef.current.y + delta.y),
          };
          velocityRef.current = { x: delta.x, y: delta.y };
          setPosition({ ...positionRef.current });
        }}
      >
        <div className="rubber-card-shine" aria-hidden="true" />
        <div className="rubber-logo-shell">
          <Image src="/icon.svg" alt="Delta logo" width={172} height={172} priority />
        </div>
        <div className="rubber-identity">
          <div>
            <span className="rubber-name">
              Delta
              <BadgeCheck
                className="size-6 text-[#5865f2]"
                fill="currentColor"
                aria-label="Verified on Discord"
              />
            </span>
            <span className="rubber-handle">@deltamusic</span>
          </div>
          <span className="rubber-move">
            <Move className="size-4" />
            drag me
          </span>
        </div>
      </div>
    </div>
  );
}
