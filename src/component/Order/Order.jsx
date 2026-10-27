import React, { useMemo, useState } from "react";
import "./Order.css";

import {
  Menu,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";

import {
  MoreVert,
  Search,
  ShoppingBagOutlined,
  LocalShippingOutlined,
  CheckCircle,
  PendingActionsOutlined,
  VisibilityOutlined,
  EditOutlined,
  Delete,
  FileDownloadOutlined,
} from "@mui/icons-material";

const initialOrders = [
  {
    id: "ORD-2026-001",
    customer: "Rahul Sharma",
    email: "rahul@gmail.com",
    date: "27 Oct 2026",
    items: 3,
    products: [
      { name: "Ashwagandha Tablets", sku: "AYU-001", quantity: 1, price: 250 },
      { name: "Amla Juice", sku: "AYU-002", quantity: 2, price: 180 },
    ],
    amount: 610,
    payment: "Paid",
    status: "Delivered",
  },
  {
    id: "ORD-2026-002",
    customer: "Priya Patel",
    email: "priya@gmail.com",
    date: "27 Oct 2026",
    items: 2,
    products: [
      { name: "Chyawanprash", sku: "AYU-004", quantity: 1, price: 320 },
      { name: "Aloe Vera Gel", sku: "AYU-005", quantity: 1, price: 150 },
    ],
    amount: 470,
    payment: "Paid",
    status: "Processing",
  },
  {
    id: "ORD-2026-003",
    customer: "Amit Verma",
    email: "amit@gmail.com",
    date: "26 Oct 2026",
    items: 5,
    products: [
      { name: "Amla Juice", sku: "AYU-002", quantity: 2, price: 180 },
      { name: "Neem Face Wash", sku: "AYU-003", quantity: 2, price: 120 },
      { name: "Aloe Vera Gel", sku: "AYU-005", quantity: 1, price: 150 },
    ],
    amount: 750,
    payment: "Pending",
    status: "Pending",
  },
  {
    id: "ORD-2026-004",
    customer: "Sneha Joshi",
    email: "sneha@gmail.com",
    date: "26 Oct 2026",
    items: 1,
    products: [
      { name: "Ashwagandha Tablets", sku: "AYU-001", quantity: 1, price: 250 },
    ],
    amount: 250,
    payment: "Paid",
    status: "Shipped",
  },
  {
    id: "ORD-2026-005",
    customer: "Vikas Patil",
    email: "vikas@gmail.com",
    date: "25 Oct 2026",
    items: 4,
    products: [
      { name: "Chyawanprash", sku: "AYU-004", quantity: 2, price: 320 },
      { name: "Neem Face Wash", sku: "AYU-003", quantity: 2, price: 120 },
    ],
    amount: 880,
    payment: "Failed",
    status: "Cancelled",
  },
  {
    id: "ORD-2026-006",
    customer: "Neha Singh",
    email: "neha@gmail.com",
    date: "25 Oct 2026",
    items: 2,
    products: [
      { name: "Aloe Vera Gel", sku: "AYU-005", quantity: 1, price: 150 },
      { name: "Amla Juice", sku: "AYU-002", quantity: 1, price: 180 },
    ],
    amount: 330,
    payment: "Paid",
    status: "Processing",
  },
];

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function Order() {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editOrder, setEditOrder] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  const handleMenuOpen = (event, order) => {
    setAnchorEl(event.currentTarget);
    setActiveOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveOrder(null);
  };

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "Pending").length,
      processing: orders.filter((order) => order.status === "Processing")
        .length,
      delivered: orders.filter((order) => order.status === "Delivered").length,
      revenue: orders
        .filter((order) => order.payment === "Paid")
        .reduce((sum, order) => sum + order.amount, 0),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(term) ||
        order.customer.toLowerCase().includes(term) ||
        order.email.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const updateStatus = (id, status) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order)),
    );
    setEditOrder(null);
  };

  const deleteOrder = (order) => {
    if (window.confirm(`Delete order ${order.id}?`)) {
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
    }
  };

  const exportCSV = () => {
    const headers = [
      "Order ID",
      "Customer",
      "Email",
      "Date",
      "Items",
      "Amount",
      "Payment",
      "Status",
    ];

    const rows = filteredOrders.map((order) => [
      order.id,
      order.customer,
      order.email,
      order.date,
      order.items,
      order.amount,
      order.payment,
      order.status,
    ]);

    const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="order-page">
      <div className="order-header">
        <div>
          <h1>Order Management</h1>
          <p>Track, manage and monitor all customer orders.</p>
        </div>

        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlined />}
          className="order-export-btn"
          onClick={exportCSV}
        >
          Export CSV
        </Button>
      </div>

      <div className="order-stats">
        <div className="order-stat-card">
          <div className="order-stat-icon purple">
            <ShoppingBagOutlined />
          </div>
          <div>
            <span>Total Orders</span>
            <h3>{stats.total}</h3>
            <small>All recorded orders</small>
          </div>
        </div>

        <div className="order-stat-card">
          <div className="order-stat-icon orange">
            <PendingActionsOutlined />
          </div>
          <div>
            <span>Pending Orders</span>
            <h3>{stats.pending}</h3>
            <small>Awaiting confirmation</small>
          </div>
        </div>

        <div className="order-stat-card">
          <div className="order-stat-icon blue">
            <LocalShippingOutlined />
          </div>
          <div>
            <span>Processing</span>
            <h3>{stats.processing}</h3>
            <small>Being prepared</small>
          </div>
        </div>

        <div className="order-stat-card">
          <div className="order-stat-icon green">
            <CheckCircle />
          </div>
          <div>
            <span>Paid Revenue</span>
            <h3>{currency(stats.revenue)}</h3>
            <small>From paid sample orders</small>
          </div>
        </div>
      </div>

      <div className="order-table-card">
        <div className="order-toolbar">
          <div>
            <h2>All Orders</h2>
            <p>Review order details and update delivery status.</p>
          </div>

          <div className="order-filters">
            <TextField
              size="small"
              placeholder="Search order or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="order-search"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="order-status-filter"
              aria-label="Filter orders by status"
            >
              {[
                "All",
                "Pending",
                "Processing",
                "Shipped",
                "Delivered",
                "Cancelled",
              ].map((status) => (
                <MenuItem key={status} value={status}>
                  {status === "All" ? "All Statuses" : status}
                </MenuItem>
              ))}
            </TextField>
          </div>
        </div>

        <div className="order-table-scroll">
          <table className="order-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong className="order-id">{order.id}</strong>
                  </td>

                  <td>
                    <div className="order-customer">
                      <div className="order-avatar">
                        {order.customer.charAt(0)}
                      </div>
                      <div>
                        <strong>{order.customer}</strong>
                        <span>{order.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="order-date">{order.date}</td>

                  <td>{order.items} items</td>

                  <td>
                    <strong className="order-amount">
                      {currency(order.amount)}
                    </strong>
                  </td>

                  <td>
                    <Chip
                      size="small"
                      label={order.payment}
                      className={`payment-chip payment-${order.payment.toLowerCase()}`}
                    />
                  </td>

                  <td>
                    <Chip
                      size="small"
                      label={order.status}
                      className={`order-chip status-${order.status.toLowerCase()}`}
                    />
                  </td>

                  <td>
                    <IconButton
                      aria-label="Order actions"
                      onClick={(event) => handleMenuOpen(event, order)}
                    >
                      <MoreVert />
                    </IconButton>

                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl) && activeOrder?.id === order.id}
                      onClose={handleMenuClose}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                    >
                      <MenuItem
                        onClick={() => {
                          setSelectedOrder(activeOrder);
                          handleMenuClose();
                        }}
                      >
                        <VisibilityOutlined fontSize="small" sx={{ mr: 1 }} />
                        View Order
                      </MenuItem>

                      <MenuItem
                        onClick={() => {
                          setEditOrder(activeOrder);
                          handleMenuClose();
                        }}
                      >
                        <EditOutlined fontSize="small" sx={{ mr: 1 }} />
                        Update Status
                      </MenuItem>

                      <MenuItem
                        onClick={() => {
                          const orderToDelete = activeOrder;
                          handleMenuClose();
                          if (orderToDelete) deleteOrder(orderToDelete);
                        }}
                        sx={{ color: "error.main" }}
                      >
                        <Delete fontSize="small" sx={{ mr: 1 }} />
                        Delete Order
                      </MenuItem>
                    </Menu>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="8" className="order-empty">
                    No orders found. Try another search or status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="order-footer">
          <span>
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
          <span className="order-footer-note">Sample dashboard data</span>
        </div>
      </div>

      {/* View order dialog */}

      {selectedOrder && (
        <div
          className="order-dialog-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="order-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-dialog-header">
              <div>
                <h2 id="order-detail-title">Order Details</h2>
                <p>{selectedOrder.id}</p>
              </div>

              <IconButton onClick={() => setSelectedOrder(null)}>×</IconButton>
            </div>

            <div className="order-detail-list">
              <div>
                <span>Customer</span>
                <strong>{selectedOrder.customer}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{selectedOrder.email}</strong>
              </div>

              <div>
                <span>Order Date</span>
                <strong>{selectedOrder.date}</strong>
              </div>

              <div>
                <span>Total Items</span>
                <strong>{selectedOrder.items}</strong>
              </div>

              <div className="order-detail-products">
                <span>Products</span>

                <div className="order-products-list">
                  {selectedOrder.products.map((product) => (
                    <div className="order-product-item" key={product.sku}>
                      <div className="order-product-info">
                        <strong>{product.name}</strong>
                        <small>SKU: {product.sku}</small>
                        <small>Quantity: {product.quantity}</small>
                      </div>

                      <strong className="order-product-price">
                        {currency(product.price * product.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span>Amount</span>
                <strong>{currency(selectedOrder.amount)}</strong>
              </div>

              <div>
                <span>Payment</span>
                <strong>{selectedOrder.payment}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedOrder.status}</strong>
              </div>
            </div>

            <Button
              fullWidth
              variant="contained"
              onClick={() => setSelectedOrder(null)}
              className="order-dialog-close"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Update status dialog */}
      {editOrder && (
        <div
          className="order-dialog-backdrop"
          onClick={() => setEditOrder(null)}
        >
          <div
            className="order-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-status-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-dialog-header">
              <div>
                <h2 id="order-status-title">Update Order Status</h2>
                <p>{editOrder.id}</p>
              </div>
              <IconButton onClick={() => setEditOrder(null)}>×</IconButton>
            </div>

            <TextField
              select
              fullWidth
              label="Order Status"
              value={editOrder.status}
              onChange={(e) =>
                setEditOrder({
                  ...editOrder,
                  status: e.target.value,
                })
              }
              className="EditOption"
              SelectProps={{
                MenuProps: {
                  disablePortal: false,
                  PaperProps: {
                    sx: {
                      maxHeight: 240,
                      borderRadius: "8px",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                      zIndex: 1500,
                    },
                  },
                },
              }}
            >
              {[
                "Pending",
                "Processing",
                "Shipped",
                "Delivered",
                "Cancelled",
              ].map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <div className="order-dialog-buttons">
              <Button variant="outlined" onClick={() => setEditOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => updateStatus(editOrder.id, editOrder.status)}
              >
                Save Status
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Order;
