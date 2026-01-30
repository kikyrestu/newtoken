## What’s True in This Repo (Important)
- There are **no Vue files** in this project (it’s React/TSX). 
- The countdown overlay is currently constrained to the screen area via:
  - `top-[22%] bottom-[22%] left-[11%] right-[11%]` in [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx#L132-L154)

You asked for:
1) a temporary **10×10 red grid ruler overlay with 0–100% labels**, and
2) to reposition the digits into the device screen using **starting point** `top/bottom 18%`, `left/right 8%`.

## Objective 1 — LayoutRuler Overlay (Developer Tool)
### Implementation plan (matches your Vue request, but delivered in this repo as React)
- Create `frontend/src/components/LayoutRuler.tsx` (temporary debug overlay) with:
  - `pointer-events-none`, `fixed inset-0`, high z-index.
  - Red grid using CSS background:
    - `repeating-linear-gradient` for vertical + horizontal lines at 10%.
  - Axis labels (0%, 10%, … 100%) rendered as absolutely-positioned tiny red text along:
    - top edge (x-axis)
    - left edge (y-axis)
- Add it to the hero root in [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx) behind HUD but above video:
  - Render it behind clickable UI (still `pointer-events-none`) so it won’t block buttons.
- Optional toggle:
  - Gate it behind an env flag `import.meta.env.VITE_SHOW_LAYOUT_RULER === 'true'` so you can enable/disable without code edits.

### Vue version (what you asked to “output”)
I will also provide a `LayoutRuler.vue` code block (template + minimal CSS) that mirrors the exact overlay behavior, so you can copy it into a Vue app if needed.

## Objective 2 — Put Digits Inside Screen (New Bounding Box)
- Update the overlay container that wraps the digits on the timer PNG:
  - from current: `top-[22%] bottom-[22%] left-[11%] right-[11%]`
  - to your starting point: `top-[18%] bottom-[18%] left-[8%] right-[8%]`
- Keep: `flex items-center justify-center z-20` so it stays centered vertically and always above the image.

## Deliverables
1) New file: `LayoutRuler.tsx` + integration into `MissionObserverHero.tsx`.
2) Updated countdown overlay safe-zone percentages in `MissionObserverHero.tsx`.
3) “Output code” you requested: Vue template + CSS for HeroSection including LayoutRuler overlay and the corrected safe-zone positioning.
4) Quick verification: TypeScript diagnostics + `npm run build` passes.

If you confirm, I will apply the edits exactly as above and keep the ruler clearly marked as temporary/debug-only (and disabled by default via env flag).