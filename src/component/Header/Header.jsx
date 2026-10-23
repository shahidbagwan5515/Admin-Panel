import React, { useState, useEffect } from "react";
import "./Header.css";
import Sidebar from "../Sidebar/Sidebar";
import { Outlet, useLocation } from "react-router-dom";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth > 600 : true;
  });

  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth <= 600 : false;
  });

  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 600;

      setIsMobile((previousMobile) => {
        // Only reset sidebar when crossing mobile/desktop breakpoint
        if (previousMobile !== mobile) {
          setSidebarOpen(!mobile);
          return mobile;
        }

        return previousMobile;
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close mobile sidebar after navigation
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <Box className="admin-layout">
      {isMobile && sidebarOpen && (
        <Box className="sidebar-overlay" onClick={closeMobileSidebar} />
      )}

      <Sidebar open={sidebarOpen} onNavigate={closeMobileSidebar} />

      <Box
        className={`admin-main ${
          sidebarOpen ? "main-expanded" : "main-collapsed"
        } ${isMobile ? "mobile-main" : ""}`}
      >
        <AppBar position="static" elevation={0} className="admin-header">
          <Toolbar className="admin-toolbar">
            <Box className="admin-header-left">
              <IconButton
                className="admin-menu-btn"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={sidebarOpen}
              >
                {isMobile && sidebarOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>

              <Typography variant="h6" className="admin-title">
                Admin Panel
              </Typography>
            </Box>

            <Box className="admin-header-right">
              <Avatar className="admin-avatar">A</Avatar>

              <Box className="admin-profile">
                <Typography className="admin-name">Admin</Typography>
                <Typography className="admin-role">Administrator</Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        <Box className="admin-content">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Header;
