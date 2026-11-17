
<?php

// =============================================
// HEADERS & CORS
// =============================================

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

// =============================================
// DATABASE, AUTH & NOTIFICATION
// =============================================

require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/auth.php";
require_once __DIR__ . "/../helpers/notification_helper.php";

// =============================================
// UPLOAD SETTINGS
// =============================================

$uploadDir = __DIR__ . "/../uploads/products/";

$projectPath = dirname(dirname($_SERVER["SCRIPT_NAME"]));
$uploadUrl = $projectPath . "/uploads/products/";

// =============================================
// JSON RESPONSE
// =============================================

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

// =============================================
// REQUEST DATA
// =============================================

function getRequestData()
{
  $json = json_decode(file_get_contents("php://input"), true);

  return is_array($json) ? $json : $_POST;
}

// =============================================
// PRODUCT NOTIFICATION
// =============================================

function productNotification(
  $conn,
  $action,
  $title,
  $message,
  $productId
) {
  try {

    $user = getLoggedInUser();

    if (!$user || empty($user["email"])) {
      error_log(
        "PRODUCT NOTIFICATION FAILED: Logged-in user/email not found."
      );
      return false;
    }

    $actorName = $user["name"] ?? "Admin";
    $recipientEmail = strtolower(
      trim($user["email"])
    );

    $result = createNotification(
      $conn,
      "Product",
      $action,
      $title,
      $message,
      $productId,
      $actorName,
      $recipientEmail
    );

    if (!$result) {
      error_log(
        "PRODUCT NOTIFICATION INSERT FAILED: " . $title
      );
      return false;
    }

    error_log(
      "PRODUCT NOTIFICATION CREATED: " .
        $title . " | " . $recipientEmail
    );

    return true;
  } catch (Throwable $e) {

    error_log(
      "PRODUCT NOTIFICATION ERROR: " . $e->getMessage()
    );

    return false;
  }
}

// =============================================
// IMAGE UPLOAD
// =============================================

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
    if (!mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
      throw new Exception("Unable to create upload directory.");
    }
  }

  $savedImages = [];

  foreach ($images as $image) {

    if (!is_string($image) || trim($image) === "") {
      continue;
    }

    $image = trim($image);

    // External URL
    if (preg_match('/^https?:\/\//i', $image)) {
      $savedImages[] = $image;
      continue;
    }

    // Existing local image
    $imagePath = parse_url($image, PHP_URL_PATH);

    if (!$imagePath) {
      $imagePath = $image;
    }

    $normalizedPath = ltrim(
      str_replace("\\", "/", $imagePath),
      "/"
    );

    if (
      preg_match(
        '#(?:^|/)uploads/products/([a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp))$#i',
        $normalizedPath,
        $matches
      )
    ) {

      $fileName = $matches[1];

      if (!is_file($uploadDir . $fileName)) {
        throw new Exception(
          "Existing product image not found: " . $fileName
        );
      }

      $savedImages[] = $uploadUrl . $fileName;
      continue;
    }

    // Base64 image
    if (
      !preg_match(
        '/^data:image\/(jpeg|jpg|png|webp);base64,/i',
        $image
      )
    ) {
      throw new Exception("Unsupported image format.");
    }

    $parts = explode(",", $image, 2);

    if (count($parts) !== 2) {
      throw new Exception("Invalid image data.");
    }

    $imageData = base64_decode($parts[1], true);

    if ($imageData === false) {
      throw new Exception("Invalid Base64 image data.");
    }

    if (strlen($imageData) > 5 * 1024 * 1024) {
      throw new Exception("Image size must be below 5 MB.");
    }

    $imageInfo = @getimagesizefromstring($imageData);

    if ($imageInfo === false) {
      throw new Exception("Invalid image file.");
    }

    $mimeExtensions = [
      "image/jpeg" => "jpg",
      "image/png" => "png",
      "image/webp" => "webp"
    ];

    $mime = $imageInfo["mime"];

    if (!isset($mimeExtensions[$mime])) {
      throw new Exception(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );
    }

    $extension = $mimeExtensions[$mime];

    $fileName = uniqid("product_", true) . "." . $extension;

    if (
      file_put_contents(
        $uploadDir . $fileName,
        $imageData
      ) === false
    ) {
      throw new Exception("Image upload failed.");
    }

    $savedImages[] = $uploadUrl . $fileName;
  }

  if (count($savedImages) > 6) {
    throw new Exception("Maximum 6 images allowed.");
  }

  return json_encode($savedImages);
}

// =============================================
// VALIDATE PRODUCT
// =============================================

function validateProduct($data)
{
  $name = trim($data["name"] ?? "");
  $sku = trim($data["sku"] ?? "");
  $category = trim($data["category"] ?? "");
  $supplier = trim($data["supplier"] ?? "");
  $description = trim($data["description"] ?? "");

  $stock = $data["stock"] ?? null;
  $price = $data["price"] ?? null;
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

  if (
    !is_numeric($price) ||
    !is_finite((float)$price) ||
    (float)$price < 0
  ) {
    response(false, "Invalid product price.", null, 422);
  }

  if (!in_array($status, ["Active", "Inactive"], true)) {
    response(false, "Invalid product status.", null, 422);
  }

  return [
    "name" => $name,
    "sku" => $sku,
    "category" => $category,
    "stock" => (int)$stock,
    "price" => (float)$price,
    "supplier" => $supplier,
    "description" => $description,
    "status" => $status
  ];
}

// =============================================
// REQUEST METHOD
// =============================================

$method = $_SERVER["REQUEST_METHOD"];

// =============================================
// GET PRODUCTS
// =============================================

if ($method === "GET") {

  try {

    $id = (int)($_GET["id"] ?? 0);

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

    if (!$stmt) {
      throw new Exception($conn->error);
    }

    $stmt->execute();

    $result = $stmt->get_result();

    $products = [];

    while ($row = $result->fetch_assoc()) {

      $row["id"] = (int)$row["id"];
      $row["stock"] = (int)$row["stock"];
      $row["price"] = (float)$row["price"];

      $row["images"] = $row["images"]
        ? (json_decode($row["images"], true) ?: [])
        : [];

      $products[] = $row;
    }

    $stmt->close();

    if ($id > 0 && empty($products)) {
      response(false, "Product not found.", null, 404);
    }

    response(
      true,
      "Products fetched successfully.",
      $id > 0 ? $products[0] : $products
    );
  } catch (Throwable $e) {

    error_log("PRODUCT GET ERROR: " . $e->getMessage());

    response(false, "Unable to fetch products.", null, 500);
  }
}

// =============================================
// ADD PRODUCT
// =============================================

elseif ($method === "POST") {

  $uploadedFiles = [];

  try {

    $data = getRequestData();

    if (!is_array($data) || empty($data)) {
      response(false, "No product data received.", null, 400);
    }

    $product = validateProduct($data);

    extract($product);

    // Check duplicate SKU
    $check = $conn->prepare(
      "SELECT id FROM products WHERE sku = ?"
    );

    if (!$check) {
      throw new Exception($conn->error);
    }

    $check->bind_param("s", $sku);
    $check->execute();

    if ($check->get_result()->num_rows > 0) {
      $check->close();
      response(false, "SKU already exists.", null, 409);
    }

    $check->close();

    // Upload images
    $images = uploadProductImages($data["images"] ?? []);

    $decodedImages = json_decode($images, true);

    foreach ($decodedImages as $image) {

      $fileName = basename(
        parse_url($image, PHP_URL_PATH)
      );

      if (str_starts_with($fileName, "product_")) {
        $uploadedFiles[] = $fileName;
      }
    }

    // Insert product
    $stmt = $conn->prepare("
            INSERT INTO products (
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

    if (!$stmt) {
      throw new Exception($conn->error);
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
      throw new Exception($stmt->error);
    }

    $newId = (int)$conn->insert_id;

    $stmt->close();

    // Create notification
    $notificationCreated = productNotification(
      $conn,
      "Created",
      "New Product Added",
      "Product '{$name}' (SKU: {$sku}) has been added successfully.",
      $newId
    );

    response(
      true,
      "Product added successfully.",
      [
        "id" => $newId,
        "name" => $name,
        "sku" => $sku,
        "notification_created" => $notificationCreated
      ],
      201
    );
  } catch (Throwable $e) {

    foreach ($uploadedFiles as $file) {

      $path = $uploadDir . $file;

      if (is_file($path)) {
        unlink($path);
      }
    }

    error_log("PRODUCT ADD ERROR: " . $e->getMessage());

    if (
      $e instanceof mysqli_sql_exception &&
      $e->getCode() === 1062
    ) {
      response(false, "SKU already exists.", null, 409);
    }

    response(
      false,
      "Product add failed: " . $e->getMessage(),
      null,
      500
    );
  }
}

// =============================================
// UPDATE PRODUCT
// =============================================

elseif ($method === "PUT") {

  try {

    $id = (int)($_GET["id"] ?? 0);

    if ($id <= 0) {
      response(false, "Product ID is required.", null, 400);
    }

    $data = getRequestData();

    if (!is_array($data) || empty($data)) {
      response(false, "No product data received.", null, 400);
    }

    // Check product exists
    $existing = $conn->prepare(
      "SELECT id FROM products WHERE id = ?"
    );

    if (!$existing) {
      throw new Exception($conn->error);
    }

    $existing->bind_param("i", $id);
    $existing->execute();

    if (!$existing->get_result()->fetch_assoc()) {
      $existing->close();
      response(false, "Product not found.", null, 404);
    }

    $existing->close();

    $product = validateProduct($data);

    extract($product);

    // Check duplicate SKU
    $check = $conn->prepare(
      "SELECT id FROM products WHERE sku = ? AND id != ?"
    );

    if (!$check) {
      throw new Exception($conn->error);
    }

    $check->bind_param("si", $sku, $id);
    $check->execute();

    if ($check->get_result()->num_rows > 0) {
      $check->close();
      response(false, "SKU already exists.", null, 409);
    }

    $check->close();

    // Upload or preserve images
    $images = uploadProductImages($data["images"] ?? []);

    // Update product
    $stmt = $conn->prepare("
            UPDATE products SET
                name = ?,
                sku = ?,
                category = ?,
                stock = ?,
                price = ?,
                supplier = ?,
                description = ?,
                images = ?,
                status = ?
            WHERE id = ?
        ");

    if (!$stmt) {
      throw new Exception($conn->error);
    }

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

    if (!$stmt->execute()) {
      throw new Exception($stmt->error);
    }

    $stmt->close();

    // Create notification
    $notificationCreated = productNotification(
      $conn,
      "Updated",
      "Product Updated",
      "Product '{$name}' (SKU: {$sku}) has been updated successfully.",
      $id
    );

    response(
      true,
      "Product updated successfully.",
      [
        "id" => $id,
        "notification_created" => $notificationCreated
      ]
    );
  } catch (Throwable $e) {

    error_log("PRODUCT UPDATE ERROR: " . $e->getMessage());

    if (
      $e instanceof mysqli_sql_exception &&
      $e->getCode() === 1062
    ) {
      response(false, "SKU already exists.", null, 409);
    }

    response(
      false,
      "Product update failed: " . $e->getMessage(),
      null,
      500
    );
  }
}

// =============================================
// DELETE PRODUCT
// =============================================

elseif ($method === "DELETE") {

  try {

    $id = (int)($_GET["id"] ?? 0);

    if ($id <= 0) {
      response(false, "Product ID is required.", null, 400);
    }

    // Fetch product before deletion
    $check = $conn->prepare(
      "SELECT name, sku FROM products WHERE id = ?"
    );

    if (!$check) {
      throw new Exception($conn->error);
    }

    $check->bind_param("i", $id);
    $check->execute();

    $product = $check->get_result()->fetch_assoc();

    $check->close();

    if (!$product) {
      response(false, "Product not found.", null, 404);
    }

    // Delete product
    $stmt = $conn->prepare(
      "DELETE FROM products WHERE id = ?"
    );

    if (!$stmt) {
      throw new Exception($conn->error);
    }

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
      throw new Exception($stmt->error);
    }

    $stmt->close();

    // Create notification
    $notificationCreated = productNotification(
      $conn,
      "Deleted",
      "Product Deleted",
      "Product '{$product["name"]}' (SKU: {$product["sku"]}) has been deleted.",
      $id
    );

    response(
      true,
      "Product deleted successfully.",
      [
        "id" => $id,
        "notification_created" => $notificationCreated
      ]
    );
  } catch (Throwable $e) {

    error_log("PRODUCT DELETE ERROR: " . $e->getMessage());

    response(
      false,
      "Product delete failed: " . $e->getMessage(),
      null,
      500
    );
  }
}

// =============================================
// INVALID METHOD
// =============================================

else {

  response(false, "Method not allowed.", null, 405);
}

?>
