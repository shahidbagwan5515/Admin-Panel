<?php

header("Content-Type: application/json; charset=UTF-8");

$allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
  header("Access-Control-Allow-Origin: " . $origin);
  header("Access-Control-Allow-Credentials: true");
}

header("Vary: Origin");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/auth.php";
require_once __DIR__ . "/../helpers/notification_helper.php";

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

function notifyCategory($conn, $user, $action, $id, $name)
{
  $messages = [
    "Created" => "New category '{$name}' has been created.",
    "Updated" => "Category '{$name}' has been updated.",
    "Deleted" => "Category '{$name}' has been deleted.",
    "Activated" => "Category '{$name}' has been activated.",
    "Deactivated" => "Category '{$name}' has been deactivated."
  ];

  return createNotification(
    $conn,
    "Category",
    $action,
    "Category " . $action,
    $messages[$action] ?? "Category action completed.",
    $id,
    $user["name"] ?? "Admin",
    $user["email"] ?? null
  );
}

$method = $_SERVER["REQUEST_METHOD"];

$input = [];

if (in_array($method, ["POST", "PUT", "DELETE"], true)) {
  $raw = file_get_contents("php://input");

  if (trim($raw) !== "") {
    $input = json_decode($raw, true);

    if (!is_array($input)) {
      sendResponse(false, "Invalid JSON data.", null, 400);
    }
  }
}

try {

  // GET CATEGORIES
  if ($method === "GET") {
    requireLogin();

    if (isset($_GET["id"])) {
      $id = (int)$_GET["id"];

      if ($id <= 0) {
        sendResponse(false, "Invalid category ID.", null, 400);
      }

      $stmt = $conn->prepare(
        "SELECT * FROM categories WHERE id = ?"
      );

      $stmt->bind_param("i", $id);
      $stmt->execute();

      $category = $stmt->get_result()->fetch_assoc();
      $stmt->close();

      if (!$category) {
        sendResponse(false, "Category not found.", null, 404);
      }

      sendResponse(true, "Category fetched.", $category);
    }

    $result = $conn->query(
      "SELECT * FROM categories ORDER BY id DESC"
    );

    $categories = [];

    while ($row = $result->fetch_assoc()) {
      $categories[] = $row;
    }

    sendResponse(true, "Categories fetched.", $categories);
  }

  // LOGIN REQUIRED FOR ALL WRITE OPERATIONS
  $user = requireLogin();

  // POST: ADD CATEGORY
  if ($method === "POST") {
    $name = trim($input["name"] ?? "");
    $description = trim($input["description"] ?? "");

    if ($name === "") {
      sendResponse(false, "Category name is required.", null, 400);
    }

    $stmt = $conn->prepare("
            INSERT INTO categories (name, description)
            VALUES (?, ?)
        ");

    $stmt->bind_param("ss", $name, $description);
    $stmt->execute();

    $id = (int)$conn->insert_id;
    $stmt->close();

    notifyCategory($conn, $user, "Created", $id, $name);

    sendResponse(
      true,
      "Category added successfully.",
      ["id" => $id],
      201
    );
  }

  // PUT: UPDATE CATEGORY OR STATUS
  if ($method === "PUT") {
    $id = (int)($input["id"] ?? 0);
    $name = trim($input["name"] ?? "");
    $description = trim($input["description"] ?? "");

    if ($id <= 0 || $name === "") {
      sendResponse(false, "Valid ID and name are required.", null, 400);
    }

    $check = $conn->prepare(
      "SELECT id, name, status FROM categories WHERE id = ?"
    );

    $check->bind_param("i", $id);
    $check->execute();

    $oldCategory = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$oldCategory) {
      sendResponse(false, "Category not found.", null, 404);
    }

    $oldStatus = strtolower($oldCategory["status"] ?? "active");

    $newStatus = isset($input["status"])
      ? strtolower(trim($input["status"]))
      : null;

    if (
      $newStatus !== null &&
      !in_array($newStatus, ["active", "inactive"], true)
    ) {
      sendResponse(false, "Invalid category status.", null, 400);
    }

    if ($newStatus !== null) {
      $stmt = $conn->prepare("
                UPDATE categories
                SET name = ?, description = ?, status = ?
                WHERE id = ?
            ");

      $stmt->bind_param(
        "sssi",
        $name,
        $description,
        $newStatus,
        $id
      );
    } else {
      $stmt = $conn->prepare("
                UPDATE categories
                SET name = ?, description = ?
                WHERE id = ?
            ");

      $stmt->bind_param("ssi", $name, $description, $id);
    }

    $stmt->execute();
    $stmt->close();

    if ($newStatus !== null && $newStatus !== $oldStatus) {
      $action = $newStatus === "active"
        ? "Activated"
        : "Deactivated";
    } else {
      $action = "Updated";
    }

    notifyCategory($conn, $user, $action, $id, $name);

    sendResponse(true, "Category updated successfully.");
  }

  // DELETE CATEGORY
  if ($method === "DELETE") {
    $id = (int)($input["id"] ?? $_GET["id"] ?? 0);

    if ($id <= 0) {
      sendResponse(false, "Valid category ID required.", null, 400);
    }

    $check = $conn->prepare(
      "SELECT name FROM categories WHERE id = ?"
    );

    $check->bind_param("i", $id);
    $check->execute();

    $category = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$category) {
      sendResponse(false, "Category not found.", null, 404);
    }

    $stmt = $conn->prepare(
      "DELETE FROM categories WHERE id = ?"
    );

    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();

    notifyCategory(
      $conn,
      $user,
      "Deleted",
      $id,
      $category["name"]
    );

    sendResponse(true, "Category deleted successfully.");
  }

  sendResponse(false, "Method not allowed.", null, 405);
} catch (mysqli_sql_exception $e) {
  error_log("Category SQL Error: " . $e->getMessage());

  if ((int)$e->getCode() === 1062) {
    sendResponse(false, "Category already exists.", null, 409);
  }

  if ((int)$e->getCode() === 1451) {
    sendResponse(
      false,
      "Cannot delete category because products are linked to it.",
      null,
      409
    );
  }

  sendResponse(false, "Database operation failed.", null, 500);
} catch (Throwable $e) {
  error_log("Category API Error: " . $e->getMessage());
  sendResponse(false, "Something went wrong.", null, 500);
}
