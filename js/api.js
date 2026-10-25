/*
  api.js  -  THE ONLY FILE THAT TALKS TO THE "DATABASE"

  Right now the "database" is the JSON files inside the data/ folder.
  Every page asks for its data using getData("name").

  HOW TO MOVE TO PHP LATER (for the examination cell):
  1. Create one PHP file per data name inside a folder called api/
     Example: api/circulars.php  (it must print JSON, same shape as data/circulars.json)
  2. Change the two settings below:
        API_FOLDER    = "api/"
        API_EXTENSION = ".php"
  3. Replace the demo code in loginStudent(), updateMyProfile() and sendRequest()
     (each one has a comment that shows what to change).
  4. Delete the data/ folder.

  The pages (HTML files) do not need to change for this.
*/

var API_FOLDER = "data/";
var API_EXTENSION = ".json";


/* ------------------------------------------------------------------
   1. Read data
   ------------------------------------------------------------------ */

// Gets data from the server. Example: var list = await getData("circulars");
// "async / await" only means: wait here until the data arrives.
async function getData(name) {
  var response = await fetch(API_FOLDER + name + API_EXTENSION);
  if (response.ok == false) {
    throw new Error("Could not load " + name);
  }
  return await response.json();
}


/* ------------------------------------------------------------------
   2. Login and logout
   ------------------------------------------------------------------ */

// Returns the roll number of the logged in student (or empty text if nobody is logged in)
function getLoggedInRoll() {
  return localStorage.getItem("rgmcet_roll") || "";
}

// Checks roll number and password. Returns true if correct, false if wrong.
// DEMO ONLY: it compares with data/students.json.
// PHP: send roll and password to login.php using fetch(..., { method: "POST", body: ... })
// and let PHP start a session. Never keep passwords in a JSON file in the real project.
async function loginStudent(roll, password) {
  var students = await getData("students");
  for (var i = 0; i < students.length; i++) {
    if (students[i].roll == roll && students[i].password == password) {
      localStorage.setItem("rgmcet_roll", roll);
      return true;
    }
  }
  return false;
}

function logoutStudent() {
  localStorage.removeItem("rgmcet_roll");
}


/* ------------------------------------------------------------------
   3. Student profile
   ------------------------------------------------------------------ */

// Returns the details of the logged in student.
// PHP: api/profile.php should return only the student who is logged in (use the session).
async function getMyProfile() {
  var roll = getLoggedInRoll();
  var students = await getData("students");
  var me = null;
  for (var i = 0; i < students.length; i++) {
    if (students[i].roll == roll) {
      me = students[i];
    }
  }
  if (me == null) {
    throw new Error("Student not found");
  }
  // Add the changes this student made earlier (demo: stored in the phone)
  var saved = localStorage.getItem("rgmcet_profile_" + roll);
  if (saved) {
    var changes = JSON.parse(saved);
    me.email = changes.email;
    me.mobile = changes.mobile;
    me.address = changes.address;
  }
  return me;
}

// Saves the profile fields a student is allowed to change.
// DEMO ONLY: saves in the phone. PHP: send these values to update_profile.php (POST).
async function updateMyProfile(email, mobile, address) {
  var changes = { email: email, mobile: mobile, address: address };
  localStorage.setItem("rgmcet_profile_" + getLoggedInRoll(), JSON.stringify(changes));
  return true;
}


/* ------------------------------------------------------------------
   4. Requests sent by the student (grievance, certificate, feedback)
   ------------------------------------------------------------------ */

// type is "grievance", "certificate" or "feedback". details is a plain object.
// DEMO ONLY: saves in the phone. PHP: POST to submit_request.php and save in a database table.
async function sendRequest(type, details) {
  var all = getMyRequests();
  var request = {
    id: "REQ" + (all.length + 1001),
    type: type,
    date: new Date().toISOString().substring(0, 10),
    status: "Submitted",
    details: details
  };
  all.unshift(request);
  localStorage.setItem("rgmcet_requests_" + getLoggedInRoll(), JSON.stringify(all));
  return request;
}

// Returns the list of requests sent earlier. PHP: api/my_requests.php
function getMyRequests() {
  var saved = localStorage.getItem("rgmcet_requests_" + getLoggedInRoll());
  if (saved) {
    return JSON.parse(saved);
  }
  return [];
}


/* ------------------------------------------------------------------
   5. "Read" marks (which circular or notification the student has opened)
   ------------------------------------------------------------------ */

// kind is "circular" or "notification"; id is the id of that item.
// DEMO ONLY: saved in the phone. PHP: call mark_read.php so the read count can be stored.
function markAsRead(kind, id) {
  var list = getReadList(kind);
  if (list.indexOf(id) == -1) {
    list.push(id);
    localStorage.setItem("rgmcet_read_" + kind + "_" + getLoggedInRoll(), JSON.stringify(list));
  }
}

function getReadList(kind) {
  var saved = localStorage.getItem("rgmcet_read_" + kind + "_" + getLoggedInRoll());
  if (saved) {
    return JSON.parse(saved);
  }
  return [];
}

function isRead(kind, id) {
  return getReadList(kind).indexOf(id) != -1;
}
