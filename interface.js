let getStatusTimeout;
let getGlobStatusTimeout;
let getActiveTimeout;
let getFailedTimeout;

const stats_speed_btn = document.getElementById("stats_speed_btn");
const currentDownloads = document.getElementById("currentDownloads");
const statusField = document.getElementById("statusField");
const stats_speed = document.getElementById("stats_speed");
const stats_downloads = document.getElementById("stats_downloads");
const r = document.getElementById("results");
const rf = document.getElementById("resultsFailed");
const rw = document.getElementById("resultsWaiting");

class int_struct {
  #value;
  constructor() {
    this.#value = 0;
  }
  get() {
    return this.#value;
  }
  set(value) {
    let new_value = parseInt(value);
    if (!isNaN(new_value)) {
      this.#value = new_value;
    } else {
      console.warn("Invalid value in call to set() on int_struct.");
    }
  }
}

let MAX_CONCURRENT_DOWNLOADS = new int_struct();

function setup() {
  try {
    axios({
      method: "get",
      url: "config",
    }).then(function (response) {
      response.data.speed_limits_in_mb.forEach((element) => {
        const btn = document.createElement("button");
        btn.classList.add("btn", "btn-" + element.bootstrap_css);
        btn.addEventListener("click", (event) => {
          setMaxOverallDownloadLimit(element.value + 'M');
        });
        btn.innerText = element.value + "MB/s";
        stats_speed_btn.appendChild(btn);
      });
      btn_css = "light";
      response.data.current_downloads.forEach((value) => {
        console.log(value);
        const btn = document.createElement("button");
        btn.classList.add("btn", "btn-" + btn_css);
        btn_css = (btn_css == "light" ? "dark" : "light");
        btn.addEventListener("click", (event) => {
          setMaxConcurrentDownloads(value);
        });
        btn.innerText = value;
        currentDownloads.appendChild(btn);
      });
    });
  } catch (error) {
    console.error(error);
  }
}
function getStatus() {
  // clearTimeout(getStatusTimeout);
  if (!document.hidden) {
    axios({
      method: "get",
      url: "status",
    }).then(function (response) {
      statusField.innerHTML =
        "<div class='alert alert-" +
        (response.data.b ? "success" : "danger") +
        "' role='alert'>" +
        response.data.status +
        "</div>";
    });
  }
  // getStatusTimeout = setTimeout(getStatus, 15000);
}

function getGlobStats() {
  clearTimeout(getGlobStatusTimeout);
  if (!document.hidden) {
    axios({
      method: "get",
      url: "stats",
    }).then(function (response) {
      if (response.data) {
        MAX_CONCURRENT_DOWNLOADS.set(
          response.data.globOpt.result["max-concurrent-downloads"]
        );
        stats_speed.innerHTML = "";
        stats_downloads.innerHTML = "";
        let e = document.createElement("span");

        e.innerText =
          "Total speed: " +
          fmtspeed(response.data.globStats.result.downloadSpeed) +
          " / Speed limit: " +
          fmtspeed(
            response.data.globOpt.result["max-overall-download-limit"],
            true
          );
        stats_speed.appendChild(e);

        let e2 = document.createElement("span");
        e2.innerText =
          "Max Concurrent Downloads: " + MAX_CONCURRENT_DOWNLOADS.get();
        stats_downloads.appendChild(e2);
      } else {
        stats_speed.innerText = "NO STATS";
      }
    });
  }
  getGlobStatusTimeout = setTimeout(getGlobStats, 1000);
}

function getActive() {
  clearTimeout(getActiveTimeout);
  if (!document.hidden) {
    axios({
      method: "get",
      url: "list/active/",
    }).then(function (response) {
      if (response.data.result.length > 0) {
        r.innerHTML = "";
      } else {
        r.innerText = "List is empty";
      }
      response.data.result.forEach((element) => {
        let e = document.createElement("span");
        let br = document.createElement("br");
        e.innerText = element.dir + getFileName(element.files[0].path) + " / ";
        if (element.totalLength > 0) {
          e.innerText +=
            fmtsize(element.completedLength) +
            "/" +
            fmtsize(element.totalLength);
        } else {
          e.innerText += "0%";
        }

        e.innerText +=
          " / " + fmtspeed(element.downloadSpeed) + " / " + getEta(element);

        r.appendChild(e);
        r.appendChild(br);
        let pb = document.createElement("div");
        let pbinner = document.createElement("div");
        pb.classList.add("progress");
        pbinner.classList.add("progress-bar");
        pbinner.setAttribute("role", "progressbar");
        const perc = fmtperc(element.completedLength, element.totalLength);
        pbinner.style.width = perc;
        pbinner.setAttribute("aria-valuenow", perc);
        pbinner.setAttribute("aria-valuemin", "0");
        pbinner.setAttribute("aria-valuemax", "100");
        pbinner.innerText = perc;
        pb.appendChild(pbinner);
        r.appendChild(pb);
        let br2 = document.createElement("br");
        r.appendChild(br2);
      });
    });
    getWaiting();
  }
  getActiveTimeout = setTimeout(getActive, 1000);
}

function getWaiting() {
  axios({
    method: "get",
    url: "list/waiting/0/1000",
  }).then(function (response) {
    if (response.data.result.length > 0) {
      rw.innerHTML = "";
    } else {
      rw.innerText = "List is empty";
    }
    response.data.result.forEach((element) => {
      let e = document.createElement("span");
      let br = document.createElement("br");
      e.innerText =
        element.dir +
        getFileName(element.files[0].path) +
        " - " +
        fmtperc(element.completedLength, element.totalLength);
      rw.appendChild(e);
      rw.appendChild(br);
    });
  });
}

function getFailed() {
  clearTimeout(getFailedTimeout);
  if (!document.hidden) {
    axios({
      method: "get",
      url: "list/stopped/0/1000",
    }).then(function (response) {
      const failedDownloads = [];
      response.data.result.forEach((element) => {
        if (element.errorCode !== "0") {
          failedDownloads.push(element);
        }
      });
      if (failedDownloads.length > 0) {
        rf.innerHTML = "";
        failedDownloads.forEach((element) => {
          let e = document.createElement("span");
          let br = document.createElement("br");
          e.innerText = element.dir + getFileName(element.files[0].path);
          if (element.totalLength !== "0") {
            e.innerText =
              e.innerText +
              " - " +
              fmtperc(element.completedLength, element.totalLength);
          }
          e.innerText =
            e.innerText + " (" + getErrorCode(element.errorCode) + ")";
          e.style.cssText = "color:red;";
          rf.appendChild(e);
          rf.appendChild(br);
        });
      } else {
        rf.innerText = "List is empty";
      }
    });
  }
  getFailedTimeout = setTimeout(getFailed, 60000);
}

function setMaxConcurrentDownloads(max_concurrent_downloads_value) {
  if (max_concurrent_downloads_value >= 1) {
    axios.post("max-concurrent-downloads", {
      value: max_concurrent_downloads_value,
    });
  }
}

function setMaxConcurrentDownloadsByDirection(direction) {
  switch (direction) {
    case "UP":
      setMaxConcurrentDownloads(MAX_CONCURRENT_DOWNLOADS.get() + 1);
      break;
    default:
    case "DOWN":
      if (MAX_CONCURRENT_DOWNLOADS.get() != 1) {
        setMaxConcurrentDownloads(MAX_CONCURRENT_DOWNLOADS.get() - 1);
      }
      break;
  }
}

function setMaxOverallDownloadLimit(speed) {
  axios.post("max-overall-download-limit", {
    value: speed,
  });
}

function getErrorCode(errorCode) {
  errorCode = errorCode - 1;
  switch (errorCode) {
    case 0:
      return "download was unsuccessful";
    case 1:
      return "unknown error occurred";
    case 2:
      return "time out occurred";
    case 3:
      return "resource was not found";
    case 4:
      return 'aria2 saw the specified number of "resource not found" error. See --max-file-not-found option';
    case 5:
      return "download aborted because download speed was too slow. See --lowest-speed-limit option";
    case 6:
      return "there were unfinished downloads";
    case 7:
      return "remote server did not support resume when resume was required to complete download";
    case 8:
      return "not enough disk space available";
    case 9:
      return "piece length was different from one in .aria2 control";
    case 10:
      return "downloading same file at that moment";
    case 11:
      return "downloading same info hash torrent at that moment";
    case 12:
      return "file already existed";
    case 13:
      return "renaming file failed";
    case 14:
      return "could not open existing file";
    case 15:
      return "could not create new file or truncate existing file";
    case 16:
      return "file I/O error occurred";
    case 17:
      return "could not create directory";
    case 18:
      return "name resolution failed";
    case 19:
      return "could not parse Metalink document";
    case 20:
      return "FTP command failed";
    case 21:
      return "HTTP response header was bad or unexpected";
    case 22:
      return "too many redirects occurred";
    case 23:
      return "HTTP authorization failed";
    case 24:
      return "could not parse bencoded file";
    case 25:
      return ' ".torrent" file was corrupted or missing information ';
    case 26:
      return "Magnet URI was bad";
    case 27:
      return "bad/unrecognized option was given or unexpected option argument was given";
    case 28:
      return "remote server was unable to handle the request due to a temporary overloading or maintenance";
    case 29:
      return "could not parse JSON-RPC request";
    case 30:
      return "Removed";
  }
}

function fmtsize(len) {
  len = +len; // coerce to number
  if (len <= 1024) {
    return len.toFixed(0) + " B";
  }
  len /= 1024;
  if (len <= 1024) {
    return len.toFixed(1) + " KB";
  }
  len /= 1024;
  if (len <= 1024) {
    return len.toFixed(2) + " MB";
  }
  len /= 1024;
  return len.toFixed(3) + " GB";
}

function fmtspeed(speed, zero_as_unlimited = false) {
  if (zero_as_unlimited && speed == 0) {
    return "Unlimited";
  }
  return fmtsize(speed) + "/s";
}

function getFileName(path) {
  var seed = path.split(/[/\\]/);
  return seed[seed.length - 1];
}

function fmtperc(curr, max) {
  let val = ((curr * 100) / max).toFixed(2);
  if (isNaN(val)) {
    val = 0;
  }
  return val + "%";
}

function getEta(d) {
  return show_time((d.totalLength - d.completedLength) / d.downloadSpeed);
}

function show_time(time) {
  time = parseInt(time, 10);
  if (!time || !isFinite(time)) return "∞";
  var secs = time % 60;
  if (time < 60) return secs + "s";
  var mins = Math.floor((time % 3600) / 60);
  if (time < 3600) return pad(mins) + ":" + pad(secs);
  var hrs = Math.floor((time % 86400) / 3600);
  if (time < 86400) return pad(hrs) + ":" + pad(mins) + ":" + pad(secs);
  var days = Math.floor(time / 86400);
  return days + "::" + pad(hrs) + ":" + pad(mins) + ":" + pad(secs);
}

function pad(f) {
  return ("0" + f).slice(-2);
}

setup();
getGlobStats();
getActive();
getFailed();
