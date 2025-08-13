## Interrupt Widgets: Authoring Guide

This guide explains how to create new interrupt widgets that integrate with the unified stream timeline, support read-only freezing after submission, and hydrate correctly on refresh.

### What every interrupt widget receives

- `apiData`: normalized interrupt envelope.
  - `apiData.value.widget.type`: widget type string you mapped
  - `apiData.value.widget.args`: the live args sent from the backend
  - `apiData.value.widget.args.submission`: the frozen snapshot (present only after submission)
- `readOnly`: boolean indicating whether the widget has been completed and must render as read-only
- `interruptId` (generic widgets): the stable interrupt id for completion helpers

Notes:

- `value` and `frozenValue` can differ. After submission, the renderer injects the frozen snapshot as `args.submission` alongside the original `args`.
- Use `readOnly` to decide which set of values to render (or combination of value and frozenValue can also be used)

---

### Step-by-step: Create a new interrupt widget

1. Create your component

- Path: `src/components/widgets/YourWidget.widget.tsx`
- Export a React component and mark it as a client component when needed.
- Define props to include:
  - `apiData?: any`
  - `readOnly?: boolean`
  - `interruptId?: string`
  - Plus any widget-specific props you expect in `widget.args`.

Example skeleton:

```tsx
"use client";

import React from "react";
import { useStreamContext } from "@/providers/Stream";
import { submitInterruptResponse } from "./util";

interface YourWidgetProps {
  // Interrupt props
  apiData?: any;
  readOnly?: boolean;
  interruptId?: string;
  // Your own args (optional)
  title?: string;
}

const YourWidget: React.FC<YourWidgetProps> = ({
  apiData,
  readOnly,
  interruptId,
  title,
}) => {
  // 1) Hydrate values
  const liveArgs = apiData?.value?.widget?.args;
  const frozenArgs = liveArgs?.submission; // present after submit
  const effectiveArgs = readOnly && frozenArgs ? frozenArgs : liveArgs; // Or create effectiveArgs by combining frozenArgs

  // 2) Local UI state can be initialized from effectiveArgs
  // const [form, setForm] = React.useState(effectiveArgs?.initialField ?? "");

  const thread = useStreamContext();

  // 3) Submit handler
  async function handleSubmit() {
    const submission = {
      // Build the compact snapshot you want to freeze
      // e.g., fields from your local form state
    };

    // Provide a frozen snapshot so the UI can hydrate on reload in readOnly mode
    const frozenValue = {
      widget: { type: "YourWidget", args: submission },
      value: {
        type: "widget",
        widget: { type: "YourWidget", args: submission },
      },
    };

    await submitInterruptResponse(thread, "response", submission, {
      interruptId, // pass-through if provided
      frozenValue,
    });
  }

  return (
    <div>
      {/* Render from effectiveArgs; guard editability using readOnly */}
      {/* <input disabled={readOnly} value={form} onChange={(e) => setForm(e.target.value)} /> */}
      {/* <button disabled={readOnly} onClick={handleSubmit}>Submit</button> */}
      {title}
    </div>
  );
};

export default YourWidget;
```

2. Map the widget type

- Add your component to `src/components/widgets/index.ts` with the type your agent emits:

```ts
import YourWidget from "./YourWidget.widget";

export const componentMap = {
  // ...existing mappings
  YourWidget,
} as const;
```

3. Emit an interrupt from the backend

- Your agent should emit a `widget` interrupt with `type: "YourWidget"` and an `args` payload you plan to render from:

```ts
// pseudo server-side shape
{
  value: {
    type: "widget",
    widget: {
      type: "YourWidget",
      args: {
        title: "Fill the form",
        // other inputs to render
      },
    },
  },
}
```

4. Hydrate correctly (live vs frozen)

- In your component, compute:

```ts
const liveArgs = apiData?.value?.widget?.args; // original args
const frozenArgs = liveArgs?.submission; // injected after submit
const effectiveArgs = readOnly && frozenArgs ? frozenArgs : liveArgs; // choose by mode
```

- Render from `effectiveArgs` so that on reload (readOnly), the UI shows the frozen snapshot.

5. Submit and freeze

- On user submit, call the helper that resumes the graph and completes the interrupt locally with your frozen snapshot:

```ts
await submitInterruptResponse(thread, "response", submission, {
  interruptId, // optional; when omitted, the helper finds the latest active interrupt
  frozenValue: {
    widget: { type: "YourWidget", args: submission },
    value: { type: "widget", widget: { type: "YourWidget", args: submission } },
  },
});
```

- After success, the stream store marks the interrupt as completed and persists it. On refresh, `readOnly` will be true and `args.submission` will be present for hydration.

---

### Advanced

- Rendering window: If your widget should render in the itinerary panel instead of chat, set `args.renderingWindow = "itinerary"`. The renderer will mount it in the itinerary window.
- Visual read-only cues: A global read-only guard blocks pointer events while `readOnly` is true. You may add visual disabled styles using the `readOnly` prop.
```
const MyWidget = ({ readOnly, apiData }: { readOnly?: boolean; apiData?: any }) => {
  const liveArgs = apiData?.value?.widget?.args;
  const frozenArgs = liveArgs?.submission;
  const effective = readOnly && frozenArgs ? frozenArgs : liveArgs;

  return (
    <div className={readOnly ? "opacity-60 cursor-not-allowed" : ""} aria-disabled={readOnly}>
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Traveler details</h3>
        {readOnly ? <span className="text-xs rounded px-2 py-0.5 bg-gray-100 text-gray-600">Read-only</span> : null}
      </div>

      <input
        className="mt-2 w-full border rounded px-2 py-1.5 disabled:bg-gray-50 disabled:text-gray-500"
        disabled={readOnly}
        defaultValue={effective?.name}
      />

      <button
        className={`mt-3 rounded px-3 py-1.5 ${readOnly ? "bg-gray-300 text-white" : "bg-blue-600 text-white"}`}
        disabled={readOnly}
      >
        Submit
      </button>
    </div>
  );
};
```
- Data model differences: It's expected that `value` and `frozenValue` differ. The renderer preserves original `args` and injects a frozen `args.submission`. Always prefer `submission` when `readOnly` is true.

---

### Quick checklist

- [ ] Create `YourWidget.widget.tsx` with `apiData`, `readOnly`, `interruptId` props
- [ ] Map it in `src/components/widgets/index.ts`
- [ ] Hydrate using `liveArgs` vs `frozenArgs` per `readOnly`
- [ ] Submit via `submitInterruptResponse(...)` with a compact `frozenValue`
- [ ] Optionally set `args.renderingWindow = "itinerary"` for itinerary rendering
