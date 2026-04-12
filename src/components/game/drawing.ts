import { CANVAS_W, CANVAS_H, COLORS, type SurferSkin } from "./constants";

export function drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

export function drawSurfer(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, skin: SurferSkin = "male") {
  const bodyColor = skin === "male" ? COLORS.surfer : COLORS.surferFemale;
  drawPixelRect(ctx, x + 2, y + 12, 12, 3, COLORS.surferBoard);
  drawPixelRect(ctx, x + 1, y + 13, 14, 2, COLORS.surferBoard);
  drawPixelRect(ctx, x + 6, y + 2, 4, 4, bodyColor);
  drawPixelRect(ctx, x + 5, y, 6, 4, bodyColor);
  if (skin === "female") {
    // Hair
    drawPixelRect(ctx, x + 4, y - 1, 8, 2, "#cc3388");
    drawPixelRect(ctx, x + 11, y, 2, 3, "#cc3388");
  }
  const armOff = frame % 2 === 0 ? 0 : 1;
  drawPixelRect(ctx, x + 3, y + 5 + armOff, 2, 2, bodyColor);
  drawPixelRect(ctx, x + 11, y + 5 - armOff, 2, 2, bodyColor);
  drawPixelRect(ctx, x + 5, y + 8, 2, 4, bodyColor);
  drawPixelRect(ctx, x + 9, y + 8, 2, 4, bodyColor);
  drawPixelRect(ctx, x + 6, y + 1, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 9, y + 1, 1, 1, COLORS.ocean);
}

export function drawSwimmer(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
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

export function drawFollower(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  drawPixelRect(ctx, x + 3, y + 10, 10, 3, COLORS.surferBoard);
  drawPixelRect(ctx, x + 5, y + 1, 6, 4, COLORS.swimmerSkin);
  drawPixelRect(ctx, x + 6, y + 2, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 9, y + 2, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 5, y + 5, 6, 5, COLORS.swimmer);
  const armOff = frame % 2 === 0 ? 0 : 1;
  drawPixelRect(ctx, x + 3, y + 5 + armOff, 2, 2, COLORS.swimmer);
  drawPixelRect(ctx, x + 11, y + 5 - armOff, 2, 2, COLORS.swimmer);
}

export function drawWave(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const wobble = Math.sin(frame * 0.3) * 1;
  drawPixelRect(ctx, x + 1, y + 4 + wobble, 12, 4, COLORS.wave);
  drawPixelRect(ctx, x + 3, y + 2 + wobble, 8, 3, COLORS.wave);
  drawPixelRect(ctx, x + 2, y + 3 + wobble, 2, 2, COLORS.waveFoam);
  drawPixelRect(ctx, x + 8, y + 2 + wobble, 3, 2, COLORS.waveFoam);
  drawPixelRect(ctx, x, y + 8 + wobble, 14, 3, COLORS.wave);
}

export function drawBigWave(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const wobble = Math.sin(frame * 0.25) * 2;
  drawPixelRect(ctx, x + 1, y + 6 + wobble, 18, 6, COLORS.bigWave);
  drawPixelRect(ctx, x + 4, y + 3 + wobble, 12, 4, COLORS.bigWave);
  drawPixelRect(ctx, x + 3, y + 4 + wobble, 3, 3, COLORS.bigWaveFoam);
  drawPixelRect(ctx, x + 12, y + 3 + wobble, 4, 3, COLORS.bigWaveFoam);
  drawPixelRect(ctx, x, y + 12 + wobble, 21, 4, COLORS.bigWave);
  drawPixelRect(ctx, x + 6, y + 1 + wobble, 8, 3, COLORS.waveFoam);
}

export function drawShark(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
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

export function drawGreatWhite(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  // Bigger shark (1.5x scale)
  drawPixelRect(ctx, x + 2, y + 7, 16, 7, COLORS.greatWhite);
  drawPixelRect(ctx, x + 5, y + 4, 10, 4, COLORS.greatWhite);
  drawPixelRect(ctx, x + 8, y, 5, 5, COLORS.sharkFin);
  drawPixelRect(ctx, x + 9, y - 2, 3, 3, COLORS.sharkFin);
  const tailOff = frame % 2 === 0 ? 0 : 2;
  drawPixelRect(ctx, x, y + 8 + tailOff, 4, 4, COLORS.greatWhite);
  drawPixelRect(ctx, x + 15, y + 5, 3, 3, COLORS.greatWhiteEye);
  // Teeth
  drawPixelRect(ctx, x + 16, y + 10, 4, 1, "#ffffff");
  drawPixelRect(ctx, x + 17, y + 11, 1, 1, "#ffffff");
  drawPixelRect(ctx, x + 19, y + 11, 1, 1, "#ffffff");
  // Belly
  drawPixelRect(ctx, x + 4, y + 12, 12, 2, "#dddddd");
}

export function drawTurtle(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  // Shell
  drawPixelRect(ctx, x + 3, y + 3, 8, 7, COLORS.turtleShell);
  drawPixelRect(ctx, x + 4, y + 4, 6, 5, COLORS.turtle);
  // Shell pattern
  drawPixelRect(ctx, x + 5, y + 5, 2, 2, COLORS.turtleShell);
  drawPixelRect(ctx, x + 8, y + 6, 1, 1, COLORS.turtleShell);
  // Head
  drawPixelRect(ctx, x + 6, y + 1, 3, 3, COLORS.turtleHead);
  drawPixelRect(ctx, x + 7, y + 1, 1, 1, COLORS.ocean); // eye
  // Flippers
  const flapOff = frame % 4 < 2 ? 0 : 1;
  drawPixelRect(ctx, x + 1, y + 4 + flapOff, 2, 3, COLORS.turtleHead);
  drawPixelRect(ctx, x + 11, y + 5 - flapOff, 2, 3, COLORS.turtleHead);
  // Rear flippers
  drawPixelRect(ctx, x + 3, y + 10, 2, 2, COLORS.turtleHead);
  drawPixelRect(ctx, x + 9, y + 10, 2, 2, COLORS.turtleHead);
}

export function drawLocal(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  // Angry surfer on board
  drawPixelRect(ctx, x + 2, y + 12, 12, 3, COLORS.localBoard);
  drawPixelRect(ctx, x + 1, y + 13, 14, 2, COLORS.localBoard);
  // Head
  drawPixelRect(ctx, x + 5, y, 6, 4, COLORS.localSkin);
  drawPixelRect(ctx, x + 6, y + 2, 4, 4, COLORS.localSkin);
  // Angry eyebrows
  drawPixelRect(ctx, x + 5, y, 3, 1, COLORS.local);
  drawPixelRect(ctx, x + 8, y, 3, 1, COLORS.local);
  // Eyes
  drawPixelRect(ctx, x + 6, y + 1, 1, 1, COLORS.ocean);
  drawPixelRect(ctx, x + 9, y + 1, 1, 1, COLORS.ocean);
  // Mouth (angry)
  drawPixelRect(ctx, x + 7, y + 3, 2, 1, COLORS.gameover);
  // Body
  drawPixelRect(ctx, x + 5, y + 5, 6, 4, COLORS.local);
  const armOff = frame % 2 === 0 ? 0 : 1;
  // Fists shaking
  drawPixelRect(ctx, x + 2, y + 4 + armOff, 3, 2, COLORS.localSkin);
  drawPixelRect(ctx, x + 11, y + 4 - armOff, 3, 2, COLORS.localSkin);
  // Legs
  drawPixelRect(ctx, x + 5, y + 9, 2, 3, COLORS.local);
  drawPixelRect(ctx, x + 9, y + 9, 2, 3, COLORS.local);
}

export function drawOceanBg(ctx: CanvasRenderingContext2D, scrollY: number) {
  ctx.fillStyle = COLORS.ocean;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (let i = 0; i < 20; i++) {
    const ly = ((i * 24 + scrollY * 0.5) % (CANVAS_H + 24)) - 12;
    ctx.fillStyle = COLORS.oceanLight;
    ctx.fillRect(0, Math.floor(ly), CANVAS_W, 1);
    ctx.fillRect(20 + (i % 3) * 30, Math.floor(ly) + 1, 40, 1);
  }
}
