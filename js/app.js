/*
  app.js  -  small helper functions used by every page

  Part 1: helper functions (dates, money, badges, PDF buttons)
  Part 2: the top bar and bottom menu (setupPage)
*/


/* ------------------------------------------------------------------
   PART 1: HELPERS
   ------------------------------------------------------------------ */

// Makes text safe to show inside HTML (so data from the server can never break the page)
function esc(text) {
  if (text === null || text === undefined) {
    return "";
  }
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-20" becomes "20 Oct 2026"
function formatDate(text) {
  if (!text) {
    return "-";
  }
  var parts = text.substring(0, 10).split("-");
  return Number(parts[2]) + " " + MONTH_NAMES[Number(parts[1]) - 1] + " " + parts[0];
}

// "2026-10-20T09:30:00" becomes "20 Oct 2026, 9:30 AM"
function formatDateTime(text) {
  var time = text.substring(11, 16);
  var hour = Number(time.substring(0, 2));
  var minute = time.substring(3, 5);
  var ampm = "AM";
  if (hour >= 12) {
    ampm = "PM";
  }
  if (hour > 12) {
    hour = hour - 12;
  }
  if (hour == 0) {
    hour = 12;
  }
  return formatDate(text) + ", " + hour + ":" + minute + " " + ampm;
}

// Today's date as "2026-10-22" (same style as the dates in our data)
function todayText() {
  var d = new Date();
  var month = d.getMonth() + 1;
  var day = d.getDate();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  return d.getFullYear() + "-" + month + "-" + day;
}

// 35000 becomes "Rs. 35,000"
function formatMoney(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-IN");
}

// Returns the value from the page address. For "department.html?code=CSE", getParam("code") gives "CSE"
function getParam(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

// Coloured label for circular priority
function priorityBadge(priority) {
  if (priority == "Urgent") {
    return '<span class="badge text-bg-danger">Urgent</span>';
  }
  if (priority == "Important") {
    return '<span class="badge text-bg-warning">Important</span>';
  }
  return '<span class="badge text-bg-secondary">Normal</span>';
}

// "View" and "Download" buttons for a file (PDF, image, DOCX)
// If the file name is empty nothing is shown.
function fileButtons(file) {
  if (!file) {
    return "";
  }
  return '<a class="btn btn-sm btn-outline-primary me-1" href="' + esc(file) + '" target="_blank"><i class="bi bi-eye"></i> View</a>' +
         '<a class="btn btn-sm btn-primary" href="' + esc(file) + '" download><i class="bi bi-download"></i> Download</a>';
}

// A friendly box shown when a list is empty
function emptyBox(message) {
  return '<div class="empty-box"><i class="bi bi-inbox"></i><p>' + esc(message) + '</p></div>';
}

// Runs the main function of a page. If something fails, an error message is shown.
async function runPage(mainFunction) {
  try {
    await mainFunction();
  } catch (error) {
    document.getElementById("content").innerHTML =
      '<div class="alert alert-danger">Sorry, something went wrong.<br><small>' + esc(error.message) + '</small></div>';
  }
}

// Gives the first letters of a name, for example "K. Ravi Teja" gives "KR"
function initials(name) {
  var words = name.replace(/\./g, "").split(" ");
  var result = "";
  for (var i = 0; i < words.length && result.length < 2; i++) {
    if (words[i] != "") {
      result = result + words[i].charAt(0).toUpperCase();
    }
  }
  return result;
}


/* ------------------------------------------------------------------
   PART 2: TOP BAR AND BOTTOM MENU
   ------------------------------------------------------------------ */

// The five buttons in the bottom menu
var BOTTOM_MENU = [
  { key: "home", label: "Home", icon: "bi-house-door", link: "home.html" },
  { key: "circulars", label: "Circulars", icon: "bi-megaphone", link: "circulars.html" },
  { key: "exams", label: "Exams", icon: "bi-journal-check", link: "exams.html" },
  { key: "fees", label: "Fees", icon: "bi-wallet2", link: "fees.html" },
  { key: "more", label: "More", icon: "bi-grid", link: "more.html" }
];

/*
  Every page calls this once at the top:
     setupPage({ title: "Circulars", active: "circulars", back: true });
  title  = text in the top bar
  active = which bottom menu button is highlighted ("home", "circulars", "exams", "fees", "more")
  back   = true shows a back arrow, false shows the college logo
*/
function setupPage(options) {
  // If nobody is logged in, go to the login page
  if (getLoggedInRoll() == "") {
    window.location.href = "index.html";
    return;
  }

  // Top bar
  var left = "";
  if (options.back) {
    left = '<button class="bar-button" onclick="history.back()" aria-label="Back"><i class="bi bi-arrow-left"></i></button>';
  } else {
    left = '<img class="bar-logo" src="icons/icon-192.png" alt="RGMCET">';
  }
  document.getElementById("topbar").innerHTML =
    '<header class="app-bar">' + left +
    '<h1 class="bar-title">' + esc(options.title) + '</h1>' +
    '<a class="bar-button position-relative" href="notifications.html" aria-label="Notifications">' +
    '<i class="bi bi-bell"></i><span id="bellCount" class="bell-count d-none">0</span></a>' +
    '</header>';

  // Bottom menu
  var menu = "";
  for (var i = 0; i < BOTTOM_MENU.length; i++) {
    var item = BOTTOM_MENU[i];
    var activeClass = "";
    if (item.key == options.active) {
      activeClass = " active";
    }
    menu += '<a class="bottom-item' + activeClass + '" href="' + item.link + '">' +
            '<i class="bi ' + item.icon + '"></i><span>' + item.label + '</span></a>';
  }
  document.getElementById("bottomnav").innerHTML = '<nav class="bottom-nav">' + menu + '</nav>';

  showUnreadCount();
  registerServiceWorker();
}

// Shows the red number on the bell icon (unread notifications)
async function showUnreadCount() {
  try {
    var list = await getData("notifications");
    var count = 0;
    for (var i = 0; i < list.length; i++) {
      if (isRead("notification", list[i].id) == false) {
        count++;
      }
    }
    var bell = document.getElementById("bellCount");
    if (bell && count > 0) {
      bell.textContent = count;
      bell.classList.remove("d-none");
    }
  } catch (error) {
    // The bell number is not important, so we ignore errors here
  }
}

// Turns on the offline / installable (PWA) feature
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}
