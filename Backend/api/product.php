
<?php

require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

// Upload directory
$uploadDir = __DIR__ . "/../uploads/products/";

// Image URL
$projectPath = dirname(dirname($_SERVER["SCRIPT_NAME"]));
$uploadUrl = $projectPath . "/uploads/products/";

// JSON response
function response($success, $message, $data = null, $status = 200)
{

  http_response_code($status);

  echo json_encode([
    "success" => $success,
    "message" => $message,
    "data" => $data
  ]);

  exit;
}

// Get request data
function getRequestData()
{

  $json = json_decode(file_get_contents("php://input"), true);

  return is_array($json) ? $json : $_POST;
}

// Save product images
function uploadProductImages($images)
{

  global $uploadDir, $uploadUrl;

  if (!is_array($images)) {
    throw new Exception("Invalid images format.");
  }

  if (count($images) > 6) {
    throw new Exception("Maximum 6 images allowed.");
  }

  if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
  }

  $savedImages = [];

  foreach ($images as $image) {

    // Existing image URL
    if (!preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,/i', $image, $matches)) {

      $savedImages[] = $image;
      continue;
    }

    $parts = explode(",", $image, 2);

    $imageData = base64_decode($parts[1], true);

    if ($imageData === false) {
      throw new Exception("Invalid image data.");
    }

    if (strlen($imageData) > 5 * 1024 * 1024) {
      throw new Exception("Image size must be below 5 MB.");
    }

    $extension = strtolower($matches[1]);

    if ($extension === "jpeg") {
      $extension = "jpg";
    }

    $fileName = uniqid("product_", true) . "." . $extension;

    $filePath = $uploadDir . $fileName;

    if (file_put_contents($filePath, $imageData) === false) {
      throw new Exception("Image upload failed.");
    }

    $savedImages[] = $uploadUrl . $fileName;
  }

  return json_encode($savedImages);
}


// ================================
// GET - FETCH PRODUCTS
// ================================

if ($_SERVER["REQUEST_METHOD"] === "GET") {

  $id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;

  if ($id > 0) {

    $stmt = $conn->prepare(
      "SELECT * FROM products WHERE id = ?"
    );

    $stmt->bind_param("i", $id);
  } else {

    $stmt = $conn->prepare(
      "SELECT * FROM products ORDER BY id DESC"
    );
  }

  $stmt->execute();

  $result = $stmt->get_result();

  $products = [];

  while ($row = $result->fetch_assoc()) {

    $row["images"] = $row["images"]
      ? json_decode($row["images"], true)
      : [];

    $row["stock"] = (int)$row["stock"];
    $row["price"] = (float)$row["price"];

    $products[] = $row;
  }

  $stmt->close();

  if ($id > 0 && empty($products)) {
    response(false, "Product not found.", null, 404);
  }

  response(true, "Products fetched successfully.", $id > 0 ? $products[0] : $products);
}


// ================================
// POST - ADD PRODUCT
// ================================
// ================================
// POST - ADD PRODUCT
// ================================

if ($_SERVER["REQUEST_METHOD"] === "POST") {

  try {

    $data = getRequestData();

    if (empty($data)) {
      response(false, "No product data received.", null, 400);
    }

    $name = trim($data["name"] ?? "");
    $sku = trim($data["sku"] ?? "");
    $category = trim($data["category"] ?? "");
    $supplier = trim($data["supplier"] ?? "");
    $description = trim($data["description"] ?? "");
    $status = $data["status"] ?? "Active";

    $stock = $data["stock"] ?? null;
    $price = $data["price"] ?? null;

    // Required fields
    if (
      $name === "" ||
      $sku === "" ||
      $category === "" ||
      $supplier === ""
    ) {
      response(false, "Please fill all required fields.", null, 422);
    }

    // Stock validation
    if (
      !is_numeric($stock) ||
      (float)$stock < 0 ||
      floor((float)$stock) != (float)$stock
    ) {
      response(false, "Invalid stock quantity.", null, 422);
    }

    // Price validation
    if (!is_numeric($price) || (float)$price < 0) {
      response(false, "Invalid product price.", null, 422);
    }

    // Status validation
    if (!in_array($status, ["Active", "Inactive"], true)) {
      response(false, "Invalid product status.", null, 422);
    }

    $stock = (int)$stock;
    $price = (float)$price;

    // Check duplicate SKU
    $check = $conn->prepare(
      "SELECT id FROM products WHERE sku = ?"
    );

    $check->bind_param("s", $sku);
    $check->execute();

    if ($check->get_result()->num_rows > 0) {
      $check->close();

      response(false, "SKU already exists.", null, 409);
    }

    $check->close();

    // Upload images
    $images = uploadProductImages($data["images"] ?? []);

    // Insert product
    $stmt = $conn->prepare(
      "INSERT INTO products
            (
                name,
                sku,
                category,
                stock,
                price,
                supplier,
                description,
                images,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    if (!$stmt) {
      throw new Exception("Database prepare failed: " . $conn->error);
    }

    $stmt->bind_param(
      "sssidssss",
      $name,
      $sku,
      $category,
      $stock,
      $price,
      $supplier,
      $description,
      $images,
      $status
    );

    if (!$stmt->execute()) {
      throw new Exception("Product insert failed: " . $stmt->error);
    }

    $newId = $conn->insert_id;

    $stmt->close();

    response(true, "Product added successfully.", [
      "id" => $newId
    ], 201);
  } catch (Throwable $e) {

    error_log("PRODUCT ADD ERROR: " . $e->getMessage());

    response(
      false,
      $e->getMessage(),
      null,
      500
    );
  }
}


// ================================
// PUT - UPDATE PRODUCT
// ================================

if ($_SERVER["REQUEST_METHOD"] === "PUT") {

  try {

    $id = (int)($_GET["id"] ?? 0);

    if ($id <= 0) {
      response(false, "Product ID is required.", null, 400);
    }

    $data = getRequestData();

    $name = trim($data["name"] ?? "");
    $sku = trim($data["sku"] ?? "");
    $category = trim($data["category"] ?? "");
    $stock = $data["stock"] ?? null;
    $price = $data["price"] ?? null;
    $supplier = trim($data["supplier"] ?? "");
    $description = trim($data["description"] ?? "");
    $status = $data["status"] ?? "Active";

    if (
      $name === "" ||
      $sku === "" ||
      $category === "" ||
      $supplier === ""
    ) {
      response(false, "Please fill all required fields.", null, 422);
    }

    if (
      !is_numeric($stock) ||
      (float)$stock < 0 ||
      floor((float)$stock) != (float)$stock
    ) {
      response(false, "Invalid stock quantity.", null, 422);
    }

    if (!is_numeric($price) || (float)$price < 0) {
      response(false, "Invalid product price.", null, 422);
    }

    if (!in_array($status, ["Active", "Inactive"], true)) {
      response(false, "Invalid product status.", null, 422);
    }

    $stock = (int)$stock;
    $price = (float)$price;

    $images = uploadProductImages($data["images"] ?? []);

    $stmt = $conn->prepare(
      "UPDATE products SET
            name = ?,
            sku = ?,
            category = ?,
            stock = ?,
            price = ?,
            supplier = ?,
            description = ?,
            images = ?,
            status = ?
            WHERE id = ?"
    );

    $stmt->bind_param(
      "sssidssssi",
      $name,
      $sku,
      $category,
      $stock,
      $price,
      $supplier,
      $description,
      $images,
      $status,
      $id
    );

    $stmt->execute();

    if ($stmt->affected_rows === 0) {

      $check = $conn->prepare(
        "SELECT id FROM products WHERE id = ?"
      );

      $check->bind_param("i", $id);
      $check->execute();

      $exists = $check->get_result()->num_rows > 0;

      $check->close();

      if (!$exists) {
        response(false, "Product not found.", null, 404);
      }
    }

    $stmt->close();

    response(true, "Product updated successfully.");
  } catch (Throwable $e) {

    if ($conn->errno == 1062) {
      response(false, "SKU already exists.", null, 409);
    }

    response(false, $e->getMessage(), null, 500);
  }
}


// ================================
// DELETE - DELETE PRODUCT
// ================================

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {

  $id = (int)($_GET["id"] ?? 0);

  if ($id <= 0) {
    response(false, "Product ID is required.", null, 400);
  }

  $stmt = $conn->prepare(
    "DELETE FROM products WHERE id = ?"
  );

  $stmt->bind_param("i", $id);

  $stmt->execute();

  if ($stmt->affected_rows === 0) {
    $stmt->close();
    response(false, "Product not found.", null, 404);
  }

  $stmt->close();

  response(true, "Product deleted successfully.");
}


// ================================
// INVALID REQUEST
// ================================

response(false, "Invalid request method.", null, 405);

?>
