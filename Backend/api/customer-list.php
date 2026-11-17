
<?php

// =====================================
// CUSTOMER LIST API
// =====================================

$allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
  header("Access-Control-Allow-Origin: " . $origin);
}

header("Vary: Origin");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// =====================================
// OPTIONS REQUEST
// =====================================

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

// =====================================
// DATABASE CONNECTION
// =====================================

require_once __DIR__ . "/../config/db.php";

// =====================================
// JSON RESPONSE
// =====================================

function response($success, $message, $data = [], $status = 200)
{
  http_response_code($status);

  echo json_encode([
    "success" => $success,
    "message" => $message,
    "data" => $data
  ], JSON_UNESCAPED_UNICODE);

  exit;
}

// =====================================
// DATABASE CHECK
// =====================================

if (!isset($conn) || !($conn instanceof mysqli)) {
  response(false, "Database connection failed", [], 500);
}

// =====================================
// METHOD CHECK
// =====================================

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
  response(false, "Only GET method allowed", [], 405);
}

// =====================================
// FETCH CUSTOMERS
// =====================================

try {

  $sql = "
        SELECT
            id,
            name,
            email,
            phone,
            created_at
        FROM signup
        ORDER BY id DESC
    ";

  $result = $conn->query($sql);

  if (!$result) {
    throw new Exception($conn->error);
  }

  $customers = [];

  while ($row = $result->fetch_assoc()) {

    $customers[] = [
      "id" => (int)$row["id"],
      "name" => $row["name"] ?? "Unknown",
      "email" => $row["email"] ?? "N/A",
      "phone" => $row["phone"] ?? "N/A",
      "created_at" => $row["created_at"] ?? "",
      "status" => "Active",
      "orders" => 0,
      "spent" => 0
    ];
  }

  response(
    true,
    "Customers fetched successfully",
    $customers
  );
} catch (Throwable $e) {

  error_log("Customer API Error: " . $e->getMessage());

  response(
    false,
    "Unable to fetch customers",
    [],
    500
  );
}

?>
