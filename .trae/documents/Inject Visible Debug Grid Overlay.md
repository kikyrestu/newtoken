## Why You Can’t See the Grid Right Now
The existing ruler in this repo is currently gated behind an env flag:
- `import.meta.env.VITE_SHOW_LAYOUT_RULER === 'true'` in [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx#L53-L57)
So unless you set `VITE_SHOW_LAYOUT_RULER=true`, it won’t render.

## What I Will Do (Exactly What You Asked)
### 1) Inject your 10×10 debug grid overlay at the very bottom of the hero
- Place it as the **last child** inside the root hero wrapper (right before the final closing tag), with:
  - `absolute inset-0`
  - `z-[100]`
  - `pointer-events-none`
  - `flex flex-wrap opacity-50`
- Because this repo is React/TSX (no `.vue` files), I’ll inject a **TSX-equivalent** that preserves the exact logic:
  - 100 cells
  - X labels for `i <= 10`
  - Y labels for `(i-1) % 10 === 0`
  - Same % calculations

### 2) Keep everything else unchanged
No changes to your countdown positioning in this step.

## What You Will See After
A red 10×10 grid overlay covering the **entire screen**, above the drone video and all UI (but not blocking clicks).

## Resulting Injected Block (TSX form)
This will be inserted at the bottom of [MissionObserverHero.tsx](file:///d:/PROJECT/NEWTOKECRYPTO/frontend/src/components/MissionObserverHero.tsx):

```tsx
<div className="absolute inset-0 z-[100] pointer-events-none flex flex-wrap opacity-50">
  {Array.from({ length: 100 }, (_, idx) => {
    const i = idx + 1;
    return (
      <div key={i} className="w-[10%] h-[10%] border-[0.5px] border-red-500 relative">
        {i <= 10 && (
          <span className="absolute top-0 left-1 text-[10px] text-red-500 font-bold bg-black/50 px-1">
            X: {(i - 1) * 10}%
          </span>
        )}
        {(i - 1) % 10 === 0 && (
          <span className="absolute top-0 left-1 text-[10px] text-red-500 font-bold bg-black/50 px-1">
            Y: {Math.floor((i - 1) / 10) * 10}%
          </span>
        )}
      </div>
    );
  })}
</div>
```

Once approved, I’ll apply the edit and then paste the full updated MissionObserverHero.tsx file output.