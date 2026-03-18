import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { AddWord } from "./pages/AddWord";
import { Review } from "./pages/Review";
import { NodeDetail } from "./pages/NodeDetail";
import { Frontier } from "./pages/Frontier";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddWord />} />
          <Route path="/review" element={<Review />} />
          <Route path="/frontier" element={<Frontier />} />
          <Route path="/nodes/:id" element={<NodeDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
