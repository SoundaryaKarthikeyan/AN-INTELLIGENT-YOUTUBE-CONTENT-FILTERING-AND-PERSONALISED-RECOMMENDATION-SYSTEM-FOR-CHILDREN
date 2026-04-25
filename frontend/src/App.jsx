import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import ParentDashboard from "./ParentDashboard";
import CreateChild from "./CreateChild";
import ChildScreen from "./ChildScreen";
import AgeVerification from "./AgeVerification";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ParentDashboard />} />
        <Route path="/create-child" element={<CreateChild />} />
        <Route path="/child/:id" element={<ChildScreen />} />
        <Route path="/verify/:id" element={<AgeVerification />} />
      </Routes>
    </BrowserRouter>
  );
}