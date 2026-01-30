## **Root Cause (Why It Looks Wrong)**
Right now the **RuggedTerminal CSS frame** is wrapping **both** states (Timer + Modal). The original requirement is strict:
- **State A (Countdown)**: must be the **PNG device frame** with digits overlaid.
- **State B (Modal)**: must be the **CSS Rugged Tablet** with TV/CRT animation.

Also, your repo currently has the timer asset at:
- [public](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/public) → `time-countdown.png`
There is **no** `/assets/timer-countdown.png` yet, so the path in the requirement is not currently valid.

## **Plan**
### 1) Fix Asset Path (Make `/assets/timer-countdown.png` real)
- Create folder `frontend/public/assets/`
- Copy/duplicate existing `frontend/public/time-countdown.png` to `frontend/public/assets/timer-countdown.png`
- Result: `src="/assets/timer-countdown.png"` works exactly as requested.

### 2) Refactor Center Rendering in MissionObserverHero (Strict v-if / v-else Equivalent)
Replace the current center block so it uses a single wrapper with **fixed dimensions** (prevents layout jumping), but switches internals:
- **If `!showSafetyModal`**: render **PNG timer frame** + **absolute overlay** digits.
- **Else**: render **CSS RuggedTerminal** + modal content + TV-on animation.

### 3) Keep Both States Dimension-Locked
Use the same outer container for both states:
- `w-full max-w-3xl h-[300px] md:h-[400px]`
This ensures the switch feels like **screen content changes** inside a device, not a layout reshuffle.

## **Proposed Code Block (Center Area Replacement)**
This is the exact conditional structure you requested (ternary = v-if/v-else equivalent). It assumes you’ll keep your existing `RuggedTerminal` and modal content.

```tsx
{/* CENTER DISPLAY AREA - STRICT CONDITIONAL */}
<div className="flex-shrink-0 flex items-center justify-center px-4 w-full">
  {!showSafetyModal ? (
    // STATE A: Countdown Active (PNG ONLY)
    <div className="w-full max-w-3xl h-[300px] md:h-[400px] flex items-center justify-center">
      <div className="relative h-full w-auto max-w-full">
        <img
          src="/assets/timer-countdown.png"
          alt="Countdown Frame"
          className="h-full w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
        />

        {/* Digits overlay - positioned on top of PNG */}
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] flex justify-center">
            <CountdownTimer unlockTimestamp={unlockTimestamp} size="md" showLabels={false} />
          </div>
        </div>
      </div>
    </div>
  ) : (
    // STATE B: Modal Active (CSS Rugged Tablet ONLY)
    <RuggedTerminal className="w-full max-w-3xl h-[300px] md:h-[400px]">
      <div className="h-full w-full flex flex-col p-6 md:p-8 animate-tv-on overflow-y-auto">
        {/* ...existing modal header + list + close button... */}
      </div>
    </RuggedTerminal>
  )}
</div>
```

## **Implementation Notes**
- The overlay box (`w-[60%]`) might need a tiny `top-[45%]` tweak depending on the PNG’s screen window. I’ll tune it by matching the exact visible “screen” region of the timer asset.
- The timer state will have **no rugged borders**, exactly as requested.

If you confirm, I will apply this refactor in [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx) and add the missing `public/assets/timer-countdown.png` file so the path is correct.