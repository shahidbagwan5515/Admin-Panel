import "./Dashboard.css";
import { useState } from "react";

import {
  Dashboard as DashboardIcon,
  ShoppingBag,
  CurrencyRupee,
  People,
  TrendingUp,
  TrendingDown,
  MoreHoriz,
  ArrowForward,
  Inventory2,
  LocalShipping,
  CheckCircle,
  PendingActions,
  CalendarMonth,
} from "@mui/icons-material";

const salesData = [
  { day: "Mon", value: 45 },
  { day: "Tue", value: 65 },
  { day: "Wed", value: 50 },
  { day: "Thu", value: 82 },
  { day: "Fri", value: 60 },
  { day: "Sat", value: 92 },
  { day: "Sun", value: 72 },
];

const initialOrders = [
  {
    id: "#ORD-1025",
    customer: "Rahul Sharma",
    product: "Vibha Sandal Cream",
    date: "23 Oct 2026",
    amount: 320,
    status: "Delivered",
  },
  {
    id: "#ORD-1024",
    customer: "Priya Patel",
    product: "Nimbapatradi Churnam",
    date: "23 Oct 2026",
    amount: 450,
    status: "Processing",
  },
  {
    id: "#ORD-1023",
    customer: "Amit Verma",
    product: "Handmade Soap",
    date: "22 Oct 2026",
    amount: 198,
    status: "Pending",
  },
  {
    id: "#ORD-1022",
    customer: "Sneha Joshi",
    product: "Vibha Hair Care Cream",
    date: "22 Oct 2026",
    amount: 500,
    status: "Delivered",
  },
];

function Dashboard() {
  const [period, setPeriod] = useState("This Week");

  const stats = [
    {
      title: "Total Revenue",
      value: "₹2,45,680",
      change: "+12.8%",
      positive: true,
      icon: <CurrencyRupee />,
      color: "green",
      note: "vs. last month",
    },
    {
      title: "Total Orders",
      value: "1,284",
      change: "+8.2%",
      positive: true,
      icon: <ShoppingBag />,
      color: "blue",
      note: "vs. last month",
    },
    {
      title: "Total Customers",
      value: "8,549",
      change: "+5.4%",
      positive: true,
      icon: <People />,
      color: "purple",
      note: "vs. last month",
    },
    {
      title: "Pending Orders",
      value: "36",
      change: "-2.5%",
      positive: true,
      icon: <Inventory2 />,
      color: "orange",
      note: "vs. last month",
    },
  ];

  return (
    <main className="dashboard-page">
      {/* Page Header */}
      <header className="dashboard-heading">
        <div>
          {/* <div className="dashboard-breadcrumb">
            <DashboardIcon fontSize="small" />
            <span>Dashboard</span>
            <span>/</span>
            <span className="breadcrumb-active">Overview</span>
          </div> */}

          <h1>Dashboard Overview</h1>
          <p>Welcome Lorem ipsum dolor sit amet consectetur store.</p>
        </div>

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
      </header>

      {/* Statistics */}
      <section className="dashboard-stats">
        {stats.map((stat) => (
          <article className="dashboard-stat-card" key={stat.title}>
            <div className="stat-card-top">
              <span className="stat-title">{stat.title}</span>
              <span className={`stat-icon ${stat.color}`}>{stat.icon}</span>
            </div>

            <h2>{stat.value}</h2>

            <div className="stat-bottom">
              <span
                className={`stat-change ${
                  stat.positive ? "positive" : "negative"
                }`}
              >
                {stat.positive ? (
                  <TrendingUp fontSize="small" />
                ) : (
                  <TrendingDown fontSize="small" />
                )}
                {stat.change}
              </span>
              <span className="stat-note">{stat.note}</span>
            </div>
          </article>
        ))}
      </section>

      {/* Sales Chart and Order Summary */}
      <section className="dashboard-middle-grid">
        <article className="dashboard-panel sales-panel">
          <div className="panel-heading">
            <div>
              <h3>Sales Overview</h3>
              <p>Track your store's sales performance</p>
            </div>

            <button
              type="button"
              className="panel-more-btn"
              aria-label="Sales overview options"
              onClick={() =>
                setPeriod((previous) =>
                  previous === "This Week" ? "This Month" : "This Week",
                )
              }
            >
              <MoreHoriz />
            </button>
          </div>

          <div className="sales-total">
            <h2>₹84,254</h2>
            <span className="sales-growth">
              <TrendingUp fontSize="small" /> 14.6%
            </span>
          </div>

          <p className="sales-caption">
            Total sales <span>· {period}</span>
          </p>

          <div
            className="sales-chart"
            role="img"
            aria-label="Illustrative weekly sales chart"
          >
            <div className="chart-y-labels">
              <span>₹10k</span>
              <span>₹7.5k</span>
              <span>₹5k</span>
              <span>₹2.5k</span>
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
                {salesData.map((item) => (
                  <div className="chart-bar-column" key={item.day}>
                    <div
                      className="chart-bar"
                      style={{ height: `${item.value}%` }}
                      title={`${item.day}: ${item.value}%`}
                    />
                    <span>{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="dashboard-panel order-summary-panel">
          <div className="panel-heading">
            <div>
              <h3>Order Summary</h3>
              <p>Current order status</p>
            </div>
            <button
              type="button"
              className="panel-more-btn"
              aria-label="Order summary options"
            >
              <MoreHoriz />
            </button>
          </div>

          <div className="order-summary-list">
            <div className="order-summary-item">
              <span className="summary-icon delivered">
                <CheckCircle />
              </span>
              <div className="summary-details">
                <strong>Delivered</strong>
                <span>Successfully completed</span>
              </div>
              <strong className="summary-number">856</strong>
            </div>

            <div className="order-summary-item">
              <span className="summary-icon shipping">
                <LocalShipping />
              </span>
              <div className="summary-details">
                <strong>Processing</strong>
                <span>Orders being prepared</span>
              </div>
              <strong className="summary-number">392</strong>
            </div>

            <div className="order-summary-item">
              <span className="summary-icon pending">
                <PendingActions />
              </span>
              <div className="summary-details">
                <strong>Pending</strong>
                <span>Awaiting confirmation</span>
              </div>
              <strong className="summary-number">36</strong>
            </div>
          </div>

          <div className="order-summary-footer">
            <span>Total orders</span>
            <strong>1,284</strong>
          </div>
        </article>
      </section>

      {/* Recent Orders */}
      <section className="dashboard-panel recent-orders-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Orders</h3>
            <p>Latest orders placed in your store</p>
          </div>

          <button
            type="button"
            className="view-all-btn"
            onClick={() =>
              window.alert("Connect this button to your Orders page.")
            }
          >
            View All <ArrowForward fontSize="small" />
          </button>
        </div>

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
              {initialOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.product}</td>
                  <td className="order-date">{order.date}</td>
                  <td className="order-amount">
                    ₹{order.amount.toLocaleString("en-IN")}
                  </td>
                  <td>
                    <span
                      className={`order-status ${order.status.toLowerCase()}`}
                    >
                      <span className="status-dot" />
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
