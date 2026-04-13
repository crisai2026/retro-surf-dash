import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_W, CANVAS_H, SCALE, SURFER_W, SURFER_H, OBJ_SIZE, BIG_OBJ_SIZE,
  SPAWN_INTERVAL, FOLLOW_DELAY, COLORS,
  type Obj, type ObjType, type SurferSkin, type GameState,
} from "./game/constants";
import {
  getAudioCtx, playWaveSound, playBigWaveSound, playRescueSound, playTurtleSound,
  playLocalSound, playSharkSound, playGreatWhiteSound, playSharkHitFollower, playGameOverSound,
} from "./game/audio";
import {
  drawPixelRect, drawSurfer, drawSwimmer, drawFollower, drawWave, drawBigWave,
  drawShark, drawGreatWhite, drawTurtle, drawLocal, drawOceanBg,
} from "./game/drawing";

export default function SurferGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const [gameState, setGameState] = useState<GameState>("title");
  const stateRef = useRef({
    surferX: CANVAS_W / 2 - SURFER_W / 2,
    objects: [] as Obj[],
    score: 0,
    lives: 3,
    frame: 0,
    scrollY: 0,
    keys: { left: false, right: false, pause: false },
    gameState: "title" as GameState,
    highScore: 0,
    flashTimer: 0,
    followers: [] as { x: number; y: number }[],
    posHistory: [] as number[],
    savedCount: 0,
    bestSaved: 0,
    level: 0,
    levelUpTimer: 0,
    skin: "male" as SurferSkin,
    pushTimer: 0,
    pushDir: 0,
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
    s.pushTimer = 0;
    s.pushDir = 0;
    setGameState("playing");
    getAudioCtx(audioRef);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const pressed = e.type === "keydown";
      if (e.key === "ArrowLeft" || e.key === "a") s.keys.left = pressed;
      if (e.key === "ArrowRight" || e.key === "d") s.keys.right = pressed;

      if (!pressed) return;

      // Pause toggle
      if ((e.key === "p" || e.key === "P" || e.key === "Escape") && (s.gameState === "playing" || s.gameState === "paused")) {
        if (s.gameState === "playing") {
          s.gameState = "paused";
          setGameState("paused");
        } else {
          s.gameState = "playing";
          setGameState("playing");
        }
        return;
      }

      // Character select
      if (s.gameState === "charSelect") {
        if (e.key === "ArrowLeft" || e.key === "a") s.skin = "male";
        if (e.key === "ArrowRight" || e.key === "d") s.skin = "female";
        if (e.key === "Enter" || e.key === " ") startGame();
        return;
      }

      if (pressed && (e.key === " " || e.key === "Enter")) {
        if (s.gameState === "title") {
          s.gameState = "charSelect";
          setGameState("charSelect");
        } else if (s.gameState === "gameover") {
          s.gameState = "charSelect";
          setGameState("charSelect");
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, [startGame]);

  const touchRef = useRef<{ startTouchX: number; startSurferX: number; currentTouchX: number } | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const getTouchX = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      return (e.touches[0].clientX - rect.left) / (rect.width / CANVAS_W);
    };
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.gameState === "title") {
        s.gameState = "charSelect";
        setGameState("charSelect");
        return;
      }
      if (s.gameState === "charSelect") {
        const tx = getTouchX(e);
        if (tx < CANVAS_W / 2) s.skin = "male";
        else s.skin = "female";
        startGame();
        return;
      }
      if (s.gameState === "gameover") {
        s.gameState = "charSelect";
        setGameState("charSelect");
        return;
      }
      if (s.gameState === "playing") {
        // Check pause button tap (top-right 24x24 region)
        const rect = canvas.getBoundingClientRect();
        const tx = (e.touches[0].clientX - rect.left) / (rect.width / CANVAS_W);
        const ty = (e.touches[0].clientY - rect.top) / (rect.height / CANVAS_H);
        if (tx > CANVAS_W - 28 && ty < 28) {
          s.gameState = "paused";
          setGameState("paused");
          return;
        }
        const touchX = getTouchX(e);
        touchRef.current = { startTouchX: touchX, startSurferX: s.surferX, currentTouchX: touchX };
        return;
      }
      if (s.gameState === "paused") {
        s.gameState = "playing";
        setGameState("playing");
        return;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchRef.current) {
        touchRef.current.currentTouchX = getTouchX(e);
      }
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
      if (s.gameState !== "paused") {
        s.scrollY += 2;
      }
      if (s.flashTimer > 0) s.flashTimer--;
      if (s.levelUpTimer > 0) s.levelUpTimer--;
      if (s.pushTimer > 0) s.pushTimer--;

      if (s.gameState === "playing") {
        let speed = 3;
        if (s.pushTimer > 0) {
          s.surferX += s.pushDir * 5;
        }
        if (s.keys.left) s.surferX -= speed;
        if (s.keys.right) s.surferX += speed;
        if (touchRef.current !== null) {
          const targetX = touchRef.current.startSurferX + (touchRef.current.currentTouchX - touchRef.current.startTouchX);
          s.surferX += (targetX - s.surferX) * 0.35;
        }
        s.surferX = Math.max(0, Math.min(CANVAS_W - SURFER_W, s.surferX));

        s.posHistory.push(s.surferX);
        const maxHistory = (s.followers.length + 2) * FOLLOW_DELAY + 10;
        if (s.posHistory.length > maxHistory) {
          s.posHistory = s.posHistory.slice(s.posHistory.length - maxHistory);
        }

        for (let i = 0; i < s.followers.length; i++) {
          const histIdx = s.posHistory.length - 1 - (i + 1) * FOLLOW_DELAY;
          if (histIdx >= 0) s.followers[i].x = s.posHistory[histIdx];
          s.followers[i].y = CANVAS_H - 40 + (i + 1) * 18;
        }

        // Spawn
        if (s.frame % SPAWN_INTERVAL === 0) {
          const r = Math.random();
          const sharkThresh = Math.min(0.27 + 0.02 * s.level, 0.50);
          const gwThresh = sharkThresh + 0.01; // 1% great white
          const localThresh = gwThresh + 0.05; // 5% local
          const turtleThresh = localThresh + 0.02; // 2% turtle
          const waveThresh = turtleThresh + 0.50; // 50% waves
          // rest = swimmer ~15%

          let type: ObjType;
          if (r < sharkThresh) type = "shark";
          else if (r < gwThresh) type = "greatWhite";
          else if (r < localThresh) type = "local";
          else if (r < turtleThresh) type = "turtle";
          else if (r < waveThresh) {
            type = Math.random() < 0.1 ? "bigWave" : "wave"; // 10% big waves
          } else {
            type = "swimmer";
          }

          const size = (type === "bigWave" || type === "greatWhite") ? BIG_OBJ_SIZE : OBJ_SIZE;
          s.objects.push({ x: Math.random() * (CANVAS_W - size), y: -size, type, frame: 0 });
        }

        // Collision
        const surferBox = { x: s.surferX + 2, y: CANVAS_H - 40, w: SURFER_W - 4, h: SURFER_H - 2 };
        s.objects = s.objects.filter((o) => {
          const speedMult = 1 + s.level * 0.1;
          const baseSpeed = ({ wave: 1.8, bigWave: 2.4, shark: 2.2, greatWhite: 3.0, swimmer: 1.5, turtle: 1.2, local: 2.0 } as Record<ObjType, number>)[o.type];
          o.y += baseSpeed * speedMult;
          o.frame++;
          const size = (o.type === "bigWave" || o.type === "greatWhite") ? BIG_OBJ_SIZE : OBJ_SIZE;
          const oBox = { x: o.x + 1, y: o.y + 1, w: size - 2, h: size - 2 };

          if (
            surferBox.x < oBox.x + oBox.w &&
            surferBox.x + surferBox.w > oBox.x &&
            surferBox.y < oBox.y + oBox.h &&
            surferBox.y + surferBox.h > oBox.y
          ) {
            if (o.type === "wave") {
              s.score += 1 + Math.floor(s.followers.length / 2);
              if (audioRef.current) playWaveSound(audioRef.current);
            } else if (o.type === "bigWave") {
              s.score += 3 + Math.floor(s.followers.length / 2);
              if (audioRef.current) playBigWaveSound(audioRef.current);
            } else if (o.type === "swimmer") {
              s.savedCount++;
              if (s.lives < 5) s.lives++;
              else s.score += 5;
              s.followers.push({ x: s.surferX, y: CANVAS_H - 40 + s.followers.length * 18 });
              if (audioRef.current) playRescueSound(audioRef.current);
            } else if (o.type === "turtle") {
              s.lives = Math.min(5, s.lives + 2);
              if (audioRef.current) playTurtleSound(audioRef.current);
            } else if (o.type === "local") {
              s.score = Math.max(0, s.score - 1);
              s.pushTimer = 10;
              s.pushDir = s.surferX < CANVAS_W / 2 ? -1 : 1;
              s.flashTimer = 8;
              if (audioRef.current) playLocalSound(audioRef.current);
            } else if (o.type === "shark") {
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
            } else if (o.type === "greatWhite") {
              s.lives -= 2;
              s.flashTimer = 20;
              if (audioRef.current) playGreatWhiteSound(audioRef.current);
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

          // Sharks/greatWhite hit followers
          if (o.type === "shark" || o.type === "greatWhite") {
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

        // Level-up
        const newLevel = Math.floor(s.score / 25);
        if (newLevel > s.level) {
          s.level = newLevel;
          s.levelUpTimer = 90;
        }
      }

      // === DRAW ===
      drawOceanBg(ctx, s.scrollY);

      if (s.gameState === "playing" || s.gameState === "paused" || s.gameState === "gameover") {
        s.objects.forEach((o) => {
          switch (o.type) {
            case "wave": drawWave(ctx, o.x, o.y, o.frame); break;
            case "bigWave": drawBigWave(ctx, o.x, o.y, o.frame); break;
            case "swimmer": drawSwimmer(ctx, o.x, o.y, o.frame); break;
            case "shark": drawShark(ctx, o.x, o.y, o.frame); break;
            case "greatWhite": drawGreatWhite(ctx, o.x, o.y, o.frame); break;
            case "turtle": drawTurtle(ctx, o.x, o.y, o.frame); break;
            case "local": drawLocal(ctx, o.x, o.y, o.frame); break;
          }
        });

        for (let i = s.followers.length - 1; i >= 0; i--) {
          const f = s.followers[i];
          if (f.y < CANVAS_H) drawFollower(ctx, f.x, f.y, s.frame + i * 3);
        }

        if (s.flashTimer === 0 || s.frame % 4 < 2) {
          drawSurfer(ctx, s.surferX, CANVAS_H - 40, s.frame, s.skin);
        }

        // HUD
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
        ctx.fillStyle = COLORS.hudDim;
        ctx.fillText(`LV:${s.level}`, 4, s.followers.length > 0 ? 60 : 48);
        for (let i = 0; i < s.lives; i++) {
          drawPixelRect(ctx, CANVAS_W - 14 - i * 14, 4, 4, 4, COLORS.gameover);
          drawPixelRect(ctx, CANVAS_W - 18 - i * 14, 4, 4, 4, COLORS.gameover);
          drawPixelRect(ctx, CANVAS_W - 18 - i * 14, 6, 8, 4, COLORS.gameover);
          drawPixelRect(ctx, CANVAS_W - 16 - i * 14, 10, 4, 2, COLORS.gameover);
        }

        if (s.levelUpTimer > 0) {
          ctx.font = "12px 'Press Start 2P'";
          ctx.textAlign = "center";
          ctx.fillStyle = COLORS.title;
          ctx.fillText("LEVEL UP!", CANVAS_W / 2, CANVAS_H / 2 - 10);
          ctx.textAlign = "left";
        }
      }

      // Pause overlay
      if (s.gameState === "paused") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.font = "10px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.paused;
        ctx.fillText("PAUSED", CANVAS_W / 2, CANVAS_H / 2 - 10);
        ctx.font = "6px 'Press Start 2P'";
        ctx.fillText("PRESS P TO", CANVAS_W / 2, CANVAS_H / 2 + 10);
        ctx.fillText("CONTINUE", CANVAS_W / 2, CANVAS_H / 2 + 22);
        ctx.textAlign = "left";
      }

      // Title screen
      if (s.gameState === "title") {
        ctx.font = "16px 'Press Start 2P'";
        ctx.fillStyle = COLORS.title;
        ctx.textAlign = "center";
        ctx.fillText("SURF", CANVAS_W / 2, 60);
        ctx.fillText("RIDER", CANVAS_W / 2, 84);
        ctx.textAlign = "center";
        drawSurfer(ctx, CANVAS_W / 2 - 8, 100, s.frame);

        ctx.font = "6px 'Press Start 2P'";
        ctx.fillStyle = s.frame % 60 < 40 ? COLORS.hud : COLORS.ocean;
        ctx.fillText("PRESS ENTER", CANVAS_W / 2, 145);
        ctx.fillText("OR TAP TO START", CANVAS_W / 2, 157);

        // Instructions
        ctx.fillStyle = COLORS.waveFoam;
        ctx.fillText("<- -> MOVE", CANVAS_W / 2, 180);

        ctx.fillStyle = COLORS.wave;
        ctx.fillText("WAVE = POINTS", CANVAS_W / 2, 200);
        ctx.fillStyle = COLORS.swimmer;
        ctx.fillText("SWIMMER = LIVES", CANVAS_W / 2, 212);
        ctx.fillStyle = COLORS.gameover;
        ctx.fillText("SHARK = DANGER", CANVAS_W / 2, 224);
        ctx.fillStyle = COLORS.turtle;
        ctx.fillText("TURTLE = +2 LIVES", CANVAS_W / 2, 236);
        ctx.fillStyle = COLORS.local;
        ctx.fillText("LOCAL = PUSH!", CANVAS_W / 2, 248);

        // Demo sprites
        drawWave(ctx, 20, 270, s.frame);
        drawSwimmer(ctx, 60, 268, s.frame);
        drawShark(ctx, 110, 270, s.frame);
        drawTurtle(ctx, 155, 270, s.frame);
        drawLocal(ctx, 195, 268, s.frame);

        ctx.textAlign = "left";
      }

      // Character select
      if (s.gameState === "charSelect") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.font = "10px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.title;
        ctx.fillText("CHOOSE", CANVAS_W / 2, 80);
        ctx.fillText("SURFER", CANVAS_W / 2, 96);

        // Male
        const maleX = CANVAS_W / 2 - 50;
        const femaleX = CANVAS_W / 2 + 34;
        drawSurfer(ctx, maleX, 130, s.frame, "male");
        drawSurfer(ctx, femaleX, 130, s.frame, "female");

        ctx.font = "6px 'Press Start 2P'";
        ctx.fillStyle = COLORS.hud;
        ctx.fillText("DUDE", maleX + 8, 160);
        ctx.fillText("GIRL", femaleX + 8, 160);

        // Selection indicator
        const selX = s.skin === "male" ? maleX - 4 : femaleX - 4;
        ctx.strokeStyle = COLORS.title;
        ctx.lineWidth = 2;
        ctx.strokeRect(selX, 124, 24, 42);

        ctx.font = "6px 'Press Start 2P'";
        ctx.fillStyle = s.frame % 60 < 40 ? COLORS.hud : COLORS.ocean;
        ctx.fillText("<- -> SELECT", CANVAS_W / 2, 200);
        ctx.fillText("ENTER TO START", CANVAS_W / 2, 215);
        ctx.textAlign = "left";
      }

      // Game over
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
        ← → to move • P to pause • Enter to start
      </p>
    </div>
  );
}
