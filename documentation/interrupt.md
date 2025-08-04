# Handling Interrupts in LangGraph

LangGraph provides a powerful way to manage interactive workflows by allowing the server to pause execution and wait for input from the client. This feature is called an **interrupt**.

Below is a clear and simple guide to handling interrupts in LangGraph on both the server side and client side.

---

## 🚀 Server Side: Sending an Interrupt

To send an interrupt from the server, use the `interrupt()` function. This will pause the flow and send a JSON object to the client.

### ✅ Example:

```ts
const result = interrupt({
  value: {
    interrupt_id: "32835f20-f631-4f0d-9e8e-8b0018bedf50",
    type: "SearchCriteriaWidget",
    searchCriteria: searchCriteria,
    selectedTravellers: selectedTravellers,
  },
});
```

- `interrupt_id`: A unique ID to track the interrupt.
- `type`: The type of widget or component you want to render on the UI.
- Additional fields (e.g., `searchCriteria`, `selectedTravellers`) can be passed as needed.

Once the interrupt is sent, LangGraph will pause execution and wait for a response from the client.

---

## 🧑‍💻 Client Side: Handling the Interrupt

When the client receives the interrupt, it will get a JSON object with the data sent from the server.

### ✅ Step 1: Render the Interrupt Component

Use the `type` from the JSON object to render the appropriate widget.

```tsx
const interruptType = interruptData.type;
const interruptProps = interruptData;

return (
  <DynamicRenderer
    type={interruptType}
    interrupt={interruptProps}
  />
);
```

Use a `switch` statement or `componentMap` to map the type to the correct React component.

### ✅ Step 2: Resume the Graph with a Response

Once the user submits data from the UI, send it back to the server using:

```ts
const thread = useStreamContext();

await thread.submit(
  {},
  {
    command: {
      type: "resume",
      value: {
        interrupt_id: "32835f20-f631-4f0d-9e8e-8b0018bedf50",
        // Add any data that needs to be sent back to the server
        userInput: "User's response",
      },
    },
  },
);
```

---

## 🎯 New: widgetFromBE Interrupt Type

The `widgetFromBE` interrupt type allows rendering UI widgets that are sent from the backend via the typed stream. This is useful for dynamic, configurable widgets.

### ✅ Server Side: Sending widgetFromBE Interrupt

```ts
const response = interrupt({
  value: {
    type: "widgetFromBE",
    metadata: {
      attachmentId: uiWidget.id, // This should match a UI widget ID in the typed stream
    },
  },
});
```

### ✅ Client Side: Handling widgetFromBE Interrupt

The system automatically:

1. **Extracts the attachmentId** from `interrupt.value.metadata.attachmentId`
2. **Finds the matching UI widget** in the typed stream (`stream.values.ui`)
3. **Renders the widget** using `LoadExternalComponent` with the UI widget data

The widget will be rendered on the chat screen using the UI data from the typed stream, making it fully configurable from the backend.

### ✅ Example Flow

1. Backend sends UI widget via typed stream with ID `"flight-options-123"`
2. Backend sends interrupt with `attachmentId: "flight-options-123"`
3. Frontend finds the UI widget with matching ID
4. Frontend renders the widget using `LoadExternalComponent`
5. User interacts with the widget
6. User submits response to resume the graph

This approach allows for completely dynamic and configurable UI widgets that can be defined and sent from the backend.

---

## ✅ Summary

| Step | Server                                             | Client                                           |
| ---- | -------------------------------------------------- | ------------------------------------------------ |
| 1    | Call `interrupt()` to pause and send a widget type | Receive JSON object with `type` and other fields |
| 2    | Wait for client response                           | Render component based on `type`                 |
| 3    | Receive submitted data                             | Call `thread.submit()` to resume flow            |

This makes it easy to build interactive flows using LangGraph where the server can ask for input mid-execution and the client can respond with structured data.

---

Let us know if you want to add file upload, rich widgets, or conditional rendering next!
