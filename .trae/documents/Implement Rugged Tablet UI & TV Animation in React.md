I will enhance the "Mission Launchpad" hero section by implementing the requested "Rugged Tablet" design and "TV Turn-On" animation. Since the project is built with **React**, I will implement these features in `MissionObserverHero.tsx` rather than introducing Vue.js, ensuring seamless integration and performance.

### 1. Style & Animation Updates (`src/styles/main.css`)
I will add the CRT "TV Turn-On" animation keyframes to your global CSS.
- **Animation Logic**: The modal will start as a thin horizontal line (Scale Y ~0) and then expand vertically to full height, simulating an old-school screen powering up.
- **Classes**: `.animate-tv-on` and `.animate-tv-off` (reverse).

### 2. Component Logic (`src/components/MissionObserverHero.tsx`)
I will refactor the existing Hero component to handle the new interaction flow:
- **State Management**: Add `showSafetyModal` state to toggle between the Countdown Timer and the Info Modal.
- **Left HUD Update**: Add the "Safety Measures" button to the "System Status" panel on the left side to trigger the modal.
- **Center Stage**:
  - **Default**: Shows the existing `CountdownTimer`.
  - **Active**: Shows the new `InfoModal` with the "Rugged Tablet" design.

### 3. Rugged Tablet UI Design
The new Info Modal will be styled using Tailwind CSS to match the "Defense Protocol" theme:
- **Structure**: A thick, dark industrial frame (`border-slate-800`, `bg-slate-900`) with rounded corners.
- **Details**: "Bolts" or rivets in the corners using CSS, a "mesh" background texture, and neon green accents.
- **Content**: The requested "Safety and Control Systems" text (Altitude Enforcement, Geo-Fence, etc.) will be hardcoded inside this modal.

### 4. Implementation Steps
1.  **Edit `src/styles/main.css`**: Add `@keyframes` for the TV effect.
2.  **Edit `src/components/MissionObserverHero.tsx`**: 
    - Import `X` icon from `lucide-react`.
    - Implement the `InfoModal` sub-component (or inline render) with the Rugged Tablet styles.
    - Wire up the "Safety Measures" button.

Does this plan to implement the features in **React** meet your approval?