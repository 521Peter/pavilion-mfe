import { Routes, Route } from "react-router-dom";
import Git from "./pages/Git";
import "./App.css";

function App() {
  return (
    <div className="git-report-app">
      <Routes>
        <Route path="/git/*" element={<Git />} />
      </Routes>
    </div>
  );
}
export default App;
