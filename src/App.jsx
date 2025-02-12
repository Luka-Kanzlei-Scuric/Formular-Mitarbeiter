import { Routes, Route } from "react-router-dom";
import PrivatinsolvenzFormular from './components/PrivatinsolvenzFormular';

const Home = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Willkommen</h1>
    <p>Bitte nutzen Sie einen gültigen Formular-Link.</p>
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="form/:taskId" element={<PrivatinsolvenzFormular />} />
      </Routes>
    </div>
  );
}

export default App;  // Diese Zeile hat gefehlt!