
<?php

// =====================================
// CORS
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

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/../config/db.php";

// =====================================
// RESPONSE
// =====================================

function response($success, $message, $data = [], $status = 200)
{
    http_response_code($status);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

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
// FETCH PAYMENT RECORDS
// =====================================

try {

    $sql = "
        SELECT
            id,
            order_number,
            user_id,
            grand_total,
            payment_method,
            payment_status,
            order_status
        FROM orders_history
        ORDER BY id DESC
    ";

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception($conn->error);
    }

    $payments = [];

    while ($row = $result->fetch_assoc()) {

        $payments[] = [
            "id" => $row["id"],
            "payment_id" => "PAY-" . $row["id"],
            "customer_name" => "Customer #" . $row["user_id"],
            "email" => "N/A",
            "order_id" => $row["order_number"],
            "payment_date" => "",
            "payment_method" => $row["payment_method"],
            "amount" => (float)$row["grand_total"],
            "status" => $row["payment_status"],
            "order_status" => $row["order_status"]
        ];
    }

    response(
        true,
        "Payment records fetched successfully",
        $payments
    );
} catch (Throwable $e) {

    error_log("Payment List API Error: " . $e->getMessage());

    response(
        false,
        "Unable to fetch payment records",
        [],
        500
    );
}

?>
