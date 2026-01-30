## Updated Vue Template (Pixel-Safe Screen Box)
Below is the exact wrapper structure you asked for: **relative image wrapper** + **absolute safe-zone text box** that stays inside the dark screen area and never touches the bezel.

```vue
<template>
  <!-- Device wrapper (smaller, substantial) -->
  <div class="w-full max-w-2xl mx-auto">
    <div class="relative w-full">
      <img
        src="/assets/timer-countdown.png"
        alt="Countdown Device"
        class="w-full h-auto object-contain select-none pointer-events-none"
      />

      <!-- SAFE ZONE: confined strictly inside the dark screen -->
      <div
        class="absolute top-[22%] bottom-[22%] left-[11%] right-[11%] flex items-center justify-center z-20"
      >
        <div
          class="font-orbitron text-[#00ff41] drop-shadow-[0_0_12px_rgba(0,255,65,0.65)] tracking-widest text-[5vw] md:text-[3.5rem] tabular-nums"
        >
          {{ timeString }}
        </div>
      </div>
    </div>
  </div>
</template>
```

- `max-w-2xl` ≈ **672px** (your target 650–700px).
- The safe zone uses your exact classes: `absolute top-[22%] bottom-[22%] left-[11%] right-[11%] flex items-center justify-center`.
- `z-20` ensures digits render above the PNG.
- Font sizing uses **responsive** `text-[5vw] md:text-[3.5rem]` + `tracking-widest`.

## Plan to Apply This in Your Actual Codebase (React Equivalent)
If you want this reflected in your running app (currently React), I will:
1. Change the countdown container from `max-w-5xl` → `max-w-2xl` in [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx).
2. Replace the current overlay box with exactly:
   - `absolute top-[22%] bottom-[22%] left-[11%] right-[11%] flex items-center justify-center z-20`
3. Adjust `variant="device"` digits to match `text-[5vw] md:text-[3.5rem] tracking-widest` (already supported by current markup).

Reply “apply it” and I’ll implement the React-side changes to match this Vue template precisely.