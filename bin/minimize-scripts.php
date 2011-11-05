<?php

require "header.php";


$total_before = 0;
$total_after = 0;

function compress_list($resource, $files) {
  global $total_before;
  global $total_after;

  foreach ( $files as $file ) {
    // Build command
    $type = preg_match("/\.js$/", $file) ? "js" : "css";
    $path = ($resource ? PATH_RESOURCES : PATH_JSBASE) . "/{$file}";
    $cmd  = PATH_PROJECT_BIN . "/yui.sh";
    $cmd  = sprintf("%s/yui.sh %s/yuicompressor-2.4.6.jar", PATH_PROJECT_BIN, PATH_PROJECT_VENDOR);

    $args = "--preserve-semi ";
    if ( $type == "js" ) {
      $args .= sprintf("--type js --charset UTF-8 %s", escapeshellarg($path));
    } else {
      $args .= sprintf("--type css --charset UTF-8 %s", escapeshellarg($path));
    }

    // Run command
    $exec = sprintf("%s %s 2>&1", $cmd, $args);
    $size = 0;
    $comp = 0;
    $perc = 0;
    if ( !($content = shell_exec($exec)) ) {
      $content = "/* FAILED TO GET CONTENTS */";
    } else {
      $size    = filesize($path);
      $comp    = strlen($content);

      if ( $size && $comp ) {
        $perc = round(($comp / $size) * 100);
      }

      $total_before += $size;
      $total_after  += $comp;
    }

    $label = "Minimized {$file}";
    $spaces = str_pad("", (40 - strlen($label)));
    print sprintf("%s%s ($size => $comp, $perc%%)\n", $label, $spaces);

    // Write cached file
    $out_path = ($resource ? PATH_RESOURCES_COMPRESSED : PATH_JSBASE_COMPRESSED) . "/{$file}";
    file_put_contents($out_path, $content);
  }
}

// Parse application data
$app_files = Array();
if ( $xml = file_get_contents(APPLICATION_BUILD) ) {
  if ( $xml = new SimpleXmlElement($xml) ) {
    foreach ( $xml->application as $app ) {
      $app_name     = (string) $app['name'];
      foreach ( $app->resource as $res ) {
        $app_files[] = ((string) $res);
      }
    }
  }
}

compress_list(true, $app_files);

compress_list(false, Array(
  "init.js",
  "core.js",
  "main.js"
));

$perc = 0;
if ( $total_before && $total_after ) {
  $perc = round(($total_after / $total_before) * 100);
}

print "\nCompressed {$total_before} into {$total_after} ({$perc}% compression)\n";

?>
