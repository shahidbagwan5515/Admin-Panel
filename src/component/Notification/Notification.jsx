import React, { useEffect, useState, useCallback } from "react";
import "./Notification.css";

import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import SearchIcon from "@mui/icons-material/Search";

const API_URL =
  "http://localhost/Admin-Panel/dashboard/Backend/api/notifications.php";

// Common API handler
const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Invalid server response. Check notifications.php.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || `API Error: ${response.status}`);
  }

  return result;
};

// Format date
const formatDate = (value) => {
  if (!value) return { date: "", time: "" };

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return { date: String(value), time: "" };
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  let displayDate = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (sameDay(date, today)) {
    displayDate = "Today";
  } else if (sameDay(date, yesterday)) {
    displayDate = "Yesterday";
  }

  return {
    date: displayDate,
    time: date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

// Notification icon
const getIcon = (type) => {
  switch (String(type || "").toLowerCase()) {
    case "order":
      return <ShoppingBagOutlinedIcon />;
    case "customer":
      return <PersonAddAltOutlinedIcon />;
    case "stock":
      return <Inventory2OutlinedIcon />;
    case "payment":
      return <PaymentOutlinedIcon />;
    case "offer":
      return <LocalOfferOutlinedIcon />;
    default:
      return <NotificationsActiveOutlinedIcon />;
  }
};

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Fetch notifications using PHP session
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (filter !== "All") {
        params.set("filter", filter);
      }

      const query = params.toString();
      const url = query ? `${API_URL}?${query}` : API_URL;

      const result = await apiRequest(url, {
        method: "GET",
      });

      const rows = result.data?.notifications || [];

      const formatted = rows.map((item) => {
        const formattedDate = formatDate(item.created_at);
        const isRead = Number(item.is_read) === 1;

        return {
          ...item,
          id: Number(item.id),
          read: isRead,
          is_read: isRead ? 1 : 0,
          type: item.type || "system",
          time: formattedDate.time,
          date: formattedDate.date,
          orderId:
            item.module === "Orders" || item.type === "order"
              ? item.reference_id
              : null,
        };
      });

      setNotifications(formatted);
      setUnreadCount(Number(result.data?.unread_count || 0));
    } catch (err) {
      console.error("Notification Fetch Error:", err);
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark one notification as read
  const markAsRead = async (id) => {
    const selected = notifications.find((item) => item.id === Number(id));

    if (!selected || selected.read) return;

    try {
      await apiRequest(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark_read",
          id: Number(id),
        }),
      });

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === Number(id) ? { ...item, read: true, is_read: 1 } : item,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark Read Error:", err);
      alert(err.message);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (unreadCount === 0 || processing) return;

    try {
      setProcessing(true);

      await apiRequest(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark_all_read",
        }),
      });

      await fetchNotifications();
    } catch (err) {
      console.error("Mark All Read Error:", err);
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Delete one notification
  const deleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      setProcessing(true);

      await apiRequest(`${API_URL}?id=${Number(id)}`, {
        method: "DELETE",
      });

      await fetchNotifications();
    } catch (err) {
      console.error("Delete Notification Error:", err);
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Delete all notifications
  const clearAll = async () => {
    if (!notifications.length || processing) return;

    if (!window.confirm("Are you sure you want to delete all notifications?")) {
      return;
    }

    try {
      setProcessing(true);

      await apiRequest(`${API_URL}?all=1`, {
        method: "DELETE",
      });

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Clear Notifications Error:", err);
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.read) {
      await markAsRead(item.id);
    }

    if (item.type === "order" && item.orderId) {
      alert(`Order ID: ${item.orderId}`);
    }
  };

  return (
    <div className="notification-page">
      <div className="notification-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with all your store activities and alerts.</p>
        </div>

        <div className="notification-header-actions">
          <button
            className="notification-read-all"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || processing}
          >
            <DoneAllOutlinedIcon />
            Mark all as read
          </button>

          <button
            className="notification-clear"
            onClick={clearAll}
            disabled={notifications.length === 0 || processing}
          >
            <DeleteOutlineOutlinedIcon />
            Clear all
          </button>
        </div>
      </div>

      <div className="notification-content">
        <div className="notification-list-header">
          <div>
            <h2>All Notifications</h2>
            <p>You have {unreadCount} unread notifications.</p>
          </div>

          <span className="notification-count">
            {notifications.length} notifications
          </span>
        </div>

        <div className="notification-toolbar">
          <div className="notification-search">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="notification-tabs">
            {["All", "Unread", "Read"].map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}

                {item === "Unread" && unreadCount > 0 && (
                  <span>{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="notification-empty">
            <NotificationsActiveOutlinedIcon />
            <h3>Loading notifications...</h3>
          </div>
        ) : error ? (
          <div className="notification-empty">
            <NotificationsActiveOutlinedIcon />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button onClick={fetchNotifications}>Retry</button>
          </div>
        ) : notifications.length > 0 ? (
          <div className="notification-list">
            {notifications.map((item) => (
              <div
                className={`notification-item ${
                  !item.read ? "unread-item" : ""
                }`}
                key={item.id}
              >
                <div
                  className="notification-item-click"
                  onClick={() => handleNotificationClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNotificationClick(item);
                    }
                  }}
                >
                  <div className={`notification-item-icon ${item.type}`}>
                    {getIcon(item.type)}
                  </div>

                  <div className="notification-item-content">
                    <div className="notification-item-title">
                      <h3>{item.title}</h3>
                      {!item.read && <span className="unread-dot" />}
                    </div>

                    <p>{item.message}</p>

                    <div className="notification-item-meta">
                      <span>{item.time}</span>
                      <span className="notification-meta-dot">•</span>
                      <span>{item.date}</span>
                      <span className={`notification-label ${item.type}`}>
                        {item.module || item.type}
                      </span>
                    </div>

                    {item.actor_name && (
                      <span className="view-order-hint">
                        By: {item.actor_name}
                      </span>
                    )}

                    {item.type === "order" && item.orderId && (
                      <span className="view-order-hint">
                        Click to view order details →
                      </span>
                    )}
                  </div>
                </div>

                <div className="notification-item-actions">
                  {!item.read && (
                    <button
                      className="notification-mark-btn"
                      onClick={() => markAsRead(item.id)}
                      disabled={processing}
                      title="Mark as read"
                    >
                      <DoneAllOutlinedIcon />
                    </button>
                  )}

                  <button
                    className="notification-delete-btn"
                    onClick={() => deleteNotification(item.id)}
                    disabled={processing}
                    title="Delete notification"
                  >
                    <DeleteOutlineOutlinedIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="notification-empty">
            <NotificationsActiveOutlinedIcon />
            <h3>No notifications found</h3>
            <p>You're all caught up. There are no notifications to display.</p>
          </div>
        )}

        <div className="notification-footer">
          Showing {notifications.length} notifications
        </div>
      </div>
    </div>
  );
}

export default Notification;
