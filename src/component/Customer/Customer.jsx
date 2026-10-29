import React, { useState } from "react";
import "./Customer.css";

import SearchIcon from "@mui/icons-material/Search";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";

const customerData = [
  {
    id: "#CUS001",
    name: "Aarav Sharma",
    email: "aarav.sharma@gmail.com",
    phone: "+91 98765 43210",
    orders: 12,
    spent: "₹8,450",
    status: "Active",
    joined: "12 Oct 2026",
    initials: "AS",
  },
  {
    id: "#CUS002",
    name: "Priya Patel",
    email: "priya.patel@gmail.com",
    phone: "+91 87654 32109",
    orders: 8,
    spent: "₹5,200",
    status: "Active",
    joined: "10 Oct 2026",
    initials: "PP",
  },
  {
    id: "#CUS003",
    name: "Rahul Verma",
    email: "rahul.verma@gmail.com",
    phone: "+91 99887 76655",
    orders: 3,
    spent: "₹1,850",
    status: "Inactive",
    joined: "08 Oct 2026",
    initials: "RV",
  },
  {
    id: "#CUS004",
    name: "Sneha Joshi",
    email: "sneha.joshi@gmail.com",
    phone: "+91 88776 65544",
    orders: 15,
    spent: "₹12,600",
    status: "Active",
    joined: "05 Oct 2026",
    initials: "SJ",
  },
  {
    id: "#CUS005",
    name: "Aditya Kulkarni",
    email: "aditya.k@gmail.com",
    phone: "+91 77665 54433",
    orders: 1,
    spent: "₹650",
    status: "Inactive",
    joined: "02 Oct 2026",
    initials: "AK",
  },
];

function Customer() {
  const [customers, setCustomers] = useState(customerData);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCustomer, setMenuCustomer] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    quantity: "1",
    price: "",
  });
  const [formError, setFormError] = useState("");

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      quantity: "1",
      price: "",
    });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (customer) => {
    const spent = Number(String(customer.spent || "₹0").replace(/[₹,\s]/g, ""));

    setEditingId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      quantity: String(customer.orders ?? 1),
      price:
        customer.orders > 0
          ? String(Number((spent / customer.orders).toFixed(2)))
          : "",
    });
    setFormError("");
    setShowForm(true);
  };

  const closeCustomerForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      quantity: "1",
      price: "",
    });
    setFormError("");
  };

  const saveCustomer = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (!name || !email || !phone) {
      setFormError("Please fill in all customer details.");
      return;
    }

    if (
      form.quantity.trim() === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setFormError("Please enter a valid quantity.");
      return;
    }

    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setFormError("Please enter a valid order price.");
      return;
    }

    const duplicateEmail = customers.some(
      (customer) =>
        customer.email.toLowerCase() === email && customer.id !== editingId,
    );

    if (duplicateEmail) {
      setFormError("This email is already registered.");
      return;
    }

    // Automatic total calculation
    const totalSpent = quantity * price;
    const formattedSpent = `₹${totalSpent.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    if (editingId !== null) {
      setCustomers((previous) =>
        previous.map((customer) =>
          customer.id === editingId
            ? {
                ...customer,
                name,
                email,
                phone,
                orders: quantity,
                price,
                spent: formattedSpent,
                initials,
              }
            : customer,
        ),
      );

      setSelectedCustomer((previous) =>
        previous?.id === editingId
          ? {
              ...previous,
              name,
              email,
              phone,
              orders: quantity,
              price,
              spent: formattedSpent,
              initials,
            }
          : previous,
      );
    } else {
      const newCustomer = {
        id: `#CUS${String(Date.now()).slice(-6)}`,
        name,
        email,
        phone,
        orders: quantity,
        price,
        spent: formattedSpent,
        status: "Active",
        joined: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        initials,
      };

      setCustomers((previous) => [...previous, newCustomer]);
    }

    closeCustomerForm();
  };

  const handleMenuEdit = () => {
    const customer = menuCustomer;
    handleMenuClose();

    if (customer) {
      openEditForm(customer);
    }
  };

  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event, customer) => {
    setAnchorEl(event.currentTarget);
    setMenuCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCustomer(null);
  };

  const handleMenuView = () => {
    const customer = menuCustomer;
    handleMenuClose();

    if (customer) {
      setSelectedCustomer(customer);
    }
  };

  const handleMenuDelete = () => {
    const customerId = menuCustomer?.id;
    handleMenuClose();

    if (customerId) {
      deleteCustomer(customerId);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = [
      customer.name,
      customer.email,
      customer.phone,
      customer.id,
    ].some((value) => value.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = status === "All" || customer.status === status;

    return matchesSearch && matchesStatus;
  });

  const deleteCustomer = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?",
    );

    if (confirmed) {
      setCustomers((previous) =>
        previous.filter((customer) => customer.id !== id),
      );
    }
  };

  const exportCSV = () => {
    const headers = [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Orders",
      "Total Spent",
      "Status",
      "Joined",
    ];

    const rows = filteredCustomers.map((customer) => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.orders,
      customer.spent,
      customer.status,
      customer.joined,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

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

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Customers</h1>
          <p>Manage and monitor your customer relationships.</p>
        </div>

        <div className="customer-header-actions">
          <button className="customer-export-btn" onClick={exportCSV}>
            <FileDownloadOutlinedIcon />
            Export CSV
          </button>

          <button className="customer-add-btn" onClick={openAddForm}>
            <PersonAddAltOutlinedIcon />
            Add Customer
          </button>
        </div>
      </div>

      <div className="customer-stats">
        <div className="customer-stat-card">
          <div className="customer-stat-icon green">
            <PeopleAltOutlinedIcon />
          </div>
          <div>
            <span>Total Customers</span>
            <h2>{customers.length.toLocaleString("en-IN")}</h2>
            <small>Registered customers</small>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon blue">
            <PeopleAltOutlinedIcon />
          </div>
          <div>
            <span>Active Customers</span>
            <h2>{customers.filter((c) => c.status === "Active").length}</h2>
            <small>Currently active</small>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon orange">
            <PeopleAltOutlinedIcon />
          </div>
          <div>
            <span>Total Orders</span>
            <h2>{customers.reduce((sum, c) => sum + c.orders, 0)}</h2>
            <small>Orders by these customers</small>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon purple">₹</div>
          <div>
            <span>Total Revenue</span>
            <h2>
              ₹
              {customers
                .reduce(
                  (sum, c) => sum + Number(c.spent.replace(/[₹,]/g, "")),
                  0,
                )
                .toLocaleString("en-IN")}
            </h2>
            <small>Customer purchase value</small>
          </div>
        </div>
      </div>

      {showForm && (
        <div
          className="customer-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCustomerForm();
            }
          }}
        >
          <form
            className="customer-modal customer-form-modal"
            onSubmit={saveCustomer}
          >
            <button
              type="button"
              className="customer-modal-close"
              onClick={closeCustomerForm}
              aria-label="Close form"
            >
              ×
            </button>

            <h2>{editingId !== null ? "Edit Customer" : "Add New Customer"}</h2>

            <p>
              {editingId !== null
                ? "Update customer information."
                : "Enter the new customer's information."}
            </p>

            <div className="customer-form-field">
              <label htmlFor="customer-name">Full Name</label>
              <input
                id="customer-name"
                type="text"
                placeholder="Enter customer name"
                value={form.name}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }));
                  setFormError("");
                }}
                required
              />
            </div>

            <div className="customer-form-field">
              <label htmlFor="customer-email">Email Address</label>
              <input
                id="customer-email"
                type="email"
                placeholder="customer@example.com"
                value={form.email}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }));
                  setFormError("");
                }}
                required
              />
            </div>

            <div className="customer-form-field">
              <label htmlFor="customer-phone">Phone Number</label>
              <input
                id="customer-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }));
                  setFormError("");
                }}
                required
              />
            </div>

            <div className="customer-form-field">
              <label htmlFor="customer-quantity">Quantity / Total Orders</label>
              <input
                id="customer-quantity"
                type="number"
                min="0"
                step="1"
                placeholder="Enter quantity"
                value={form.quantity}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    quantity: event.target.value,
                  }));
                  setFormError("");
                }}
                required
              />
            </div>

            <div className="customer-form-field">
              <label htmlFor="customer-price">Price Per Order (₹)</label>
              <input
                id="customer-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter price"
                value={form.price}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    price: event.target.value,
                  }));
                  setFormError("");
                }}
                required
              />
            </div>

            <div className="customer-form-field">
              <label htmlFor="customer-total">Total Spent (₹)</label>
              <input
                id="customer-total"
                type="text"
                value={`₹${(
                  (Number(form.quantity) || 0) * (Number(form.price) || 0)
                ).toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}`}
                readOnly
              />
              <small>Quantity × Price Per Order</small>
            </div>

            {formError && (
              <p className="customer-form-error" role="alert">
                {formError}
              </p>
            )}

            <div className="customer-form-actions">
              <button
                type="button"
                className="customer-form-cancel"
                onClick={closeCustomerForm}
              >
                Cancel
              </button>

              <button type="submit" className="customer-form-save">
                {editingId !== null ? "Save Changes" : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="customer-table-card">
        <div className="customer-table-heading">
          <div>
            <h2>All Customers</h2>
            <p>View and manage your registered customers.</p>
          </div>

          <span className="customer-count">
            {filteredCustomers.length} customers
          </span>
        </div>

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
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="customer-profile">
                      <div className="customer-avatar">{customer.initials}</div>
                      <div className="customer-profile-info">
                        <strong>{customer.name}</strong>
                        <span>{customer.email}</span>
                        <small>{customer.id}</small>
                      </div>
                    </div>
                  </td>

                  <td className="customer-phone">{customer.phone}</td>

                  <td>
                    <span className="customer-order-count">
                      {customer.orders}
                    </span>
                  </td>

                  <td className="customer-spent">{customer.spent}</td>

                  <td>
                    <span
                      className={`customer-status ${
                        customer.status === "Active" ? "active" : "inactive"
                      }`}
                    >
                      <span />
                      {customer.status}
                    </span>
                  </td>

                  <td className="customer-joined">{customer.joined}</td>

                  <td className="product-actions-cell">
                    <Tooltip title="More options">
                      <IconButton
                        size="small"
                        className="stock-more-btn"
                        onClick={(event) => handleMenuOpen(event, customer)}
                        aria-label={`Options for ${customer.name}`}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="7" className="customer-empty">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            slotProps={{
              paper: {
                sx: {
                  minWidth: 170,
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
                },
              },
            }}
          >
            <MenuItem onClick={handleMenuView}>
              <ListItemIcon>
                <VisibilityOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Customer</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleMenuEdit}>
              <ListItemIcon>
                <EditOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Customer</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleMenuDelete} sx={{ color: "#dc2626" }}>
              <ListItemIcon sx={{ color: "#dc2626" }}>
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Customer</ListItemText>
            </MenuItem>
          </Menu>
        </div>

        <div className="customer-table-footer">
          <span>
            Showing {filteredCustomers.length} of {customers.length} customers
          </span>
          <span className="customer-footer-note">Customer Management</span>
        </div>
      </div>

      {selectedCustomer && (
        <div
          className="customer-modal-overlay"
          onClick={() => setSelectedCustomer(null)}
        >
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="customer-modal-close"
              onClick={() => setSelectedCustomer(null)}
            >
              ×
            </button>

            <div className="customer-modal-avatar">
              {selectedCustomer.initials}
            </div>
            <h2>{selectedCustomer.name}</h2>
            <p>{selectedCustomer.id}</p>

            <div className="customer-modal-details">
              <span>Email</span>
              <strong>{selectedCustomer.email}</strong>

              <span>Phone</span>
              <strong>{selectedCustomer.phone}</strong>

              <span>Total Orders</span>
              <strong>{selectedCustomer.orders}</strong>

              <span>Total Spent</span>
              <strong>{selectedCustomer.spent}</strong>

              <span>Status</span>
              <strong>{selectedCustomer.status}</strong>

              <span>Joined Date</span>
              <strong>{selectedCustomer.joined}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customer;
