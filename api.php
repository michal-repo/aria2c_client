<?php

namespace Aria2API;

require 'vendor/autoload.php';

use Aria2;

class A2
{
    private $aria2;

    public function __construct($conn_str = null)
    {
        $this->aria2 = new Aria2(is_null($conn_str) ? "http://127.0.0.1:6800/jsonrpc" : $conn_str);
    }

    public function getVersion()
    {
        return json_encode(["version" => "0.0.1"]);
    }

    public function getStats()
    {
        $globOptions = $this->aria2->getGlobalOption();
        $globStat = $this->aria2->getGlobalStat();
        return json_encode([
            "globOpt" => $globOptions,
            "globStats" => $globStat
        ]);
    }

    public function getActiveList()
    {
        $list = $this->aria2->tellActive();

        return json_encode($list);
    }
    public function getWaitingList(int $start, int $end)
    {
        $list = $this->aria2->tellWaiting($start, $end);

        return json_encode($list);
    }
    public function getStoppedList(int $start, int $end)
    {
        $list = $this->aria2->tellStopped($start, $end);

        return json_encode($list);
    }
    public function changeGlobalOption(string $opt, string $value)
    {
        $list = $this->aria2->changeGlobalOption([$opt => $value]);

        return json_encode($list);
    }

    public function serviceStatus()
    {
        $status = "Inactive";
        $boolval = false;
        $out = shell_exec("systemctl status aria2-deamon-rpc.service");
        if (strpos($out, "active (running)")) {
            $status = "Active";
            $boolval = true;
        }
        return json_encode(["status" => $status, "b" => $boolval]);
    }
}
