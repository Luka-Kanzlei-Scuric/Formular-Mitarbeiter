import { Routes, Route } from "react-router-dom";
import PrivatinsolvenzFormular from './components/PrivatinsolvenzFormular';

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="form/:taskId" element={<PrivatinsolvenzFormular />} /> {/* kein führender Slash */}
    </Routes>
  );
}