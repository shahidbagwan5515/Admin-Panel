import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Header from "./component/Header/Header";
import Dashboard from "./component/Dashboard/Dashboard";
import Login from "./component/Login/Login";
import Stock from "./component/Stock Add/Stock";
import User from "./component/User/User";
import Order from "./component/Order/Order";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem("isLoggedIn") === "true",
  );

  const handleLogin = () => {
    sessionStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={isLoggedIn ? "/Header/Dashboard" : "/Login"}
              replace
            />
          }
        />

        <Route
          path="/Login"
          element={
            isLoggedIn ? (
              <Navigate to="/Header/Dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/Header"
          element={
            isLoggedIn ? (
              <Header onLogout={handleLogout} />
            ) : (
              <Navigate to="/Login" replace />
            )
          }
        >
          <Route index element={<Navigate to="Dashboard" replace />} />
          <Route path="Dashboard" element={<Dashboard />} />
          <Route path="User" element={<User />} />
          <Route path="Product" element={<h1>Products</h1>} />
          <Route path="Order" element={<Order />} />
          <Route path="Stock" element={<Stock />} />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to={isLoggedIn ? "/Header/Dashboard" : "/Login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
