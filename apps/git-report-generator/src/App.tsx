import { Routes, Route, Link } from 'react-router-dom'
import Git from './pages/Git'
import "./App.css"

function App() {
  return (
    <div>
      <Routes>
        <Route path="/git" element={<Git />} />
      </Routes>
    </div>
  )
}
export default App
