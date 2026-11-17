import React, { useState, useEffect, useMemo } from "react";
import "./Customer.css";

import SearchIcon from "@mui/icons-material/Search";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";

import { IconButton, Tooltip } from "@mui/material";

const API_URL =
  "http://localhost/Admin-Panel/dashboard/Backend/api/customer-list.php";

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================
  // FETCH CUSTOMERS FROM PHP API
  // =====================================

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      // Read response before checking HTTP status
      const responseText = await response.text();

      console.log("Customer API Status:", response.status);
      console.log("Customer API Response:", responseText);

      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          "PHP API returned invalid JSON: " + responseText.slice(0, 300),
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message || result.error || `HTTP Error: ${response.status}`,
        );
      }

      if (result.success === false) {
        throw new Error(result.message || "Unable to fetch customers");
      }

      const data = Array.isArray(result)
        ? result
        : result.data || result.customers || [];

      if (!Array.isArray(data)) {
        throw new Error("Invalid customer data received");
      }

      const formattedCustomers = data.map((customer) => {
        const name = customer.name || "Unknown Customer";

        const initials = name
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return {
          id: customer.id,
          customerId: `CUS${String(customer.id).padStart(3, "0")}`,
          name,
          email: customer.email || "N/A",
          phone: customer.phone || "N/A",
          joined: customer.created_at || "",
          initials: initials || "C",
          orders: Number(customer.orders || 0),
          spent: Number(customer.spent || 0),
          status: customer.status || "Active",
        };
      });

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error("Customer API Error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // =====================================
  // FORMAT DATE
  // =====================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================
  // FORMAT CURRENCY
  // =====================================

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  // =====================================
  // CUSTOMER STATISTICS
  // =====================================

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.status.toLowerCase() === "active",
  ).length;

  const totalOrders = customers.reduce(
    (sum, customer) => sum + customer.orders,
    0,
  );

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.spent,
    0,
  );

  // =====================================
  // SEARCH AND FILTER
  // =====================================

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchText = search.toLowerCase();

      const matchesSearch = [
        customer.name,
        customer.email,
        customer.phone,
        String(customer.id),
        customer.customerId,
      ].some((value) => String(value).toLowerCase().includes(searchText));

      const matchesStatus =
        status === "All" ||
        customer.status.toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, status]);

  // =====================================
  // EXPORT CSV
  // =====================================

  const exportCSV = () => {
    if (filteredCustomers.length === 0) return;

    const headers = [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Orders",
      "Total Spent",
      "Status",
      "Joined Date",
    ];

    const rows = filteredCustomers.map((customer) => [
      customer.customerId,
      customer.name,
      customer.email,
      customer.phone,
      customer.orders,
      customer.spent,
      customer.status,
      customer.joined,
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
    link.download = "customers.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  // =====================================
  // VIEW CUSTOMER
  // =====================================

  const viewCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div className="customer-page">
      {/* HEADER */}

      <div className="customer-header">
        <div>
          <h1>Customers</h1>
          <p>Manage and monitor your registered customers.</p>
        </div>

        <div className="customer-header-actions">
          <button
            className="customer-export-btn"
            onClick={fetchCustomers}
            disabled={loading}
          >
            <RefreshIcon />
            Refresh
          </button>

          <button
            className="customer-export-btn"
            onClick={exportCSV}
            disabled={filteredCustomers.length === 0}
          >
            <FileDownloadOutlinedIcon />
            Export CSV
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="customer-stats">
        <div className="customer-stat-card">
          <div className="customer-stat-icon green">
            <PeopleAltOutlinedIcon />
          </div>

          <div>
            <span>Total Customers</span>
            <h2>{totalCustomers.toLocaleString("en-IN")}</h2>
            <small>Registered customers</small>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon blue">
            <PeopleAltOutlinedIcon />
          </div>

          <div>
            <span>Active Customers</span>
            <h2>{activeCustomers}</h2>
            <small>Registered accounts</small>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon orange">
            <PeopleAltOutlinedIcon />
          </div>

          <div>
            <span>Total Orders</span>
            <h2>{totalOrders}</h2>
            <small>Customer orders</small>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon purple">₹</div>

          <div>
            <span>Total Revenue</span>
            <h2>₹{formatCurrency(totalRevenue)}</h2>
            <small>Customer purchase value</small>
          </div>
        </div>
      </div>

      {/* CUSTOMER TABLE */}

      <div className="customer-table-card">
        <div className="customer-table-heading">
          <div>
            <h2>All Customers</h2>
            <p>View your registered customers from the database.</p>
          </div>

          <span className="customer-count">
            {filteredCustomers.length} Customers
          </span>
        </div>

        {/* SEARCH AND FILTER */}

        <div className="customer-toolbar">
          <div className="customer-search">
            <SearchIcon />

            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="customer-filter">
            <FilterListOutlinedIcon />

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* TABLE */}

        <div className="customer-table-wrapper">
          <table className="customer-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="customer-empty">
                    Loading customers...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="customer-empty">
                    <p>{error}</p>

                    <button
                      className="customer-export-btn"
                      onClick={fetchCustomers}
                    >
                      Try Again
                    </button>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-profile">
                        <div className="customer-avatar">
                          {customer.initials}
                        </div>

                        <div className="customer-profile-info">
                          <strong>{customer.name}</strong>
                          <span>{customer.email}</span>
                          <small>#{customer.customerId}</small>
                        </div>
                      </div>
                    </td>

                    <td className="customer-phone">{customer.phone}</td>

                    <td>
                      <span className="customer-order-count">
                        {customer.orders}
                      </span>
                    </td>

                    <td className="customer-spent">
                      ₹{formatCurrency(customer.spent)}
                    </td>

                    <td>
                      <span
                        className={`customer-status ${
                          customer.status.toLowerCase() === "active"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        <span />
                        {customer.status}
                      </span>
                    </td>

                    <td className="customer-joined">
                      {formatDate(customer.joined)}
                    </td>

                    <td className="product-actions-cell">
                      <Tooltip title="View Customer">
                        <IconButton
                          size="small"
                          onClick={() => viewCustomer(customer)}
                          aria-label={`View ${customer.name}`}
                        >
                          <VisibilityOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="customer-empty">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}

        <div className="customer-table-footer">
          <span>
            Showing {filteredCustomers.length} of {customers.length} customers
          </span>

          <span className="customer-footer-note">Customer Management</span>
        </div>
      </div>

      {/* CUSTOMER DETAILS MODAL */}

      {selectedCustomer && (
        <div
          className="customer-modal-overlay"
          onClick={() => setSelectedCustomer(null)}
        >
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="customer-modal-close"
              onClick={() => setSelectedCustomer(null)}
              aria-label="Close"
            >
              <CloseIcon />
            </button>

            <div className="customer-modal-avatar">
              {selectedCustomer.initials}
            </div>

            <h2>{selectedCustomer.name}</h2>
            <p>#{selectedCustomer.customerId}</p>

            <div className="customer-modal-details">
              <span>Email Address</span>
              <strong>{selectedCustomer.email}</strong>

              <span>Phone Number</span>
              <strong>{selectedCustomer.phone}</strong>

              <span>Total Orders</span>
              <strong>{selectedCustomer.orders}</strong>

              <span>Total Spent</span>
              <strong>₹{formatCurrency(selectedCustomer.spent)}</strong>

              <span>Status</span>
              <strong>{selectedCustomer.status}</strong>

              <span>Joined Date</span>
              <strong>{formatDate(selectedCustomer.joined)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customer;
