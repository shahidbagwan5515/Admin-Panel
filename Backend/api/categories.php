
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

$input = json_decode(file_get_contents("php://input"), true) ?? [];

try {

  // GET ALL CATEGORIES
  if ($method === "GET") {

    if (isset($_GET["id"])) {

      $id = (int) $_GET["id"];

      $stmt = $conn->prepare(
        "SELECT * FROM categories WHERE id = ?"
      );

      $stmt->bind_param("i", $id);
      $stmt->execute();

      $category = $stmt->get_result()->fetch_assoc();

      if (!$category) {
        sendResponse(false, "Category not found", null, 404);
      }

      sendResponse(true, "Category fetched successfully", $category);
    }

    $result = $conn->query(
      "SELECT * FROM categories ORDER BY id DESC"
    );

    $categories = [];

    while ($row = $result->fetch_assoc()) {
      $categories[] = $row;
    }

    sendResponse(true, "Categories fetched successfully", $categories);
  }

  // ADD CATEGORY
  if ($method === "POST") {

    $name = trim($input["name"] ?? "");
    $description = trim($input["description"] ?? "");

    if ($name === "") {
      sendResponse(false, "Category name is required", null, 400);
    }

    $stmt = $conn->prepare(
      "INSERT INTO categories (name, description)
             VALUES (?, ?)"
    );

    $stmt->bind_param("ss", $name, $description);
    $stmt->execute();

    sendResponse(true, "Category added successfully", [
      "id" => $conn->insert_id
    ], 201);
  }

  // UPDATE CATEGORY
  if ($method === "PUT") {

    $id = (int) ($input["id"] ?? 0);
    $name = trim($input["name"] ?? "");
    $description = trim($input["description"] ?? "");

    if ($id <= 0 || $name === "") {
      sendResponse(false, "Valid ID and category name required", null, 400);
    }

    $stmt = $conn->prepare(
      "UPDATE categories
             SET name = ?, description = ?
             WHERE id = ?"
    );

    $stmt->bind_param("ssi", $name, $description, $id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {

      $check = $conn->prepare(
        "SELECT id FROM categories WHERE id = ?"
      );

      $check->bind_param("i", $id);
      $check->execute();

      if (!$check->get_result()->fetch_assoc()) {
        sendResponse(false, "Category not found", null, 404);
      }
    }

    sendResponse(true, "Category updated successfully");
  }

  // DELETE CATEGORY
  if ($method === "DELETE") {

    $id = (int) ($input["id"] ?? $_GET["id"] ?? 0);

    if ($id <= 0) {
      sendResponse(false, "Valid category ID required", null, 400);
    }

    $stmt = $conn->prepare(
      "DELETE FROM categories WHERE id = ?"
    );

    $stmt->bind_param("i", $id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
      sendResponse(false, "Category not found", null, 404);
    }

    sendResponse(true, "Category deleted successfully");
  }

  sendResponse(false, "Method not allowed", null, 405);
} catch (mysqli_sql_exception $e) {

  if ($e->getCode() === 1062) {
    sendResponse(false, "Category already exists", null, 409);
  }

  if ($e->getCode() === 1451) {
    sendResponse(false, "Cannot delete category because products are linked to it", null, 409);
  }

  sendResponse(false, "Database operation failed", null, 500);
}

$conn->close();

?>
