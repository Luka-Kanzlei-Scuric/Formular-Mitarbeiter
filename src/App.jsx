import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/form/:taskId" element={<PrivatinsolvenzFormular />} />
    </Routes>
  );
}

export default App;