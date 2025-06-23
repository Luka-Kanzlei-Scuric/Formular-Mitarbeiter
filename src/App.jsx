import { Routes, Route } from "react-router-dom";
import PrivatinsolvenzFormular from './components/PrivatinsolvenzFormular';
import SearchForm from './components/ui/SearchForm';

const Home = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Willkommen</h1>
    <p className="mb-6">Bitte nutzen Sie einen gültigen Formular-Link oder suchen Sie nach einem Formular.</p>
    <SearchForm />
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="form/:taskId" element={<PrivatinsolvenzFormular />} />
        <Route path="search" element={<SearchForm />} />
      </Routes>
    </div>
  );
}

export default App;  // Diese Zeile hat gefehlt!