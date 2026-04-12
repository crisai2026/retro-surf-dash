export const CANVAS_W = 240;
export const CANVAS_H = 320;
export const SCALE = 2;
export const SURFER_W = 16;
export const SURFER_H = 16;
export const OBJ_SIZE = 14;
export const BIG_OBJ_SIZE = 21; // 1.5x
export const SPAWN_INTERVAL = 4;
export const FOLLOW_DELAY = 12;

export type ObjType = "wave" | "bigWave" | "shark" | "greatWhite" | "swimmer" | "turtle" | "local";
export type Obj = { x: number; y: number; type: ObjType; frame: number };
export type SurferSkin = "male" | "female";
export type GameState = "title" | "charSelect" | "playing" | "paused" | "gameover";

export const COLORS = {
  ocean: "#0a1e3d",
  oceanLight: "#123060",
  surfer: "#ffcc00",
  surferFemale: "#ff6699",
  surferBoard: "#e06020",
  wave: "#40c0ff",
  waveFoam: "#b0e8ff",
  bigWave: "#2090dd",
  bigWaveFoam: "#80d0ff",
  shark: "#888888",
  sharkFin: "#666666",
  sharkEye: "#ff2020",
  greatWhite: "#bbbbbb",
  greatWhiteEye: "#ff0000",
  swimmer: "#ff70b0",
  swimmerSkin: "#ffcc88",
  turtle: "#40a040",
  turtleShell: "#2d7030",
  turtleHead: "#60c060",
  local: "#cc4400",
  localBoard: "#aa3300",
  localSkin: "#ddaa66",
  hud: "#40ff40",
  hudDim: "#207020",
  gameover: "#ff4040",
  title: "#ffcc00",
  paused: "#80ffff",
};
