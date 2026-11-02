import { useState } from "react";
import "./Payment.css";

import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import Search from "@mui/icons-material/Search";
import Download from "@mui/icons-material/Download";
import MoreVert from "@mui/icons-material/MoreVert";
import CreditCard from "@mui/icons-material/CreditCard";
import AccountBalance from "@mui/icons-material/AccountBalance";
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";

const paymentData = [
  {
    id: "PAY-2026-001",
    customer: "Rahul Sharma",
    email: "rahul@gmail.com",
    date: "27 Oct 2026",
    orderId: "ORD-2026-001",
    method: "UPI",
    amount: 610,
    status: "Success",
  },
  {
    id: "PAY-2026-002",
    customer: "Priya Patel",
    email: "priya@gmail.com",
    date: "27 Oct 2026",
    orderId: "ORD-2026-002",
    method: "Credit Card",
    amount: 470,
    status: "Success",
  },
  {
    id: "PAY-2026-003",
    customer: "Amit Verma",
    email: "amit@gmail.com",
    date: "26 Oct 2026",
    orderId: "ORD-2026-003",
    method: "Cash on Delivery",
    amount: 750,
    status: "Pending",
  },
  {
    id: "PAY-2026-004",
    customer: "Sneha Joshi",
    email: "sneha@gmail.com",
    date: "26 Oct 2026",
    orderId: "ORD-2026-004",
    method: "Net Banking",
    amount: 250,
    status: "Success",
  },
  {
    id: "PAY-2026-005",
    customer: "Vikas Patil",
    email: "vikas@gmail.com",
    date: "25 Oct 2026",
    orderId: "ORD-2026-005",
    method: "UPI",
    amount: 880,
    status: "Failed",
  },
  {
    id: "PAY-2026-006",
    customer: "Aditya Kulkarni",
    email: "aditya@gmail.com",
    date: "24 Oct 2026",
    orderId: "ORD-2026-006",
    method: "Credit Card",
    amount: 1200,
    status: "Refunded",
  },
];

function Payment() {
  const [payments, setPayments] = useState(paymentData);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Status");
  const [menuId, setMenuId] = useState(null);

  const totalAmount = payments
    .filter((p) => p.status === "Success")
    .reduce((sum, p) => sum + p.amount, 0);

  const successful = payments.filter((p) => p.status === "Success").length;

  const pending = payments.filter((p) => p.status === "Pending").length;

  const failed = payments.filter((p) => p.status === "Failed").length;

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.customer.toLowerCase().includes(search.toLowerCase()) ||
      payment.id.toLowerCase().includes(search.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All Status" || payment.status === filter;

    return matchesSearch && matchesFilter;
  });

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

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "payment-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const updateStatus = (id, status) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    );
    setMenuId(null);
  };

  return (
    <div className="payment-page">
      {/* Header */}
      <div className="payment-header">
        <div>
          <h1>Payment Management</h1>
          <p>Track, manage and monitor all customer payments.</p>
        </div>

        <button className="payment-export-btn" onClick={exportCSV}>
          <Download />
          Export CSV
        </button>
      </div>

      {/* Payment Table */}
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
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="payment-id">{payment.id}</td>

                    <td>
                      <div className="payment-customer">
                        <div className="payment-avatar">
                          {payment.customer.charAt(0)}
                        </div>
                        <div>
                          <strong>{payment.customer}</strong>
                          <small>{payment.email}</small>
                        </div>
                      </div>
                    </td>

                    <td>{payment.date}</td>

                    <td className="payment-order-id">{payment.orderId}</td>

                    <td>
                      <div className="payment-method">
                        {payment.method === "UPI" ? (
                          <PaymentsOutlined />
                        ) : payment.method === "Net Banking" ? (
                          <AccountBalance />
                        ) : payment.method === "Cash on Delivery" ? (
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

                    {/* <td className="payment-action-cell">
                      <button
                        className="payment-action-btn"
                        onClick={() =>
                          setMenuId(menuId === payment.id ? null : payment.id)
                        }
                      >
                        <MoreVert />
                      </button>

                      {menuId === payment.id && (
                        <div className="payment-action-menu">
                          <button
                            onClick={() => updateStatus(payment.id, "Success")}
                          >
                            Mark Success
                          </button>
                          <button
                            onClick={() => updateStatus(payment.id, "Pending")}
                          >
                            Mark Pending
                          </button>
                          <button
                            onClick={() => updateStatus(payment.id, "Refunded")}
                          >
                            Mark Refunded
                          </button>
                          <button
                            onClick={() => updateStatus(payment.id, "Failed")}
                          >
                            Mark Failed
                          </button>
                        </div>
                      )}
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="payment-empty">
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
