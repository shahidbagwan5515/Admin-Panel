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
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if (session_status() === PHP_SESSION_NONE) {
  session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "domain" => "",
    "secure" => false,
    "httponly" => true,
    "samesite" => "Lax"
  ]);

  session_start();
}

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

require_once __DIR__ . "/../config/db.php";

function loginResponse($success, $message, $data = null, $status = 200)
{
  http_response_code($status);

  echo json_encode([
    "success" => $success,
    "message" => $message,
    "data" => $data
  ]);

  exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  loginResponse(false, "Method not allowed.", null, 405);
}

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
  loginResponse(false, "Invalid request data.", null, 400);
}

$email = strtolower(trim($input["email"] ?? ""));
$password = $input["password"] ?? "";

if ($email === "" || $password === "") {
  loginResponse(false, "Email and password are required.", null, 400);
}

try {
  $stmt = $conn->prepare("
        SELECT id, name, email, password, role, status, permissions
        FROM users
        WHERE email = ?
        LIMIT 1
    ");

  $stmt->bind_param("s", $email);
  $stmt->execute();

  $user = $stmt->get_result()->fetch_assoc();
  $stmt->close();

  if (!$user) {
    loginResponse(false, "Invalid email or password.", null, 401);
  }

  // Supports password_hash() passwords and legacy plain-text passwords.
  $storedPassword = (string)$user["password"];

  $passwordValid = password_verify($password, $storedPassword);

  if (!$passwordValid && !password_get_info($storedPassword)["algo"]) {
    $passwordValid = hash_equals($storedPassword, (string)$password);
  }

  if (!$passwordValid) {
    loginResponse(false, "Invalid email or password.", null, 401);
  }

  if (strtolower(trim($user["status"] ?? "")) !== "active") {
    loginResponse(false, "Your account is inactive.", null, 403);
  }

  $permissions = json_decode($user["permissions"] ?? "[]", true);

  if (!is_array($permissions)) {
    $permissions = [];
  }

  session_regenerate_id(true);

  $_SESSION["user"] = [
    "id" => (int)$user["id"],
    "name" => $user["name"],
    "email" => strtolower(trim($user["email"])),
    "role" => $user["role"]
  ];

  $_SESSION["logged_in"] = true;

  unset($user["password"]);

  $user["permissions"] = $permissions;

  loginResponse(true, "Login successful.", $user);
} catch (Throwable $e) {
  error_log("Login API Error: " . $e->getMessage());

  loginResponse(false, "Something went wrong.", null, 500);
}
