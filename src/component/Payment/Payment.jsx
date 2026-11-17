import { useState, useEffect } from "react";
import "./Payment.css";

import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import Search from "@mui/icons-material/Search";
import Download from "@mui/icons-material/Download";
import CreditCard from "@mui/icons-material/CreditCard";
import AccountBalance from "@mui/icons-material/AccountBalance";
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";

const API_URL =
  "http://localhost/Admin-Panel/Dashboard/Backend/api/payment-list.php";

function Payment() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch payment data from PHP API
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success === false) {
        throw new Error(result.message || "Unable to fetch payments");
      }

      const data = Array.isArray(result)
        ? result
        : result.data || result.payments || [];

      const formattedData = data.map((p) => ({
        id: String(p.payment_id ?? p.id ?? ""),
        customer: p.customer_name ?? p.customer ?? "N/A",
        email: p.email ?? p.customer_email ?? "N/A",
        date: p.payment_date ?? p.date ?? p.created_at ?? "",
        orderId: p.order_id ?? "N/A",
        method: p.payment_method ?? p.method ?? "N/A",
        amount: Number(p.amount ?? 0),
        status: p.status ?? "Pending",
      }));

      setPayments(formattedData);
    } catch (err) {
      console.error("Payment API Error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Payment Summary
  const totalAmount = payments
    .filter((p) => p.status.toLowerCase() === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  const successful = payments.filter(
    (p) => p.status.toLowerCase() === "success",
  ).length;

  const pending = payments.filter(
    (p) => p.status.toLowerCase() === "pending",
  ).length;

  const failed = payments.filter(
    (p) => p.status.toLowerCase() === "failed",
  ).length;

  // Search and Filter
  const filteredPayments = payments.filter((payment) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      payment.customer.toLowerCase().includes(searchText) ||
      payment.id.toLowerCase().includes(searchText) ||
      payment.orderId.toLowerCase().includes(searchText) ||
      payment.email.toLowerCase().includes(searchText);

    const matchesFilter =
      filter === "All Status" ||
      payment.status.toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  // Export CSV
  const exportCSV = () => {
    const headers = [
      "Payment ID",
      "Customer",
      "Email",
      "Order ID",
      "Date",
      "Method",
      "Amount",
      "Status",
    ];

    const rows = filteredPayments.map((p) => [
      p.id,
      p.customer,
      p.email,
      p.orderId,
      p.date,
      p.method,
      p.amount,
      p.status,
    ]);

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "payment-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="payment-page">
      {/* Header */}
      <div className="payment-header">
        <div>
          <h1>Payment Management</h1>
          <p>Track, manage and monitor all customer payments.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="payment-export-btn"
            onClick={fetchPayments}
            disabled={loading}
          >
            Refresh
          </button>

          <button
            className="payment-export-btn"
            onClick={exportCSV}
            disabled={filteredPayments.length === 0}
          >
            <Download />
            Export CSV
          </button>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="payment-stats">
        <div className="payment-stat-card">
          <div className="payment-stat-icon purple">
            <AccountBalanceWalletOutlined />
          </div>
          <div>
            <span>Total Revenue</span>
            <h2>₹{totalAmount.toLocaleString("en-IN")}</h2>
            <small>Successful payments</small>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon green">
            <PaymentsOutlined />
          </div>
          <div>
            <span>Successful Payments</span>
            <h2>{successful}</h2>
            <small>Completed transactions</small>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon orange">
            <AccountBalance />
          </div>
          <div>
            <span>Pending Payments</span>
            <h2>{pending}</h2>
            <small>Awaiting confirmation</small>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon red">
            <CreditCard />
          </div>
          <div>
            <span>Failed Payments</span>
            <h2>{failed}</h2>
            <small>Unsuccessful transactions</small>
          </div>
        </div>
      </div>
      {/* Transactions */}
      <div className="payment-table-card">
        <div className="payment-table-header">
          <div>
            <h3>All Transactions</h3>
            <p>View and manage all payment transactions.</p>
          </div>

          <span className="payment-count">
            {filteredPayments.length} Payments
          </span>
        </div>

        {/* Search and Filter */}
        <div className="payment-filters">
          <div className="payment-search">
            <Search />

            <input
              type="text"
              placeholder="Search payment, customer or order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All Status</option>
            <option>Success</option>
            <option>Pending</option>
            <option>Failed</option>
            <option>Refunded</option>
          </select>
        </div>

        {/* Table */}
        <div className="payment-table-wrapper">
          <table className="payment-table">
            <thead>
              <tr>
                <th>PAYMENT ID</th>
                <th>CUSTOMER</th>
                <th>DATE</th>
                <th>ORDER ID</th>
                <th>METHOD</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="payment-empty">
                    Loading payments...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="payment-empty">
                    {error}
                    <br />
                    <button onClick={fetchPayments}>Try Again</button>
                  </td>
                </tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="payment-id">{payment.id}</td>

                    <td>
                      <div className="payment-customer">
                        <div className="payment-avatar">
                          {payment.customer.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{payment.customer}</strong>
                          <small>{payment.email}</small>
                        </div>
                      </div>
                    </td>

                    <td>{formatDate(payment.date)}</td>

                    <td className="payment-order-id">{payment.orderId}</td>

                    <td>
                      <div className="payment-method">
                        {payment.method.toLowerCase().includes("upi") ? (
                          <PaymentsOutlined />
                        ) : payment.method.toLowerCase().includes("bank") ? (
                          <AccountBalance />
                        ) : payment.method.toLowerCase().includes("cash") ? (
                          <AccountBalanceWalletOutlined />
                        ) : (
                          <CreditCard />
                        )}

                        {payment.method}
                      </div>
                    </td>

                    <td className="payment-amount">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span
                        className={`payment-status ${payment.status.toLowerCase()}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="payment-empty">
                    No payment transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="payment-table-footer">
          Showing {filteredPayments.length} of {payments.length} transactions
        </div>
      </div>
    </div>
  );
}

export default Payment;
