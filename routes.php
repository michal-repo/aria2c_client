<?php

namespace Routes;

require_once 'api.php';
require_once 'config.php';

use Aria2API\A2 as A2;

class Route
{
    public $method;
    public $path;
    public $fun;

    public function __construct($method, $path, $fun)
    {
        $this->method = $method;
        $this->path = $path;
        $this->fun = $fun;
    }
}

$api = new A2($aria2c_connection_str);

$routes = [
    new Route('get', '/', function () {
        echo file_get_contents("interface.html");
    }),
    new Route('get', '/config', function () {
        header('Content-Type: application/json');
        echo file_get_contents("config.json");
    }),
    new Route('get', '/version', function () {
        header('Content-Type: application/json');
        echo $GLOBALS['api']->getVersion();
    }),
    new Route('get', '/stats', function () {
        header('Content-Type: application/json');
        echo $GLOBALS['api']->getStats();
    }),
    new Route('get', '/list/active/', function () {
        header('Content-Type: application/json');
        echo $GLOBALS['api']->getActiveList();
    }),
    new Route('get', '/list/waiting/(\d+)/(\d+)', function ($start = 0, $end = 10) {
        header('Content-Type: application/json');
        echo $GLOBALS['api']->getWaitingList((int) $start, (int) $end);
    }),
    new Route('get', '/list/stopped/(\d+)/(\d+)', function ($start = 0, $end = 10) {
        header('Content-Type: application/json');
        echo $GLOBALS['api']->getStoppedList((int) $start, (int) $end);
    }),
    new Route('get', '/status', function () {
        header('Content-Type: application/json');
        echo $GLOBALS['api']->serviceStatus();
    }),
    new Route('post', '/max-concurrent-downloads', function () {
        header('Content-Type: application/json');
        $j = json_decode(file_get_contents("php://input"), true);
        if ($j === null || $j === false) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['status' => 'Error', 'message' => 'Accepts only JSON']);
        } elseif (!isset($j['value'])) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['status' => 'Error', 'message' => 'value required']);
        } else {
            echo $GLOBALS['api']->changeGlobalOption("max-concurrent-downloads", strval($j['value']));
        }
    }),
    new Route('post', '/max-overall-download-limit', function () {
        header('Content-Type: application/json');
        $j = json_decode(file_get_contents("php://input"), true);
        if ($j === null || $j === false) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['status' => 'Error', 'message' => 'Accepts only JSON']);
        } elseif (!isset($j['value'])) {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(['status' => 'Error', 'message' => 'value required']);
        } else {
            echo $GLOBALS['api']->changeGlobalOption("max-overall-download-limit", strval($j['value']));
        }
    }),

];
