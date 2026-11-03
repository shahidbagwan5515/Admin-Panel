import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

const API_URL = "http://localhost/Admin-Panel/dashboard/Backend/api/users.php";

// -------------------------------------
// SIDEBAR MENU
// -------------------------------------

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
    title: "Roles",
    icon: <PeopleAltOutlinedIcon />,
    path: "/Header/Roles",
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
  {
    title: "Payment",
    icon: <PaymentOutlinedIcon />,
    path: "/Header/Payment",
  },
];

// -------------------------------------
// NORMALIZE PERMISSION
// -------------------------------------

const normalizePermission = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

// -------------------------------------
// PARSE PERMISSIONS
// -------------------------------------

const parsePermissions = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

// -------------------------------------
// GET STORED USER
// -------------------------------------

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

// -------------------------------------
// SIDEBAR COMPONENT
// -------------------------------------

function Sidebar({ open, onNavigate, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(getStoredUser);

  // -------------------------------------
  // REFRESH USER FROM DATABASE
  // -------------------------------------

  const refreshUser = useCallback(async () => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      setUser(null);
      return;
    }

    setUser(storedUser);

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to fetch users.");
      }

      const users = Array.isArray(result.data) ? result.data : [];

      const latestUser = users.find((item) => {
        if (storedUser.id && item.id) {
          return Number(item.id) === Number(storedUser.id);
        }

        return (
          storedUser.email &&
          item.email?.toLowerCase() === storedUser.email.toLowerCase()
        );
      });

      if (!latestUser) {
        console.error("Logged-in user not found.");
        return;
      }

      const updatedUser = {
        ...storedUser,
        ...latestUser,
        permissions: parsePermissions(latestUser.permissions),
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setUser(updatedUser);

      console.log("Updated user permissions:", updatedUser.permissions);
    } catch (error) {
      console.error("Sidebar API error:", error);
    }
  }, []);

  // -------------------------------------
  // LISTEN FOR PERMISSION UPDATES
  // -------------------------------------

  useEffect(() => {
    refreshUser();

    const handlePermissionUpdate = () => {
      refreshUser();
    };

    const handleStorageChange = (event) => {
      if (event.key === "user") {
        refreshUser();
      }
    };

    window.addEventListener("permissionsUpdated", handlePermissionUpdate);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("permissionsUpdated", handlePermissionUpdate);

      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshUser]);

  // -------------------------------------
  // USER ROLE
  // -------------------------------------

  const role = normalizePermission(user?.role);

  // Only superAdmin gets full access.
  const isSuperAdmin = role === "superadmin";

  // -------------------------------------
  // USER PERMISSIONS
  // -------------------------------------

  const permissions = parsePermissions(user?.permissions).map(
    normalizePermission,
  );

  // -------------------------------------
  // FILTER SIDEBAR MENU
  // -------------------------------------

  const filteredMenuItems = isSuperAdmin
    ? menuItems
    : menuItems.filter((item) =>
        permissions.includes(normalizePermission(item.title)),
      );

  // -------------------------------------
  // LOGOUT
  // -------------------------------------

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  // -------------------------------------
  // UI
  // -------------------------------------

  return (
    <Box
      component="aside"
      className={`sidebar ${open ? "sidebar-open" : "sidebar-collapsed"}`}
      aria-label="Main navigation"
    >
      <Box className="sidebar-brand">
        <Box className="sidebar-brand-icon">
          <BusinessRoundedIcon />
        </Box>

        {open && (
          <Typography className="sidebar-brand-name">Dashboard</Typography>
        )}
      </Box>

      <Divider className="sidebar-divider" />

      <Box className="sidebar-navigation">
        {open && (
          <Typography className="sidebar-section-label">MAIN MENU</Typography>
        )}

        <List className="sidebar-menu" disablePadding>
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Tooltip
                key={item.title}
                title={open ? "" : item.title}
                placement="right"
                arrow
              >
                <ListItemButton
                  component={Link}
                  to={item.path}
                  className={`sidebar-menu-item ${isActive ? "active" : ""}`}
                  onClick={() => onNavigate?.(item.title)}
                  selected={isActive}
                  aria-current={isActive ? "page" : undefined}
                >
                  <ListItemIcon className="sidebar-menu-icon">
                    {item.icon}
                  </ListItemIcon>

                  {open && (
                    <ListItemText
                      primary={item.title}
                      slotProps={{
                        primary: {
                          className: "sidebar-menu-text",
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>

        {!isSuperAdmin && filteredMenuItems.length === 0 && (
          <Typography
            sx={{
              px: 2,
              py: 2,
              fontSize: 13,
              color: "text.secondary",
            }}
          >
            No permissions assigned.
          </Typography>
        )}
      </Box>

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
