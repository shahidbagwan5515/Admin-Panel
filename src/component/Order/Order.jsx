import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./Order.css";

import {
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  CircularProgress,
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
  Refresh,
} from "@mui/icons-material";

// =============================================
// API CONFIGURATION
// =============================================
const ORDER_API =
  "http://localhost/Admin-Panel/Dashboard/Backend/api/order_history.php";
// =============================================
// CONSTANTS
// =============================================

const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

// =============================================
// HELPERS
// =============================================

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(String(date).replace(" ", "T"));

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =============================================
// FORMAT API ORDER
// =============================================

const formatOrder = (order) => {
  const products = Array.isArray(order.products) ? order.products : [];

  return {
    db_id: Number(order.db_id ?? order.id),

    id: order.orderNumber || order.order_number || `ORD-${order.id}`,

    orderNumber: order.orderNumber || order.order_number || `ORD-${order.id}`,

    user_id: Number(order.user_id) || 0,

    customer: order.customer || order.customer_name || "Customer",

    email: order.email || "",

    phone: order.phone || "",

    address: order.address || "",
    city: order.city || "",
    state: order.state || "",
    pincode: order.pincode || "",

    date: order.date || order.created_at || "",

    items: Number(
      order.items ??
        products.reduce(
          (sum, product) => sum + Number(product.quantity || 0),
          0,
        ),
    ),

    products: products.map((product) => ({
      id: product.id ?? product.productId,
      product_id: product.productId ?? product.product_id ?? null,
      name: product.name || product.product_name || "Product",
      sku: product.sku || product.product_sku || "",
      image: product.image || product.product_image || "",
      quantity: Number(product.quantity) || 0,
      price: Number(product.price) || 0,
      total:
        Number(product.total) ||
        Number(product.price || 0) * Number(product.quantity || 0),
    })),

    subtotal: Number(order.subtotal) || 0,
    discount: Number(order.discount) || 0,

    delivery_amount: Number(order.delivery ?? order.delivery_amount) || 0,

    gst: Number(order.gst) || 0,

    amount: Number(order.total ?? order.grand_total ?? order.amount) || 0,

    payment_method: order.paymentMethod || order.payment_method || "",

    payment: order.payment || order.payment_status || "Pending",

    status: order.status || order.order_status || "Pending",
  };
};

// =============================================
// MAIN COMPONENT
// =============================================

function Order() {
  // =============================================
  // STATES
  // =============================================

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editOrder, setEditOrder] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  // =============================================
  // API REQUEST HELPER
  // =============================================

  const apiRequest = useCallback(async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error("Invalid API response. Check PHP errors and API URL.");
    }

    if (!response.ok || result.success !== true) {
      throw new Error(
        result.message || `API request failed (${response.status})`,
      );
    }

    return result;
  }, []);

  // =============================================
  // FETCH ALL ORDERS FROM DATABASE
  // =============================================

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest(ORDER_API, {
        method: "GET",
      });

      const rows = Array.isArray(result.data) ? result.data : [];

      const formattedOrders = rows.map(formatOrder);

      setOrders(formattedOrders);

      // Update currently selected order if it still exists.
      setSelectedOrder((previous) => {
        if (!previous) return null;

        return (
          formattedOrders.find((order) => order.db_id === previous.db_id) ||
          null
        );
      });

      console.log("Orders Loaded Successfully:", formattedOrders);
    } catch (error) {
      console.error("Order Fetch Error:", error);
      setError(error.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // =============================================
  // INITIAL LOAD
  // =============================================

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // =============================================
  // MENU HANDLERS
  // =============================================

  const handleMenuOpen = (event, order) => {
    setAnchorEl(event.currentTarget);
    setActiveOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveOrder(null);
  };

  // =============================================
  // STATISTICS
  // =============================================

  const stats = useMemo(() => {
    return {
      total: orders.length,

      pending: orders.filter((order) => order.status === "Pending").length,

      processing: orders.filter((order) => order.status === "Processing")
        .length,

      delivered: orders.filter((order) => order.status === "Delivered").length,

      revenue: orders
        .filter((order) => String(order.payment).toLowerCase() === "paid")
        .reduce((sum, order) => sum + Number(order.amount || 0), 0),
    };
  }, [orders]);

  // =============================================
  // SEARCH AND FILTER
  // =============================================

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesSearch = [
        order.id,
        order.customer,
        order.email,
        order.phone,
        order.user_id,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      );

      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // =============================================
  // UPDATE ORDER STATUS
  // =============================================

  const updateStatus = async () => {
    if (!editOrder) return;

    try {
      setSaving(true);

      const result = await apiRequest(ORDER_API, {
        method: "POST",
        body: JSON.stringify({
          order_id: editOrder.db_id,
          status: editOrder.status,
        }),
      });

      console.log("Status Update:", result);

      await fetchOrders();

      setEditOrder(null);

      alert("Order status updated successfully!");
    } catch (error) {
      console.error("Status Update Error:", error);
      alert(error.message || "Unable to update order status.");
    } finally {
      setSaving(false);
    }
  };

  // =============================================
  // DELETE ORDER
  // =============================================

  const deleteOrder = async (order) => {
    if (!order) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${order.id}?`,
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const result = await apiRequest(ORDER_API, {
        method: "DELETE",
        body: JSON.stringify({
          order_id: order.db_id,
        }),
      });

      console.log("Order Delete:", result);

      setSelectedOrder((previous) =>
        previous?.db_id === order.db_id ? null : previous,
      );

      await fetchOrders();

      alert("Order deleted successfully!");
    } catch (error) {
      console.error("Delete Order Error:", error);
      alert(error.message || "Unable to delete order.");
    } finally {
      setSaving(false);
    }
  };

  // =============================================
  // EXPORT CSV
  // =============================================

  const exportCSV = () => {
    const headers = [
      "Order ID",
      "Customer",
      "Email",
      "Phone",
      "Date",
      "Items",
      "Amount",
      "Payment Method",
      "Payment Status",
      "Order Status",
    ];

    const rows = filteredOrders.map((order) => [
      order.id,
      order.customer,
      order.email,
      order.phone,
      order.date,
      order.items,
      order.amount,
      order.payment_method,
      order.payment,
      order.status,
    ]);

    const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

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

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="order-page">
      {/* HEADER */}

      <div className="order-header">
        <div>
          <h1>Order Management</h1>
          <p>Track, manage and monitor all customer orders.</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchOrders}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlined />}
            className="order-export-btn"
            onClick={exportCSV}
            disabled={!filteredOrders.length}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="order-stats">
        <div className="order-stat-card">
          <div className="order-stat-icon purple">
            <ShoppingBagOutlined />
          </div>

          <div>
            <span>Total Orders</span>
            <h3>{stats.total}</h3>
            <small>All orders</small>
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
            <small>From paid orders</small>
          </div>
        </div>
      </div>

      {/* ORDER TABLE */}

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
            >
              {["All", ...STATUSES].map((status) => (
                <MenuItem key={status} value={status}>
                  {status === "All" ? "All Statuses" : status}
                </MenuItem>
              ))}
            </TextField>
          </div>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            style={{
              padding: "15px 20px",
              color: "#c62828",
              background: "#fff1f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span>{error}</span>

            <Button size="small" onClick={fetchOrders} disabled={loading}>
              Try Again
            </Button>
          </div>
        )}

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
              {loading ? (
                <tr>
                  <td colSpan="8" className="order-empty">
                    <CircularProgress size={25} />
                    <p>Loading orders...</p>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredOrders.map((order) => (
                    <tr key={order.db_id}>
                      <td>
                        <strong className="order-id">{order.id}</strong>
                      </td>

                      <td>
                        <div className="order-customer">
                          <div className="order-avatar">
                            {order.customer?.charAt(0) || "C"}
                          </div>

                          <div>
                            <strong>{order.customer}</strong>
                            <span>{order.email || order.phone || "N/A"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="order-date">{formatDate(order.date)}</td>

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
                          className={`payment-chip payment-${String(
                            order.payment,
                          ).toLowerCase()}`}
                        />
                      </td>

                      <td>
                        <Chip
                          size="small"
                          label={order.status}
                          className={`order-chip status-${String(
                            order.status,
                          ).toLowerCase()}`}
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
                          open={
                            Boolean(anchorEl) &&
                            activeOrder?.db_id === order.db_id
                          }
                          onClose={handleMenuClose}
                        >
                          <MenuItem
                            onClick={() => {
                              setSelectedOrder(activeOrder);
                              handleMenuClose();
                            }}
                          >
                            <VisibilityOutlined
                              fontSize="small"
                              sx={{ mr: 1 }}
                            />
                            View Order
                          </MenuItem>

                          <MenuItem
                            onClick={() => {
                              setEditOrder({
                                ...activeOrder,
                              });
                              handleMenuClose();
                            }}
                          >
                            <EditOutlined fontSize="small" sx={{ mr: 1 }} />
                            Update Status
                          </MenuItem>

                          <MenuItem
                            disabled={saving}
                            onClick={() => {
                              const selected = activeOrder;
                              handleMenuClose();

                              if (selected) {
                                deleteOrder(selected);
                              }
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

                  {filteredOrders.length === 0 && !error && (
                    <tr>
                      <td colSpan="8" className="order-empty">
                        No orders found. Try another search or status.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}

        <div className="order-footer">
          <span>
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>
      </div>

      {/* =========================================
          VIEW ORDER DIALOG
      ========================================= */}

      {selectedOrder && (
        <div
          className="order-dialog-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="order-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-dialog-header">
              <div>
                <h2>Order Details</h2>
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
                <strong>{selectedOrder.email || "N/A"}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{selectedOrder.phone || "N/A"}</strong>
              </div>

              <div>
                <span>Order Date</span>
                <strong>{formatDate(selectedOrder.date)}</strong>
              </div>

              <div>
                <span>Delivery Address</span>
                <strong>
                  {[
                    selectedOrder.address,
                    selectedOrder.city,
                    selectedOrder.state,
                    selectedOrder.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Address not available"}
                </strong>
              </div>

              <div>
                <span>Total Items</span>
                <strong>{selectedOrder.items}</strong>
              </div>

              {/* PRODUCTS */}

              <div className="order-detail-products">
                <span>Products</span>

                <div className="order-products-list">
                  {selectedOrder.products?.length > 0 ? (
                    selectedOrder.products.map((product, index) => (
                      <div
                        className="order-product-item"
                        key={`${product.id}-${index}`}
                      >
                        <div className="order-product-info">
                          <strong>{product.name}</strong>

                          <small>SKU: {product.sku || "N/A"}</small>

                          <small>Quantity: {product.quantity}</small>

                          <small>Unit Price: {currency(product.price)}</small>
                        </div>

                        <strong className="order-product-price">
                          {currency(product.total)}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <p>Product details not available.</p>
                  )}
                </div>
              </div>

              <div>
                <span>Subtotal</span>
                <strong>{currency(selectedOrder.subtotal)}</strong>
              </div>

              <div>
                <span>Discount</span>
                <strong>{currency(selectedOrder.discount)}</strong>
              </div>

              <div>
                <span>Delivery</span>
                <strong>{currency(selectedOrder.delivery_amount)}</strong>
              </div>

              <div>
                <span>GST</span>
                <strong>{currency(selectedOrder.gst)}</strong>
              </div>

              <div>
                <span>Grand Total</span>
                <strong>{currency(selectedOrder.amount)}</strong>
              </div>

              <div>
                <span>Payment Method</span>
                <strong>{selectedOrder.payment_method || "N/A"}</strong>
              </div>

              <div>
                <span>Payment Status</span>
                <strong>{selectedOrder.payment}</strong>
              </div>

              <div>
                <span>Order Status</span>
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

      {/* =========================================
          UPDATE STATUS DIALOG
      ========================================= */}

      {editOrder && (
        <div
          className="order-dialog-backdrop"
          onClick={() => !saving && setEditOrder(null)}
        >
          <div
            className="order-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-dialog-header">
              <div>
                <h2>Update Order Status</h2>
                <p>{editOrder.id}</p>
              </div>

              <IconButton onClick={() => setEditOrder(null)} disabled={saving}>
                ×
              </IconButton>
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
            >
              {STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <div className="order-dialog-buttons">
              <Button
                variant="outlined"
                onClick={() => setEditOrder(null)}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={updateStatus}
                disabled={saving}
              >
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Save Status"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Order;
