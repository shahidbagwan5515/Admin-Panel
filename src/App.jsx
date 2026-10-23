import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./component/Header/Header";
import Dashboard from "./component/Dashboard/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Header" replace />} />

        <Route path="/Header" element={<Header />}>
          <Route index element={<Navigate to="Dashboard" replace />} />
          <Route path="Dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
