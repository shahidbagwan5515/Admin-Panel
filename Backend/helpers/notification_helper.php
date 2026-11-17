
<?php

function createNotification(
  $conn,
  $module,
  $action,
  $title,
  $message,
  $referenceId = null,
  $actorName = "Admin",
  $recipientEmail = null
) {
  try {

    $recipientEmail = strtolower(
      trim($recipientEmail ?? "")
    );

    if ($recipientEmail === "") {
      error_log("Notification recipient email missing.");
      return false;
    }

    $referenceId = $referenceId !== null
      ? (string)$referenceId
      : null;

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
            VALUES (?, ?, 'system', ?, ?, ?, ?, ?, 0, NOW())
        ");

    if (!$stmt) {
      error_log(
        "Notification prepare error: " . $conn->error
      );
      return false;
    }

    $stmt->bind_param(
      "sssssss",
      $title,
      $message,
      $referenceId,
      $actorName,
      $recipientEmail,
      $module,
      $action
    );

    $success = $stmt->execute();

    if (!$success) {
      error_log(
        "Notification insert error: " . $stmt->error
      );
    }

    $stmt->close();

    return $success;
  } catch (Throwable $e) {

    error_log(
      "Notification Error: " . $e->getMessage()
    );

    return false;
  }
}
