
<?php

// =============================================
// DASHBOARD API
// =============================================

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

  // =========================================
  // DATABASE CONNECTION
  // =========================================

  require_once __DIR__ . "/../config/db.php";

  if (!isset($conn) || !($conn instanceof mysqli)) {
    throw new Exception("Valid MySQLi database connection not found.");
  }

  $conn->set_charset("utf8mb4");


  // =========================================
  // PERIOD FILTER
  // =========================================

  $period = $_GET["period"] ?? "week";

  if ($period === "month") {
    $startDate = date("Y-m-01");
    $endDate = date("Y-m-t");
  } else {
    $startDate = date("Y-m-d", strtotime("monday this week"));
    $endDate = date("Y-m-d");
  }


  // =========================================
  // HELPER FUNCTION
  // =========================================

  function getCount($conn, $sql)
  {
    $result = $conn->query($sql);

    if (!$result) {
      throw new Exception(
        "Dashboard query failed: " . $conn->error
      );
    }

    $row = $result->fetch_row();

    $result->free();

    return $row ? $row[0] : 0;
  }


  // =========================================
  // 1. TOTAL REVENUE
  // =========================================

  $totalRevenue = (float) getCount(
    $conn,
    "
        SELECT COALESCE(SUM(grand_total), 0)
        FROM orders_history
        WHERE LOWER(TRIM(payment_status)) = 'paid'
        AND LOWER(TRIM(order_status)) != 'cancelled'
        "
  );


  // =========================================
  // 2. TOTAL ORDERS
  // =========================================

  $totalOrders = (int) getCount(
    $conn,
    "
        SELECT COUNT(*)
        FROM orders_history
        "
  );


  // =========================================
  // 3. TOTAL CUSTOMERS
  // SAME TABLE AS CUSTOMER PAGE API
  // =========================================

  $totalCustomers = (int) getCount(
    $conn,
    "
        SELECT COUNT(*)
        FROM signup
        "
  );


  // =========================================
  // 4. PENDING ORDERS
  // =========================================

  $pendingOrders = (int) getCount(
    $conn,
    "
        SELECT COUNT(*)
        FROM orders_history
        WHERE LOWER(TRIM(order_status)) = 'pending'
        "
  );


  // =========================================
  // 5. SALES OVERVIEW
  // =========================================

  $salesQuery = $conn->prepare("
        SELECT
            DATE(created_at) AS sale_date,
            COALESCE(SUM(grand_total), 0) AS total_sales
        FROM orders_history
        WHERE LOWER(TRIM(payment_status)) = 'paid'
        AND LOWER(TRIM(order_status)) != 'cancelled'
        AND DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY sale_date ASC
    ");

  if (!$salesQuery) {
    throw new Exception(
      "Sales query prepare failed: " . $conn->error
    );
  }

  $salesQuery->bind_param(
    "ss",
    $startDate,
    $endDate
  );

  if (!$salesQuery->execute()) {
    throw new Exception(
      "Sales query failed: " . $salesQuery->error
    );
  }

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


  // =========================================
  // 6. ORDER SUMMARY
  // =========================================

  $summary = [
    "delivered" => 0,
    "processing" => 0,
    "shipped" => 0,
    "pending" => 0,
    "cancelled" => 0,
    "total" => 0
  ];

  $summaryQuery = $conn->query("
        SELECT
            LOWER(TRIM(order_status)) AS status,
            COUNT(*) AS total
        FROM orders_history
        GROUP BY LOWER(TRIM(order_status))
    ");

  if (!$summaryQuery) {
    throw new Exception(
      "Order summary query failed: " . $conn->error
    );
  }

  while ($row = $summaryQuery->fetch_assoc()) {

    $status = $row["status"];
    $count = (int) $row["total"];

    if (array_key_exists($status, $summary)) {
      $summary[$status] = $count;
    }

    $summary["total"] += $count;
  }

  $summaryQuery->free();


  // =========================================
  // 7. RECENT ORDERS
  // =========================================

  $recentQuery = $conn->query("
        SELECT
            o.id,
            o.order_number,

            COALESCE(
                NULLIF(o.delivery_name, ''),
                u.name,
                'Customer'
            ) AS customer,

            o.grand_total,
            o.order_status,
            o.created_at,

            GROUP_CONCAT(
                DISTINCT oi.product_name
                ORDER BY oi.id
                SEPARATOR ', '
            ) AS product_names

        FROM orders_history o

        LEFT JOIN users u
            ON u.id = o.user_id

        LEFT JOIN order_items oi
            ON oi.order_id = o.id

        GROUP BY
            o.id,
            o.order_number,
            o.delivery_name,
            u.name,
            o.grand_total,
            o.order_status,
            o.created_at

        ORDER BY o.id DESC

        LIMIT 5
    ");

  if (!$recentQuery) {
    throw new Exception(
      "Recent orders query failed: " . $conn->error
    );
  }

  $recentOrders = [];

  while ($row = $recentQuery->fetch_assoc()) {

    $recentOrders[] = [

      "id" => $row["order_number"]
        ?: ("ORD-" . $row["id"]),

      "customer" => $row["customer"],

      "product" => $row["product_names"]
        ?: "No Product",

      "date" => $row["created_at"]
        ? date("d M Y", strtotime($row["created_at"]))
        : "-",

      "amount" => (float) $row["grand_total"],

      "status" => $row["order_status"]
        ?: "Pending"

    ];
  }

  $recentQuery->free();


  // =========================================
  // FINAL JSON RESPONSE
  // =========================================

  echo json_encode([

    "success" => true,

    "message" => "Dashboard data fetched successfully.",

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

  error_log(
    "Dashboard API Error: " . $e->getMessage()
  );

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

?>
