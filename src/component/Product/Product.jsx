import { useMemo, useState } from "react";
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

import prdimg01 from "../../assets/dealsImg1.png";
import prdimg02 from "../../assets/dealsImg3.jpg";
import prdimg03 from "../../assets/psorakot.png";
import prdimg04 from "../../assets/shop.jpeg";
import prdimg05 from "../../assets/slideImg7.webp";
const FALLBACK_IMAGE =
  "https://placehold.co/300x300/f3f4f6/64748b?text=No+Image";

const initialProducts = [
  {
    id: 1,
    name: "Ashwagandha Tablets",
    sku: "AYU-001",
    category: "Ayurvedic Medicine",
    stock: 150,
    price: 250,
    supplier: "Patanjali Ayurveda",
    image: prdimg02,
    status: "Active",
  },
  {
    id: 2,
    name: "Amla Juice",
    sku: "AYU-002",
    category: "Juice",
    stock: 75,
    price: 180,
    supplier: "Dabur India",
    image: prdimg01,
    status: "Active",
  },
  {
    id: 3,
    name: "Neem Face Wash",
    sku: "AYU-003",
    category: "Skin Care",
    stock: 8,
    price: 120,
    supplier: "Himalaya Wellness",
    image: prdimg03,
    status: "Active",
  },
  {
    id: 4,
    name: "Chyawanprash",
    sku: "AYU-004",
    category: "Health Supplement",
    stock: 200,
    price: 320,
    supplier: "Dabur India",
    image: prdimg04,
    status: "Active",
  },
  {
    id: 5,
    name: "Aloe Vera Gel",
    sku: "AYU-005",
    category: "Skin Care",
    stock: 45,
    price: 150,
    supplier: "Patanjali Ayurveda",
    image: prdimg05,
    status: "Active",
  },
];

const categories = [
  "Ayurvedic Medicine",
  "Health Supplement",
  "Ayurvedic Powder",
  "Juice",
  "Skin Care",
  "Hair Care",
  "Herbal Drops",
  "Immunity Boosters",
  "Other",
];

const emptyForm = {
  name: "",
  sku: "",
  category: "Ayurvedic Medicine",
  stock: "",
  price: "",
  supplier: "",
  images: [],
  description: "",
};

function Product() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event, stock) => {
    setAnchorEl(event.currentTarget);
    setSelectedStock(stock);
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

  const activeCount = products.filter(
    (product) => product.status === "Active",
  ).length;

  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= 10,
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

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      stock: String(product.stock),
      price: String(product.price),
      supplier: product.supplier || "",
      images: product.images || (product.image ? [product.image] : []),
      description: product.description || "",
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    const validImages = [];
    const maxSize = 5 * 1024 * 1024;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Please select valid image files.");
        continue;
      }

      if (file.size > maxSize) {
        setError(`${file.name} must be less than 5 MB.`);
        continue;
      }

      validImages.push(file);
    }

    Promise.all(
      validImages.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject();

            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((newImages) => {
        setForm((previous) => ({
          ...previous,
          images: [...previous.images, ...newImages],
        }));
      })
      .catch(() => {
        setError("Unable to read one or more images.");
      });

    event.target.value = "";
  };

  const saveProduct = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const sku = form.sku.trim();
    const supplier = form.supplier.trim();
    const stock = Number(form.stock);
    const price = Number(form.price);

    if (!name || !sku || !supplier) {
      setError("Please fill in all required fields.");
      return;
    }

    if (
      form.stock === "" ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      setError("Stock must be a non-negative whole number.");
      return;
    }

    if (form.price === "" || !Number.isFinite(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    const duplicateSku = products.some(
      (product) =>
        product.sku.toLowerCase() === sku.toLowerCase() &&
        product.id !== editingId,
    );

    if (duplicateSku) {
      setError("This SKU already exists. Enter a unique SKU.");
      return;
    }

    const updatedProduct = {
      id: editingId ?? Date.now(),
      name,
      sku,
      category: form.category,
      stock,
      price,
      supplier,
      images: form.images,
      description: form.description,
    };

    if (editingId !== null) {
      setProducts((previous) =>
        previous.map((product) =>
          product.id === editingId ? updatedProduct : product,
        ),
      );
    } else {
      setProducts((previous) => [updatedProduct, ...previous]);
    }

    closeForm();
  };

  const deleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts((previous) =>
        previous.filter((product) => product.id !== id),
      );
    }
  };

  const getStockStatus = (stock) => {
    if (Number(stock) === 0) {
      return { label: "Out of Stock", className: "out" };
    }

    if (Number(stock) <= 10) {
      return { label: "Low Stock", className: "low" };
    }

    return { label: "In Stock", className: "good" };
  };

  const renderProductImage = (product, large = false) => {
    const imageSrc = product.images?.[0] || product.image || FALLBACK_IMAGE;

    return (
      <div className={`product-thumbnail ${large ? "large" : ""}`}>
        <img
          src={imageSrc}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>
    );
  };

  return (
    <div className="product-page">
      <div className="product-page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your Ayurvedic products, pricing and stock levels.</p>
        </div>

        <button className="product-add-btn" onClick={openAddForm}>
          <Add />
          <span>Add Product</span>
        </button>
      </div>

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
              <option>All Categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

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
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-info-cell">
                        {renderProductImage(product)}
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
                        {product.stock === 0
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
              })}
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

            <MenuItem onClick={handleMenuDelete} sx={{ color: "#dc2626" }}>
              <ListItemIcon sx={{ color: "#dc2626" }}>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Product</ListItemText>
            </MenuItem>
          </Menu>

          {filteredProducts.length === 0 && (
            <div className="product-empty">
              <Inventory2Outlined />
              <h3>No products found</h3>
              <p>Try changing your search or filter.</p>
            </div>
          )}
        </div>

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

          {filteredProducts.length === 0 && (
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
              >
                <Close />
              </button>
            </div>

            <div className="product-form-grid">
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

              <div className="product-form-field">
                <label htmlFor="product-category">Category *</label>
                <select
                  id="product-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>

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

              <div className="product-form-field full">
                <label htmlFor="product-image">Product Images</label>

                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />

                <div className="product-image-gallery">
                  {form.images.map((image, index) => (
                    <div className="product-image-preview" key={index}>
                      <img src={image} alt={`Product preview ${index + 1}`} />

                      <button
                        type="button"
                        onClick={() =>
                          setForm((previous) => ({
                            ...previous,
                            images: previous.images.filter(
                              (_, imageIndex) => imageIndex !== index,
                            ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

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
              >
                Cancel
              </button>
              <button type="submit" className="product-save-btn">
                {editingId !== null ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Product;
