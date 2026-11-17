
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

// -------------------------------------
// RESPONSE FUNCTION
// -------------------------------------

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

// -------------------------------------
// USER NOTIFICATION FUNCTION
// -------------------------------------

function userNotification($conn, $user, $action, $title, $message, $id)
{
  try {

    if (
      !$user ||
      empty($user["email"])
    ) {
      error_log("User notification: Admin email not found.");
      return false;
    }

    return createNotification(
      $conn,
      "Users",
      $action,
      $title,
      $message,
      $id,
      $user["name"] ?? "Admin",
      $user["email"]
    );
  } catch (Throwable $e) {

    error_log("User Notification Error: " . $e->getMessage());
    return false;
  }
}

// -------------------------------------
// GET JSON INPUT
// -------------------------------------

function getInput()
{
  $raw = file_get_contents("php://input");

  $input = json_decode($raw, true);

  if (!is_array($input)) {
    sendResponse(false, "Invalid JSON request.", null, 400);
  }

  return $input;
}

// -------------------------------------
// ALLOWED PERMISSIONS
// -------------------------------------

function allowedPermissions()
{
  return [
    "Dashboard",
    "Stock",
    "Users",
    "Orders",
    "Category",
    "Roles",
    "Product",
    "Customer",
    "Payment"
  ];
}

// -------------------------------------
// VALIDATE PERMISSIONS
// -------------------------------------

function validatePermissions($permissions)
{
  if (!is_array($permissions)) {
    sendResponse(false, "Permissions must be an array.", null, 400);
  }

  $allowed = allowedPermissions();
  $cleanPermissions = [];

  foreach ($permissions as $permission) {

    if (!is_string($permission)) {
      sendResponse(false, "Invalid permission value.", null, 400);
    }

    $permission = trim($permission);

    if (!in_array($permission, $allowed, true)) {
      sendResponse(
        false,
        "Invalid permission: " . $permission,
        null,
        400
      );
    }

    if (!in_array($permission, $cleanPermissions, true)) {
      $cleanPermissions[] = $permission;
    }
  }

  return $cleanPermissions;
}

// -------------------------------------
// FORMAT USER
// -------------------------------------

function formatUser($row)
{
  $permissions = json_decode($row["permissions"] ?? "[]", true);

  if (!is_array($permissions)) {
    $permissions = [];
  }

  return [
    "id" => (int)$row["id"],
    "name" => $row["name"],
    "email" => $row["email"],
    "role" => $row["role"],
    "status" => $row["status"],
    "permissions" => $permissions
  ];
}

$method = $_SERVER["REQUEST_METHOD"];

try {

  // =====================================
  // GET USERS
  // =====================================

  if ($method === "GET") {

    $user = requireLogin();

    $sql = "
            SELECT id, name, email, role, status, permissions
            FROM users
            ORDER BY id DESC
        ";

    $result = $conn->query($sql);

    if (!$result) {
      sendResponse(false, "Unable to fetch users.", null, 500);
    }

    $users = [];

    while ($row = $result->fetch_assoc()) {
      $users[] = formatUser($row);
    }

    sendResponse(true, "Users fetched successfully.", $users);
  }

  // =====================================
  // LOGIN REQUIRED FOR WRITE OPERATIONS
  // =====================================

  $user = requireLogin();

  // =====================================
  // POST: CREATE USER
  // =====================================

  if ($method === "POST") {

    $input = getInput();

    $name = trim($input["name"] ?? "");
    $email = strtolower(trim($input["email"] ?? ""));
    $password = $input["password"] ?? "";
    $role = trim($input["role"] ?? "");
    $status = $input["status"] ?? "Active";

    $permissions = validatePermissions(
      $input["permissions"] ?? ["Dashboard"]
    );

    if (!is_string($password)) {
      sendResponse(false, "Invalid password.", null, 400);
    }

    if ($name === "" || $email === "" || $role === "" || $password === "") {
      sendResponse(
        false,
        "Name, email, password and role are required.",
        null,
        400
      );
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      sendResponse(false, "Invalid email address.", null, 400);
    }

    if (strlen($password) < 6) {
      sendResponse(
        false,
        "Password must be at least 6 characters long.",
        null,
        400
      );
    }

    if (!in_array($status, ["Active", "Inactive"], true)) {
      sendResponse(false, "Invalid status.", null, 400);
    }

    // Check duplicate email
    $check = $conn->prepare(
      "SELECT id FROM users WHERE email = ?"
    );

    $check->bind_param("s", $email);
    $check->execute();

    if ($check->get_result()->num_rows > 0) {
      $check->close();

      sendResponse(
        false,
        "This email is already registered.",
        null,
        409
      );
    }

    $check->close();

    $permissionsJson = json_encode($permissions);

    $stmt = $conn->prepare("
            INSERT INTO users
            (name, email, password, role, status, permissions)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

    if (!$stmt) {
      sendResponse(false, "Database error.", null, 500);
    }

    $stmt->bind_param(
      "ssssss",
      $name,
      $email,
      $password,
      $role,
      $status,
      $permissionsJson
    );

    if (!$stmt->execute()) {
      $stmt->close();
      sendResponse(false, "Unable to create user.", null, 500);
    }

    $userId = (int)$conn->insert_id;
    $stmt->close();

    // CREATE NOTIFICATION
    $notificationSent = userNotification(
      $conn,
      $user,
      "Created",
      "New User Added",
      "New user '{$name}' ({$email}) has been created successfully. Role: {$role}.",
      $userId
    );

    sendResponse(true, "User created successfully.", [
      "id" => $userId,
      "name" => $name,
      "email" => $email,
      "role" => $role,
      "status" => $status,
      "permissions" => $permissions,
      "notification_created" => $notificationSent
    ], 201);
  }

  // =====================================
  // PUT: UPDATE USER
  // =====================================

  elseif ($method === "PUT") {

    $input = getInput();

    $id = (int)($input["id"] ?? 0);

    if ($id <= 0) {
      sendResponse(false, "Valid user ID is required.", null, 400);
    }

    $check = $conn->prepare("
            SELECT id, name, email, role, status, permissions
            FROM users
            WHERE id = ?
        ");

    $check->bind_param("i", $id);
    $check->execute();

    $existing = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$existing) {
      sendResponse(false, "User not found.", null, 404);
    }

    $name = trim($input["name"] ?? $existing["name"]);
    $email = strtolower(trim($input["email"] ?? $existing["email"]));
    $role = trim($input["role"] ?? $existing["role"]);
    $status = $input["status"] ?? $existing["status"];

    if ($name === "" || $email === "" || $role === "") {
      sendResponse(
        false,
        "Name, email and role are required.",
        null,
        400
      );
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      sendResponse(false, "Invalid email address.", null, 400);
    }

    if (!in_array($status, ["Active", "Inactive"], true)) {
      sendResponse(false, "Invalid status.", null, 400);
    }

    // Duplicate email check
    $checkEmail = $conn->prepare("
            SELECT id FROM users
            WHERE email = ? AND id != ?
        ");

    $checkEmail->bind_param("si", $email, $id);
    $checkEmail->execute();

    if ($checkEmail->get_result()->num_rows > 0) {
      $checkEmail->close();

      sendResponse(
        false,
        "This email is already registered.",
        null,
        409
      );
    }

    $checkEmail->close();

    // Permissions
    if (array_key_exists("permissions", $input)) {
      $permissions = validatePermissions($input["permissions"]);
    } else {
      $permissions = json_decode(
        $existing["permissions"] ?? "[]",
        true
      );

      if (!is_array($permissions)) {
        $permissions = [];
      }
    }

    $permissionsJson = json_encode($permissions);

    $newPassword = $input["password"] ?? "";

    if (!is_string($newPassword)) {
      sendResponse(false, "Invalid password.", null, 400);
    }

    if ($newPassword !== "") {

      if (strlen($newPassword) < 6) {
        sendResponse(
          false,
          "New password must be at least 6 characters long.",
          null,
          400
        );
      }

      $stmt = $conn->prepare("
                UPDATE users
                SET name = ?,
                    email = ?,
                    password = ?,
                    role = ?,
                    status = ?,
                    permissions = ?
                WHERE id = ?
            ");

      $stmt->bind_param(
        "ssssssi",
        $name,
        $email,
        $newPassword,
        $role,
        $status,
        $permissionsJson,
        $id
      );
    } else {

      $stmt = $conn->prepare("
                UPDATE users
                SET name = ?,
                    email = ?,
                    role = ?,
                    status = ?,
                    permissions = ?
                WHERE id = ?
            ");

      $stmt->bind_param(
        "sssssi",
        $name,
        $email,
        $role,
        $status,
        $permissionsJson,
        $id
      );
    }

    if (!$stmt->execute()) {
      $stmt->close();
      sendResponse(false, "Unable to update user.", null, 500);
    }

    $stmt->close();

    // Detect permission-only update
    $oldPermissions = json_decode(
      $existing["permissions"] ?? "[]",
      true
    );

    if (!is_array($oldPermissions)) {
      $oldPermissions = [];
    }

    $permissionsChanged = (
      json_encode($oldPermissions) !== json_encode($permissions)
    );

    $profileChanged = (
      $existing["name"] !== $name ||
      $existing["email"] !== $email ||
      $existing["role"] !== $role ||
      $existing["status"] !== $status ||
      $newPassword !== ""
    );

    if ($permissionsChanged && !$profileChanged) {
      $action = "Permissions Updated";
      $title = "User Permissions Updated";
      $message = "Permissions for '{$name}' ({$email}) have been updated.";
    } else {
      $action = "Updated";
      $title = "User Updated";
      $message = "User '{$name}' ({$email}) has been updated successfully. Role: {$role}.";
    }

    // UPDATE NOTIFICATION
    $notificationSent = userNotification(
      $conn,
      $user,
      $action,
      $title,
      $message,
      $id
    );

    sendResponse(true, "User updated successfully.", [
      "id" => $id,
      "name" => $name,
      "email" => $email,
      "role" => $role,
      "status" => $status,
      "permissions" => $permissions,
      "notification_created" => $notificationSent
    ]);
  }

  // =====================================
  // DELETE: DELETE USER
  // =====================================

  elseif ($method === "DELETE") {

    $id = (int)($_GET["id"] ?? 0);

    if ($id <= 0) {
      sendResponse(false, "Valid user ID is required.", null, 400);
    }

    $check = $conn->prepare("
            SELECT id, name, email
            FROM users
            WHERE id = ?
        ");

    $check->bind_param("i", $id);
    $check->execute();

    $deletedUser = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$deletedUser) {
      sendResponse(false, "User not found.", null, 404);
    }

    $stmt = $conn->prepare("
            DELETE FROM users WHERE id = ?
        ");

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
      $stmt->close();
      sendResponse(false, "Unable to delete user.", null, 500);
    }

    $stmt->close();

    // DELETE NOTIFICATION
    $notificationSent = userNotification(
      $conn,
      $user,
      "Deleted",
      "User Deleted",
      "User '{$deletedUser["name"]}' ({$deletedUser["email"]}) has been deleted successfully.",
      $id
    );

    sendResponse(true, "User deleted successfully.", [
      "id" => $id,
      "notification_created" => $notificationSent
    ]);
  } else {
    sendResponse(false, "Method not allowed.", null, 405);
  }
} catch (mysqli_sql_exception $error) {

  error_log("User SQL Error: " . $error->getMessage());

  if ((int)$error->getCode() === 1062) {
    sendResponse(false, "This email is already registered.", null, 409);
  }

  sendResponse(false, "Database operation failed.", null, 500);
} catch (Throwable $error) {

  error_log("User API Error: " . $error->getMessage());

  sendResponse(false, "Server error occurred.", null, 500);
}

?>
