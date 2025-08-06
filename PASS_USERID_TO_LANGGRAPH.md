# Passing `userId` to LangGraph Agent in This Project

To pass a `userId` (e.g., `4345`) as part of the input to your LangGraph agent, you need to include it in the payload sent via the `submit` function. Below are the main places in the codebase where you should add this field, along with example code snippets.

---

## 1. Standard Message Submission (Main Chat Input)

- **File:** `src/components/thread/index.tsx`
- **Function:** `handleSubmit`
- **Current code:**
  ```js
  stream.submit(
    { messages: [...toolMessages, newHumanMessage], context },
    { ... }
  );
  ```
- **Update to:**
  ```js
  stream.submit(
    { messages: [...toolMessages, newHumanMessage], context, userId: 4345 },
    { ... }
  );
  ```

---

## 2. Human Message Edit (Edit Sent Message)

- **File:** `src/components/thread/messages/human.tsx`
- **Function:** `handleSubmitEdit`
- **Current code:**
  ```js
  thread.submit(
    { messages: [newMessage] },
    { ... }
  );
  ```
- **Update to:**
  ```js
  thread.submit(
    { messages: [newMessage], userId: 4345 },
    { ... }
  );
  ```

---

## 3. Agent-Inbox/Human Interrupt Actions (Accept/Edit/Response)

- **File:** `src/components/thread/agent-inbox/hooks/use-interrupted-actions.tsx`
- **Function:** `resumeRun`
- **Current code:**
  ```js
  thread.submit(
    {},
    {
      command: {
        resume: response,
      },
    },
  );
  ```
- **Update to:**
  ```js
  thread.submit(
    { userId: 4345 },
    {
      command: {
        resume: response,
      },
    },
  );
  ```

---

## Notes

- If you want to make `userId` dynamic (not hardcoded), consider passing it from a context, environment variable, or user session.
- This approach ensures that every interaction with the LangGraph agent includes the `userId` in the payload, allowing the backend to use it for personalization, logging, or other purposes.

---

**Summary:**

- Add `userId: 4345` to the first argument of every `submit` call that sends input to the agent.
- Adjust as needed for your application's requirements.
