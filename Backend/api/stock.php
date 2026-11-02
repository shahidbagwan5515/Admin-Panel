
<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  exit;
}

require_once "../config/db.php";

$method = $_SERVER["REQUEST_METHOD"];

// FormData update support
if ($method === "POST" && ($_POST["_method"] ?? "") === "PUT") {
  $method = "PUT";
}

$input = json_decode(file_get_contents("php://input"), true) ?? [];

$uploadDir = __DIR__ . "/../uploads/stock/";

if (!is_dir($uploadDir)) {
  mkdir($uploadDir, 0755, true);
}

function sendResponse($success, $message, $data = null, $status = 200)
{
  http_response_code($status);

  echo json_encode([
    "success" => $success,
    "message" => $message,
    "data" => $data
  ]);

  exit;
}

// Image validation and upload
function uploadStockImage($file, $uploadDir)
{

  if ($file["error"] !== UPLOAD_ERR_OK) {
    throw new Exception("Image upload failed");
  }

  if ($file["size"] > 5 * 1024 * 1024) {
    throw new Exception("Maximum image size is 5 MB");
  }

  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->file($file["tmp_name"]);

  $allowedTypes = [
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp"
  ];

  if (!isset($allowedTypes[$mime])) {
    throw new Exception("Only JPG, PNG and WEBP images allowed");
  }

  $fileName = bin2hex(random_bytes(16)) . "." . $allowedTypes[$mime];

  $destination = $uploadDir . $fileName;

  if (!move_uploaded_file($file["tmp_name"], $destination)) {
    throw new Exception("Unable to save image");
  }

  return [
    "path" => "uploads/stock/" . $fileName,
    "file" => $destination
  ];
}

try {

  // GET STOCK / SEARCH / CATEGORY FILTER
  if ($method === "GET") {

    if (isset($_GET["id"])) {

      $id = (int) $_GET["id"];

      $stmt = $conn->prepare(
        "SELECT s.*, c.name AS category_name
                 FROM stocks s
                 LEFT JOIN categories c ON s.category_id = c.id
                 WHERE s.id = ?"
      );

      $stmt->bind_param("i", $id);
      $stmt->execute();

      $stock = $stmt->get_result()->fetch_assoc();

      if (!$stock) {
        sendResponse(false, "Stock not found", null, 404);
      }

      sendResponse(true, "Stock fetched successfully", $stock);
    }

    $search = trim($_GET["search"] ?? "");
    $categoryId = (int) ($_GET["category_id"] ?? 0);

    $sql = "SELECT s.*, c.name AS category_name
                FROM stocks s
                LEFT JOIN categories c ON s.category_id = c.id
                WHERE 1=1";

    $params = [];
    $types = "";

    if ($search !== "") {
      $sql .= " AND (
                s.product_name LIKE ?
                OR s.product_code LIKE ?
                OR s.supplier_name LIKE ?
            )";

      $term = "%" . $search . "%";

      $params[] = $term;
      $params[] = $term;
      $params[] = $term;

      $types .= "sss";
    }

    if ($categoryId > 0) {
      $sql .= " AND s.category_id = ?";
      $params[] = $categoryId;
      $types .= "i";
    }

    $sql .= " ORDER BY s.id DESC";

    $stmt = $conn->prepare($sql);

    if (!empty($params)) {
      $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();

    $result = $stmt->get_result();

    $stocks = [];

    while ($row = $result->fetch_assoc()) {
      $stocks[] = $row;
    }

    sendResponse(true, "Stocks fetched successfully", $stocks);
  }

  // ADD STOCK
  if ($method === "POST") {

    $productName = trim($_POST["product_name"] ?? "");
    $productCode = trim($_POST["product_code"] ?? "");
    $categoryId = (int) ($_POST["category_id"] ?? 0);
    $quantity = filter_var($_POST["quantity"] ?? null, FILTER_VALIDATE_INT);
    $unitPrice = $_POST["unit_price"] ?? "";
    $supplierName = trim($_POST["supplier_name"] ?? "");

    if (
      $productName === "" ||
      $productCode === "" ||
      $categoryId <= 0 ||
      $quantity === false ||
      $quantity === null ||
      $quantity < 0 ||
      !is_numeric($unitPrice) ||
      (float)$unitPrice < 0 ||
      $supplierName === ""
    ) {
      sendResponse(false, "Please enter valid stock details", null, 400);
    }

    $uploadedFile = null;

    $conn->begin_transaction();

    try {

      $stmt = $conn->prepare(
        "INSERT INTO stocks
                (product_name, product_code, category_id,
                 quantity, unit_price, supplier_name)
                VALUES (?, ?, ?, ?, ?, ?)"
      );

      $price = (float) $unitPrice;

      $stmt->bind_param(
        "ssiids",
        $productName,
        $productCode,
        $categoryId,
        $quantity,
        $price,
        $supplierName
      );

      $stmt->execute();

      $stockId = $conn->insert_id;

      // Optional single image
      if (
        isset($_FILES["image"]) &&
        $_FILES["image"]["error"] !== UPLOAD_ERR_NO_FILE
      ) {

        $uploadedFile = uploadStockImage(
          $_FILES["image"],
          $uploadDir
        );

        $imagePath = $uploadedFile["path"];

        $update = $conn->prepare(
          "UPDATE stocks SET image_path = ? WHERE id = ?"
        );

        $update->bind_param("si", $imagePath, $stockId);
        $update->execute();
      }

      $conn->commit();

      sendResponse(true, "Stock added successfully", [
        "id" => $stockId,
        "image_path" => $uploadedFile["path"] ?? null
      ], 201);
    } catch (Throwable $e) {

      $conn->rollback();

      if ($uploadedFile && file_exists($uploadedFile["file"])) {
        unlink($uploadedFile["file"]);
      }

      throw $e;
    }
  }

  // UPDATE STOCK
  if ($method === "PUT") {

    $id = (int) ($_POST["id"] ?? $input["id"] ?? 0);

    if ($id <= 0) {
      sendResponse(false, "Valid stock ID required", null, 400);
    }

    $stmt = $conn->prepare(
      "SELECT * FROM stocks WHERE id = ?"
    );

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $oldStock = $stmt->get_result()->fetch_assoc();

    if (!$oldStock) {
      sendResponse(false, "Stock not found", null, 404);
    }

    $productName = trim($_POST["product_name"] ?? $input["product_name"] ?? $oldStock["product_name"]);
    $productCode = trim($_POST["product_code"] ?? $input["product_code"] ?? $oldStock["product_code"]);
    $categoryId = (int) ($_POST["category_id"] ?? $input["category_id"] ?? $oldStock["category_id"]);
    $quantity = filter_var(
      $_POST["quantity"] ?? $input["quantity"] ?? $oldStock["quantity"],
      FILTER_VALIDATE_INT
    );
    $unitPrice = $_POST["unit_price"] ?? $input["unit_price"] ?? $oldStock["unit_price"];
    $supplierName = trim($_POST["supplier_name"] ?? $input["supplier_name"] ?? $oldStock["supplier_name"]);

    if (
      $productName === "" ||
      $productCode === "" ||
      $categoryId <= 0 ||
      $quantity === false ||
      $quantity < 0 ||
      !is_numeric($unitPrice) ||
      (float)$unitPrice < 0 ||
      $supplierName === ""
    ) {
      sendResponse(false, "Invalid stock details", null, 400);
    }

    $uploadedFile = null;
    $oldImagePath = $oldStock["image_path"];

    $conn->begin_transaction();

    try {

      $newImagePath = $oldImagePath;

      if (
        isset($_FILES["image"]) &&
        $_FILES["image"]["error"] !== UPLOAD_ERR_NO_FILE
      ) {
        $uploadedFile = uploadStockImage(
          $_FILES["image"],
          $uploadDir
        );

        $newImagePath = $uploadedFile["path"];
      }

      $price = (float) $unitPrice;

      $update = $conn->prepare(
        "UPDATE stocks SET
                product_name = ?,
                product_code = ?,
                category_id = ?,
                quantity = ?,
                unit_price = ?,
                supplier_name = ?,
                image_path = ?
                WHERE id = ?"
      );

      $update->bind_param(
        "ssidsssi",
        $productName,
        $productCode,
        $categoryId,
        $quantity,
        $price,
        $supplierName,
        $newImagePath,
        $id
      );

      $update->execute();

      $conn->commit();

      if ($uploadedFile && $oldImagePath) {
        $oldFile = __DIR__ . "/../" . $oldImagePath;

        if (is_file($oldFile)) {
          unlink($oldFile);
        }
      }

      sendResponse(true, "Stock updated successfully", [
        "id" => $id,
        "image_path" => $newImagePath
      ]);
    } catch (Throwable $e) {

      $conn->rollback();

      if ($uploadedFile && file_exists($uploadedFile["file"])) {
        unlink($uploadedFile["file"]);
      }

      throw $e;
    }
  }

  // DELETE STOCK
  if ($method === "DELETE") {

    $id = (int) ($input["id"] ?? $_GET["id"] ?? 0);

    if ($id <= 0) {
      sendResponse(false, "Valid stock ID required", null, 400);
    }

    $stmt = $conn->prepare(
      "SELECT image_path FROM stocks WHERE id = ?"
    );

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $stock = $stmt->get_result()->fetch_assoc();

    if (!$stock) {
      sendResponse(false, "Stock not found", null, 404);
    }

    $delete = $conn->prepare(
      "DELETE FROM stocks WHERE id = ?"
    );

    $delete->bind_param("i", $id);
    $delete->execute();

    if ($stock["image_path"]) {
      $imageFile = __DIR__ . "/../" . $stock["image_path"];

      if (is_file($imageFile)) {
        unlink($imageFile);
      }
    }

    sendResponse(true, "Stock deleted successfully");
  }

  sendResponse(false, "Method not allowed", null, 405);
} catch (mysqli_sql_exception $e) {

  if ($e->getCode() === 1062) {
    sendResponse(false, "Product code already exists", null, 409);
  }

  if ($e->getCode() === 1452) {
    sendResponse(false, "Selected category does not exist", null, 400);
  }

  sendResponse(false, "Database operation failed", null, 500);
} catch (Throwable $e) {

  sendResponse(false, $e->getMessage(), null, 400);
}

$conn->close();

?>
