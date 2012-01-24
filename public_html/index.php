<?php
/*!
 * @file
 * index.php
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @created 2011-05-26
 */

require "../header.php";

if ( !($core = Core::initialize()) ) {
  die("Failed to initialize OS.js Core");
}

if ( !ENABLE_CACHE ) {
  header("Expires: Fri, 01 Jan 2010 05:00:00 GMT");
  header("Cache-Control: maxage=1");
  header("Cache-Control: no-cache");
  header("Pragma: no-cache");
}

///////////////////////////////////////////////////////////////////////////////
// STYLESHEET LOADING
///////////////////////////////////////////////////////////////////////////////

if ( isset($_GET['font']) && !empty($_GET['font']) ) {
  header("Content-Type: text/css; charset=utf-8");
  print Core::getFont($_GET['font'], ENV_PRODUCTION);
  exit;
}

if ( isset($_GET['theme']) && !empty($_GET['theme']) ) {
  if ( ($content = Core::getTheme($_GET['theme'], ENV_PRODUCTION)) === false ) {
    header("HTTP/1.0 404 Not Found");
    exit;
  }

  header("Content-Type: text/css; charset=utf-8");
  print $content;
  exit;
}

if ( isset($_GET['cursor']) && !empty($_GET['cursor']) ) {
  if ( ($content = Core::getCursor($_GET['cursor'], ENV_PRODUCTION)) === false ) {
    header("HTTP/1.0 404 Not Found");
    exit;
  }

  header("Content-Type: text/css; charset=utf-8");
  print $content;
  exit;
}

///////////////////////////////////////////////////////////////////////////////
// RESOURCE LOADING
///////////////////////////////////////////////////////////////////////////////

if ( isset($_GET['resource']) && !empty($_GET['resource']) ) {
  $type = preg_match("/\.js$/", $_GET['resource']) ? "js" : "css";
  $app  = isset($_GET['application']) ? $_GET['application'] : null;
  if ( ($content = Core::getFile(true, $_GET['resource'], $app, ENV_PRODUCTION)) === false ) {
    header("HTTP/1.0 404 Not Found");
    exit;
  }

  header(sprintf("Content-Type: %s; charset=utf-8", $type == "js" ? "application/x-javascript" : "text/css"));
  print $content;
  exit;

} else if ( isset($_GET['library']) ) {
  $type = preg_match("/\.js$/", $_GET['library']) ? "js" : "css";
  if ( ($content = Core::getFile(false, $_GET['library'], null, ENV_PRODUCTION)) === false ) {
    header("HTTP/1.0 404 Not Found");
    exit;
  }

  header(sprintf("Content-Type: %s; charset=utf-8", $type == "js" ? "application/x-javascript" : "text/css"));
  print $content;
  exit;
}

///////////////////////////////////////////////////////////////////////////////
// AJAX
///////////////////////////////////////////////////////////////////////////////

// GET operations
if ( !($json = $core->doGET($_GET)) === false ) {
  header("Content-Type: application/json");
  die($json);
}

// POST operations
if ( !($json = $core->doPOST(file_get_contents('php://input'))) === false ) {
  header("Content-Type: application/json");
  die($json);
}


///////////////////////////////////////////////////////////////////////////////
// HTML
///////////////////////////////////////////////////////////////////////////////

header("Content-Type: text/html; charset=utf-8");
require PATH_JSBASE . "/template.php";
?>
