import "./App.css";
import { Routes, Route } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { AuthCallback } from './components/auth/AuthCallback';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Thread } from "@/components/thread";
import { StreamProvider } from "./providers/Stream.tsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <StreamProvider>
              <Thread />
            </StreamProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
