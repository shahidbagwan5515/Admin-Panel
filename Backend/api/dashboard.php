
<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

date_default_timezone_set("Asia/Kolkata");

try {

  // DATABASE CONNECTION
  require_once __DIR__ . "/../config/db.php";

  if (!isset($conn) || !($conn instanceof mysqli)) {
    throw new Exception("Valid MySQLi database connection not found.");
  }

  // PERIOD FILTER
  $period = $_GET["period"] ?? "week";

  if ($period === "month") {
    $startDate = date("Y-m-01");
    $endDate = date("Y-m-t");
  } else {
    $startDate = date("Y-m-d", strtotime("monday this week"));
    $endDate = date("Y-m-d");
  }

  // HELPER FUNCTION FOR SINGLE VALUE
  function getCount($conn, $sql)
  {
    $result = $conn->query($sql);

    if (!$result) {
      throw new Exception($conn->error);
    }

    $row = $result->fetch_row();

    return $row ? $row[0] : 0;
  }

  // 1. TOTAL REVENUE
  $totalRevenue = (float) getCount(
    $conn,
    "SELECT COALESCE(SUM(grand_total), 0)
         FROM orders
         WHERE payment_status = 'Paid'
         AND order_status != 'Cancelled'"
  );

  // 2. TOTAL ORDERS
  $totalOrders = (int) getCount(
    $conn,
    "SELECT COUNT(*) FROM orders"
  );

  // 3. TOTAL CUSTOMERS
  $totalCustomers = (int) getCount(
    $conn,
    "SELECT COUNT(*) FROM signup"
  );

  // 4. PENDING ORDERS
  $pendingOrders = (int) getCount(
    $conn,
    "SELECT COUNT(*)
         FROM orders
         WHERE order_status = 'Pending'"
  );

  // 5. SALES OVERVIEW
  $salesQuery = $conn->prepare("
        SELECT
            DATE(created_at) AS sale_date,
            SUM(grand_total) AS total_sales
        FROM orders
        WHERE payment_status = 'Paid'
        AND order_status != 'Cancelled'
        AND DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY sale_date ASC
    ");

  if (!$salesQuery) {
    throw new Exception($conn->error);
  }

  $salesQuery->bind_param("ss", $startDate, $endDate);
  $salesQuery->execute();

  $salesResult = $salesQuery->get_result();

  $sales = [];

  while ($row = $salesResult->fetch_assoc()) {
    $sales[] = [
      "day" => date("D", strtotime($row["sale_date"])),
      "date" => $row["sale_date"],
      "value" => (float) $row["total_sales"]
    ];
  }

  $salesQuery->close();

  // 6. ORDER SUMMARY
  $summary = [
    "delivered" => 0,
    "processing" => 0,
    "shipped" => 0,
    "pending" => 0,
    "cancelled" => 0,
    "total" => 0
  ];

  $summaryQuery = $conn->query("
        SELECT order_status, COUNT(*) AS total
        FROM orders
        GROUP BY order_status
    ");

  if (!$summaryQuery) {
    throw new Exception($conn->error);
  }

  while ($row = $summaryQuery->fetch_assoc()) {

    $status = strtolower(trim($row["order_status"] ?? ""));
    $count = (int) $row["total"];

    if (array_key_exists($status, $summary)) {
      $summary[$status] = $count;
    }

    $summary["total"] += $count;
  }

  // 7. RECENT ORDERS
  $recentQuery = $conn->query("
        SELECT
            o.id,
            o.order_number,
            o.delivery_name,
            o.grand_total,
            o.order_status,
            o.created_at,

            GROUP_CONCAT(
                DISTINCT oi.product_name
                ORDER BY oi.id
                SEPARATOR ', '
            ) AS product_names

        FROM orders o

        LEFT JOIN order_items oi
            ON o.id = oi.order_id

        GROUP BY
            o.id,
            o.order_number,
            o.delivery_name,
            o.grand_total,
            o.order_status,
            o.created_at

        ORDER BY o.created_at DESC

        LIMIT 5
    ");

  if (!$recentQuery) {
    throw new Exception($conn->error);
  }

  $recentOrders = [];

  while ($row = $recentQuery->fetch_assoc()) {

    $recentOrders[] = [
      "id" => $row["order_number"],
      "customer" => $row["delivery_name"],
      "product" => $row["product_names"] ?: "No Product",
      "date" => date("d M Y", strtotime($row["created_at"])),
      "amount" => (float) $row["grand_total"],
      "status" => $row["order_status"]
    ];
  }

  // FINAL JSON RESPONSE
  echo json_encode([
    "success" => true,

    "stats" => [
      "totalRevenue" => $totalRevenue,
      "totalOrders" => $totalOrders,
      "totalCustomers" => $totalCustomers,
      "pendingOrders" => $pendingOrders
    ],

    "sales" => $sales,

    "orderSummary" => $summary,

    "recentOrders" => $recentOrders

  ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {

  http_response_code(500);

  echo json_encode([
    "success" => false,
    "message" => "Dashboard API Error",
    "error" => $e->getMessage(),
    "file" => basename($e->getFile()),
    "line" => $e->getLine()
  ], JSON_UNESCAPED_UNICODE);

  exit;
}
