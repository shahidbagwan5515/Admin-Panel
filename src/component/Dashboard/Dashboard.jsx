import "./Dashboard.css";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import {
  ShoppingBag,
  CurrencyRupee,
  People,
  TrendingUp,
  MoreHoriz,
  ArrowForward,
  Inventory2,
  LocalShipping,
  CheckCircle,
  PendingActions,
  CalendarMonth,
  Refresh,
  // ErrorOutline,
} from "@mui/icons-material";

// =====================================
// API URL
// =====================================
const API_URL =
  "http://localhost/Admin-Panel/Dashboard/Backend/api/dashboard.php";
// =====================================
// FORMAT CURRENCY
// =====================================

const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

// =====================================
// DASHBOARD COMPONENT
// =====================================

function Dashboard() {
  const [period, setPeriod] = useState("This Week");

  const [dashboardData, setDashboardData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // =====================================
  // FETCH DASHBOARD DATA
  // =====================================

  const fetchDashboard = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const selectedPeriod = period === "This Month" ? "month" : "week";

        const response = await fetch(`${API_URL}?period=${selectedPeriod}`);

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load dashboard data");
        }

        setDashboardData(result);
      } catch (err) {
        console.error("Dashboard API Error:", err);

        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period],
  );

  // =====================================
  // LOAD DATA
  // =====================================

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // =====================================
  // REFRESH
  // =====================================

  const handleRefresh = () => {
    setRefreshing(true);

    fetchDashboard(false);
  };

  // =====================================
  // DATA VARIABLES
  // =====================================

  const statsData = dashboardData?.stats || {};

  const salesData = dashboardData?.sales || [];

  const summary = dashboardData?.orderSummary || {};

  const recentOrders = dashboardData?.recentOrders || [];

  // =====================================
  // STATISTICS CARDS
  // =====================================

  const stats = [
    {
      title: "Total Revenue",

      value: `₹${formatCurrency(statsData.totalRevenue)}`,

      icon: <CurrencyRupee />,

      color: "green",
    },

    {
      title: "Total Orders",

      value: formatCurrency(statsData.totalOrders),

      icon: <ShoppingBag />,

      color: "blue",
    },

    {
      title: "Total Customers",

      value: formatCurrency(statsData.totalCustomers),

      icon: <People />,

      color: "purple",
    },

    {
      title: "Pending Orders",

      value: formatCurrency(statsData.pendingOrders),

      icon: <Inventory2 />,

      color: "orange",
    },
  ];

  // =====================================
  // SALES CHART CALCULATION
  // =====================================

  const maxSales = Math.max(
    ...salesData.map((item) => Number(item.value || 0)),
    1,
  );

  const totalSales = salesData.reduce(
    (total, item) => total + Number(item.value || 0),
    0,
  );

  // =====================================
  // LOADING SCREEN
  // =====================================

  if (loading && !dashboardData) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-loader"></div>

          <h3>Loading Dashboard...</h3>

          <p>Please wait while we fetch your store data.</p>
        </div>
      </main>
    );
  }

  // =====================================
  // ERROR SCREEN
  // =====================================

  if (error && !dashboardData) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-error">
          {/* <ErrorOutline /> */}

          <h3>Unable to Load Dashboard</h3>

          <p>{error}</p>

          <button
            type="button"
            className="dashboard-retry-btn"
            onClick={() => fetchDashboard()}
          >
            <Refresh />
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // =====================================
  // MAIN DASHBOARD
  // =====================================

  return (
    <main className="dashboard-page">
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <header className="dashboard-heading">
        <div>
          <h1>Dashboard Overview</h1>

          <p>Welcome back! Here's what's happening in your store today.</p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="dashboard-date-btn"
            onClick={() =>
              setPeriod((previous) =>
                previous === "This Week" ? "This Month" : "This Week",
              )
            }
          >
            <CalendarMonth />

            {period}
          </button>

          <button
            type="button"
            className="dashboard-date-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh dashboard"
          >
            <Refresh className={refreshing ? "refresh-spinning" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* =====================================
          API ERROR BANNER
      ===================================== */}

      {error && dashboardData && (
        <div className="dashboard-error-banner">
          {/* <ErrorOutline /> */}

          <span>{error}</span>

          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {/* =====================================
          STATISTICS
      ===================================== */}

      <section className="dashboard-stats">
        {stats.map((stat) => (
          <article className="dashboard-stat-card" key={stat.title}>
            <div className="stat-card-top">
              <span className="stat-title">{stat.title}</span>

              <span className={`stat-icon ${stat.color}`}>{stat.icon}</span>
            </div>

            <h2>{stat.value}</h2>

            <div className="stat-bottom">
              <span className="stat-note">Live database data</span>
            </div>
          </article>
        ))}
      </section>

      {/* =====================================
          SALES CHART AND ORDER SUMMARY
      ===================================== */}

      <section className="dashboard-middle-grid">
        {/* SALES OVERVIEW */}

        <article className="dashboard-panel sales-panel">
          <div className="panel-heading">
            <div>
              <h3>Sales Overview</h3>

              <p>Track your store's sales performance</p>
            </div>

            <button
              type="button"
              className="panel-more-btn"
              aria-label="Refresh sales data"
              onClick={handleRefresh}
            >
              <MoreHoriz />
            </button>
          </div>

          {/* SALES TOTAL */}

          <div className="sales-total">
            <h2>₹{formatCurrency(totalSales)}</h2>

            <span className="sales-growth">
              <TrendingUp fontSize="small" />

              {period}
            </span>
          </div>

          <p className="sales-caption">
            Total paid sales
            <span> · {period}</span>
          </p>

          {/* SALES CHART */}

          <div
            className="sales-chart"
            role="img"
            aria-label={`${period} sales chart`}
          >
            <div className="chart-y-labels">
              <span>₹{formatCurrency(maxSales)}</span>

              <span>₹{formatCurrency(maxSales * 0.75)}</span>

              <span>₹{formatCurrency(maxSales * 0.5)}</span>

              <span>₹{formatCurrency(maxSales * 0.25)}</span>

              <span>₹0</span>
            </div>

            <div className="chart-content">
              <div className="chart-grid-lines">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="chart-bars">
                {salesData.length > 0 ? (
                  salesData.map((item, index) => (
                    <div className="chart-bar-column" key={item.date || index}>
                      <div
                        className="chart-bar"
                        style={{
                          height: `${Math.max(
                            (Number(item.value) / maxSales) * 100,
                            1,
                          )}%`,
                        }}
                        title={`${item.day}: ₹${formatCurrency(item.value)}`}
                      />

                      <span>{item.day}</span>
                    </div>
                  ))
                ) : (
                  <div className="chart-empty">No sales data available</div>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* ORDER SUMMARY */}

        <article className="dashboard-panel order-summary-panel">
          <div className="panel-heading">
            <div>
              <h3>Order Summary</h3>

              <p>Current order status</p>
            </div>

            <button
              type="button"
              className="panel-more-btn"
              aria-label="Refresh order summary"
              onClick={handleRefresh}
            >
              <MoreHoriz />
            </button>
          </div>

          <div className="order-summary-list">
            {/* DELIVERED */}

            <div className="order-summary-item">
              <span className="summary-icon delivered">
                <CheckCircle />
              </span>

              <div className="summary-details">
                <strong>Delivered</strong>

                <span>Successfully completed</span>
              </div>

              <strong className="summary-number">
                {summary.delivered ?? 0}
              </strong>
            </div>

            {/* PROCESSING */}

            <div className="order-summary-item">
              <span className="summary-icon shipping">
                <LocalShipping />
              </span>

              <div className="summary-details">
                <strong>Processing</strong>

                <span>Orders being prepared</span>
              </div>

              <strong className="summary-number">
                {(summary.processing ?? 0) + (summary.shipped ?? 0)}
              </strong>
            </div>

            {/* PENDING */}

            <div className="order-summary-item">
              <span className="summary-icon pending">
                <PendingActions />
              </span>

              <div className="summary-details">
                <strong>Pending</strong>

                <span>Awaiting confirmation</span>
              </div>

              <strong className="summary-number">{summary.pending ?? 0}</strong>
            </div>
          </div>

          {/* SUMMARY FOOTER */}

          <div className="order-summary-footer">
            <span>Total orders</span>

            <strong>{formatCurrency(summary.total)}</strong>
          </div>
        </article>
      </section>

      {/* =====================================
          RECENT ORDERS
      ===================================== */}

      <section className="dashboard-panel recent-orders-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Orders</h3>

            <p>Latest orders placed in your store</p>
          </div>

          <Link to="../Order" className="view-all-btn">
            View All
            <ArrowForward fontSize="small" />
          </Link>
        </div>

        {/* RECENT ORDERS TABLE */}

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Order ID</th>

                <th>Customer</th>

                <th>Product</th>

                <th>Date</th>

                <th>Amount</th>

                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">{order.id}</td>

                    <td>{order.customer}</td>

                    <td>{order.product}</td>

                    <td className="order-date">{order.date}</td>

                    <td className="order-amount">
                      ₹{formatCurrency(order.amount)}
                    </td>

                    <td>
                      <span
                        className={`order-status ${String(
                          order.status,
                        ).toLowerCase()}`}
                      >
                        <span className="status-dot" />

                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="dashboard-empty">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
