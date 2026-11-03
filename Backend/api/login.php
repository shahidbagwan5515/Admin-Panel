
<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// -------------------------------------
// OPTIONS REQUEST
// -------------------------------------

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

// -------------------------------------
// DATABASE CONNECTION
// -------------------------------------

require_once __DIR__ . "/../config/db.php";

// -------------------------------------
// JSON RESPONSE
// -------------------------------------

function sendResponse($success, $message, $data = null, $code = 200)
{
  http_response_code($code);

  echo json_encode([
    "success" => $success,
    "message" => $message,
    "data" => $data
  ]);

  exit;
}

// -------------------------------------
// POST METHOD CHECK
// -------------------------------------

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  sendResponse(false, "Method not allowed.", null, 405);
}

// -------------------------------------
// GET JSON INPUT
// -------------------------------------

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
  sendResponse(false, "Invalid request data.", null, 400);
}

$email = strtolower(trim($input["email"] ?? ""));
$password = $input["password"] ?? "";

if ($email === "" || $password === "") {
  sendResponse(
    false,
    "Email and password are required.",
    null,
    400
  );
}

// -------------------------------------
// LOGIN PROCESS
// -------------------------------------

try {

  // Find user by email
  $stmt = $conn->prepare(
    "SELECT id, name, email, password, role, status, permissions
         FROM users
         WHERE email = ?
         LIMIT 1"
  );

  if (!$stmt) {
    throw new Exception($conn->error);
  }

  $stmt->bind_param("s", $email);

  $stmt->execute();

  $result = $stmt->get_result();

  $user = $result->fetch_assoc();

  $stmt->close();

  // Check user exists
  if (!$user) {
    sendResponse(
      false,
      "Invalid email or password.",
      null,
      401
    );
  }

  // -------------------------------------
  // DIRECT PASSWORD COMPARISON
  // No password hashing
  // -------------------------------------

  if (!hash_equals(
    (string) $user["password"],
    (string) $password
  )) {
    sendResponse(
      false,
      "Invalid email or password.",
      null,
      401
    );
  }

  // -------------------------------------
  // CHECK USER STATUS
  // -------------------------------------

  if (strtolower(trim($user["status"])) !== "active") {
    sendResponse(
      false,
      "Your account is inactive. Contact administrator.",
      null,
      403
    );
  }

  // -------------------------------------
  // DECODE PERMISSIONS
  // -------------------------------------

  $permissions = json_decode(
    $user["permissions"] ?? "[]",
    true
  );

  if (!is_array($permissions)) {
    $permissions = [];
  }

  // Never send password to frontend
  unset($user["password"]);

  $user["permissions"] = $permissions;

  // -------------------------------------
  // LOGIN SUCCESS
  // -------------------------------------

  sendResponse(
    true,
    "Login successful.",
    $user,
    200
  );
} catch (Throwable $error) {

  error_log("Login API Error: " . $error->getMessage());

  sendResponse(
    false,
    "Something went wrong.",
    null,
    500
  );
}

?>
