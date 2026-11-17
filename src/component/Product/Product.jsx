import { useEffect, useMemo, useState } from "react";
import "./Product.css";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";

import Add from "@mui/icons-material/Add";
import Search from "@mui/icons-material/Search";
import Close from "@mui/icons-material/Close";
import EditOutlined from "@mui/icons-material/EditOutlined";
import Delete from "@mui/icons-material/Delete";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import TrendingUp from "@mui/icons-material/TrendingUp";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";

const API_URL =
  "http://localhost/Admin-Panel/dashboard/Backend/api/product.php";

const CATEGORY_API =
  "http://localhost/Admin-Panel/dashboard/Backend/api/categories.php";

const FALLBACK_IMAGE =
  "https://placehold.co/300x300/f3f4f6/64748b?text=No+Image";

const BACKEND_URL = "http://localhost/Admin-Panel/dashboard/Backend/";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  stock: "",
  price: "",
  supplier: "",
  images: [],
  description: "",
  status: "Active",
};

// ======================================================
// API HELPER
// ======================================================

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const responseText = await response.text();

  let result;

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `Invalid server response. HTTP ${response.status}. Check PHP errors in XAMPP.`,
    );
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed. HTTP status: ${response.status}`,
    );
  }

  return result;
};

// ======================================================
// IMAGE HELPERS
// ======================================================

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return FALLBACK_IMAGE;
  }

  const cleanImage = image.trim();

  if (
    cleanImage.startsWith("data:image/") ||
    cleanImage.startsWith("http://") ||
    cleanImage.startsWith("https://")
  ) {
    return cleanImage;
  }

  if (cleanImage.startsWith("/")) {
    return `http://localhost${cleanImage}`;
  }

  return `${BACKEND_URL}${cleanImage.replace(/^\.?\//, "")}`;
};

const normalizeImages = (images) => {
  if (!images) return [];

  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }

  if (!Array.isArray(images)) {
    images = [];
  }

  return images.filter(
    (image) => typeof image === "string" && image.trim() !== "",
  );
};

// ======================================================
// PRODUCT COMPONENT
// ======================================================

function Product() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  // ====================================================
  // FETCH PRODUCTS
  // ====================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const result = await apiRequest(API_URL, {
        method: "GET",
      });

      const productData = Array.isArray(result.data)
        ? result.data
        : result.data?.products || [];

      setProducts(
        productData.map((product) => ({
          ...product,
          id: Number(product.id),
          stock: Number(product.stock || 0),
          price: Number(product.price || 0),
          images: normalizeImages(product.images),
        })),
      );

      return true;
    } catch (err) {
      console.error("Product Fetch Error:", err);
      setError(err.message || "Unable to load products.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // FETCH CATEGORIES
  // ====================================================

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);

      const result = await apiRequest(CATEGORY_API, {
        method: "GET",
      });

      const categoryData = Array.isArray(result.data)
        ? result.data
        : result.data?.categories || [];

      const activeCategories = categoryData
        .filter((item) => {
          const status = String(
            item.status ?? item.STATUS ?? "active",
          ).toLowerCase();

          return status === "active" || status === "1";
        })
        .map((item) => item.name ?? item.NAME ?? "")
        .filter(Boolean);

      setCategories([...new Set(activeCategories)]);
    } catch (err) {
      console.error("Category Fetch Error:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ====================================================
  // MENU HANDLERS
  // ====================================================

  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedStock(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStock(null);
  };

  const handleMenuEdit = () => {
    const product = selectedStock;
    handleMenuClose();

    if (product) {
      openEditForm(product);
    }
  };

  const handleMenuDelete = () => {
    const productId = selectedStock?.id;
    handleMenuClose();

    if (productId != null) {
      deleteProduct(productId);
    }
  };

  // ====================================================
  // SEARCH AND FILTER
  // ====================================================

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.sku,
        product.category,
        product.supplier,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      );

      const matchesCategory =
        categoryFilter === "All Categories" ||
        product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All Status" || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  // ====================================================
  // DASHBOARD STATISTICS
  // ====================================================

  const activeCount = products.filter(
    (product) => product.status === "Active",
  ).length;

  const lowStockCount = products.filter(
    (product) => Number(product.stock) > 0 && Number(product.stock) <= 10,
  ).length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0,
  );

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price) || 0);

  // ====================================================
  // OPEN ADD FORM
  // ====================================================

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  // ====================================================
  // OPEN EDIT FORM
  // ====================================================

  const openEditForm = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      stock: String(product.stock ?? ""),
      price: String(product.price ?? ""),
      supplier: product.supplier || "",
      images: normalizeImages(product.images),
      description: product.description || "",
      status: product.status || "Active",
    });

    setError("");
    setShowForm(true);
  };

  // ====================================================
  // CLOSE FORM
  // ====================================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  };

  // ====================================================
  // INPUT CHANGE
  // ====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ====================================================
  // IMAGE UPLOAD
  // ====================================================

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || []);
    const maxSize = 5 * 1024 * 1024;

    if (form.images.length + files.length > 6) {
      setError("Maximum 6 images are allowed.");
      event.target.value = "";
      return;
    }

    const validImages = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not a valid image.`);
        continue;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, JPEG, PNG and WEBP images are allowed.");
        continue;
      }

      if (file.size > maxSize) {
        setError(`${file.name} must be less than 5 MB.`);
        continue;
      }

      validImages.push(file);
    }

    try {
      const newImages = await Promise.all(
        validImages.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();

              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(new Error("Image reading failed."));

              reader.readAsDataURL(file);
            }),
        ),
      );

      setForm((previous) => ({
        ...previous,
        images: [...previous.images, ...newImages].slice(0, 6),
      }));

      if (newImages.length > 0) {
        setError("");
      }
    } catch (err) {
      setError(err.message || "Unable to read selected images.");
    }

    event.target.value = "";
  };

  // ====================================================
  // REMOVE IMAGE
  // ====================================================

  const removeImage = (index) => {
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  // ====================================================
  // VALIDATE PRODUCT
  // ====================================================

  const validateProduct = () => {
    const name = form.name.trim();
    const sku = form.sku.trim();
    const supplier = form.supplier.trim();

    const stock = Number(form.stock);
    const price = Number(form.price);

    if (!name || !sku || !supplier || !form.category) {
      return "Please fill in all required fields.";
    }

    if (
      form.stock === "" ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      return "Stock must be a non-negative whole number.";
    }

    if (form.price === "" || !Number.isFinite(price) || price < 0) {
      return "Please enter a valid price.";
    }

    if (form.images.length > 6) {
      return "Maximum 6 images are allowed.";
    }

    return "";
  };

  // ====================================================
  // ADD / UPDATE PRODUCT
  // ====================================================

  const saveProduct = async (event) => {
    event.preventDefault();

    const validationError = validateProduct();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category,
      stock: Number(form.stock),
      price: Number(form.price),
      supplier: form.supplier.trim(),
      images: form.images,
      description: form.description.trim(),
      status: form.status || "Active",
    };

    try {
      setSaving(true);
      setError("");

      const isEditing = editingId !== null;

      const url = isEditing
        ? `${API_URL}?id=${encodeURIComponent(editingId)}`
        : API_URL;

      const result = await apiRequest(url, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      window.alert(
        result.message ||
          (isEditing
            ? "Product updated successfully."
            : "Product added successfully."),
      );

      // Reload product list after successful save.
      await fetchProducts();

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      setError("");
    } catch (err) {
      console.error("Product Save Error:", err);
      setError(err.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // DELETE PRODUCT
  // ====================================================

  const deleteProduct = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const result = await apiRequest(
        `${API_URL}?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );

      setProducts((previous) =>
        previous.filter((product) => Number(product.id) !== Number(id)),
      );

      window.alert(result.message || "Product deleted successfully.");
    } catch (err) {
      console.error("Product Delete Error:", err);
      window.alert(err.message || "Unable to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  // ====================================================
  // STOCK STATUS
  // ====================================================

  const getStockStatus = (stock) => {
    const quantity = Number(stock);

    if (quantity === 0) {
      return {
        label: "Out of Stock",
        className: "out",
      };
    }

    if (quantity <= 10) {
      return {
        label: "Low Stock",
        className: "low",
      };
    }

    return {
      label: "In Stock",
      className: "good",
    };
  };

  // ====================================================
  // PRODUCT IMAGE
  // ====================================================

  const renderProductImage = (product, large = false) => {
    const images = normalizeImages(product.images);

    let firstImage = images[0] || product.image || "";

    if (!firstImage) {
      firstImage = FALLBACK_IMAGE;
    }

    return (
      <div className={`product-thumbnail ${large ? "large" : ""}`}>
        <img
          src={
            firstImage === FALLBACK_IMAGE
              ? FALLBACK_IMAGE
              : getImageUrl(firstImage)
          }
          alt={product.name || "Product"}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>
    );
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="product-page">
      {/* PAGE HEADER */}

      <div className="product-page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your Ayurvedic products, pricing and stock levels.</p>
        </div>

        <button className="product-add-btn" onClick={openAddForm} type="button">
          <Add />
          <span>Add Product</span>
        </button>
      </div>

      {/* DASHBOARD STATISTICS */}

      <div className="product-stats">
        <div className="product-stat-card">
          <div className="product-stat-icon green">
            <Inventory2Outlined />
          </div>

          <div>
            <span>Total Products</span>
            <h2>{products.length}</h2>
            <small>Products in inventory</small>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="product-stat-icon mint">
            <TrendingUp />
          </div>

          <div>
            <span>Active Products</span>
            <h2>{activeCount}</h2>
            <small>Currently available</small>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="product-stat-icon orange">
            <WarningAmberOutlined />
          </div>

          <div>
            <span>Low Stock</span>
            <h2>{lowStockCount}</h2>
            <small>Products need restocking</small>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="product-stat-icon blue">
            <Inventory2Outlined />
          </div>

          <div>
            <span>Total Stock Units</span>
            <h2>{totalStock}</h2>
            <small>Units across all products</small>
          </div>
        </div>
      </div>

      {/* PRODUCT CONTENT */}

      <section className="product-content">
        <div className="product-content-header">
          <div>
            <h2>All Products</h2>
            <p>View, add and update your product inventory.</p>
          </div>

          <span className="product-total-badge">
            {filteredProducts.length} products
          </span>
        </div>

        {/* SEARCH AND FILTER */}

        <div className="product-toolbar">
          <div className="product-search">
            <Search />

            <input
              type="text"
              placeholder="Search product, SKU or supplier..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="product-filters">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="All Categories">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* DESKTOP TABLE */}

        <div className="product-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>SUPPLIER</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: 24,
                    }}
                  >
                    Loading products...
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="product-info-cell">
                          {renderProductImage(product, true)}

                          <div className="product-name-info">
                            <strong>{product.name}</strong>
                            <small>SKU: {product.sku}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="product-category-label">
                          {product.category}
                        </span>
                      </td>

                      <td>
                        <strong className="product-price">
                          {formatPrice(product.price)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`product-stock ${stockStatus.className}`}
                        >
                          {Number(product.stock) === 0
                            ? "Out of stock"
                            : `${product.stock} units`}
                        </span>
                      </td>

                      <td>{product.supplier}</td>

                      <td className="product-actions-cell">
                        <Tooltip title="More options">
                          <IconButton
                            size="small"
                            className="stock-more-btn"
                            onClick={(event) => handleMenuOpen(event, product)}
                            aria-label={`Options for ${product.name}`}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* ACTION MENU */}

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
                  minWidth: 165,
                  borderRadius: "10px",
                  border: "1px solid #e8eee9",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
                  mt: 0.5,
                },
              },
            }}
          >
            <MenuItem onClick={handleMenuEdit}>
              <ListItemIcon>
                <EditOutlined fontSize="small" />
              </ListItemIcon>

              <ListItemText>Edit Product</ListItemText>
            </MenuItem>

            <MenuItem
              onClick={handleMenuDelete}
              sx={{ color: "#dc2626" }}
              disabled={deleting}
            >
              <ListItemIcon sx={{ color: "#dc2626" }}>
                <Delete fontSize="small" />
              </ListItemIcon>

              <ListItemText>
                {deleting ? "Deleting..." : "Delete Product"}
              </ListItemText>
            </MenuItem>
          </Menu>

          {!loading && filteredProducts.length === 0 && (
            <div className="product-empty">
              <Inventory2Outlined />
              <h3>No products found</h3>
              <p>Try changing your search or filter.</p>
            </div>
          )}
        </div>

        {/* MOBILE PRODUCT LIST */}

        <div className="product-mobile-list">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock);

            return (
              <article className="product-mobile-card" key={product.id}>
                <div className="product-mobile-card-top">
                  {renderProductImage(product, true)}

                  <div className="product-name-info">
                    <strong>{product.name}</strong>
                    <small>SKU: {product.sku}</small>

                    <span className="product-category-label">
                      {product.category}
                    </span>
                  </div>

                  <IconButton
                    size="small"
                    className="stock-more-btn"
                    onClick={(event) => handleMenuOpen(event, product)}
                    aria-label={`Options for ${product.name}`}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </div>

                <div className="product-mobile-details">
                  <div>
                    <span>Price</span>
                    <strong>{formatPrice(product.price)}</strong>
                  </div>

                  <div>
                    <span>Stock</span>
                    <strong className={stockStatus.className}>
                      {product.stock} units
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong
                      className={
                        product.status === "Active"
                          ? "mobile-active"
                          : "mobile-inactive"
                      }
                    >
                      {product.status}
                    </strong>
                  </div>
                </div>
              </article>
            );
          })}

          {!loading && filteredProducts.length === 0 && (
            <div className="product-empty">
              <Inventory2Outlined />
              <h3>No products found</h3>
              <p>Try changing your search or filter.</p>
            </div>
          )}
        </div>

        <div className="product-list-footer">
          Showing <strong>{filteredProducts.length}</strong> of{" "}
          <strong>{products.length}</strong> products
        </div>
      </section>

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div className="product-modal-overlay" onClick={closeForm}>
          <form
            className="product-modal"
            onSubmit={saveProduct}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="product-modal-header">
              <div>
                <h2>
                  {editingId !== null ? "Edit Product" : "Add New Product"}
                </h2>

                <p>Enter the product and inventory details below.</p>
              </div>

              <button
                type="button"
                className="product-modal-close"
                onClick={closeForm}
                aria-label="Close form"
                disabled={saving}
              >
                <Close />
              </button>
            </div>

            <div className="product-form-grid">
              {/* PRODUCT NAME */}

              <div className="product-form-field full">
                <label htmlFor="product-name">Product Name *</label>

                <input
                  id="product-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* SKU */}

              <div className="product-form-field">
                <label htmlFor="product-sku">Product Code / SKU *</label>

                <input
                  id="product-sku"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="e.g. AYU-006"
                  required
                />
              </div>

              {/* CATEGORY */}

              <div className="product-form-field">
                <label htmlFor="product-category">Category *</label>

                <select
                  id="product-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : "Select Category"}
                  </option>

                  {form.category && !categories.includes(form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRICE */}

              <div className="product-form-field">
                <label htmlFor="product-price">Price (₹) *</label>

                <input
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  required
                />
              </div>

              {/* STOCK */}

              <div className="product-form-field">
                <label htmlFor="product-stock">Stock Quantity *</label>

                <input
                  id="product-stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              {/* SUPPLIER */}

              <div className="product-form-field full">
                <label htmlFor="product-supplier">Supplier Name *</label>

                <input
                  id="product-supplier"
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              {/* STATUS */}

              <div className="product-form-field">
                <label htmlFor="product-status">Status</label>

                <select
                  id="product-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* PRODUCT IMAGES */}

              <div className="product-form-field full">
                <label htmlFor="product-image">
                  Product Images (Maximum 6)
                </label>

                <input
                  id="product-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  disabled={form.images.length >= 6}
                />

                <small>
                  {form.images.length} / 6 images selected. Maximum 5 MB per
                  image.
                </small>

                <div className="product-image-gallery">
                  {form.images.map((image, index) => (
                    <div
                      className="product-image-preview"
                      key={`${index}-${image.slice(0, 30)}`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Product preview ${index + 1}`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />

                      <button type="button" onClick={() => removeImage(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="product-form-field full">
                <label htmlFor="product-description">Product Description</label>

                <textarea
                  id="product-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter product description..."
                  rows={4}
                />
              </div>
            </div>

            {error && <p className="product-form-error">{error}</p>}

            <div className="product-modal-actions">
              <button
                type="button"
                className="product-cancel-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="product-save-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Product;
