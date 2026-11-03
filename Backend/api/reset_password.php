<?php
require_once __DIR__ . "/config/db.php";

$email = "test@gmail.com";
$password = "test123";

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare(
  "UPDATE users SET password = ? WHERE email = ?"
);

$stmt->bind_param("ss", $hash, $email);

if ($stmt->execute()) {
  echo "Password update successful!";
} else {
  echo "Error: " . $stmt->error;
}

$stmt->close();
$conn->close();
