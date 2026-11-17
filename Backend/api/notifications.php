<?php

header("Content-Type: application/json; charset=UTF-8");

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
  header("Access-Control-Allow-Credentials: true");
}

header("Vary: Origin");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

// =====================================
// DATABASE & AUTH
// =====================================

require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/auth.php";

$user = requireLogin();

$email = strtolower(trim($user["email"] ?? ""));
$role = strtolower(trim($user["role"] ?? ""));

// Only Admin gets access to all users' notifications
$isAdmin = ($role === "admin");

if ($email === "") {
  http_response_code(401);
  echo json_encode([
    "success" => false,
    "message" => "User email not found."
  ]);
  exit;
}

// =====================================
// RESPONSE FUNCTION
// =====================================

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

// =====================================
// INPUT FUNCTION
// =====================================

function getInput()
{
  $raw = file_get_contents("php://input");

  if (trim($raw) === "") {
    return [];
  }

  $input = json_decode($raw, true);

  if (!is_array($input)) {
    sendResponse(false, "Invalid JSON data.", null, 400);
  }

  return $input;
}

// =====================================
// CURRENT REQUEST METHOD
// =====================================

$method = $_SERVER["REQUEST_METHOD"];

try {

  // =====================================
  // GET: FETCH NOTIFICATIONS
  // ADMIN = ALL USERS
  // OTHER ROLES = OWN NOTIFICATIONS
  // =====================================

  if ($method === "GET") {

    $search = trim($_GET["search"] ?? "");
    $filter = trim($_GET["filter"] ?? "");
    $module = trim($_GET["module"] ?? "");

    $sql = "
            SELECT
                id,
                title,
                message,
                type,
                reference_id,
                actor_name,
                recipient_email,
                module,
                action,
                is_read,
                created_at
            FROM notifications
            WHERE 1=1
        ";

    $params = [];
    $types = "";

    // Restrict non-admin users
    if (!$isAdmin) {
      $sql .= " AND recipient_email = ? ";
      $params[] = $email;
      $types .= "s";
    }

    // Search
    if ($search !== "") {

      $sql .= "
                AND (
                    title LIKE ?
                    OR message LIKE ?
                    OR actor_name LIKE ?
                    OR recipient_email LIKE ?
                )
            ";

      $keyword = "%" . $search . "%";

      $params[] = $keyword;
      $params[] = $keyword;
      $params[] = $keyword;
      $params[] = $keyword;

      $types .= "ssss";
    }

    // Module filter
    if ($module !== "") {
      $sql .= " AND module = ? ";

      $params[] = $module;
      $types .= "s";
    }

    // Read / Unread filter
    if ($filter === "Unread") {
      $sql .= " AND is_read = 0 ";
    } elseif ($filter === "Read") {
      $sql .= " AND is_read = 1 ";
    }

    $sql .= " ORDER BY created_at DESC, id DESC";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
      sendResponse(false, "Unable to prepare notifications query.", null, 500);
    }

    if (!empty($params)) {
      $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();

    $result = $stmt->get_result();

    $notifications = [];

    while ($row = $result->fetch_assoc()) {

      $row["id"] = (int)$row["id"];
      $row["is_read"] = (int)$row["is_read"];
      $row["read"] = (bool)$row["is_read"];

      $notifications[] = $row;
    }

    $stmt->close();

    // =====================================
    // UNREAD COUNT
    // =====================================

    $countSql = "
            SELECT COUNT(*) AS total
            FROM notifications
            WHERE is_read = 0
        ";

    $countParams = [];
    $countTypes = "";

    if (!$isAdmin) {
      $countSql .= " AND recipient_email = ? ";

      $countParams[] = $email;
      $countTypes .= "s";
    }

    $countStmt = $conn->prepare($countSql);

    if (!$countStmt) {
      sendResponse(false, "Unable to fetch unread count.", null, 500);
    }

    if (!empty($countParams)) {
      $countStmt->bind_param($countTypes, ...$countParams);
    }

    $countStmt->execute();

    $countRow = $countStmt->get_result()->fetch_assoc();

    $unreadCount = (int)($countRow["total"] ?? 0);

    $countStmt->close();

    sendResponse(
      true,
      "Notifications fetched successfully.",
      [
        "notifications" => $notifications,
        "unread_count" => $unreadCount,
        "total" => count($notifications)
      ]
    );
  }

  // =====================================
  // POST: CREATE NOTIFICATION
  // =====================================

  if ($method === "POST") {

    $input = getInput();

    $title = trim($input["title"] ?? "");
    $message = trim($input["message"] ?? "");

    $type = strtolower(trim($input["type"] ?? "system"));

    $module = trim($input["module"] ?? "Dashboard");

    $action = trim($input["action"] ?? "Updated");

    $referenceId = isset($input["reference_id"])
      ? (string)$input["reference_id"]
      : null;

    $actorName = $user["name"] ?? "Admin";

    $allowedTypes = [
      "order",
      "customer",
      "stock",
      "payment",
      "offer",
      "system"
    ];

    if ($title === "" || $message === "") {
      sendResponse(
        false,
        "Title and message are required.",
        null,
        400
      );
    }

    if (!in_array($type, $allowedTypes, true)) {
      sendResponse(
        false,
        "Invalid notification type.",
        null,
        400
      );
    }

    // Admin can specify another recipient.
    // Other roles can only send to themselves.
    $recipientEmail = $email;

    if ($isAdmin && !empty($input["recipient_email"])) {

      $recipientEmail = strtolower(
        trim($input["recipient_email"])
      );

      if (!filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
        sendResponse(
          false,
          "Invalid recipient email.",
          null,
          400
        );
      }
    }

    $stmt = $conn->prepare("
            INSERT INTO notifications (
                title,
                message,
                type,
                reference_id,
                actor_name,
                recipient_email,
                module,
                action,
                is_read,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
        ");

    if (!$stmt) {
      sendResponse(false, "Unable to create notification.", null, 500);
    }

    $stmt->bind_param(
      "ssssssss",
      $title,
      $message,
      $type,
      $referenceId,
      $actorName,
      $recipientEmail,
      $module,
      $action
    );

    if (!$stmt->execute()) {

      error_log("Notification insert error: " . $stmt->error);

      $stmt->close();

      sendResponse(
        false,
        "Notification creation failed.",
        null,
        500
      );
    }

    $id = (int)$conn->insert_id;

    $stmt->close();

    sendResponse(
      true,
      "Notification created successfully.",
      [
        "id" => $id,
        "recipient_email" => $recipientEmail
      ],
      201
    );
  }

  // =====================================
  // PUT: MARK NOTIFICATIONS AS READ
  // =====================================

  if ($method === "PUT") {

    $input = getInput();

    $action = trim($input["action"] ?? "");

    // MARK ALL AS READ
    if ($action === "mark_all_read") {

      $sql = "
                UPDATE notifications
                SET is_read = 1
                WHERE is_read = 0
            ";

      if (!$isAdmin) {
        $sql .= " AND recipient_email = ? ";
      }

      $stmt = $conn->prepare($sql);

      if (!$stmt) {
        sendResponse(false, "Unable to update notifications.", null, 500);
      }

      if (!$isAdmin) {
        $stmt->bind_param("s", $email);
      }

      $stmt->execute();

      $updated = $stmt->affected_rows;

      $stmt->close();

      sendResponse(
        true,
        "Notifications marked as read.",
        ["updated" => $updated]
      );
    }

    // MARK SINGLE NOTIFICATION AS READ
    if ($action === "mark_read") {

      $id = (int)($input["id"] ?? 0);

      if ($id <= 0) {
        sendResponse(
          false,
          "Valid notification ID required.",
          null,
          400
        );
      }

      $sql = "
                UPDATE notifications
                SET is_read = 1
                WHERE id = ?
            ";

      if (!$isAdmin) {
        $sql .= " AND recipient_email = ? ";
      }

      $stmt = $conn->prepare($sql);

      if (!$stmt) {
        sendResponse(false, "Unable to update notification.", null, 500);
      }

      if ($isAdmin) {
        $stmt->bind_param("i", $id);
      } else {
        $stmt->bind_param("is", $id, $email);
      }

      $stmt->execute();

      $stmt->close();

      // Check notification existence and ownership
      $checkSql = "
                SELECT id
                FROM notifications
                WHERE id = ?
            ";

      if (!$isAdmin) {
        $checkSql .= " AND recipient_email = ? ";
      }

      $check = $conn->prepare($checkSql);

      if (!$check) {
        sendResponse(false, "Unable to verify notification.", null, 500);
      }

      if ($isAdmin) {
        $check->bind_param("i", $id);
      } else {
        $check->bind_param("is", $id, $email);
      }

      $check->execute();

      $exists = $check->get_result()->fetch_assoc();

      $check->close();

      if (!$exists) {
        sendResponse(
          false,
          "Notification not found.",
          null,
          404
        );
      }

      sendResponse(
        true,
        "Notification marked as read.",
        [
          "id" => $id,
          "is_read" => 1
        ]
      );
    }

    sendResponse(false, "Invalid update action.", null, 400);
  }

  // =====================================
  // DELETE: DELETE NOTIFICATIONS
  // =====================================

  if ($method === "DELETE") {

    // DELETE ALL NOTIFICATIONS
    if (($_GET["all"] ?? "") === "1") {

      $sql = "DELETE FROM notifications";

      if (!$isAdmin) {
        $sql .= " WHERE recipient_email = ? ";
      }

      $stmt = $conn->prepare($sql);

      if (!$stmt) {
        sendResponse(false, "Unable to delete notifications.", null, 500);
      }

      if (!$isAdmin) {
        $stmt->bind_param("s", $email);
      }

      $stmt->execute();

      $deleted = $stmt->affected_rows;

      $stmt->close();

      sendResponse(
        true,
        "Notifications deleted successfully.",
        ["deleted" => $deleted]
      );
    }

    // DELETE SINGLE NOTIFICATION
    $id = (int)($_GET["id"] ?? 0);

    if ($id <= 0) {
      sendResponse(
        false,
        "Valid notification ID required.",
        null,
        400
      );
    }

    $sql = "
            DELETE FROM notifications
            WHERE id = ?
        ";

    if (!$isAdmin) {
      $sql .= " AND recipient_email = ? ";
    }

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
      sendResponse(false, "Unable to delete notification.", null, 500);
    }

    if ($isAdmin) {
      $stmt->bind_param("i", $id);
    } else {
      $stmt->bind_param("is", $id, $email);
    }

    $stmt->execute();

    $deleted = $stmt->affected_rows;

    $stmt->close();

    if ($deleted === 0) {
      sendResponse(
        false,
        "Notification not found.",
        null,
        404
      );
    }

    sendResponse(
      true,
      "Notification deleted successfully.",
      ["id" => $id]
    );
  }

  // =====================================
  // INVALID METHOD
  // =====================================

  sendResponse(
    false,
    "Method not allowed.",
    null,
    405
  );
} catch (Throwable $e) {

  error_log(
    "Notification API Error: " . $e->getMessage()
  );

  sendResponse(
    false,
    "Something went wrong.",
    null,
    500
  );
}
