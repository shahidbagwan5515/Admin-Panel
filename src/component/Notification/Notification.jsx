import React, { useState } from "react";
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
import CloseIcon from "@mui/icons-material/Close";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CheckCircle from "@mui/icons-material/CheckCircle";

const initialNotifications = [
  {
    id: 1,
    title: "New Order Received",
    message: "A new order #ORD1025 has been placed by Rahul Sharma.",
    time: "5 minutes ago",
    date: "Today",
    type: "order",
    read: false,
    orderId: "ORD1025",
  },
  {
    id: 2,
    title: "New Customer Registered",
    message: "Priya Patel has created a new customer account.",
    time: "25 minutes ago",
    date: "Today",
    type: "customer",
    read: false,
  },
  {
    id: 3,
    title: "Low Stock Alert",
    message: "Ashwagandha Capsules stock is running low. Only 5 items left.",
    time: "1 hour ago",
    date: "Today",
    type: "stock",
    read: false,
  },
  {
    id: 4,
    title: "Payment Received",
    message: "Payment of ₹2,450 has been successfully received.",
    time: "3 hours ago",
    date: "Today",
    type: "payment",
    read: true,
  },
  {
    id: 5,
    title: "New Offer Created",
    message: "Your Diwali special discount campaign is now active.",
    time: "Yesterday",
    date: "Yesterday",
    type: "offer",
    read: true,
  },
  {
    id: 6,
    title: "Order Delivered",
    message: "Order #ORD1018 has been successfully delivered.",
    time: "Yesterday",
    date: "Yesterday",
    type: "order",
    read: true,
    orderId: "ORD1018",
  },
];

const orderDetails = {
  ORD1025: {
    customer: "Rahul Sharma",
    email: "rahul.sharma@gmail.com",
    phone: "+91 98765 43210",
    address: "Flat 101, Lorem, ipsum dolor,Maharashtra - 425001",
    date: "30 October 2026",
    payment: "Paid",
    method: "UPI",
    status: "Processing",
    items: [
      { name: "Ashwagandha Capsules", quantity: 2, price: 450 },
      { name: "Amla Juice", quantity: 1, price: 350 },
      { name: "Herbal Hair Oil", quantity: 1, price: 299 },
    ],
    shipping: 50,
  },
  ORD1018: {
    customer: "Amit Verma",
    email: "amit.verma@gmail.com",
    phone: "+91 98765 12345",
    address: "Shivaji Nagar, Mumbai, Maharashtra - 400001",
    date: "29 October 2026",
    payment: "Paid",
    method: "Cash on Delivery",
    status: "Delivered",
    items: [
      { name: "Neem Face Wash", quantity: 2, price: 250 },
      { name: "Aloe Vera Gel", quantity: 1, price: 199 },
    ],
    shipping: 40,
  },
};

function Notification() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const filteredNotifications = notifications.filter((item) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Unread" && !item.read) ||
      (filter === "Read" && item.read);

    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      setNotifications([]);
    }
  };

  const handleNotificationClick = (item) => {
    markAsRead(item.id);

    if (item.type === "order" && item.orderId) {
      const details = orderDetails[item.orderId];
      if (details) {
        setSelectedOrder({
          ...details,
          orderId: item.orderId,
        });
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
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

  const orderSubtotal = selectedOrder
    ? selectedOrder.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      )
    : 0;

  const orderTotal = orderSubtotal + (selectedOrder?.shipping || 0);

  return (
    <div className="notification-page">
      {/* Header */}
      <div className="notification-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with all your store activities and alerts.</p>
        </div>

        <div className="notification-header-actions">
          <button className="notification-read-all" onClick={markAllAsRead}>
            <DoneAllOutlinedIcon />
            Mark all as read
          </button>

          <button className="notification-clear" onClick={clearAll}>
            <DeleteOutlineOutlinedIcon />
            Clear all
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="notification-content">
        <div className="notification-list-header">
          <div>
            <h2>All Notifications</h2>
            <p>You have {unreadCount} unread notifications.</p>
          </div>

          <span className="notification-count">
            {filteredNotifications.length} notifications
          </span>
        </div>

        <div className="notification-toolbar">
          <div className="notification-search">
            <SearchIcon />
            <input
              type="text"
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

        {/* Notification Items */}
        {filteredNotifications.length > 0 ? (
          <div className="notification-list">
            {filteredNotifications.map((item) => (
              <div
                className={`notification-item ${!item.read ? "unread-item" : ""}`}
                key={item.id}
              >
                <div
                  className="notification-item-click"
                  onClick={() => handleNotificationClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNotificationClick(item);
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
                        {item.type}
                      </span>
                    </div>

                    {item.type === "order" && (
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
                      title="Mark as read"
                    >
                      <DoneAllOutlinedIcon />
                    </button>
                  )}

                  <button
                    className="notification-delete-btn"
                    onClick={() => deleteNotification(item.id)}
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
          Showing {filteredNotifications.length} of {notifications.length}{" "}
          notifications
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="order-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <span className="order-modal-eyebrow">ORDER INFORMATION</span>
                <h2>Order Details</h2>
                <p>{selectedOrder.orderId}</p>
              </div>

              <button
                className="order-modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="order-modal-body">
              {/* Status */}
              <div className="order-status-banner">
                <div className="order-status-icon">
                  <LocalShippingOutlinedIcon />
                </div>
                <div>
                  <span>Order Status</span>
                  <h3>{selectedOrder.status}</h3>
                </div>
                <span
                  className={`order-status-badge ${selectedOrder.status.toLowerCase()}`}
                >
                  {selectedOrder.status}
                </span>
              </div>

              {/* Customer Details */}
              <div className="order-detail-grid">
                <div className="order-detail-card">
                  <h3>
                    <PersonOutlineOutlinedIcon /> Customer Details
                  </h3>
                  <p>
                    <strong>{selectedOrder.customer}</strong>
                  </p>
                  <p>{selectedOrder.email}</p>
                  <p>{selectedOrder.phone}</p>
                </div>

                <div className="order-detail-card">
                  <h3>
                    <LocationOnOutlinedIcon /> Shipping Address
                  </h3>
                  <p>{selectedOrder.address}</p>
                  <p className="order-date">
                    <CalendarTodayOutlinedIcon />
                    {selectedOrder.date}
                  </p>
                </div>
              </div>

              {/* Product Table */}
              <div className="order-products-section">
                <h3>Ordered Products</h3>

                <div className="order-table-wrapper">
                  <table className="order-products-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedOrder.items.map((product, index) => (
                        <tr key={index}>
                          <td>{product.name}</td>
                          <td>{product.quantity}</td>
                          <td>₹{product.price.toLocaleString("en-IN")}</td>
                          <td>
                            ₹
                            {(product.price * product.quantity).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="order-bottom-grid">
                <div className="order-payment-card">
                  <h3>
                    <PaymentOutlinedIcon /> Payment Information
                  </h3>
                  <div className="order-info-row">
                    <span>Payment Method</span>
                    <strong>{selectedOrder.method}</strong>
                  </div>
                  <div className="order-info-row">
                    <span>Payment Status</span>
                    <strong className="payment-success">
                      {selectedOrder.payment}
                    </strong>
                  </div>
                </div>

                <div className="order-total-card">
                  <h3>Order Summary</h3>
                  <div className="order-info-row">
                    <span>Subtotal</span>
                    <span>₹{orderSubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="order-info-row">
                    <span>Shipping</span>
                    <span>₹{selectedOrder.shipping}</span>
                  </div>
                  <div className="order-info-row order-grand-total">
                    <strong>Total Amount</strong>
                    <strong>₹{orderTotal.toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="order-timeline">
                <h3>Order Timeline</h3>
                <div className="timeline-step completed">
                  <span>
                    <CheckCircle />
                  </span>
                  <div>
                    <strong>Order Placed</strong>
                    <p>{selectedOrder.date}</p>
                  </div>
                </div>

                <div
                  className={`timeline-step ${selectedOrder.status === "Processing" || selectedOrder.status === "Delivered" ? "completed" : ""}`}
                >
                  <span>
                    <CheckCircle />
                  </span>
                  <div>
                    <strong>Processing</strong>
                    <p>Order is being prepared</p>
                  </div>
                </div>

                <div
                  className={`timeline-step ${selectedOrder.status === "Delivered" ? "completed" : ""}`}
                >
                  <span>
                    <CheckCircle />
                  </span>
                  <div>
                    <strong>Delivered</strong>
                    <p>Order successfully delivered</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-modal-footer">
              <button onClick={() => setSelectedOrder(null)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notification;
