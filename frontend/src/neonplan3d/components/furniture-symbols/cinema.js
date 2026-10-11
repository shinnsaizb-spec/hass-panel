/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/cinema.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
import { circle, createSymbolRegistry, line, rect } from "./common.js";
const TYPES = ["cinema_screen_wall", "cinema_screen_roller", "cinema_projector_ceiling", "cinema_projector_table", "cinema_speaker_tower", "cinema_speaker_bookshelf", "cinema_speaker_center", "cinema_subwoofer", "cinema_soundbar", "cinema_speaker_wall", "cinema_speaker_ceiling", "cinema_av_receiver", "cinema_tv_oled_65", "cinema_tv_oled_85", "cinema_projector_ust", "cinema_screen_floor_rising", "cinema_turntable", "cinema_vinyl_shelf", "cinema_game_console", "cinema_hifi_rack", "cinema_chair", "cinema_chair_row_3", "cinema_acoustic_panel", "cinema_bass_trap_corner", "cinema_popcorn_machine", "lamp_cinema_star_ceiling", "cinema_surround_speaker_stand", "cinema_speaker_inwall", "cinema_media_streamer", "cinema_bluray_player", "cinema_stereo_amplifier", "cinema_headphone_stand"];
function symbol(type, w, d) {
  if (type.startsWith("cinema_screen_") || type.startsWith("cinema_tv_")) return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w * 0.44, 0, w * 0.44, 0)];
  if (type.startsWith("cinema_projector_")) return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(-w * 0.22, d * 0.38, Math.min(w, d) * 0.12), rect(w * 0.2, d * 0.32, w * 0.38, d * 0.46)];
  if (type === "cinema_speaker_ceiling") return [circle(0, 0, Math.min(w, d) * 0.48, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.3)];
  if (type === "cinema_soundbar") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), ...[-0.32, 0, 0.32].map(x => circle(w * x, 0, d * 0.22))];
  if (type.includes("speaker") || type === "cinema_subwoofer") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(0, d * 0.28, Math.min(w, d) * 0.25)];
  if (type === "cinema_av_receiver") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(-w * 0.37, d * 0.38, d * 0.08), circle(w * 0.37, d * 0.38, d * 0.08), rect(-w * 0.18, d * 0.34, w * 0.18, d * 0.46)];
  if (type === "cinema_turntable") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(-w * 0.1, 0, Math.min(w, d) * 0.34), line(w * 0.3, -d * 0.3, w * 0.08, d * 0.3)];
  if (type === "cinema_vinyl_shelf" || type === "cinema_hifi_rack") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w * 0.28, -d / 2, -w * 0.28, d / 2), line(0, -d / 2, 0, d / 2), line(w * 0.28, -d / 2, w * 0.28, d / 2)];
  if (type === "cinema_chair") return [rect(-w * 0.42, -d * 0.38, w * 0.42, d * 0.42, "fp3d-sym-fill"), line(-w * 0.34, -d * 0.2, w * 0.34, -d * 0.2)];
  if (type === "cinema_chair_row_3") return [rect(-w / 2, -d * 0.38, w / 2, d * 0.42, "fp3d-sym-fill"), line(-w / 6, -d * 0.38, -w / 6, d * 0.42), line(w / 6, -d * 0.38, w / 6, d * 0.42)];
  if (type === "cinema_acoustic_panel") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), ...[-0.3, -0.1, 0.1, 0.3].map(x => line(w * x, -d / 2, w * x, d / 2))];
  if (type === "cinema_bass_trap_corner") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w / 2, d / 2, w / 2, -d / 2)];
  if (type === "cinema_popcorn_machine") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.23), line(-w * 0.36, d * 0.32, w * 0.36, d * 0.32)];
  if (type === "lamp_cinema_star_ceiling") return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), ...[[-0.3, -0.25], [0, 0], [0.28, -0.1], [-0.16, 0.3], [0.34, 0.3]].map(([x, z]) => circle(w * x, d * z, Math.min(w, d) * 0.018))];
  if (type === "cinema_headphone_stand") return [circle(0, 0, Math.min(w, d) * 0.45, "fp3d-sym-fill"), line(-w * 0.3, 0, w * 0.3, 0)];
  return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill")];
}
export const CINEMA_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, symbol);