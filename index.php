<?php

namespace Router;

require_once 'vendor/autoload.php';

require_once 'routes.php';

use \Bramus\Router\Router as BRouter;

$router = new BRouter();

$router->set404('/api(/.*)?', function () {
    header('HTTP/1.1 404 Not Found');
    header('Content-Type: application/json');

    $jsonArray = array();
    $jsonArray['status'] = "404";
    $jsonArray['status_text'] = "route not defined";

    echo json_encode($jsonArray);
});

// Load routes
foreach ($routes as $route) {
    $m = $route->method;
    $router->$m($route->path, $route->fun);
}

// Run router
$router->run();
