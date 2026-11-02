import { useEffect, useMemo, useState } from "react";
import "./Category.css";

import {
  Add,
  Search,
  EditOutlined,
  DeleteOutlineRounded,
  CategoryOutlined,
  Inventory2Outlined,
  MoreVert,
  SpaOutlined,
  LocalFloristOutlined,
  FavoriteBorderOutlined,
} from "@mui/icons-material";

import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

const CATEGORY_API =
  "http://localhost/Admin-Panel/dashboard/Backend/api/categories.php";

const initialCategories = [];

const emptyForm = {
  name: "",
  description: "",
};

function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const menuOpen = Boolean(anchorEl);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await fetch(CATEGORY_API);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to fetch categories");
      }

      const formattedCategories = (result.data || []).map((item) => ({
        id: Number(item.id),
        name: item.name ?? item.NAME ?? "",
        description: item.description || "",
        status:
          String(item.status ?? item.STATUS).toLowerCase() === "active"
            ? "Active"
            : "Inactive",
        products: Number(item.products || 0),
        color: "#eaf1ff",
        icon: <CategoryOutlined />,
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error("Category Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleMenuOpen = (event, category) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const handleMenuEdit = () => {
    if (!selectedCategory) return;

    const category = selectedCategory;
    handleMenuClose();
    openEditForm(category);
  };

  const handleMenuStatus = () => {
    if (!selectedCategory) return;

    const id = selectedCategory.id;
    handleMenuClose();
    toggleStatus(id);
  };

  const handleMenuDelete = () => {
    if (!selectedCategory) return;

    const id = selectedCategory.id;
    handleMenuClose();
    deleteCategory(id);
  };

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    return categories.filter((category) =>
      [category.name, category.description].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [categories, search]);

  const activeCount = categories.filter(
    (category) => category.status === "Active",
  ).length;

  const inactiveCount = categories.length - activeCount;

  const totalProducts = categories.reduce(
    (total, category) => total + Number(category.products || 0),
    0,
  );

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description,
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  };

  const saveCategory = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== editingId,
    );

    if (duplicate) {
      setError("This category already exists.");
      return;
    }

    try {
      const response = await fetch(CATEGORY_API, {
        method: editingId !== null ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingId !== null && { id: editingId }),
          name,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to save category.");
        return;
      }

      closeForm();
      await fetchCategories();
    } catch (error) {
      console.error("Save Category Error:", error);
      setError("Server connection failed.");
    }
  };

  const deleteCategory = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${CATEGORY_API}?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Unable to delete category.");
        return;
      }

      await fetchCategories();
    } catch (error) {
      console.error("Delete Category Error:", error);
      alert("Server connection failed.");
    }
  };

  const toggleStatus = async (id) => {
    const category = categories.find((item) => item.id === id);

    if (!category) return;

    const newStatus = category.status === "Active" ? "inactive" : "active";

    try {
      const response = await fetch(CATEGORY_API, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name: category.name,
          description: category.description || "",
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Unable to update category status.");
        return;
      }

      await fetchCategories();
    } catch (error) {
      console.error("Status Update Error:", error);
      alert("Server connection failed.");
    }
  };

  return (
    <div className="category-page">
      <div className="category-heading">
        <div>
          <h1 className="category-title">Category Management</h1>
          <p className="category-subtitle">
            Organize and manage your product categories.
          </p>
        </div>

        <button className="category-add-btn" onClick={openAddForm}>
          <Add />
          <span>Add Category</span>
        </button>
      </div>

      {/* Category table */}
      <section className="category-content">
        <div className="category-toolbar">
          <div>
            <h2 className="category-content-title">All Categories</h2>
            <p className="category-content-caption">
              View and manage all your product categories.
            </p>
          </div>

          <div className="category-search">
            <Search />
            <input
              type="search"
              aria-label="Search categories"
              placeholder="Search categories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="category-table-wrapper">
          <table className="category-table">
            <thead>
              <tr>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>PRODUCTS</th>
                <th>STATUS</th>
                <th className="category-actions-heading">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="category-table-name">
                        <span>{category.name}</span>
                      </div>
                    </td>

                    <td className="category-description">
                      {category.description || "—"}
                    </td>

                    <td>
                      <span className="category-product-badge">
                        {category.products} Products
                      </span>
                    </td>

                    <td>
                      <span
                        className={`category-status ${
                          category.status === "Active" ? "active" : "inactive"
                        }`}
                      >
                        {category.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="category-more-btn"
                        title="More actions"
                        aria-label={`Actions for ${category.name}`}
                        aria-haspopup="menu"
                        aria-expanded={
                          menuOpen && selectedCategory?.id === category.id
                        }
                        onClick={(event) => handleMenuOpen(event, category)}
                      >
                        <MoreVert />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="category-empty">
                      <CategoryOutlined />
                      <h3>No categories found</h3>
                      <p>Try another search or add a new category.</p>
                    </div>
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
              <ListItemText>Edit Category</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleMenuStatus}>
              <ListItemIcon>
                <Inventory2Outlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {selectedCategory?.status === "Active"
                  ? "Deactivate Category"
                  : "Activate Category"}
              </ListItemText>
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
              <ListItemText>Delete Category</ListItemText>
            </MenuItem>
          </Menu>
        </div>

        <div className="category-list-footer">
          Showing <strong>{filteredCategories.length}</strong> of{" "}
          <strong>{categories.length}</strong> categories
        </div>
      </section>

      {/* Add / Edit dialog */}
      {showForm && (
        <div
          className="category-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <form
            className="category-modal"
            onSubmit={saveCategory}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >
            <div className="category-modal-header">
              <div>
                <h2 id="category-modal-title">
                  {editingId !== null ? "Edit Category" : "Add New Category"}
                </h2>
                <p>Enter your category details below.</p>
              </div>

              <button
                type="button"
                className="category-modal-close"
                onClick={closeForm}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <div className="category-form-field">
              <label htmlFor="category-name">Category Name</label>
              <input
                id="category-name"
                type="text"
                placeholder="e.g. Herbal Medicines"
                value={form.name}
                onChange={(event) => {
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }));
                  setError("");
                }}
                autoFocus
                required
              />
            </div>

            <div className="category-form-field">
              <label htmlFor="category-description">Description</label>
              <textarea
                id="category-description"
                placeholder="Write a short description..."
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            {error && (
              <p className="category-form-error" role="alert">
                {error}
              </p>
            )}

            <div className="category-modal-actions">
              <button
                type="button"
                className="category-cancel-btn"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button type="submit" className="category-save-btn">
                {editingId !== null ? "Save Changes" : "Add Category"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Category;
