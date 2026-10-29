import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

const menuItems = [
  {
    title: "Dashboard",
    icon: <DashboardOutlinedIcon />,
    path: "/Header/Dashboard",
  },
  {
    title: "Stock",
    icon: <BarChartOutlinedIcon />,
    path: "/Header/Stock",
  },
  {
    title: "Users",
    icon: <PeopleAltOutlinedIcon />,
    path: "/Header/User",
  },
  {
    title: "Orders",
    icon: <ShoppingCartOutlinedIcon />,
    path: "/Header/Order",
  },
  {
    title: "Category",
    icon: <CategoryOutlinedIcon />,
    path: "/Header/Category",
  },
  {
    title: "Product",
    icon: <Inventory2OutlinedIcon />,
    path: "/Header/Product",
  },
  {
    title: "Customer",
    icon: <PersonOutlineOutlinedIcon />,
    path: "/Header/Customer",
  },
];
function Sidebar({ open, onNavigate, onLogout }) {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const navigate = useNavigate();

  const handleNavigation = (item) => {
    setActiveItem(item.title);

    navigate(item.path);

    if (onNavigate) {
      onNavigate(item.title);
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
        component={Link}
        to={item.path}
        className={`sidebar-menu-item ${
          activeItem === item.title ? "active" : ""
        }`}
        onClick={() => handleNavigation(item)}
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
