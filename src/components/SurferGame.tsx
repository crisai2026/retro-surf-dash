import { useCallback, useEffect, useRef, useState } from "react";

const CANVAS_W = 240;
const CANVAS_H = 320;
const SCALE = 2;
const SURFER_W = 16;
const SURFER_H = 16;
const OBJ_SIZE = 14;
const SPAWN_INTERVAL = 40; // frames

type Obj = { x: number; y: number; type: "wave" | "shark"; frame: number };

const COLORS = {
  ocean: "#0a1e3d",
  oceanLight: "#123060",
  surfer: "#ffcc00",
  surferBoard: "#e06020",
  wave: "#40c0ff",
  waveFoam: "#b0e8ff",
  shark: "#888888",
  sharkFin: "#666666",
  sharkEye: "#ff2020",
  hud: "#40ff40",
  hudDim: "#207020",
  gameover: "#ff4040",
  title: "#ffcc00",
};

function drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function drawSurfer(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  // Board
  drawPixelRect(ctx, x + 2, y + 12, 12, 3, COLORS.surferBoard);
  drawPixelRect(ctx, x + 1, y + 13, 14, 2, COLORS.surferBoard);
  // Body
  drawPixelRect(ctx, x + 6, y + 2, 4, 4, COLORS.surfer);
  // Head
  drawPixelRect(ctx, x + 5, y, 6, 4, COLORS.surfer);
  // Arms (animated)
  const armOff = frame % 2 === 0 ? 0 : 1;
  drawPixelRect(ctx, x + 3, y + 5 + armOff, 2, 2, COLORS.surfer);
  drawPixelRect(ctx, x + 11, y + 5 - armOff, 2, 2, COLORS.surfer);
  // Legs
  drawPixelRect(ctx, x + 5, y + 8, 2, 4, COLORS.surfer);
  drawPixelRect(ctx, x + 9, y + 8, 2, 4, COLORS.surfer);
  // Eyes
  drawPixelRect(ctx, x + 6, y + 1, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 9, y + 1, 1, 1, COLORS.ocean);
}

function drawWave(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const wobble = Math.sin(frame * 0.3) * 1;
  drawPixelRect(ctx, x + 1, y + 4 + wobble, 12, 4, COLORS.wave);
  drawPixelRect(ctx, x + 3, y + 2 + wobble, 8, 3, COLORS.wave);
  drawPixelRect(ctx, x + 2, y + 3 + wobble, 2, 2, COLORS.waveFoam);
  drawPixelRect(ctx, x + 8, y + 2 + wobble, 3, 2, COLORS.waveFoam);
  drawPixelRect(ctx, x, y + 8 + wobble, 14, 3, COLORS.wave);
}

function drawShark(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  // Body
  drawPixelRect(ctx, x + 2, y + 5, 10, 5, COLORS.shark);
  drawPixelRect(ctx, x + 4, y + 3, 6, 3, COLORS.shark);
  // Fin
  drawPixelRect(ctx, x + 6, y, 3, 4, COLORS.sharkFin);
  drawPixelRect(ctx, x + 7, y - 1, 2, 2, COLORS.sharkFin);
  // Tail
  const tailOff = frame % 2 === 0 ? 0 : 1;
  drawPixelRect(ctx, x, y + 6 + tailOff, 3, 3, COLORS.shark);
  // Eye
  drawPixelRect(ctx, x + 10, y + 4, 2, 2, COLORS.sharkEye);
  // Mouth
  drawPixelRect(ctx, x + 11, y + 7, 3, 1, COLORS.shark);
  // Teeth
  drawPixelRect(ctx, x + 12, y + 8, 1, 1, "#ffffff");
  drawPixelRect(ctx, x + 14, y + 8, 1, 1, "#ffffff");
}

function drawOceanBg(ctx: CanvasRenderingContext2D, scrollY: number) {
  ctx.fillStyle = COLORS.ocean;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Scrolling wave lines
  for (let i = 0; i < 20; i++) {
    const ly = ((i * 24 + scrollY * 0.5) % (CANVAS_H + 24)) - 12;
    ctx.fillStyle = COLORS.oceanLight;
    ctx.fillRect(0, Math.floor(ly), CANVAS_W, 1);
    ctx.fillRect(20 + (i % 3) * 30, Math.floor(ly) + 1, 40, 1);
  }
}

export default function SurferGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"title" | "playing" | "gameover">("title");
  const stateRef = useRef({
    surferX: CANVAS_W / 2 - SURFER_W / 2,
    objects: [] as Obj[],
    score: 0,
    lives: 3,
    frame: 0,
    scrollY: 0,
    keys: { left: false, right: false },
    gameState: "title" as "title" | "playing" | "gameover",
    highScore: 0,
    flashTimer: 0,
  });

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.surferX = CANVAS_W / 2 - SURFER_W / 2;
    s.objects = [];
    s.score = 0;
    s.lives = 3;
    s.frame = 0;
    s.gameState = "playing";
    setGameState("playing");
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const pressed = e.type === "keydown";
      if (e.key === "ArrowLeft" || e.key === "a") s.keys.left = pressed;
      if (e.key === "ArrowRight" || e.key === "d") s.keys.right = pressed;
      if (pressed && (e.key === " " || e.key === "Enter")) {
        if (s.gameState !== "playing") startGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, [startGame]);

  // Touch controls
  const touchRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.gameState !== "playing") { startGame(); return; }
      const rect = canvas.getBoundingClientRect();
      const tx = (e.touches[0].clientX - rect.left) / (rect.width / CANVAS_W);
      touchRef.current = tx;
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      touchRef.current = (e.touches[0].clientX - rect.left) / (rect.width / CANVAS_W);
    };
    const handleTouchEnd = (e: TouchEvent) => { e.preventDefault(); touchRef.current = null; };
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const loop = () => {
      const s = stateRef.current;
      s.frame++;
      s.scrollY += 2;
      if (s.flashTimer > 0) s.flashTimer--;

      if (s.gameState === "playing") {
        // Move surfer
        const speed = 3;
        if (s.keys.left) s.surferX -= speed;
        if (s.keys.right) s.surferX += speed;
        if (touchRef.current !== null) {
          const target = touchRef.current - SURFER_W / 2;
          s.surferX += (target - s.surferX) * 0.15;
        }
        s.surferX = Math.max(0, Math.min(CANVAS_W - SURFER_W, s.surferX));

        // Spawn
        if (s.frame % SPAWN_INTERVAL === 0) {
          const type = Math.random() < 0.4 ? "shark" : "wave";
          s.objects.push({
            x: Math.random() * (CANVAS_W - OBJ_SIZE),
            y: -OBJ_SIZE,
            type,
            frame: 0,
          });
        }

        // Update objects
        const surferBox = { x: s.surferX + 2, y: CANVAS_H - 40, w: SURFER_W - 4, h: SURFER_H - 2 };
        s.objects = s.objects.filter((o) => {
          o.y += type === "shark" ? 2.2 : 1.8;
          o.y += o.type === "shark" ? 2.2 : 1.8;
          o.frame++;
          // Collision
          const oBox = { x: o.x + 1, y: o.y + 1, w: OBJ_SIZE - 2, h: OBJ_SIZE - 2 };
          if (
            surferBox.x < oBox.x + oBox.w &&
            surferBox.x + surferBox.w > oBox.x &&
            surferBox.y < oBox.y + oBox.h &&
            surferBox.y + surferBox.h > oBox.y
          ) {
            if (o.type === "wave") {
              s.score++;
            } else {
              s.lives--;
              s.flashTimer = 15;
              if (s.lives <= 0) {
                s.highScore = Math.max(s.highScore, s.score);
                s.gameState = "gameover";
                setGameState("gameover");
              }
            }
            return false;
          }
          return o.y < CANVAS_H + 20;
        });
      }

      // Draw
      drawOceanBg(ctx, s.scrollY);

      if (s.gameState === "playing" || s.gameState === "gameover") {
        // Draw objects
        s.objects.forEach((o) => {
          if (o.type === "wave") drawWave(ctx, o.x, o.y, o.frame);
          else drawShark(ctx, o.x, o.y, o.frame);
        });

        // Draw surfer
        if (s.flashTimer === 0 || s.frame % 4 < 2) {
          drawSurfer(ctx, s.surferX, CANVAS_H - 40, s.frame);
        }

        // HUD
        ctx.font = "8px 'Press Start 2P'";
        ctx.fillStyle = COLORS.hud;
        ctx.fillText(`SCORE:${s.score}`, 4, 12);
        // Lives as hearts
        for (let i = 0; i < s.lives; i++) {
          drawPixelRect(ctx, CANVAS_W - 14 - i * 14, 4, 4, 4, COLORS.gameover);
          drawPixelRect(ctx, CANVAS_W - 18 - i * 14, 4, 4, 4, COLORS.gameover);
          drawPixelRect(ctx, CANVAS_W - 18 - i * 14, 6, 8, 4, COLORS.gameover);
          drawPixelRect(ctx, CANVAS_W - 16 - i * 14, 10, 4, 2, COLORS.gameover);
        }
      }

      if (s.gameState === "title") {
        ctx.font = "16px 'Press Start 2P'";
        ctx.fillStyle = COLORS.title;
        ctx.textAlign = "center";
        ctx.fillText("SURF", CANVAS_W / 2, 80);
        ctx.fillText("RIDER", CANVAS_W / 2, 104);
        ctx.font = "6px 'Press Start 2P'";
        ctx.fillStyle = s.frame % 60 < 40 ? COLORS.hud : COLORS.ocean;
        ctx.fillText("PRESS ENTER", CANVAS_W / 2, 180);
        ctx.fillText("OR TAP TO START", CANVAS_W / 2, 195);
        ctx.textAlign = "left";
        // Draw a static surfer on title
        drawSurfer(ctx, CANVAS_W / 2 - 8, 130, s.frame);
        drawWave(ctx, CANVAS_W / 2 - 40, 220, s.frame);
        drawShark(ctx, CANVAS_W / 2 + 20, 240, s.frame);
      }

      if (s.gameState === "gameover") {
        ctx.font = "12px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.gameover;
        ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.font = "8px 'Press Start 2P'";
        ctx.fillStyle = COLORS.title;
        ctx.fillText(`SCORE: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 10);
        ctx.fillText(`BEST: ${s.highScore}`, CANVAS_W / 2, CANVAS_H / 2 + 30);
        ctx.font = "6px 'Press Start 2P'";
        ctx.fillStyle = s.frame % 60 < 40 ? COLORS.hud : COLORS.ocean;
        ctx.fillText("PRESS ENTER", CANVAS_W / 2, CANVAS_H / 2 + 60);
        ctx.textAlign = "left";
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 select-none">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          width: CANVAS_W * SCALE,
          height: CANVAS_H * SCALE,
          imageRendering: "pixelated",
          border: "3px solid hsl(120, 100%, 70%)",
          borderRadius: 0,
        }}
      />
      <p className="text-[8px] text-muted-foreground tracking-widest uppercase">
        ← → or A D to move • Enter to start
      </p>
    </div>
  );
}
