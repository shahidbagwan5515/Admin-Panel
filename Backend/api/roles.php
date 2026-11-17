
<?php

require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/auth.php";
require_once __DIR__ . "/../helpers/notification_helper.php";

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

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

function notifyRole($conn, $action, $id, $name)
{
  $messages = [
    "Created" => "New role '{$name}' has been created.",
    "Updated" => "Role '{$name}' has been updated.",
    "Deleted" => "Role '{$name}' has been deleted."
  ];

  $user = getLoggedInUser();

  if (!$user || empty($user["email"])) {
    error_log("Role notification: Logged-in user not found.");
    return false;
  }

  return createNotification(
    $conn,
    "Role",
    $action,
    "Role " . $action,
    $messages[$action] ?? "Role action completed.",
    $id,
    $user["name"] ?? "Admin",
    $user["email"]
  );
}

$method = $_SERVER["REQUEST_METHOD"];

try {

  // GET ROLES
  if ($method === "GET") {

    $result = $conn->query(
      "SELECT id, name FROM roles ORDER BY id DESC"
    );

    if (!$result) {
      response(false, "Unable to fetch roles.", null, 500);
    }

    $roles = [];

    while ($row = $result->fetch_assoc()) {
      $roles[] = [
        "id" => (int)$row["id"],
        "name" => $row["name"]
      ];
    }

    response(true, "Roles fetched successfully.", $roles);
  }

  // ADD ROLE
  elseif ($method === "POST") {

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
      response(false, "Invalid request data.", null, 400);
    }

    $name = trim($input["name"] ?? "");

    if ($name === "") {
      response(false, "Role name is required.", null, 400);
    }

    $check = $conn->prepare(
      "SELECT id FROM roles WHERE LOWER(name) = LOWER(?)"
    );

    $check->bind_param("s", $name);
    $check->execute();

    if ($check->get_result()->num_rows > 0) {
      response(false, "This role already exists.", null, 409);
    }

    $stmt = $conn->prepare(
      "INSERT INTO roles (name) VALUES (?)"
    );

    $stmt->bind_param("s", $name);

    if (!$stmt->execute()) {
      response(false, "Unable to add role.", null, 500);
    }

    $id = (int)$conn->insert_id;

    notifyRole($conn, "Created", $id, $name);

    response(true, "Role added successfully.", [
      "id" => $id,
      "name" => $name
    ], 201);
  }

  // UPDATE ROLE
  elseif ($method === "PUT") {

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
      response(false, "Invalid request data.", null, 400);
    }

    $id = (int)($input["id"] ?? 0);
    $name = trim($input["name"] ?? "");

    if ($id <= 0 || $name === "") {
      response(false, "Valid role ID and name are required.", null, 400);
    }

    $check = $conn->prepare(
      "SELECT id FROM roles WHERE id = ?"
    );

    $check->bind_param("i", $id);
    $check->execute();

    if ($check->get_result()->num_rows === 0) {
      response(false, "Role not found.", null, 404);
    }

    $duplicate = $conn->prepare(
      "SELECT id FROM roles WHERE LOWER(name) = LOWER(?) AND id != ?"
    );

    $duplicate->bind_param("si", $name, $id);
    $duplicate->execute();

    if ($duplicate->get_result()->num_rows > 0) {
      response(false, "This role already exists.", null, 409);
    }

    $stmt = $conn->prepare(
      "UPDATE roles SET name = ? WHERE id = ?"
    );

    $stmt->bind_param("si", $name, $id);

    if (!$stmt->execute()) {
      response(false, "Unable to update role.", null, 500);
    }

    notifyRole($conn, "Updated", $id, $name);

    response(true, "Role updated successfully.", [
      "id" => $id,
      "name" => $name
    ]);
  }

  // DELETE ROLE
  elseif ($method === "DELETE") {

    $id = (int)($_GET["id"] ?? 0);

    if ($id <= 0) {
      response(false, "Valid role ID is required.", null, 400);
    }

    $check = $conn->prepare(
      "SELECT name FROM roles WHERE id = ?"
    );

    $check->bind_param("i", $id);
    $check->execute();

    $result = $check->get_result();

    if ($result->num_rows === 0) {
      response(false, "Role not found.", null, 404);
    }

    $role = $result->fetch_assoc();
    $name = $role["name"];

    if (strtolower($name) === "admin") {
      response(false, "Admin role cannot be deleted.", null, 403);
    }

    $stmt = $conn->prepare(
      "DELETE FROM roles WHERE id = ?"
    );

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
      response(false, "Unable to delete role.", null, 500);
    }

    notifyRole($conn, "Deleted", $id, $name);

    response(true, "Role deleted successfully.");
  } else {
    response(false, "Method not allowed.", null, 405);
  }
} catch (Throwable $error) {

  error_log("Roles API Error: " . $error->getMessage());

  response(false, "Something went wrong on the server.", null, 500);
}
