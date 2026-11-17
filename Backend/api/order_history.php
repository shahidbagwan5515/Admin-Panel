
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
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/auth.php";

function sendResponse($success, $message, $data = [], $status = 200)
{
  http_response_code($status);

  echo json_encode([
    "success" => $success,
    "message" => $message,
    "data" => $data
  ], JSON_UNESCAPED_UNICODE);

  exit;
}

try {

  if (!isset($conn) || !($conn instanceof mysqli)) {
    throw new Exception("Database connection not found.");
  }

  $conn->set_charset("utf8mb4");

  $method = $_SERVER["REQUEST_METHOD"];

  // ==================================
  // GET: FETCH ALL CUSTOMER ORDERS
  // ==================================

  if ($method === "GET") {

    $sql = "
            SELECT
                o.id,
                o.order_number,
                o.user_id,
                o.subtotal,
                o.discount,
                o.delivery_amount,
                o.gst,
                o.grand_total,
                o.payment_method,
                o.payment_status,
                o.order_status,
                o.created_at,

                COALESCE(
                    NULLIF(o.delivery_name, ''),
                    u.name,
                    'Customer'
                ) AS customer,

                u.email,
                o.delivery_phone AS phone

            FROM orders_history o

            LEFT JOIN users u
                ON u.id = o.user_id

            ORDER BY o.id DESC
        ";

    $result = $conn->query($sql);

    if (!$result) {
      throw new Exception(
        "Order query failed: " . $conn->error
      );
    }

    $orders = [];

    while ($order = $result->fetch_assoc()) {

      $orderId = (int)$order["id"];

      $productSql = "
                SELECT
                    id,
                    product_id,
                    product_name,
                    product_image,
                    price,
                    quantity,
                    total
                FROM order_items
                WHERE order_id = ?
                ORDER BY id ASC
            ";

      $productStmt = $conn->prepare($productSql);

      if (!$productStmt) {
        throw new Exception(
          "Product query failed: " . $conn->error
        );
      }

      $productStmt->bind_param("i", $orderId);

      if (!$productStmt->execute()) {
        throw new Exception(
          "Product fetch failed: " . $productStmt->error
        );
      }

      $productResult = $productStmt->get_result();

      $products = [];
      $totalItems = 0;

      while ($item = $productResult->fetch_assoc()) {

        $quantity = (int)$item["quantity"];

        $totalItems += $quantity;

        $products[] = [
          "id" => (int)$item["id"],
          "productId" => (int)$item["product_id"],
          "name" => $item["product_name"],
          "sku" => "",
          "image" => $item["product_image"] ?? "",
          "quantity" => $quantity,
          "price" => (float)$item["price"],
          "total" => (float)$item["total"]
        ];
      }

      $productStmt->close();

      $orders[] = [
        "db_id" => $orderId,
        "id" => $orderId,
        "orderNumber" => $order["order_number"],
        "user_id" => (int)$order["user_id"],

        "customer" => $order["customer"],
        "email" => $order["email"] ?? "",
        "phone" => $order["phone"] ?? "",

        "date" => $order["created_at"],

        "items" => $totalItems,
        "products" => $products,

        "subtotal" => (float)$order["subtotal"],
        "discount" => (float)$order["discount"],
        "delivery" => (float)$order["delivery_amount"],
        "gst" => (float)$order["gst"],
        "total" => (float)$order["grand_total"],

        "paymentMethod" => $order["payment_method"],
        "payment" => $order["payment_status"],
        "status" => $order["order_status"]
      ];
    }

    $result->free();

    sendResponse(
      true,
      "Orders fetched successfully.",
      $orders
    );
  }

  // ==================================
  // POST: UPDATE ORDER STATUS
  // ==================================

  if ($method === "POST") {

    $input = json_decode(
      file_get_contents("php://input"),
      true
    );

    if (!is_array($input)) {
      sendResponse(false, "Invalid JSON request.", [], 400);
    }

    $orderId = (int)($input["order_id"] ?? 0);
    $status = trim($input["status"] ?? "");

    $allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled"
    ];

    if ($orderId < 1) {
      sendResponse(false, "Valid order ID required.", [], 400);
    }

    if (!in_array($status, $allowedStatuses, true)) {
      sendResponse(false, "Invalid order status.", [], 400);
    }

    $stmt = $conn->prepare("
            UPDATE orders_history
            SET order_status = ?
            WHERE id = ?
        ");

    if (!$stmt) {
      throw new Exception(
        "Update prepare failed: " . $conn->error
      );
    }

    $stmt->bind_param("si", $status, $orderId);

    if (!$stmt->execute()) {
      throw new Exception(
        "Order update failed: " . $stmt->error
      );
    }

    $affected = $stmt->affected_rows;
    $stmt->close();

    if ($affected === 0) {

      $check = $conn->prepare(
        "SELECT id FROM orders_history WHERE id = ?"
      );

      $check->bind_param("i", $orderId);
      $check->execute();

      $exists = $check->get_result()->num_rows > 0;

      $check->close();

      if (!$exists) {
        sendResponse(false, "Order not found.", [], 404);
      }
    }

    sendResponse(
      true,
      "Order status updated successfully."
    );
  }

  // ==================================
  // DELETE: DELETE ORDER
  // ==================================

  if ($method === "DELETE") {

    $input = json_decode(
      file_get_contents("php://input"),
      true
    );

    $orderId = (int)(
      $input["order_id"] ?? $_GET["order_id"] ?? 0
    );

    if ($orderId < 1) {
      sendResponse(false, "Valid order ID required.", [], 400);
    }

    $conn->begin_transaction();

    try {

      $stmt = $conn->prepare(
        "DELETE FROM order_items WHERE order_id = ?"
      );

      if (!$stmt) {
        throw new Exception($conn->error);
      }

      $stmt->bind_param("i", $orderId);
      $stmt->execute();
      $stmt->close();

      $stmt = $conn->prepare(
        "DELETE FROM orders_history WHERE id = ?"
      );

      if (!$stmt) {
        throw new Exception($conn->error);
      }

      $stmt->bind_param("i", $orderId);
      $stmt->execute();

      if ($stmt->affected_rows === 0) {
        $stmt->close();
        throw new Exception("Order not found.");
      }

      $stmt->close();

      $conn->commit();

      sendResponse(
        true,
        "Order deleted successfully."
      );
    } catch (Throwable $e) {

      $conn->rollback();

      throw $e;
    }
  }

  sendResponse(false, "Method not allowed.", [], 405);
} catch (Throwable $e) {

  error_log(
    "Admin Order API Error: " . $e->getMessage()
  );

  sendResponse(
    false,
    "Unable to process order request.",
    [],
    500
  );
}
?>
