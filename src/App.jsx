import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivatinsolvenzFormular from "./components/PrivatinsolvenzFormular";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/form/:taskId" element={<PrivatinsolvenzFormular />} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;