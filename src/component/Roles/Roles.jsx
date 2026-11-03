import { useEffect, useMemo, useState } from "react";

import {
  Add,
  Search,
  EditOutlined,
  DeleteOutlineRounded,
  SecurityOutlined,
  MoreVert,
  AdminPanelSettingsOutlined,
  LocalShippingOutlined,
} from "@mui/icons-material";

import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";

import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

import "./Roles.css";

const ROLE_API = "http://localhost/Admin-Panel/dashboard/Backend/api/roles.php";

const emptyForm = {
  name: "",
};

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const menuOpen = Boolean(anchorEl);

  // Fetch Roles
  const fetchRoles = async () => {
    try {
      setLoading(true);

      const response = await fetch(ROLE_API);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to fetch roles.");
      }

      const formattedRoles = (result.data || []).map((item) => ({
        id: Number(item.id),
        name: item.name ?? item.role_name ?? "",
      }));

      setRoles(formattedRoles);
    } catch (error) {
      console.error("Role Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Search Roles
  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase();

    return roles.filter((role) => role.name.toLowerCase().includes(term));
  }, [roles, search]);

  // Open Add Form
  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  // Open Edit Form
  const openEditForm = (role) => {
    setEditingId(role.id);

    setForm({
      name: role.name,
    });

    setError("");
    setShowForm(true);
  };

  // Close Form
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  };

  // Save Role
  const saveRole = async (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Please enter a role name.");
      return;
    }

    const duplicate = roles.some(
      (role) =>
        role.name.toLowerCase() === name.toLowerCase() && role.id !== editingId,
    );

    if (duplicate) {
      setError("This role already exists.");
      return;
    }

    try {
      const response = await fetch(ROLE_API, {
        method: editingId !== null ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...(editingId !== null && { id: editingId }),
          name,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to save role.");
        return;
      }

      closeForm();
      await fetchRoles();
    } catch (error) {
      console.error("Save Role Error:", error);
      setError("Server connection failed.");
    }
  };

  // Delete Role
  const deleteRole = async (id) => {
    const role = roles.find((item) => item.id === id);

    if (!role) return;

    if (role.name.toLowerCase() === "admin") {
      alert("Admin role cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${role.name} role?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${ROLE_API}?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Unable to delete role.");
        return;
      }

      await fetchRoles();
    } catch (error) {
      console.error("Delete Role Error:", error);
      alert("Server connection failed.");
    }
  };

  // Action Menu
  const handleMenuOpen = (event, role) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  const handleMenuEdit = () => {
    const role = selectedRole;
    handleMenuClose();

    if (role) openEditForm(role);
  };

  const handleMenuDelete = () => {
    const role = selectedRole;
    handleMenuClose();

    if (role) deleteRole(role.id);
  };

  // Role Icons
  const getRoleIcon = (name) => {
    const roleName = name.toLowerCase();

    if (
      roleName === "admin" ||
      roleName === "superadmin" ||
      roleName === "super admin"
    ) {
      return <AdminPanelSettingsOutlined />;
    }

    if (roleName === "deliveryboy" || roleName === "delivery boy") {
      return <LocalShippingOutlined />;
    }

    if (roleName === "salesman" || roleName === "salesmean") {
      return <PersonOutlinedIcon />;
    }

    return <SecurityOutlined />;
  };

  return (
    <div className="roles-page">
      {/* Header */}
      <div className="roles-heading">
        <div>
          <h1 className="roles-title">Role Management</h1>

          <p className="roles-subtitle">
            Create and manage application user roles.
          </p>
        </div>

        <button className="roles-add-btn" onClick={openAddForm}>
          <Add />
          <span>Add Role</span>
        </button>
      </div>

      {/* Roles Table */}
      <section className="roles-content">
        <div className="roles-toolbar">
          <div>
            <h2>All Roles</h2>
            <p>View and manage all application roles.</p>
          </div>

          <div className="roles-search">
            <Search />

            <input
              type="search"
              placeholder="Search roles..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search roles"
            />
          </div>
        </div>

        <div className="roles-table-wrapper">
          <table className="roles-table">
            <thead>
              <tr>
                <th>ROLE NAME</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2}>
                    <div className="roles-empty">Loading roles...</div>
                  </td>
                </tr>
              ) : filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <tr key={role.id}>
                    {/* Role Name */}
                    <td>
                      <div className="roles-name-cell">
                        <div className="roles-icon">
                          {getRoleIcon(role.name)}
                        </div>

                        <div>
                          <strong>{role.name}</strong>
                          <span>Application Role</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <button
                        type="button"
                        className="roles-more-btn"
                        title="More actions"
                        aria-label={`Actions for ${role.name}`}
                        onClick={(event) => handleMenuOpen(event, role)}
                      >
                        <MoreVert />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2}>
                    <div className="roles-empty">
                      <SecurityOutlined />

                      <h3>No roles found</h3>

                      <p>Try another search or add a new role.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Action Menu */}
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
                  minWidth: 190,
                  mt: 0.5,
                  borderRadius: "10px",
                  border: "1px solid #e8eee9",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
                },
              },
            }}
          >
            <MenuItem onClick={handleMenuEdit}>
              <ListItemIcon>
                <EditOutlined fontSize="small" />
              </ListItemIcon>

              <ListItemText>Edit Role</ListItemText>
            </MenuItem>

            <MenuItem
              onClick={handleMenuDelete}
              sx={{
                color: "#dc2626",
                "& .MuiListItemIcon-root": {
                  color: "#dc2626",
                },
              }}
            >
              <ListItemIcon>
                <DeleteOutlineRounded fontSize="small" />
              </ListItemIcon>

              <ListItemText>Delete Role</ListItemText>
            </MenuItem>
          </Menu>
        </div>

        {/* Footer */}
        <div className="roles-footer">
          Showing <strong>{filteredRoles.length}</strong> of{" "}
          <strong>{roles.length}</strong> roles
        </div>
      </section>

      {/* Add / Edit Role Dialog */}
      {showForm && (
        <div
          className="roles-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <form
            className="roles-modal"
            onSubmit={saveRole}
            role="dialog"
            aria-modal="true"
            aria-labelledby="roles-modal-title"
          >
            <div className="roles-modal-header">
              <div>
                <h2 id="roles-modal-title">
                  {editingId !== null ? "Edit Role" : "Add New Role"}
                </h2>

                <p>Enter role name below.</p>
              </div>

              <button
                type="button"
                className="roles-modal-close"
                onClick={closeForm}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            {/* Only One Input */}
            <div className="roles-form-field">
              <label htmlFor="role-name">Role Name</label>

              <input
                id="role-name"
                type="text"
                placeholder="Enter Role"
                value={form.name}
                onChange={(event) => {
                  setForm({
                    name: event.target.value,
                  });

                  setError("");
                }}
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="roles-form-error" role="alert">
                {error}
              </p>
            )}

            <div className="roles-modal-actions">
              <button
                type="button"
                className="roles-cancel-btn"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button type="submit" className="roles-save-btn">
                {editingId !== null ? "Save Changes" : "Add Role"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Roles;
