import React, { useMemo, useState } from "react";
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

const initialUsers = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@example.com",
    role: "Admin",
    status: "Active",
    permissions: ["Dashboard", "Users", "Products", "Reports"],
  },
  {
    id: 2,
    name: "Faizan Patel",
    email: "faizan@example.com",
    role: "Manager",
    status: "Active",
    permissions: ["Dashboard", "Products", "Reports"],
  },
  {
    id: 3,
    name: "Amit Verma",
    email: "amit@example.com",
    role: "Employee",
    status: "Inactive",
    permissions: ["Dashboard"],
  },
  {
    id: 4,
    name: "Sonu Joshi",
    email: "sonu@example.com",
    role: "Employee",
    status: "Active",
    permissions: ["Dashboard", "Products"],
  },
];

const availablePermissions = [
  "Dashboard",
  "Users",
  "Products",
  "Stock",
  "Orders",
  "Reports",
  "Settings",
];

const emptyForm = {
  name: "",
  email: "",
  role: "Employee",
  status: "Active",
};

function User() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState({ ...emptyForm });
  const [permissions, setPermissions] = useState([]);

  // Three-dot menu state
  const [actionAnchor, setActionAnchor] = useState(null);
  const [actionUser, setActionUser] = useState(null);

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
    setForm({ ...emptyForm, status: "Active" });
    setDialogOpen(true);
  };

  // Open Edit User dialog
  const handleEdit = (user) => {
    setEditingUser(user);

    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    setDialogOpen(true);
  };

  // Save new or edited user
  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      alert("Please enter user name and email.");
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

    if (editingUser) {
      // Update user details and selected status
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: form.name.trim(),
                email: form.email.trim(),
                role: form.role,
                status: form.status,
              }
            : user,
        ),
      );
    } else {
      // New users are always Active
      setUsers((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          status: "Active",
          permissions: ["Dashboard"],
        },
      ]);
    }

    setDialogOpen(false);
    setEditingUser(null);
    setForm({ ...emptyForm });
  };

  // Delete user
  const handleDelete = (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`,
    );

    if (confirmed) {
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
    }
  };

  // Open three-dot menu
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

    if (user) {
      handleEdit(user);
    }
  };

  const handleMenuDelete = () => {
    const user = actionUser;
    handleActionClose();

    if (user) {
      handleDelete(user);
    }
  };

  const handleMenuPermissions = () => {
    const user = actionUser;
    handleActionClose();

    if (user) {
      handlePermissionOpen(user);
    }
  };

  // Open permissions dialog
  const handlePermissionOpen = (user) => {
    setSelectedUser(user);
    setPermissions(user.permissions || []);
    setPermissionOpen(true);
  };

  // Toggle a permission
  const handlePermissionChange = (permission) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission],
    );
  };

  // Save permissions
  const handlePermissionSave = () => {
    if (!selectedUser) return;

    setUsers((prev) =>
      prev.map((user) =>
        user.id === selectedUser.id
          ? { ...user, permissions: [...permissions] }
          : user,
      ),
    );

    setPermissionOpen(false);
    setSelectedUser(null);
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
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  {/* User details */}
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

                  {/* Role */}
                  <td>
                    <span
                      className={`user-role role-${user.role.toLowerCase()}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Status */}
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

                  {/* Permissions count */}
                  <td>
                    <span className="user-permission-count">
                      {user.permissions?.length || 0} permissions
                    </span>
                  </td>

                  {/* Three-dot action menu */}
                  <td>
                    <IconButton
                      className="user-menu-button"
                      aria-label={`Actions for ${user.name}`}
                      aria-haspopup="true"
                      aria-expanded={
                        actionUser?.id === user.id && Boolean(actionAnchor)
                      }
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
            </tbody>
          </table>
        </div>

        <div className="user-table-footer">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Three-dot dropdown menu */}
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
        onClose={() => setDialogOpen(false)}
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

            <TextField
              select
              label="Role"
              fullWidth
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              slotProps={{
                select: { native: true },
              }}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </TextField>

            {/* Status toggle only in Edit User */}
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
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSave}>
            {editingUser ? "Save Changes" : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog
        open={permissionOpen}
        onClose={() => setPermissionOpen(false)}
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
              <label key={permission}>
                <Checkbox
                  checked={permissions.includes(permission)}
                  onChange={() => handlePermissionChange(permission)}
                />
                {permission}
              </label>
            ))}
          </FormGroup>
        </DialogContent>

        <DialogActions className="user-dialog-actions">
          <Button variant="outlined" onClick={() => setPermissionOpen(false)}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handlePermissionSave}>
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default User;
