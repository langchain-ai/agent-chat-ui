import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThreadProvider } from "./providers/Thread.tsx";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/contexts/UserContext";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <QueryParamProvider adapter={ReactRouter6Adapter}>
      <UserProvider>
        <ThreadProvider>
          <App />
        </ThreadProvider>
      </UserProvider>
    </QueryParamProvider>
    <Toaster />
  </BrowserRouter>,
);
