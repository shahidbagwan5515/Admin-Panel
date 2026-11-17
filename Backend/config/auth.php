<?php

if (session_status() === PHP_SESSION_NONE) {

  ini_set("session.use_only_cookies", "1");
  ini_set("session.use_strict_mode", "1");

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

function requireLogin()
{
  if (
    empty($_SESSION["user"]["id"]) ||
    empty($_SESSION["user"]["email"])
  ) {
    http_response_code(401);

    header("Content-Type: application/json; charset=UTF-8");

    echo json_encode([
      "success" => false,
      "message" => "Please login first."
    ]);

    exit;
  }

  return $_SESSION["user"];
}

function getLoggedInUser()
{
  return requireLogin();
}
