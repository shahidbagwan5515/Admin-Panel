
<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . "/../config/db.php";

// JSON response
function response($success, $message = "", $data = null, $statusCode = 200)
{
  http_response_code($statusCode);

  echo json_encode([
    "success" => $success,
    "message" => $message,
    "data" => $data
  ]);

  exit;
}

// Handle preflight request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

$method = $_SERVER["REQUEST_METHOD"];

try {

  // GET: Fetch all roles
  if ($method === "GET") {

    $sql = "SELECT id, name FROM roles ORDER BY id DESC";
    $result = $conn->query($sql);

    if (!$result) {
      response(false, "Unable to fetch roles.", null, 500);
    }

    $roles = [];

    while ($row = $result->fetch_assoc()) {
      $roles[] = [
        "id" => (int) $row["id"],
        "name" => $row["name"]
      ];
    }

    response(true, "Roles fetched successfully.", $roles);
  }


  // POST: Add new role
  elseif ($method === "POST") {

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
      response(false, "Invalid request data.", null, 400);
    }

    $name = trim($input["name"] ?? "");

    if ($name === "") {
      response(false, "Role name is required.", null, 400);
    }

    // Check duplicate role
    $check = $conn->prepare(
      "SELECT id FROM roles WHERE LOWER(name) = LOWER(?)"
    );

    $check->bind_param("s", $name);
    $check->execute();
    $duplicate = $check->get_result();

    if ($duplicate->num_rows > 0) {
      response(false, "This role already exists.", null, 409);
    }

    // Insert role
    $stmt = $conn->prepare(
      "INSERT INTO roles (name) VALUES (?)"
    );

    $stmt->bind_param("s", $name);

    if (!$stmt->execute()) {
      response(false, "Unable to add role.", null, 500);
    }

    response(true, "Role added successfully.", [
      "id" => $conn->insert_id,
      "name" => $name
    ], 201);
  }


  // PUT: Update role
  elseif ($method === "PUT") {

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
      response(false, "Invalid request data.", null, 400);
    }

    $id = (int) ($input["id"] ?? 0);
    $name = trim($input["name"] ?? "");

    if ($id <= 0) {
      response(false, "Valid role ID is required.", null, 400);
    }

    if ($name === "") {
      response(false, "Role name is required.", null, 400);
    }

    // Check role exists
    $checkRole = $conn->prepare(
      "SELECT id FROM roles WHERE id = ?"
    );

    $checkRole->bind_param("i", $id);
    $checkRole->execute();

    if ($checkRole->get_result()->num_rows === 0) {
      response(false, "Role not found.", null, 404);
    }

    // Check duplicate name excluding current role
    $checkDuplicate = $conn->prepare(
      "SELECT id FROM roles
             WHERE LOWER(name) = LOWER(?) AND id != ?"
    );

    $checkDuplicate->bind_param("si", $name, $id);
    $checkDuplicate->execute();

    if ($checkDuplicate->get_result()->num_rows > 0) {
      response(false, "This role already exists.", null, 409);
    }

    // Update role
    $stmt = $conn->prepare(
      "UPDATE roles SET name = ? WHERE id = ?"
    );

    $stmt->bind_param("si", $name, $id);

    if (!$stmt->execute()) {
      response(false, "Unable to update role.", null, 500);
    }

    response(true, "Role updated successfully.", [
      "id" => $id,
      "name" => $name
    ]);
  }


  // DELETE: Delete role
  elseif ($method === "DELETE") {

    $id = (int) ($_GET["id"] ?? 0);

    if ($id <= 0) {
      response(false, "Valid role ID is required.", null, 400);
    }

    // Check role exists
    $checkRole = $conn->prepare(
      "SELECT name FROM roles WHERE id = ?"
    );

    $checkRole->bind_param("i", $id);
    $checkRole->execute();

    $result = $checkRole->get_result();

    if ($result->num_rows === 0) {
      response(false, "Role not found.", null, 404);
    }

    $role = $result->fetch_assoc();

    // Protect admin role
    if (strtolower($role["name"]) === "admin") {
      response(false, "Admin role cannot be deleted.", null, 403);
    }

    // Delete role
    $stmt = $conn->prepare(
      "DELETE FROM roles WHERE id = ?"
    );

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
      response(false, "Unable to delete role.", null, 500);
    }

    response(true, "Role deleted successfully.");
  }


  // Unsupported method
  else {
    response(false, "Method not allowed.", null, 405);
  }
} catch (Throwable $error) {

  error_log("Roles API Error: " . $error->getMessage());

  response(false, "Something went wrong on the server.", null, 500);
}

?>
