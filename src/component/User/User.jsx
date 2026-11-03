import React, { useEffect, useMemo, useState } from "react";
import "./User.css";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Switch,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";

import {
  Add,
  Search,
  EditOutlined,
  SecurityOutlined,
  Close,
  MoreVert,
} from "@mui/icons-material";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

const API_URL = "http://localhost/Admin-Panel/dashboard/Backend/api/users.php";

const ROLES_API =
  "http://localhost/Admin-Panel/dashboard/Backend/api/roles.php";

// Permission names must match Sidebar menu titles
const availablePermissions = [
  "Dashboard",
  "Stock",
  "Users",
  "Orders",
  "Category",
  "Roles",
  "Product",
  "Customer",
  "Payment",
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "",
  status: "Active",
};

// Handle different API response formats
const getResponseData = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.roles)) return response.roles;

  return [];
};

function User() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState({ ...emptyForm });
  const [permissions, setPermissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [actionAnchor, setActionAnchor] = useState(null);
  const [actionUser, setActionUser] = useState(null);

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Unable to fetch users.");
      }

      const userList = getResponseData(result);

      setUsers(
        userList.map((user) => ({
          ...user,
          id: Number(user.id),
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          status: user.status || "Active",
          permissions: Array.isArray(user.permissions)
            ? user.permissions
            : typeof user.permissions === "string"
              ? JSON.parse(user.permissions || "[]")
              : [],
        })),
      );
    } catch (error) {
      console.error("Fetch users error:", error);
      alert(error.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles from roles.php
  const fetchRoles = async () => {
    try {
      const response = await fetch(ROLES_API);
      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Unable to fetch roles.");
      }

      const roleList = getResponseData(result);

      setRoles(
        roleList
          .map((role) => (typeof role === "string" ? role : role.name))
          .filter(Boolean),
      );
    } catch (error) {
      console.error("Fetch roles error:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Search users
  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term),
    );
  }, [users, search]);

  // Open Add User dialog
  const handleAdd = () => {
    setEditingUser(null);

    setForm({
      ...emptyForm,
      role: roles[0] || "",
      status: "Active",
    });

    setDialogOpen(true);
  };

  // Open Edit User dialog
  const handleEdit = (user) => {
    setEditingUser(user);

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });

    setDialogOpen(true);
  };

  // Add or update user through API
  const handleSave = async () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.role ||
      (!editingUser && !form.password.trim())
    ) {
      alert("Please enter name, email, password and role.");
      return;
    }

    if (!editingUser && form.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    if (editingUser && form.password && form.password.length < 6) {
      alert("New password must be at least 6 characters long.");
      return;
    }

    const emailExists = users.some(
      (user) =>
        user.email.toLowerCase() === form.email.trim().toLowerCase() &&
        user.id !== editingUser?.id,
    );

    if (emailExists) {
      alert("This email is already registered.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: editingUser ? form.status : "Active",
      permissions: editingUser
        ? editingUser.permissions || ["Dashboard"]
        : ["Dashboard"],
    };

    // Send password only when entered
    if (form.password) {
      payload.password = form.password;
    }

    if (editingUser) {
      payload.id = editingUser.id;
    }

    try {
      setSaving(true);

      const response = await fetch(API_URL, {
        method: editingUser ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Unable to save user.");
      }

      await fetchUsers();

      setDialogOpen(false);
      setEditingUser(null);
      setForm({ ...emptyForm });

      alert(
        editingUser
          ? "User updated successfully."
          : "User created successfully.",
      );
    } catch (error) {
      console.error("Save user error:", error);
      alert(error.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  // Delete user through API
  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}?id=${encodeURIComponent(user.id)}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Unable to delete user.");
      }

      setUsers((prev) => prev.filter((item) => item.id !== user.id));

      alert("User deleted successfully.");
    } catch (error) {
      console.error("Delete user error:", error);
      alert(error.message || "Failed to delete user.");
    }
  };

  // Three-dot menu
  const handleActionClick = (event, user) => {
    setActionAnchor(event.currentTarget);
    setActionUser(user);
  };

  const handleActionClose = () => {
    setActionAnchor(null);
    setActionUser(null);
  };

  const handleMenuEdit = () => {
    const user = actionUser;
    handleActionClose();

    if (user) handleEdit(user);
  };

  const handleMenuDelete = () => {
    const user = actionUser;
    handleActionClose();

    if (user) handleDelete(user);
  };

  const handleMenuPermissions = () => {
    const user = actionUser;
    handleActionClose();

    if (user) handlePermissionOpen(user);
  };

  // Open permissions dialog
  const handlePermissionOpen = (user) => {
    setSelectedUser(user);
    setPermissions(user.permissions || []);
    setPermissionOpen(true);
  };

  // Toggle permission
  const handlePermissionChange = (permission) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission],
    );
  };

  // Save permissions through PUT API
  const handlePermissionSave = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);

      const payload = {
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        status: selectedUser.status,
        permissions: permissions,
      };

      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Unable to update permissions.");
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? { ...user, permissions: [...permissions] }
            : user,
        ),
      );

      // Refresh Sidebar permissions in the same tab
      window.dispatchEvent(new Event("permissionsUpdated"));

      setPermissionOpen(false);
      setSelectedUser(null);

      alert("Permissions updated successfully.");
    } catch (error) {
      console.error("Permission update error:", error);
      alert(error.message || "Failed to update permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="user-page">
      {/* Header */}
      <div className="user-page-header">
        <div>
          <Typography className="user-page-title">User Management</Typography>

          <Typography className="user-page-subtitle">
            Manage users, roles and access permissions.
          </Typography>
        </div>

        <Button
          className="user-add-btn"
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="user-table-card">
        <div className="user-table-toolbar">
          <div>
            <h3>All Users</h3>
            <p>View and manage user access.</p>
          </div>

          <TextField
            className="user-search"
            size="small"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        </div>

        <div className="user-table-scroll">
          <table className="user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="user-empty">
                    <CircularProgress size={24} />
                  </td>
                </tr>
              ) : (
                <>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-profile-cell">
                          <div className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="user-profile-info">
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`user-role role-${user.role
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <Chip
                          size="small"
                          label={user.status}
                          className={
                            user.status === "Active"
                              ? "user-status-active"
                              : "user-status-inactive"
                          }
                        />
                      </td>

                      <td>
                        <span className="user-permission-count">
                          {user.permissions?.length || 0} permissions
                        </span>
                      </td>

                      <td>
                        <IconButton
                          className="user-menu-button"
                          aria-label={`Actions for ${user.name}`}
                          onClick={(event) => handleActionClick(event, user)}
                        >
                          <MoreVert />
                        </IconButton>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="user-empty">
                        No users found.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="user-table-footer">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Three-dot menu */}
      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={handleActionClose}
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
            className: "user-action-menu",
            elevation: 4,
          },
        }}
      >
        <MenuItem onClick={handleMenuEdit}>
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleMenuDelete}>
          <ListItemIcon>
            <DeleteOutlineRoundedIcon
              fontSize="small"
              className="menu-delete-icon"
            />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleMenuPermissions}>
          <ListItemIcon>
            <SecurityOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Permissions</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add / Edit User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "user-dialog" }}
      >
        <DialogTitle className="user-dialog-title">
          <div>
            <h3>{editingUser ? "Edit User" : "Add New User"}</h3>
            <p>Enter user details below.</p>
          </div>

          <IconButton
            aria-label="Close dialog"
            onClick={() => setDialogOpen(false)}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box className="user-form-grid">
            <TextField
              label="Full Name"
              fullWidth
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            {/* Password Field */}
            <TextField
              label={editingUser ? "New Password (Optional)" : "Password"}
              type="password"
              fullWidth
              required={!editingUser}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              inputProps={{ minLength: 6 }}
              helperText={
                editingUser
                  ? "Leave blank to keep the current password."
                  : "Minimum 6 characters. This password will be used for login."
              }
            />

            <TextField
              select
              label="Role"
              fullWidth
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>

            {roles.length === 0 && (
              <Typography color="error" variant="caption">
                No roles found. Please add roles first.
              </Typography>
            )}

            {editingUser && (
              <FormControlLabel
                className="user-active-toggle"
                control={
                  <Switch
                    checked={form.status === "Active"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.checked ? "Active" : "Inactive",
                      }))
                    }
                    color="success"
                  />
                }
                label={
                  form.status === "Active" ? "Active User" : "Inactive User"
                }
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions className="user-dialog-actions">
          <Button
            variant="outlined"
            onClick={() => setDialogOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || roles.length === 0}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingUser ? (
              "Save Changes"
            ) : (
              "Create User"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog
        open={permissionOpen}
        onClose={() => !saving && setPermissionOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ className: "user-dialog" }}
      >
        <DialogTitle className="user-dialog-title">
          <div>
            <h3>Manage Permissions</h3>
            <p>{selectedUser?.name}</p>
          </div>

          <IconButton
            aria-label="Close permissions"
            onClick={() => setPermissionOpen(false)}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography className="permission-description">
            Select which sections this user can access.
          </Typography>

          <FormGroup className="permission-list">
            {availablePermissions.map((permission) => (
              <FormControlLabel
                key={permission}
                control={
                  <Checkbox
                    checked={permissions.includes(permission)}
                    onChange={() => handlePermissionChange(permission)}
                  />
                }
                label={permission}
              />
            ))}
          </FormGroup>
        </DialogContent>

        <DialogActions className="user-dialog-actions">
          <Button
            variant="outlined"
            onClick={() => setPermissionOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handlePermissionSave}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save Permissions"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default User;
