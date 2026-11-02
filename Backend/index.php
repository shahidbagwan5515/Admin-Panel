
<?php

header("Content-Type: application/json");

require_once "config/db.php";

echo json_encode([
  "success" => true,
  "message" => "PHP Backend Connected Successfully!",
  "database" => "ayurvedic_db"
]);

?>
