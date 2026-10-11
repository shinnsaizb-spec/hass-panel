/* eslint-disable */
/* 自动生成，请勿手改 —— 由 .workbuddy-ai/tools/vendor-np3d.mjs 从 neonplan3d 移植。 */
/* 来源: neonplan3d / frontend/src/packages.ts  (https://github.com/PATCoder97/neonplan3d, MIT) */
// Room packages: a set of furniture for a kind of room, placed against the walls of the room's
// bounding box (back wall = top in the plan) or in the middle. Sizes follow FURNITURE_SIZE; rows of
// items along a wall are laid side by side. The result is a starting point to adjust in the editor.

import { bounds, furnitureFootprint, FURNITURE_SIZE } from "./model.js";
export const PACKAGES = ["kitchen_row", "kitchen_l", "kitchen_small", "kitchen_medium", "kitchen_large", "bath", "bath_small", "bath_medium", "bath_large", "bedroom", "bedroom_small", "bedroom_medium", "bedroom_large", "living", "living_small", "living_medium", "living_large", "dining", "office", "kids", "hall"];
const DEFS = {
  kitchen_row: {
    rows: [{
      wall: "back",
      align: "start",
      items: [{
        type: "fridge"
      }, {
        type: "kitchen_tall"
      }, {
        type: "kitchen",
        size: [0.9, 0.62, 0.92]
      }, {
        type: "sink"
      }, {
        type: "dishwasher"
      }, {
        type: "stove"
      }, {
        type: "kitchen",
        size: [0.6, 0.62, 0.92]
      }]
    }, {
      wall: "back",
      align: "start",
      items: [{
        type: "kitchen_wall",
        size: [1.2, 0.35, 0.7]
      }]
    }],
    free: [{
      type: "table",
      at: [0.5, 0.72],
      rotation: 0,
      size: [1.2, 0.8, 0.75]
    }, {
      type: "lamp_pendant",
      at: [0.5, 0.72],
      rotation: 0
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.3],
      rotation: 0
    }]
  },
  kitchen_l: {
    rows: [{
      wall: "back",
      align: "start",
      items: [{
        type: "fridge"
      }, {
        type: "kitchen_tall"
      }, {
        type: "sink"
      }, {
        type: "dishwasher"
      }, {
        type: "kitchen",
        size: [0.6, 0.62, 0.92]
      }]
    }, {
      wall: "left",
      align: "end",
      items: [{
        type: "stove"
      }, {
        type: "kitchen",
        size: [1.2, 0.62, 0.92]
      }]
    }],
    free: [{
      type: "island",
      at: [0.62, 0.62],
      rotation: 0,
      size: [1.6, 0.9, 0.92]
    }, {
      type: "bar_stool",
      at: [0.52, 0.86],
      rotation: 180
    }, {
      type: "bar_stool",
      at: [0.72, 0.86],
      rotation: 180
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.35],
      rotation: 0
    }]
  },
  kitchen_small: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "fridge"
      }, {
        type: "sink",
        size: [0.7, 0.62, 0.92]
      }, {
        type: "stove"
      }]
    }],
    free: [{
      type: "lamp_ceiling",
      at: [0.5, 0.5],
      rotation: 0
    }]
  },
  kitchen_medium: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "fridge"
      }, {
        type: "sink"
      }, {
        type: "dishwasher"
      }, {
        type: "stove"
      }, {
        type: "kitchen",
        size: [0.6, 0.62, 0.92]
      }]
    }],
    free: [{
      type: "table_round",
      at: [0.5, 0.72],
      rotation: 0
    }, {
      type: "lamp_pendant",
      at: [0.5, 0.72],
      rotation: 0
    }]
  },
  kitchen_large: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "fridge"
      }, {
        type: "kitchen_tall"
      }, {
        type: "sink"
      }, {
        type: "dishwasher"
      }, {
        type: "stove"
      }, {
        type: "kitchen",
        size: [1.2, 0.62, 0.92]
      }]
    }],
    free: [{
      type: "island",
      at: [0.5, 0.62],
      rotation: 0
    }, {
      type: "bar_stool",
      at: [0.42, 0.84],
      rotation: 180
    }, {
      type: "bar_stool",
      at: [0.58, 0.84],
      rotation: 180
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.3],
      rotation: 0
    }]
  },
  bath: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "washbasin"
      }]
    }, {
      wall: "back",
      align: "end",
      items: [{
        type: "wc"
      }]
    }, {
      wall: "front",
      align: "start",
      items: [{
        type: "bathtub"
      }]
    }, {
      wall: "left",
      align: "start",
      items: [{
        type: "washer"
      }]
    }],
    free: [{
      type: "lamp_downlight",
      at: [0.5, 0.5],
      rotation: 0
    }]
  },
  bath_small: {
    rows: [{
      wall: "back",
      align: "start",
      items: [{
        type: "vanity_60"
      }, {
        type: "toilet_wall_hung"
      }]
    }, {
      wall: "front",
      align: "end",
      items: [{
        type: "shower_corner_90"
      }]
    }],
    free: [{
      type: "lamp_downlight",
      at: [0.5, 0.5],
      rotation: 0
    }]
  },
  bath_medium: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "vanity_80"
      }, {
        type: "toilet_close_coupled"
      }]
    }, {
      wall: "front",
      align: "start",
      items: [{
        type: "bathtub_builtin"
      }]
    }, {
      wall: "left",
      align: "end",
      items: [{
        type: "washing_machine_cabinet"
      }]
    }],
    free: [{
      type: "lamp_downlight",
      at: [0.5, 0.5],
      rotation: 0
    }]
  },
  bath_large: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "double_vanity_120"
      }, {
        type: "bathroom_cabinet_tall"
      }]
    }, {
      wall: "front",
      align: "center",
      items: [{
        type: "bathtub_freestanding"
      }]
    }, {
      wall: "left",
      align: "center",
      items: [{
        type: "shower_walkin_140"
      }]
    }],
    free: [{
      type: "sauna",
      at: [0.82, 0.72],
      rotation: 180
    }, {
      type: "lamp_panel",
      at: [0.5, 0.5],
      rotation: 0
    }]
  },
  bedroom: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "nightstand"
      }, {
        type: "bed"
      }, {
        type: "nightstand"
      }]
    }, {
      wall: "left",
      align: "center",
      items: [{
        type: "wardrobe",
        size: [2.0, 0.6, 2.1]
      }]
    }, {
      wall: "front",
      align: "end",
      items: [{
        type: "dresser"
      }]
    }],
    free: [{
      type: "lamp_ceiling",
      at: [0.5, 0.55],
      rotation: 0
    }]
  },
  bedroom_small: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "bed_140"
      }]
    }, {
      wall: "left",
      align: "end",
      items: [{
        type: "wardrobe_2door"
      }]
    }],
    free: [{
      type: "lamp_ceiling",
      at: [0.5, 0.5],
      rotation: 0
    }]
  },
  bedroom_medium: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "nightstand_slim"
      }, {
        type: "bed_160"
      }, {
        type: "nightstand_slim"
      }]
    }, {
      wall: "left",
      align: "center",
      items: [{
        type: "wardrobe_3door"
      }]
    }],
    free: [{
      type: "lamp_ceiling",
      at: [0.5, 0.5],
      rotation: 0
    }]
  },
  bedroom_large: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "nightstand_drawer"
      }, {
        type: "bed_180"
      }, {
        type: "nightstand_drawer"
      }]
    }, {
      wall: "left",
      align: "center",
      items: [{
        type: "wardrobe_6door"
      }]
    }, {
      wall: "front",
      align: "end",
      items: [{
        type: "vanity_mirror"
      }]
    }],
    free: [{
      type: "bed_bench",
      at: [0.5, 0.72],
      rotation: 0
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.5],
      rotation: 0
    }]
  },
  living: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "tv_board"
      }]
    }, {
      wall: "right",
      align: "start",
      items: [{
        type: "shelf"
      }]
    }],
    free: [{
      type: "sofa",
      at: [0.5, 0.72],
      rotation: 180
    }, {
      type: "coffee_table",
      at: [0.5, 0.52],
      rotation: 0
    }, {
      type: "rug",
      at: [0.5, 0.55],
      rotation: 0,
      size: [2.2, 1.6, 0.01]
    }, {
      type: "armchair",
      at: [0.14, 0.5],
      rotation: 270
    }, {
      type: "lamp_floor",
      at: [0.86, 0.8],
      rotation: 0
    }, {
      type: "plant",
      at: [0.9, 0.12],
      rotation: 0
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.45],
      rotation: 0
    }]
  },
  living_small: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "tv_stand"
      }]
    }],
    free: [{
      type: "sofa_2",
      at: [0.5, 0.76],
      rotation: 180
    }, {
      type: "coffee_table_round",
      at: [0.5, 0.52],
      rotation: 0
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.4],
      rotation: 0
    }]
  },
  living_medium: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "lowboard_160"
      }, {
        type: "tv_stand"
      }]
    }],
    free: [{
      type: "sofa_3",
      at: [0.5, 0.76],
      rotation: 180
    }, {
      type: "coffee_table",
      at: [0.5, 0.52],
      rotation: 0
    }, {
      type: "armchair",
      at: [0.16, 0.55],
      rotation: 270
    }, {
      type: "rug",
      at: [0.5, 0.58],
      rotation: 0
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.38],
      rotation: 0
    }]
  },
  living_large: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "media_wall_tv"
      }]
    }, {
      wall: "right",
      align: "center",
      items: [{
        type: "display_cabinet"
      }]
    }],
    free: [{
      type: "sofa_u",
      at: [0.5, 0.72],
      rotation: 180
    }, {
      type: "nesting_tables",
      at: [0.5, 0.5],
      rotation: 0
    }, {
      type: "rug_round",
      at: [0.5, 0.58],
      rotation: 0
    }, {
      type: "lamp_floor",
      at: [0.86, 0.82],
      rotation: 0
    }, {
      type: "plant_monstera",
      at: [0.1, 0.16],
      rotation: 0
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.35],
      rotation: 0
    }]
  },
  dining: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "sideboard"
      }]
    }],
    free: [{
      type: "table",
      at: [0.5, 0.55],
      rotation: 0
    }, {
      type: "chair",
      at: [0.4, 0.35],
      rotation: 0
    }, {
      type: "chair",
      at: [0.6, 0.35],
      rotation: 0
    }, {
      type: "chair",
      at: [0.4, 0.75],
      rotation: 180
    }, {
      type: "chair",
      at: [0.6, 0.75],
      rotation: 180
    }, {
      type: "lamp_pendant",
      at: [0.5, 0.55],
      rotation: 0
    }]
  },
  office: {
    rows: [{
      wall: "back",
      align: "center",
      items: [{
        type: "desk"
      }]
    }, {
      wall: "left",
      align: "center",
      items: [{
        type: "shelf"
      }, {
        type: "shelf"
      }]
    }],
    free: [{
      type: "office_chair",
      at: [0.5, 0.38],
      rotation: 180
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.55],
      rotation: 0
    }]
  },
  kids: {
    rows: [{
      wall: "left",
      align: "start",
      items: [{
        type: "bed",
        size: [0.9, 2.0, 0.8]
      }]
    }, {
      wall: "back",
      align: "end",
      items: [{
        type: "desk",
        size: [1.2, 0.6, 0.75]
      }]
    }, {
      wall: "right",
      align: "end",
      items: [{
        type: "shelf"
      }]
    }],
    free: [{
      type: "rug",
      at: [0.55, 0.6],
      rotation: 0,
      size: [1.6, 1.2, 0.01]
    }, {
      type: "lamp_ceiling",
      at: [0.5, 0.5],
      rotation: 0
    }]
  },
  hall: {
    rows: [{
      wall: "left",
      align: "start",
      items: [{
        type: "coat_rack"
      }]
    }],
    free: [{
      type: "lamp_downlight",
      at: [0.5, 0.3],
      rotation: 0
    }, {
      type: "lamp_downlight",
      at: [0.5, 0.7],
      rotation: 0
    }]
  }
};

/** Rotation (degrees) that turns an item's back to a wall; items' fronts are at +z. */
const WALL_ROTATION = {
  back: 0,
  right: 90,
  front: 180,
  left: 270
};

/** Furniture of a package for a room. `id` makes new ids. */
export function furnishRoom(room, pkg, id, occupied = []) {
  const b = bounds(room.points);
  const W = b.x1 - b.x0;
  const D = b.z1 - b.z0;
  const def = DEFS[pkg];
  const out = [];
  const add = (type, x, z, rotation, size) => {
    const [w, d, h] = size ?? FURNITURE_SIZE[type];
    out.push({
      id: id(),
      type,
      x: round(x),
      z: round(z),
      rotation,
      w,
      d,
      h,
      variant: null,
      entity: null,
      power: null
    });
  };
  const gap = 0.02;
  for (const row of def.rows) {
    const items = row.items.map(it => ({
      type: it.type,
      size: it.size ?? FURNITURE_SIZE[it.type]
    }));
    const along = row.wall === "back" || row.wall === "front" ? W : D;
    // leave out items that do not fit any more
    const fitting = [];
    let total = 0;
    for (const it of items) {
      if (total + it.size[0] > along - 0.1) break;
      fitting.push(it);
      total += it.size[0];
    }
    // start offset along the wall, measured from the left end as seen from inside the room
    let pos = row.align === "start" ? 0.05 : row.align === "end" ? along - total - 0.05 : (along - total) / 2;
    for (const it of fitting) {
      const [w, d] = it.size;
      const c = pos + w / 2;
      const depth = d / 2 + gap;
      // seen from inside: back wall runs left→right = +x; right wall runs back→front = +z;
      // front wall runs right→left = -x; left wall runs front→back = -z
      if (row.wall === "back") add(it.type, b.x0 + c, b.z0 + depth, 0, it.size);else if (row.wall === "front") add(it.type, b.x1 - c, b.z1 - depth, 180, it.size);else if (row.wall === "right") add(it.type, b.x1 - depth, b.z0 + c, 90, it.size);else add(it.type, b.x0 + depth, b.z1 - c, WALL_ROTATION.left, it.size);
      pos += w;
    }
  }
  for (const f of def.free) {
    const [w, d] = f.size ?? FURNITURE_SIZE[f.type];
    // keep free items inside the room
    const x = Math.min(b.x1 - w / 2 - 0.05, Math.max(b.x0 + w / 2 + 0.05, b.x0 + W * f.at[0]));
    const z = Math.min(b.z1 - d / 2 - 0.05, Math.max(b.z0 + d / 2 + 0.05, b.z0 + D * f.at[1]));
    add(f.type, x, z, f.rotation, f.size);
  }
  if (!occupied.length) return out;
  const boxes = occupied.map(footprintBox);
  return out.filter(item => {
    const box = footprintBox(item);
    return !boxes.some(other => box.x0 < other.x1 && box.x1 > other.x0 && box.z0 < other.z1 && box.z1 > other.z0);
  });
}
const round = v => Math.round(v * 1000) / 1000;
function footprintBox(item) {
  const points = furnitureFootprint(item);
  return {
    x0: Math.min(...points.map(p => p[0])),
    x1: Math.max(...points.map(p => p[0])),
    z0: Math.min(...points.map(p => p[1])),
    z1: Math.max(...points.map(p => p[1]))
  };
}