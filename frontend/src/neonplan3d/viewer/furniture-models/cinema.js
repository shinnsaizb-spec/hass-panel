/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/viewer/furniture-models/cinema.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { C, EDGE_FAINT, EDGE_FURN, EDGE_GLOW } from "../furniture-builder.js";
function screen(b, w, d, h, kind) {
  if (kind === "wall") {
    b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.dark, EDGE_FURN);
    b.box(-w * 0.47, w * 0.47, h * 0.05, h * 0.95, d * 0.35, d * 0.56, C.glass, C.glass, EDGE_GLOW);
    return;
  }
  const caseY0 = kind === "floor" ? 0 : h * 0.92;
  const caseY1 = kind === "floor" ? h * 0.1 : h;
  b.box(-w / 2, w / 2, caseY0, caseY1, -d / 2, d / 2, C.body, C.bodyTop, EDGE_FURN);
  const y0 = kind === "floor" ? h * 0.1 : 0;
  const y1 = kind === "floor" ? h * 0.94 : h * 0.92;
  b.box(-w * 0.47, w * 0.47, y0, y1, -d * 0.08, d * 0.08, C.glass, C.glass, EDGE_GLOW);
  b.box(-w * 0.49, w * 0.49, y0, y0 + h * 0.025, -d * 0.14, d * 0.14, C.metal, C.metal, EDGE_FAINT);
}
function projector(b, w, d, h, ceiling, ust) {
  if (ceiling) {
    b.box(-w * 0.06, w * 0.06, h * 0.5, h, -d * 0.06, d * 0.06, C.metal, C.metal, EDGE_FAINT);
    b.box(-w * 0.32, w * 0.32, h * 0.42, h * 0.55, -d * 0.3, d * 0.3, C.metal, C.metal, EDGE_FURN);
  }
  const y0 = 0;
  const y1 = ceiling ? h * 0.43 : h;
  b.pad(-w / 2, w / 2, y0, y1, -d / 2, d / 2, C.body, C.bodyTop, 0.025, EDGE_FURN);
  if (ust) {
    b.box(-w * 0.34, w * 0.34, y1 * 0.78, y1, -d * 0.18, d * 0.18, C.glass, C.dark, EDGE_GLOW);
    b.box(-w * 0.42, w * 0.42, y1 * 0.14, y1 * 0.24, d * 0.45, d * 0.52, C.accent, C.accent, EDGE_GLOW);
  } else {
    const lens = Math.min(w, h) * 0.24;
    b.lyingCyl("z", -w * 0.2, d * 0.5, y1 * 0.5 - lens / 2, y1 * 0.5 + lens / 2, d * 0.05, lens, C.dark, C.glass, 14, EDGE_GLOW);
    b.box(w * 0.24, w * 0.38, y1 * 0.48, y1 * 0.62, d * 0.49, d * 0.54, C.accent, C.accent, EDGE_GLOW);
  }
}
function speaker(b, w, d, h, kind) {
  if (kind === "ceiling") {
    b.cyl(0, 0, Math.min(w, d) * 0.49, 0, h, C.white, C.glass, 18, EDGE_FURN);
    b.cyl(0, 0, Math.min(w, d) * 0.32, h * 0.65, h, C.dark, C.dark, 18, EDGE_GLOW);
    return;
  }
  b.pad(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.body, 0.018, EDGE_FURN);
  const front = d / 2 + 0.006;
  const driver = (x, y, dia) => b.lyingCyl("z", x, front, y - dia / 2, y + dia / 2, d * 0.035, dia, C.dark, C.glass, 14, EDGE_GLOW);
  if (kind === "soundbar") {
    for (const x of [-w * 0.32, 0, w * 0.32]) driver(x, h * 0.5, h * 0.56);
    return;
  }
  const drivers = kind === "tower" ? [0.18, 0.47, 0.75] : kind === "center" ? [0.25, 0.5, 0.75] : kind === "sub" ? [0.5] : [0.32, 0.7];
  if (kind === "center") for (const x of drivers) driver(-w / 2 + w * x, h * 0.5, h * 0.5);else for (const y of drivers) driver(0, h * y, w * (kind === "sub" ? 0.68 : 0.56));
  if (kind === "wall") b.box(w * 0.3, w * 0.4, h * 0.86, h * 0.92, front, front + 0.012, C.accent, C.accent, EDGE_GLOW);
}
function receiver(b, w, d, h) {
  b.pad(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.body, 0.02, EDGE_FURN);
  b.box(-w * 0.18, w * 0.18, h * 0.38, h * 0.67, d * 0.49, d * 0.54, C.glass, C.accent, EDGE_GLOW);
  for (const x of [-w * 0.38, w * 0.38]) b.lyingCyl("z", x, d * 0.5, h * 0.35, h * 0.68, d * 0.04, h * 0.33, C.metal, C.metal, 12, EDGE_FAINT);
}
function tv(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.dark, EDGE_FURN);
  b.box(-w * 0.485, w * 0.485, h * 0.025, h * 0.975, d * 0.35, d * 0.58, C.glass, C.dark, EDGE_GLOW);
  b.box(-w * 0.04, w * 0.04, h * 0.01, h * 0.07, -d * 0.58, -d * 0.35, C.metal, C.metal, EDGE_FAINT);
}
function turntable(b, w, d, h) {
  b.pad(-w / 2, w / 2, 0, h * 0.35, -d / 2, d / 2, C.body, C.bodyTop, 0.018, EDGE_FURN);
  b.cyl(-w * 0.1, 0, Math.min(w, d) * 0.36, h * 0.35, h * 0.5, C.dark, C.glass, 24, EDGE_GLOW);
  b.cyl(w * 0.3, -d * 0.28, w * 0.035, h * 0.35, h * 0.72, C.metal, C.metal, 10, EDGE_FAINT);
  b.rotated(w * 0.15, 0, -24).box(w * 0.13, w * 0.18, h * 0.62, h * 0.76, -d * 0.28, d * 0.3, C.metal, C.metal, EDGE_FURN);
}
function vinylShelf(b, w, d, h) {
  const t = Math.min(w, h) * 0.045;
  b.box(-w / 2, w / 2, 0, t, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(-w / 2, -w / 2 + t, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  b.box(w / 2 - t, w / 2, 0, h, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (const y of [h * 0.5, h - t]) b.box(-w / 2, w / 2, y, y + t, -d / 2, d / 2, C.wood, C.woodTop, EDGE_FURN);
  for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
    const x = -w * 0.4 + i / 8 * w * 0.8;
    b.box(x, x + t * 0.35, h * (0.08 + row * 0.5), h * (0.44 + row * 0.5), d * 0.18, d * 0.46, i % 3 ? C.accent : C.cushion, C.accent, EDGE_FAINT);
  }
}
function gameConsole(b, w, d, h) {
  b.pad(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.body, C.bodyTop, 0.025, EDGE_FURN);
  b.box(-w * 0.36, -w * 0.27, h * 0.08, h * 0.92, d * 0.46, d * 0.53, C.dark, C.dark, EDGE_FAINT);
  b.box(w * 0.3, w * 0.4, h * 0.45, h * 0.5, d * 0.48, d * 0.54, C.accent, C.accent, EDGE_GLOW);
}
function hifiRack(b, w, d, h) {
  const post = w * 0.055;
  for (const x of [-w * 0.42, w * 0.42]) for (const z of [-d * 0.4, d * 0.4]) b.box(x - post, x + post, 0, h, z - post, z + post, C.metal, C.metal, EDGE_FURN);
  for (const y of [0.04, 0.3, 0.56, 0.82]) {
    b.box(-w * 0.48, w * 0.48, h * y, h * (y + 0.035), -d * 0.46, d * 0.46, C.glass, C.glass, EDGE_GLOW);
    if (y > 0.04) {
      const y0 = h * (y + 0.04);
      b.pad(-w * 0.38, w * 0.38, y0, y0 + h * 0.12, -d * 0.34, d * 0.34, C.dark, C.bodyTop, 0.012, EDGE_FURN);
      b.box(-w * 0.12, w * 0.12, y0 + h * 0.04, y0 + h * 0.08, d * 0.33, d * 0.37, C.glass, C.accent, EDGE_GLOW);
    }
  }
}
function cinemaChair(b, x, w, d, h) {
  const seatY = h * 0.38;
  b.pad(x - w * 0.36, x + w * 0.36, seatY, seatY + h * 0.16, -d * 0.22, d * 0.35, C.cushion, C.fabricTop, 0.04, EDGE_FURN);
  b.pad(x - w * 0.36, x + w * 0.36, seatY + h * 0.12, h, -d * 0.46, -d * 0.22, C.cushion, C.fabricTop, 0.04, EDGE_FURN);
  for (const side of [-1, 1]) {
    const sx = x + side * w * 0.43;
    b.pad(sx - w * 0.07, sx + w * 0.07, seatY, seatY + h * 0.22, -d * 0.25, d * 0.37, C.dark, C.cushion, 0.025, EDGE_FURN);
    b.cyl(sx, d * 0.22, w * 0.045, seatY + h * 0.2, seatY + h * 0.24, C.dark, C.glass, 12, EDGE_GLOW);
  }
  b.box(x - w * 0.31, x + w * 0.31, 0, seatY, -d * 0.35, d * 0.28, C.dark, C.dark, EDGE_FAINT);
}
function acousticPanel(b, w, d, h) {
  b.box(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.dark, EDGE_FURN);
  for (let i = 0; i < 7; i++) {
    const x0 = -w * 0.44 + i * w * 0.88 / 7;
    b.box(x0, x0 + w * 0.065, h * 0.04, h * 0.96, d * 0.36, d * 0.55, i % 2 ? C.cushion : C.accent, C.fabricTop, EDGE_FAINT);
  }
}
function popcornMachine(b, w, d, h) {
  b.pad(-w * 0.42, w * 0.42, 0, h * 0.42, -d * 0.4, d * 0.4, C.accent, C.bodyTop, 0.025, EDGE_FURN);
  for (const x of [-w * 0.34, w * 0.34]) for (const z of [-d * 0.32, d * 0.32]) b.box(x - w * 0.025, x + w * 0.025, h * 0.42, h * 0.88, z - d * 0.025, z + d * 0.025, C.metal, C.metal, EDGE_FURN);
  b.box(-w * 0.34, w * 0.34, h * 0.45, h * 0.86, d * 0.31, d * 0.36, C.glass, C.glass, EDGE_GLOW);
  b.cyl(0, 0, w * 0.22, h * 0.46, h * 0.58, C.metal, C.accent, 16, EDGE_FURN);
  b.pad(-w * 0.48, w * 0.48, h * 0.88, h, -d * 0.48, d * 0.48, C.accent, C.bodyTop, 0.025, EDGE_FURN);
}
function surroundStand(b, w, d, h) {
  b.cyl(0, 0, Math.min(w, d) * 0.42, 0, h * 0.04, C.metal, C.metal, 16, EDGE_FURN);
  b.cyl(0, 0, w * 0.06, h * 0.04, h * 0.68, C.metal, C.metal, 10, EDGE_FAINT);
  const y0 = h * 0.68;
  b.pad(-w / 2, w / 2, y0, h, -d / 2, d / 2, C.dark, C.body, 0.018, EDGE_FURN);
  for (const y of [h * 0.77, h * 0.91]) b.lyingCyl("z", 0, d * 0.5, y - w * 0.12, y + w * 0.12, d * 0.035, w * 0.24, C.dark, C.glass, 14, EDGE_GLOW);
}
function mediaComponent(b, w, d, h, kind) {
  b.pad(-w / 2, w / 2, 0, h, -d / 2, d / 2, C.dark, C.bodyTop, Math.min(h * 0.18, 0.018), EDGE_FURN);
  if (kind === "bluray") b.box(-w * 0.34, w * 0.18, h * 0.38, h * 0.5, d * 0.48, d * 0.54, C.glass, C.glass, EDGE_FAINT);
  if (kind === "amp") for (const x of [-w * 0.36, w * 0.36]) b.lyingCyl("z", x, d * 0.5, h * 0.3, h * 0.72, d * 0.04, h * 0.42, C.metal, C.metal, 12, EDGE_FAINT);
  b.box(w * 0.28, w * 0.38, h * 0.42, h * 0.56, d * 0.49, d * 0.55, C.accent, C.accent, EDGE_GLOW);
}
function headphoneStand(b, w, d, h) {
  b.cyl(0, 0, Math.min(w, d) * 0.42, 0, h * 0.06, C.metal, C.metal, 16, EDGE_FURN);
  b.box(-w * 0.045, w * 0.045, h * 0.06, h * 0.82, -d * 0.045, d * 0.045, C.metal, C.metal, EDGE_FAINT);
  b.box(-w * 0.3, w * 0.3, h * 0.78, h * 0.86, -d * 0.08, d * 0.08, C.body, C.bodyTop, EDGE_FURN);
  for (const x of [-w * 0.34, w * 0.34]) b.cyl(x, 0, w * 0.12, h * 0.58, h * 0.82, C.dark, C.cushion, 14, EDGE_GLOW);
}
export const CINEMA_FURNITURE_MODELS = {
  cinema_screen_wall: ({
    b,
    w,
    d,
    h
  }) => (screen(b, w, d, h, "wall"), false),
  cinema_screen_roller: ({
    b,
    w,
    d,
    h
  }) => (screen(b, w, d, h, "roller"), false),
  cinema_projector_ceiling: ({
    b,
    w,
    d,
    h
  }) => (projector(b, w, d, h, true, false), false),
  cinema_projector_table: ({
    b,
    w,
    d,
    h
  }) => (projector(b, w, d, h, false, false), false),
  cinema_speaker_tower: ({
    b,
    w,
    d,
    h
  }) => (speaker(b, w, d, h, "tower"), 0.5),
  cinema_speaker_bookshelf: ({
    b,
    w,
    d,
    h
  }) => (speaker(b, w, d, h, "bookshelf"), false),
  cinema_speaker_center: ({
    b,
    w,
    d,
    h
  }) => (speaker(b, w, d, h, "center"), false),
  cinema_subwoofer: ({
    b,
    w,
    d,
    h
  }) => (speaker(b, w, d, h, "sub"), 0.5),
  cinema_soundbar: ({
    b,
    w,
    d,
    h
  }) => (speaker(b, w, d, h, "soundbar"), false),
  cinema_speaker_wall: ({
    b,
    w,
    d,
    h
  }) => (speaker(b, w, d, h, "wall"), false),
  cinema_speaker_ceiling: ({
    b,
    w,
    d,
    h
  }) => (speaker(b, w, d, h, "ceiling"), false),
  cinema_av_receiver: ({
    b,
    w,
    d,
    h
  }) => (receiver(b, w, d, h), false),
  cinema_tv_oled_65: ({
    b,
    w,
    d,
    h
  }) => (tv(b, w, d, h), false),
  cinema_tv_oled_85: ({
    b,
    w,
    d,
    h
  }) => (tv(b, w, d, h), false),
  cinema_projector_ust: ({
    b,
    w,
    d,
    h
  }) => (projector(b, w, d, h, false, true), false),
  cinema_screen_floor_rising: ({
    b,
    w,
    d,
    h
  }) => (screen(b, w, d, h, "floor"), 0.5),
  cinema_turntable: ({
    b,
    w,
    d,
    h
  }) => (turntable(b, w, d, h), false),
  cinema_vinyl_shelf: ({
    b,
    w,
    d,
    h
  }) => (vinylShelf(b, w, d, h), 0.5),
  cinema_game_console: ({
    b,
    w,
    d,
    h
  }) => (gameConsole(b, w, d, h), 0.5),
  cinema_hifi_rack: ({
    b,
    w,
    d,
    h
  }) => (hifiRack(b, w, d, h), 0.5),
  cinema_chair: ({
    b,
    w,
    d,
    h
  }) => (cinemaChair(b, 0, w, d, h), 0.5),
  cinema_chair_row_3: ({
    b,
    w,
    d,
    h
  }) => {
    for (const x of [-w / 3, 0, w / 3]) cinemaChair(b, x, w / 3, d, h);
    return 0.5;
  },
  cinema_acoustic_panel: ({
    b,
    w,
    d,
    h
  }) => (acousticPanel(b, w, d, h), false),
  cinema_bass_trap_corner: ({
    b,
    w,
    d,
    h
  }) => (b.rotated(0, 0, 45).pad(-w * 0.35, w * 0.35, 0, h, -d * 0.35, d * 0.35, C.cushion, C.fabricTop, 0.025, EDGE_FURN), false),
  cinema_popcorn_machine: ({
    b,
    w,
    d,
    h
  }) => (popcornMachine(b, w, d, h), 0.5),
  cinema_surround_speaker_stand: ({
    b,
    w,
    d,
    h
  }) => (surroundStand(b, w, d, h), 0.5),
  cinema_speaker_inwall: ({
    b,
    w,
    d,
    h
  }) => (speaker(b, w, d, h, "wall"), false),
  cinema_media_streamer: ({
    b,
    w,
    d,
    h
  }) => (mediaComponent(b, w, d, h, "streamer"), false),
  cinema_bluray_player: ({
    b,
    w,
    d,
    h
  }) => (mediaComponent(b, w, d, h, "bluray"), false),
  cinema_stereo_amplifier: ({
    b,
    w,
    d,
    h
  }) => (mediaComponent(b, w, d, h, "amp"), false),
  cinema_headphone_stand: ({
    b,
    w,
    d,
    h
  }) => (headphoneStand(b, w, d, h), false)
};
const flatScreen = (w, d, h) => ({
  x0: -w * 0.46,
  x1: w * 0.46,
  y0: h * 0.06,
  y1: h * 0.94,
  z: d * 0.57
});
export const CINEMA_FURNITURE_SCREENS = {
  cinema_screen_wall: flatScreen,
  cinema_screen_roller: (w, d, h) => ({
    x0: -w * 0.46,
    x1: w * 0.46,
    y0: h * 0.02,
    y1: h * 0.9,
    z: d * 0.09
  }),
  cinema_tv_oled_65: flatScreen,
  cinema_tv_oled_85: flatScreen,
  cinema_screen_floor_rising: (w, d, h) => ({
    x0: -w * 0.46,
    x1: w * 0.46,
    y0: h * 0.12,
    y1: h * 0.92,
    z: d * 0.09
  })
};