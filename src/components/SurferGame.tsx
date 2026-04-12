import { useCallback, useEffect, useRef, useState } from "react";

const CANVAS_W = 240;
const CANVAS_H = 320;
const SCALE = 2;
const SURFER_W = 16;
const SURFER_H = 16;
const OBJ_SIZE = 14;
const SPAWN_INTERVAL = 4;
const FOLLOW_DELAY = 12;

type Obj = { x: number; y: number; type: "wave" | "shark" | "swimmer"; frame: number };

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
  swimmer: "#ff70b0",
  swimmerSkin: "#ffcc88",
  hud: "#40ff40",
  hudDim: "#207020",
  gameover: "#ff4040",
  title: "#ffcc00",
};

// --- Audio ---
function getAudioCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext {
  if (!ref.current) ref.current = new AudioContext();
  return ref.current;
}

function playNote(ctx: AudioContext, freq: number, type: OscillatorType, start: number, dur: number, vol = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

function playWaveSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  // Ascending arpeggio C5→E5→G5→C6
  [523, 659, 784, 1047].forEach((f, i) => playNote(ctx, f, "square", t + i * 0.08, 0.12, 0.12));
}

function playRescueSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  playNote(ctx, 262, "triangle", t, 0.15, 0.18);
  playNote(ctx, 330, "triangle", t + 0.12, 0.18, 0.18);
}

function playSharkSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = "sawtooth";
  osc2.type = "square";
  osc1.frequency.setValueAtTime(800, t);
  osc1.frequency.exponentialRampToValueAtTime(200, t + 0.3);
  osc2.frequency.setValueAtTime(850, t);
  osc2.frequency.exponentialRampToValueAtTime(180, t + 0.3);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc1.start(t); osc1.stop(t + 0.35);
  osc2.start(t); osc2.stop(t + 0.35);
}

function playSharkHitFollower(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(250, t + 0.15);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.2);
}

function playGameOverSound(ctx: AudioContext) {
  const t = ctx.currentTime;
  [330, 262, 220].forEach((f, i) => playNote(ctx, f, "square", t + i * 0.2, 0.25, 0.15));
}

// --- Drawing ---
function drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function drawSurfer(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  drawPixelRect(ctx, x + 2, y + 12, 12, 3, COLORS.surferBoard);
  drawPixelRect(ctx, x + 1, y + 13, 14, 2, COLORS.surferBoard);
  drawPixelRect(ctx, x + 6, y + 2, 4, 4, COLORS.surfer);
  drawPixelRect(ctx, x + 5, y, 6, 4, COLORS.surfer);
  const armOff = frame % 2 === 0 ? 0 : 1;
  drawPixelRect(ctx, x + 3, y + 5 + armOff, 2, 2, COLORS.surfer);
  drawPixelRect(ctx, x + 11, y + 5 - armOff, 2, 2, COLORS.surfer);
  drawPixelRect(ctx, x + 5, y + 8, 2, 4, COLORS.surfer);
  drawPixelRect(ctx, x + 9, y + 8, 2, 4, COLORS.surfer);
  drawPixelRect(ctx, x + 6, y + 1, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 9, y + 1, 1, 1, COLORS.ocean);
}

function drawSwimmer(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  drawPixelRect(ctx, x + 5, y, 6, 5, COLORS.swimmerSkin);
  drawPixelRect(ctx, x + 6, y + 2, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 9, y + 2, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 4, y + 5, 8, 4, COLORS.swimmer);
  const armOff = frame % 4 < 2 ? 0 : 2;
  drawPixelRect(ctx, x + 1, y + 5 + armOff, 3, 2, COLORS.swimmerSkin);
  drawPixelRect(ctx, x + 12, y + 7 - armOff, 3, 2, COLORS.swimmerSkin);
  drawPixelRect(ctx, x + 2, y + 9, 12, 3, COLORS.wave);
  drawPixelRect(ctx, x + 4, y + 10, 2, 2, COLORS.waveFoam);
}

function drawFollower(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  drawPixelRect(ctx, x + 3, y + 10, 10, 3, COLORS.surferBoard);
  drawPixelRect(ctx, x + 5, y + 1, 6, 4, COLORS.swimmerSkin);
  drawPixelRect(ctx, x + 6, y + 2, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 9, y + 2, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 5, y + 5, 6, 5, COLORS.swimmer);
  const armOff = frame % 2 === 0 ? 0 : 1;
  drawPixelRect(ctx, x + 3, y + 5 + armOff, 2, 2, COLORS.swimmer);
  drawPixelRect(ctx, x + 11, y + 5 - armOff, 2, 2, COLORS.swimmer);
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
  drawPixelRect(ctx, x + 2, y + 5, 10, 5, COLORS.shark);
  drawPixelRect(ctx, x + 4, y + 3, 6, 3, COLORS.shark);
  drawPixelRect(ctx, x + 6, y, 3, 4, COLORS.sharkFin);
  drawPixelRect(ctx, x + 7, y - 1, 2, 2, COLORS.sharkFin);
  const tailOff = frame % 2 === 0 ? 0 : 1;
  drawPixelRect(ctx, x, y + 6 + tailOff, 3, 3, COLORS.shark);
  drawPixelRect(ctx, x + 10, y + 4, 2, 2, COLORS.sharkEye);
  drawPixelRect(ctx, x + 11, y + 7, 3, 1, COLORS.shark);
  drawPixelRect(ctx, x + 12, y + 8, 1, 1, "#ffffff");
  drawPixelRect(ctx, x + 14, y + 8, 1, 1, "#ffffff");
}

function drawOceanBg(ctx: CanvasRenderingContext2D, scrollY: number) {
  ctx.fillStyle = COLORS.ocean;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (let i = 0; i < 20; i++) {
    const ly = ((i * 24 + scrollY * 0.5) % (CANVAS_H + 24)) - 12;
    ctx.fillStyle = COLORS.oceanLight;
    ctx.fillRect(0, Math.floor(ly), CANVAS_W, 1);
    ctx.fillRect(20 + (i % 3) * 30, Math.floor(ly) + 1, 40, 1);
  }
}

export default function SurferGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
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
    followers: [] as { x: number; y: number }[],
    posHistory: [] as number[],
    savedCount: 0,
    bestSaved: 0,
    level: 0,
    levelUpTimer: 0,
  });

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.surferX = CANVAS_W / 2 - SURFER_W / 2;
    s.objects = [];
    s.score = 0;
    s.lives = 3;
    s.frame = 0;
    s.gameState = "playing";
    s.followers = [];
    s.posHistory = [];
    s.savedCount = 0;
    s.level = 0;
    s.levelUpTimer = 0;
    setGameState("playing");
    // Ensure audio context is ready
    getAudioCtx(audioRef);
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

  const touchRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.gameState !== "playing") { startGame(); return; }
      const rect = canvas.getBoundingClientRect();
      touchRef.current = (e.touches[0].clientX - rect.left) / (rect.width / CANVAS_W);
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
      if (s.levelUpTimer > 0) s.levelUpTimer--;

      if (s.gameState === "playing") {
        const speed = 3;
        if (s.keys.left) s.surferX -= speed;
        if (s.keys.right) s.surferX += speed;
        if (touchRef.current !== null) {
          const target = touchRef.current - SURFER_W / 2;
          s.surferX += (target - s.surferX) * 0.15;
        }
        s.surferX = Math.max(0, Math.min(CANVAS_W - SURFER_W, s.surferX));

        s.posHistory.push(s.surferX);
        const maxHistory = (s.followers.length + 2) * FOLLOW_DELAY + 10;
        if (s.posHistory.length > maxHistory) {
          s.posHistory = s.posHistory.slice(s.posHistory.length - maxHistory);
        }

        for (let i = 0; i < s.followers.length; i++) {
          const histIdx = s.posHistory.length - 1 - (i + 1) * FOLLOW_DELAY;
          if (histIdx >= 0) {
            s.followers[i].x = s.posHistory[histIdx];
          }
          s.followers[i].y = CANVAS_H - 40 + (i + 1) * 18;
        }

        if (s.frame % SPAWN_INTERVAL === 0) {
          const r = Math.random();
          const sharkThresh = Math.min(0.35 + 0.02 * s.level, 0.60);
          const waveThresh = sharkThresh + 0.50;
          const type: Obj["type"] = r < sharkThresh ? "shark" : r < waveThresh ? "wave" : "swimmer";
          s.objects.push({ x: Math.random() * (CANVAS_W - OBJ_SIZE), y: -OBJ_SIZE, type, frame: 0 });
        }

        const surferBox = { x: s.surferX + 2, y: CANVAS_H - 40, w: SURFER_W - 4, h: SURFER_H - 2 };
        s.objects = s.objects.filter((o) => {
          const speedMult = 1 + s.level * 0.1;
          o.y += (o.type === "shark" ? 2.2 : o.type === "swimmer" ? 1.5 : 1.8) * speedMult;
          o.frame++;
          const oBox = { x: o.x + 1, y: o.y + 1, w: OBJ_SIZE - 2, h: OBJ_SIZE - 2 };

          if (
            surferBox.x < oBox.x + oBox.w &&
            surferBox.x + surferBox.w > oBox.x &&
            surferBox.y < oBox.y + oBox.h &&
            surferBox.y + surferBox.h > oBox.y
          ) {
            if (o.type === "wave") {
              const wavePoints = 1 + Math.floor(s.followers.length / 2);
              s.score += wavePoints;
              if (audioRef.current) playWaveSound(audioRef.current);
            } else if (o.type === "swimmer") {
              s.savedCount++;
              if (s.lives < 5) {
                s.lives++;
              } else {
                s.score += 5;
              }
              s.followers.push({ x: s.surferX, y: CANVAS_H - 40 + s.followers.length * 18 });
              if (audioRef.current) playRescueSound(audioRef.current);
            } else {
              s.lives--;
              s.flashTimer = 15;
              if (audioRef.current) playSharkSound(audioRef.current);
              if (s.lives <= 0) {
                s.highScore = Math.max(s.highScore, s.score);
                s.bestSaved = Math.max(s.bestSaved, s.savedCount);
                s.gameState = "gameover";
                setGameState("gameover");
                if (audioRef.current) playGameOverSound(audioRef.current);
              }
            }
            return false;
          }

          // Level-up check
          const newLevel = Math.floor(s.score / 25);
          if (newLevel > s.level) {
            s.level = newLevel;
            s.levelUpTimer = 90;
          }
          }

          if (o.type === "shark") {
            for (let fi = 0; fi < s.followers.length; fi++) {
              const f = s.followers[fi];
              const fBox = { x: f.x + 2, y: f.y, w: SURFER_W - 4, h: SURFER_H - 2 };
              if (
                fBox.x < oBox.x + oBox.w &&
                fBox.x + fBox.w > oBox.x &&
                fBox.y < oBox.y + oBox.h &&
                fBox.y + fBox.h > oBox.y
              ) {
                s.followers = s.followers.slice(0, fi);
                s.flashTimer = 10;
                if (audioRef.current) playSharkHitFollower(audioRef.current);
                return false;
              }
            }
          }

          return o.y < CANVAS_H + 20;
        });
      }

      // Draw
      drawOceanBg(ctx, s.scrollY);

      if (s.gameState === "playing" || s.gameState === "gameover") {
        s.objects.forEach((o) => {
          if (o.type === "wave") drawWave(ctx, o.x, o.y, o.frame);
          else if (o.type === "swimmer") drawSwimmer(ctx, o.x, o.y, o.frame);
          else drawShark(ctx, o.x, o.y, o.frame);
        });

        for (let i = s.followers.length - 1; i >= 0; i--) {
          const f = s.followers[i];
          if (f.y < CANVAS_H) drawFollower(ctx, f.x, f.y, s.frame + i * 3);
        }

        if (s.flashTimer === 0 || s.frame % 4 < 2) {
          drawSurfer(ctx, s.surferX, CANVAS_H - 40, s.frame);
        }

        ctx.font = "8px 'Press Start 2P'";
        ctx.fillStyle = COLORS.hud;
        ctx.fillText(`SCORE:${s.score}`, 4, 12);
        const nextMilestone = (Math.floor(s.score / 25) + 1) * 25;
        ctx.fillStyle = COLORS.hudDim;
        ctx.fillText(`NEXT:${nextMilestone}`, 4, 24);
        ctx.fillStyle = COLORS.hud;
        ctx.fillText(`SAVED:${s.savedCount}`, 4, 36);
        if (s.followers.length > 0) {
          ctx.fillStyle = COLORS.swimmer;
          ctx.fillText(`CHAIN:${s.followers.length}`, 4, 48);
        }
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
        drawSurfer(ctx, CANVAS_W / 2 - 8, 130, s.frame);
        drawWave(ctx, CANVAS_W / 2 - 40, 220, s.frame);
        drawShark(ctx, CANVAS_W / 2 + 20, 240, s.frame);
      }

      if (s.gameState === "gameover") {
        ctx.font = "12px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.gameover;
        ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 30);
        ctx.font = "8px 'Press Start 2P'";
        ctx.fillStyle = COLORS.title;
        ctx.fillText(`SCORE: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2);
        ctx.fillText(`SAVED: ${s.savedCount}`, CANVAS_W / 2, CANVAS_H / 2 + 16);
        ctx.fillText(`BEST: ${s.highScore}`, CANVAS_W / 2, CANVAS_H / 2 + 36);
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
