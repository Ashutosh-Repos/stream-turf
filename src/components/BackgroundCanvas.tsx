"use client";

import { useEffect, useRef } from "react";

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  //   const strokeclr = `rgba(40, 80, 160,`;
  //   const fillclr = `rgba(40, 80, 160,`;
  let hue = 200;

  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animateHeader = true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const target = { x: width / 2, y: height / 2 };
    const points: any[] = [];

    function getDistance(p1: any, p2: any) {
      return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }

    class Circle {
      pos: any;
      radius: number;
      color: string;
      active = 0;

      constructor(pos: any, radius: number, color: string) {
        this.pos = pos;
        this.radius = radius;
        this.color = color;
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = `hsl(${hue}, 100%, 60%, ${this.active})`;
        ctx.fill();
      }
    }

    function initHeader() {
      width = window.innerWidth;
      height = window.innerHeight;
      if (headerRef.current) headerRef.current.style.height = `${height}px`;

      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }

      // Create points
      const gridSize = 20;
      for (let x = 0; x < width; x += width / gridSize) {
        for (let y = 0; y < height; y += height / gridSize) {
          const px = x + (Math.random() * width) / gridSize;
          const py = y + (Math.random() * height) / gridSize;
          const p = { x: px, originX: px, y: py, originY: py };
          points.push(p);
        }
      }

      // Find 5 closest
      points.forEach((p1) => {
        const closest = points
          .filter((p2) => p1 !== p2)
          .sort((a, b) => getDistance(p1, a) - getDistance(p1, b))
          .slice(0, 5);
        p1.closest = closest;
        p1.circle = new Circle(
          p1,
          2 + Math.random() * 2,
          "rgba(200,200,255,1)"
        );
      });
    }

    function drawLines(p: any) {
      if (!p.active) return;
      p.closest.forEach((other: any) => {
        ctx?.beginPath();
        ctx?.moveTo(p.x, p.y);
        ctx?.lineTo(other.x, other.y);
        if (ctx) {
          ctx.strokeStyle = `hsl(${hue}, 100%, 60%, ${p.active})`;
          ctx.stroke();
        }
      });
    }

    function shiftPoint(p: any) {
      const duration = 1000 + 1000 * Math.random();
      const dx = p.originX - 50 + Math.random() * 100;
      const dy = p.originY - 50 + Math.random() * 100;

      const start = Date.now();
      const startX = p.x;
      const startY = p.y;

      const animate = () => {
        const now = Date.now();
        const progress = Math.min(1, (now - start) / duration);
        p.x = startX + (dx - startX) * easeInOutCirc(progress);
        p.y = startY + (dy - startY) * easeInOutCirc(progress);
        if (progress < 1) requestAnimationFrame(animate);
        else shiftPoint(p);
      };
      animate();
    }

    function easeInOutCirc(t: number) {
      return t < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
    }

    function animate() {
      hue = (hue + 0.5) % 360;

      if (animateHeader && ctx) {
        ctx.clearRect(0, 0, width, height);
        points.forEach((p) => {
          const dist = getDistance(target, p);
          p.active =
            dist < 4000 ? 0.3 : dist < 20000 ? 0.1 : dist < 40000 ? 0.02 : 0;
          p.circle.active = p.active * 2;
          drawLines(p);
          p.circle.draw(ctx);
        });
      }
      requestAnimationFrame(animate);
    }

    function mouseMove(e: MouseEvent) {
      target.x = e.clientX;
      target.y = e.clientY;
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
      if (headerRef.current) headerRef.current.style.height = `${height}px`;
    }

    function scrollCheck() {
      animateHeader = window.scrollY <= height;
    }

    initHeader();
    animate();
    points.forEach(shiftPoint);

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", scrollCheck);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", scrollCheck);
    };
  }, []);

  return (
    <div ref={headerRef} className=" w-full bg-transparent absolute">
      <canvas ref={canvasRef} className="w-full h-full opacity-50" />
    </div>
  );
}
