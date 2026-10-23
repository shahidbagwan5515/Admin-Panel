import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";

const menuItems = [
  { title: "Dashboard", icon: <DashboardOutlinedIcon /> },
  { title: "Users", icon: <PeopleAltOutlinedIcon /> },
  { title: "Products", icon: <Inventory2OutlinedIcon /> },
  { title: "Orders", icon: <ShoppingCartOutlinedIcon /> },
  { title: "Analytics", icon: <BarChartOutlinedIcon /> },
];

function Sidebar({ open, onNavigate, onLogout }) {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const navigate = useNavigate();

  const handleNavigation = (title) => {
    setActiveItem(title);

    if (title === "Dashboard") {
      navigate("/Header/Dashboard");
    }

    if (onNavigate) {
      onNavigate(title);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      console.log("Logout clicked");
    }
  };

  const renderMenuItem = (item) => (
    <Tooltip
      key={item.title}
      title={open ? "" : item.title}
      placement="right"
      arrow
    >
      <ListItemButton
        className={`sidebar-menu-item ${
          activeItem === item.title ? "active" : ""
        }`}
        onClick={() => handleNavigation(item.title)}
        selected={activeItem === item.title}
        aria-current={activeItem === item.title ? "page" : undefined}
      >
        <ListItemIcon className="sidebar-menu-icon">{item.icon}</ListItemIcon>

        {open && (
          <ListItemText
            primary={item.title}
            slotProps={{
              primary: { className: "sidebar-menu-text" },
            }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );

  return (
    <Box
      component="aside"
      className={`sidebar ${open ? "sidebar-open" : "sidebar-collapsed"}`}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <Box className="sidebar-brand">
        <Box className="sidebar-brand-icon">
          <BusinessRoundedIcon />
        </Box>

        {open && (
          <Typography className="sidebar-brand-name">Dashboard</Typography>
        )}
      </Box>

      <Divider className="sidebar-divider" />

      {/* Navigation */}
      <Box className="sidebar-navigation">
        {open && (
          <Typography className="sidebar-section-label">MAIN MENU</Typography>
        )}

        <List className="sidebar-menu" disablePadding>
          {menuItems.map(renderMenuItem)}
        </List>
      </Box>

      {/* Logout */}
      <Box className="sidebar-bottom">
        <Divider className="sidebar-divider" />

        <Tooltip title={open ? "" : "Logout"} placement="right" arrow>
          <Button
            className="sidebar-logout-btn"
            startIcon={<LogoutRoundedIcon />}
            onClick={handleLogout}
            fullWidth
          >
            {open ? "Logout" : ""}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default Sidebar;
