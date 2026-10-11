/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/components/furniture-symbols/smart-home.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Built-in top-view symbols for the smart-home family.

import { createSymbolRegistry, circle, ellipse, line, rect } from "./common.js";
const TYPES = ["air_purifier", "smart_speaker", "security_camera", "smart_lock", "smart_curtain", "network_cabinet", "nas_server", "access_point", "wall_thermostat", "smoke_detector", "siren_alarm", "electrical_panel", "ups_unit", "modem_router", "heat_pump_outdoor", "hot_water_tank", "ventilation_fan", "humidifier", "smart_display", "wall_switch", "wall_outlet", "smart_plug", "motion_sensor", "contact_sensor", "water_leak_sensor", "temperature_humidity_sensor", "video_doorbell", "robot_vacuum", "robot_mower"];
function renderSymbol(type, w, d) {
  switch (type) {
    case "air_purifier":
      return [rect(-w / 2, -d / 2, w / 2, d / 2), circle(0, d * 0.28, Math.min(w, d) * 0.1, "fp3d-sym-fill")];
    case "smart_speaker":
      return [circle(0, 0, Math.min(w, d) * 0.46, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.3)];
    case "security_camera":
      return [rect(-w * 0.28, -d / 2, w * 0.28, -d * 0.36, "fp3d-sym-fill"), rect(-w * 0.38, -d * 0.28, w * 0.38, d * 0.36), circle(0, d * 0.34, Math.min(w, d) * 0.12, "fp3d-sym-strong")];
    case "smart_lock":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w * 0.15, d * 0.18, w * 0.48, d * 0.18, "fp3d-sym-strong")];
    case "smart_curtain":
      {
        const out = [line(-w / 2, -d * 0.32, w / 2, -d * 0.32, "fp3d-sym-strong")];
        for (let i = 0; i <= 10; i++) {
          const x = -w / 2 + w * i / 10;
          if (Math.abs(x) > w * 0.1) out.push(line(x, -d * 0.18, x, d * (i % 2 ? 0.34 : 0.12)));
        }
        return out;
      }
    case "network_cabinet":
      {
        const out = [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill")];
        for (let i = 1; i < 6; i++) out.push(line(-w * 0.34, -d / 2 + d * i / 6, w * 0.34, -d / 2 + d * i / 6));
        return out;
      }
    case "nas_server":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), ...[-0.27, -0.09, 0.09, 0.27].map(x => rect(x * w - w * 0.065, -d * 0.38, x * w + w * 0.065, d * 0.35))];
    case "access_point":
      return [circle(0, 0, Math.min(w, d) * 0.47, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.3), line(-w * 0.16, d * 0.42, w * 0.16, d * 0.42, "fp3d-sym-strong")];
    case "wall_thermostat":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), rect(-w * 0.36, d * 0.05, w * 0.36, d / 2, "fp3d-sym-strong")];
    case "smoke_detector":
      {
        const r = Math.min(w, d) * 0.47;
        return [circle(0, 0, r, "fp3d-sym-fill"), circle(0, 0, r * 0.72), ...Array.from({
          length: 6
        }, (_, i) => circle(Math.cos(i * Math.PI / 3) * r * 0.58, Math.sin(i * Math.PI / 3) * r * 0.58, r * 0.055))];
      }
    case "siren_alarm":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), rect(-w * 0.3, d * 0.02, w * 0.3, d / 2, "fp3d-sym-strong")];
    case "electrical_panel":
      {
        const out = [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill")];
        for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) out.push(rect(-w * 0.36 + col * w * 0.18, -d * 0.25 + row * d * 0.28, -w * 0.25 + col * w * 0.18, -d * 0.08 + row * d * 0.28));
        return out;
      }
    case "ups_unit":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), rect(-w * 0.22, d * 0.08, w * 0.22, d * 0.34, "fp3d-sym-strong"), ...[-0.22, 0, 0.22].map(x => line(x * w, -d * 0.35, x * w, -d * 0.12))];
    case "modem_router":
      return [rect(-w / 2, -d * 0.3, w / 2, d * 0.35, "fp3d-sym-fill"), line(-w * 0.35, -d * 0.3, -w * 0.46, -d / 2, "fp3d-sym-strong"), line(w * 0.35, -d * 0.3, w * 0.46, -d / 2, "fp3d-sym-strong"), ...[-0.22, 0, 0.22].map(x => circle(x * w, d * 0.18, Math.min(w, d) * 0.035))];
    case "heat_pump_outdoor":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), ...Array.from({
        length: 5
      }, (_, i) => line(-w * 0.4, -d * 0.24 + i * d * 0.12, w * 0.18, -d * 0.24 + i * d * 0.12)), rect(w * 0.31, d * 0.08, w * 0.42, d * 0.28, "fp3d-sym-strong")];
    case "hot_water_tank":
      return [circle(0, 0, Math.min(w, d) * 0.48, "fp3d-sym-fill"), circle(0, d * 0.34, Math.min(w, d) * 0.07, "fp3d-sym-strong")];
    case "ventilation_fan":
      {
        const r = Math.min(w, d) * 0.46;
        return [rect(-w / 2, -d / 2, w / 2, d / 2), circle(0, 0, r, "fp3d-sym-fill"), ...Array.from({
          length: 4
        }, (_, i) => line(Math.cos(i * Math.PI / 2) * r * 0.2, Math.sin(i * Math.PI / 2) * r * 0.2, Math.cos(i * Math.PI / 2) * r * 0.82, Math.sin(i * Math.PI / 2) * r * 0.82))];
      }
    case "humidifier":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), rect(-w * 0.34, -d * 0.3, w * 0.34, d * 0.12), line(-w * 0.35, d * 0.24, w * 0.35, d * 0.24, "fp3d-sym-strong")];
    case "smart_display":
      return [rect(-w / 2, -d * 0.18, w / 2, d * 0.32, "fp3d-sym-fill"), line(-w * 0.16, d * 0.32, w * 0.16, d / 2, "fp3d-sym-strong")];
    case "wall_switch":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), line(-w * 0.28, 0, w * 0.28, 0, "fp3d-sym-strong")];
    case "wall_outlet":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(-w * 0.17, 0, w * 0.07), circle(w * 0.17, 0, w * 0.07)];
    case "smart_plug":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(0, 0, Math.min(w, d) * 0.28), line(-w * 0.24, d * 0.32, w * 0.24, d * 0.32, "fp3d-sym-strong")];
    case "motion_sensor":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), ellipse(0, d * 0.08, w * 0.3, d * 0.3, "fp3d-sym-strong")];
    case "contact_sensor":
      return [rect(-w / 2, -d / 2, w * 0.12, d / 2, "fp3d-sym-fill"), rect(w * 0.24, -d * 0.36, w / 2, d * 0.36)];
    case "water_leak_sensor":
      return [circle(0, 0, Math.min(w, d) * 0.47, "fp3d-sym-fill"), ellipse(0, d * 0.06, w * 0.13, d * 0.2, "fp3d-sym-strong")];
    case "temperature_humidity_sensor":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), rect(-w * 0.34, -d * 0.25, w * 0.34, d * 0.25, "fp3d-sym-strong")];
    case "video_doorbell":
      return [rect(-w / 2, -d / 2, w / 2, d / 2, "fp3d-sym-fill"), circle(0, -d * 0.22, Math.min(w, d) * 0.16), circle(0, d * 0.25, Math.min(w, d) * 0.13, "fp3d-sym-strong")];
    case "robot_vacuum":
      // dock at the back, the robot resting in front of it
      return [rect(-w * 0.38, -d / 2, w * 0.38, -d * 0.17, "fp3d-sym-fill"), rect(-w * 0.22, -d * 0.17, w * 0.22, d * 0.17), circle(0, d * 0.14, Math.min(w, d) * 0.4)];
    case "robot_mower":
      return [rect(-w / 2, -d / 2, w / 2, d * 0.42, "fp3d-sym-fill"), line(-w * 0.42, -d * 0.42, -w * 0.42, d * 0.28), line(w * 0.42, -d * 0.42, w * 0.42, d * 0.28), rect(-w * 0.31, -d * 0.17, w * 0.31, d * 0.34), line(-w * 0.22, d * 0.34, w * 0.22, d * 0.34, "fp3d-sym-strong")];
    default:
      return [];
  }
}
export const SMART_HOME_FURNITURE_SYMBOLS = createSymbolRegistry(TYPES, renderSymbol);