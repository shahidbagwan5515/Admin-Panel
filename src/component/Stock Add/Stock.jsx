import { useState } from "react";
import { useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
  InputAdornment,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import prdimg01 from "../../assets/dealsImg1.png";
import prdimg02 from "../../assets/dealsImg3.jpg";
import prdimg03 from "../../assets/psorakot.png";
import prdimg04 from "../../assets/shop.jpeg";
import prdimg05 from "../../assets/slideImg7.webp";

import "./Stock.css";

const FALLBACK_IMAGE =
  "https://placehold.co/100x100/f1f5f9/64748b?text=Product";

const initialStocks = [
  {
    id: 1,
    name: "Ashwagandha Tablets",
    sku: "AYU-001",
    category: "Ayurvedic Medicine",
    quantity: 150,
    price: 250,
    supplier: "Patanjali Ayurveda",
    image: prdimg02,
  },
  {
    id: 2,
    name: "Amla Juice",
    sku: "AYU-002",
    category: "Juice",
    quantity: 75,
    price: 180,
    supplier: "Dabur India",
    image: prdimg01,
  },
  {
    id: 3,
    name: "Neem Face Wash",
    sku: "AYU-003",
    category: "Skin Care",
    quantity: 8,
    price: 120,
    supplier: "Himalaya Wellness",
    image: prdimg03,
  },
  {
    id: 4,
    name: "Chyawanprash",
    sku: "AYU-004",
    category: "Health Supplement",
    quantity: 200,
    price: 320,
    supplier: "Dabur India",
    image: prdimg04,
  },
  {
    id: 5,
    name: "Aloe Vera Gel",
    sku: "AYU-005",
    category: "Skin Care",
    quantity: 45,
    price: 150,
    supplier: "Patanjali Ayurveda",
    image: prdimg05,
  },
];

const emptyForm = {
  name: "",
  sku: "",
  category: "Ayurvedic Medicine",
  quantity: "",
  price: "",
  supplier: "",
  image: "",
  imagePreview: "",
};

function Stock() {
  const [stocks, setStocks] = useState(initialStocks);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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
      handleOpen(product);
    }
  };

  const handleMenuDelete = () => {
    const productId = selectedStock?.id;

    handleMenuClose();

    if (productId != null) {
      handleDelete(productId);
    }
  };

  const filteredStocks = useMemo(() => {
    const term = search.trim().toLowerCase();

    return stocks.filter((stock) =>
      [stock.name, stock.sku, stock.category, stock.supplier].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [stocks, search]);

  const totalUnits = stocks.reduce(
    (sum, stock) => sum + Number(stock.quantity || 0),
    0,
  );

  const lowStock = stocks.filter(
    (stock) => stock.quantity > 0 && stock.quantity <= 10,
  ).length;

  const outOfStock = stocks.filter(
    (stock) => Number(stock.quantity) === 0,
  ).length;

  const handleOpen = (stock = null) => {
    setEditingId(stock?.id ?? null);

    if (stock) {
      setForm({
        name: stock.name || "",
        sku: stock.sku || "",
        category: stock.category || "Ayurvedic Medicine",
        quantity: String(stock.quantity ?? ""),
        price: String(stock.price ?? ""),
        supplier: stock.supplier || "",
        image: stock.image || "",
        imagePreview: stock.image || "",
      });
    } else {
      setForm({ ...emptyForm });
    }

    setError("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      setForm((prev) => ({
        ...prev,
        image: imageData,
        imagePreview: imageData,
      }));

      setError("");
    };

    reader.onerror = () => {
      setError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const sku = form.sku.trim();
    const supplier = form.supplier.trim();
    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (!name || !sku || !supplier) {
      setError("Please fill in all required fields.");
      return;
    }

    if (
      form.quantity === "" ||
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isInteger(quantity)
    ) {
      setError("Quantity must be a non-negative whole number.");
      return;
    }

    if (form.price === "" || !Number.isFinite(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    const skuExists = stocks.some(
      (stock) =>
        stock.sku.toLowerCase() === sku.toLowerCase() && stock.id !== editingId,
    );

    if (skuExists) {
      setError("This SKU already exists. Please enter a unique SKU.");
      return;
    }

    const stockData = {
      id: editingId ?? Date.now(),
      name,
      sku,
      category: form.category,
      quantity,
      price,
      supplier,
      image: form.imagePreview || form.image || "",
    };

    if (editingId !== null) {
      setStocks((prev) =>
        prev.map((stock) => (stock.id === editingId ? stockData : stock)),
      );
    } else {
      setStocks((prev) => [stockData, ...prev]);
    }

    handleClose();
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this stock?",
    );

    if (confirmed) {
      setStocks((prev) => prev.filter((stock) => stock.id !== id));
    }
  };

  const getStatus = (quantity) => {
    if (Number(quantity) === 0) {
      return { label: "Out of Stock", className: "stock-out" };
    }

    if (Number(quantity) <= 10) {
      return { label: "Low Stock", className: "stock-low" };
    }

    return { label: "In Stock", className: "stock-in" };
  };

  return (
    <Box className="stock-page">
      <Box className="stock-heading">
        <Box>
          <Typography className="stock-title">Stock Management</Typography>

          <Typography className="stock-subtitle">
            Manage your inventory, quantities and suppliers.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="stock-add-btn"
          onClick={() => handleOpen()}
        >
          Add Stock
        </Button>
      </Box>

      {/* Summary cards */}
      <Box className="stock-stats">
        <Paper className="stock-stat-card" elevation={0}>
          <Box className="stock-stat-icon blue">
            <Inventory2OutlinedIcon />
          </Box>
          <Box>
            <Typography className="stock-stat-label">Total Products</Typography>
            <Typography className="stock-stat-value">
              {stocks.length}
            </Typography>
          </Box>
        </Paper>

        <Paper className="stock-stat-card" elevation={0}>
          <Box className="stock-stat-icon green">
            <Inventory2OutlinedIcon />
          </Box>
          <Box>
            <Typography className="stock-stat-label">Total Units</Typography>
            <Typography className="stock-stat-value">{totalUnits}</Typography>
          </Box>
        </Paper>

        <Paper className="stock-stat-card" elevation={0}>
          <Box className="stock-stat-icon orange">
            <Inventory2OutlinedIcon />
          </Box>
          <Box>
            <Typography className="stock-stat-label">Low Stock</Typography>
            <Typography className="stock-stat-value">{lowStock}</Typography>
          </Box>
        </Paper>

        <Paper className="stock-stat-card" elevation={0}>
          <Box className="stock-stat-icon red">
            <Inventory2OutlinedIcon />
          </Box>
          <Box>
            <Typography className="stock-stat-label">Out of Stock</Typography>
            <Typography className="stock-stat-value">{outOfStock}</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Inventory table */}
      <Paper className="stock-table-card" elevation={0}>
        <Box className="stock-table-toolbar">
          <Box>
            <Typography className="stock-table-title">
              Stock Inventory
            </Typography>
            <Typography className="stock-table-caption">
              View and manage all your stock items.
            </Typography>
          </Box>

          <TextField
            className="stock-search"
            size="small"
            placeholder="Search stock..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <TableContainer className="stock-table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PRODUCT</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>CATEGORY</TableCell>
                <TableCell>QUANTITY</TableCell>
                <TableCell>PRICE</TableCell>
                <TableCell>SUPPLIER</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell align="center">ACTIONS</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => {
                  const status = getStatus(stock.quantity);

                  return (
                    <TableRow key={stock.id} hover>
                      <TableCell>
                        <Box className="stock-product-cell">
                          <Box className="stock-product-image">
                            <img
                              src={stock.image || FALLBACK_IMAGE}
                              alt={stock.name}
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = FALLBACK_IMAGE;
                              }}
                            />
                          </Box>

                          <Box className="stock-product-details">
                            <Typography className="stock-product-name">
                              {stock.name}
                            </Typography>
                            <Typography className="stock-product-sku">
                              {stock.sku}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>{stock.sku}</TableCell>
                      <TableCell>{stock.category}</TableCell>

                      <TableCell>
                        <Typography className="stock-quantity">
                          {stock.quantity}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        ₹{Number(stock.price).toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell>{stock.supplier}</TableCell>

                      <TableCell>
                        <Chip
                          label={status.label}
                          size="small"
                          className={`stock-status ${status.className}`}
                        />
                      </TableCell>

                      <TableCell
                        align="center"
                        className="product-actions-cell"
                      >
                        <Tooltip title="More options">
                          <IconButton
                            size="small"
                            className="stock-more-btn"
                            onClick={(event) => handleMenuOpen(event, stock)}
                            aria-label={`Options for ${stock.name}`}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box className="stock-empty">
                      <Inventory2OutlinedIcon />
                      <Typography>No stock items found.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

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
                <EditOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Product</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleMenuDelete} sx={{ color: "#dc2626" }}>
              <ListItemIcon sx={{ color: "#dc2626" }}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Product</ListItemText>
            </MenuItem>
          </Menu>
        </TableContainer>

        <Box className="stock-table-footer">
          Showing {filteredStocks.length} of {stocks.length} products
        </Box>
      </Paper>

      {/* Add/Edit dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "stock-modal" }}
      >
        <Box className="stock-modal-header">
          <Box>
            <DialogTitle className="stock-modal-title">
              {editingId !== null ? "Edit Stock" : "Add New Stock"}
            </DialogTitle>

            <Typography className="stock-modal-subtitle">
              Enter the product and inventory details below.
            </Typography>
          </Box>

          <IconButton onClick={handleClose} aria-label="Close modal">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent className="stock-modal-content">
            <Box className="stock-form-grid">
              <TextField
                label="Product Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
                fullWidth
              />

              <TextField
                label="Product Code"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. MED-003"
                required
                fullWidth
              />

              <Box className="stock-image-upload">
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  className="stock-upload-btn"
                >
                  Upload Product Image
                  <input
                    type="file"
                    hidden
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageChange}
                  />
                </Button>

                {form.imagePreview && (
                  <Box className="stock-image-preview">
                    <img src={form.imagePreview} alt="Product preview" />
                    <Button
                      size="small"
                      color="error"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          image: "",
                          imagePreview: "",
                        }))
                      }
                    >
                      Remove image
                    </Button>
                  </Box>
                )}
              </Box>

              <TextField
                select
                label="Category"
                name="category"
                value={form.category}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="Ayurvedic Medicine">
                  Ayurvedic Medicine
                </MenuItem>
                <MenuItem value="Health Supplement">Health Supplement</MenuItem>
                <MenuItem value="Ayurvedic Powder">Ayurvedic Powder</MenuItem>
                <MenuItem value="Juice">Juice</MenuItem>
                <MenuItem value="Skin Care">Skin Care</MenuItem>
                <MenuItem value="Hair Care">Hair Care</MenuItem>
                <MenuItem value="Herbal Drops">Herbal Drops</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>

              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                slotProps={{
                  htmlInput: { min: 0, step: 1 },
                }}
                placeholder="Enter quantity"
                required
                fullWidth
              />

              <TextField
                label="Unit Price (₹)"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                slotProps={{
                  htmlInput: { min: 0, step: "0.01" },
                }}
                placeholder="Enter price"
                required
                fullWidth
              />

              <TextField
                label="Supplier Name"
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                placeholder="Enter supplier name"
                required
                fullWidth
              />
            </Box>

            {error && (
              <Typography className="stock-form-error">{error}</Typography>
            )}
          </DialogContent>

          <DialogActions className="stock-modal-actions">
            <Button onClick={handleClose} className="stock-cancel-btn">
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={
                editingId !== null ? <EditOutlinedIcon /> : <AddIcon />
              }
              className="stock-save-btn"
            >
              {editingId !== null ? "Save Changes" : "Add Stock"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default Stock;
