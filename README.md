# RGMCET Smart Campus - Student App (Frontend)

A mobile-first Progressive Web App (PWA) for students.
Built with **plain HTML, Bootstrap 5 and plain JavaScript only**. No frameworks, no build tools, no npm needed.

This is the **frontend only**. The data comes from JSON files in the `data/` folder.
The examination cell will replace them with PHP (see "Handover to PHP" below).

---

## 1. How to run it

A PWA must be opened from a web server (double-clicking `index.html` will not work).

**Option A - XAMPP / any PHP server (recommended for the exam cell)**
1. Copy the whole `rgmcet-app` folder into `htdocs` (XAMPP) or your server folder.
2. Open `http://localhost/rgmcet-app/` in Chrome.

**Option B - Python (quick test on a computer)**
```
cd rgmcet-app
python -m http.server 8000
```
Open `http://localhost:8000/`.

**Demo login:** roll number `23091A0512`, password `student123`.

**Test on a phone:** connect the phone to the same Wi-Fi, open `http://<computer-ip>:8000/`.
Note: "Install App" and offline mode need **HTTPS** on a real server (`localhost` is also allowed).

---

## 2. Folder map

```
rgmcet-app/
├── index.html            Login page
├── home.html             Home (welcome card, tiles, latest circulars)
├── circulars.html        College + department circulars (filter, search, details)
├── exams.html            Examination menu
├── calendar.html         Academic calendar
├── timetable.html        Examination timetable
├── hallticket.html       Hall ticket (print / download)
├── results.html          Semester results + CGPA
├── marks.html            Internal marks
├── regulations.html      R16, R19, R20, R23, R25
├── classes.html          Class timetable
├── attendance.html       Attendance
├── profile.html          Student details (can update email, mobile, address)
├── departments.html      List of departments
├── department.html       One department: circulars, activities, events, faculty, achievements
├── fees.html             College / hostel / bus / exam fees + receipts
├── discipline.html       Disciplinary records with progress steps
├── notifications.html    Notifications with categories
├── documents.html        All documents (PDF, JPG, DOCX) with search
├── services.html         Certificates, grievance, feedback, help desk, my requests
├── more.html             Menu of everything
├── settings.html         Install app, clear data, logout
│
├── js/
│   ├── api.js            ** The ONLY file that reads/writes data. PHP changes happen here. **
│   └── app.js            Helper functions + top bar + bottom menu
├── css/style.css         Our colours and styles (change brand colours at the top)
├── data/                 *** The "database" (JSON files). Delete when PHP is ready. ***
├── pdfs/  files/  images/   Sample documents (replace with real ones)
├── icons/                App icons (192, 512, maskable)
├── vendor/               Bootstrap and Bootstrap Icons (saved locally so it works offline)
├── manifest.json         PWA settings (name, colours, icons)
└── service-worker.js     Offline support
```

Every page has the same layout: a small `<script>` at the bottom of the HTML file with
the code of that page. Open the page, scroll to the bottom, and read it top to bottom.

---

## 3. Handover to PHP

### The idea
Every page gets its data with one line:

```js
var list = await getData("circulars");
```

`getData` is in `js/api.js`. It reads `data/circulars.json`.
To move to PHP you change **two lines** at the top of `js/api.js`:

```js
var API_FOLDER = "api/";
var API_EXTENSION = ".php";
```

Now `getData("circulars")` reads `api/circulars.php`.
So the PHP faculty only needs to create one PHP file per name below, and each file must print JSON
in the **same shape** as the matching file in `data/` (open the JSON file to see the field names).

Example `api/circulars.php`:

```php
<?php
header("Content-Type: application/json");
// ... read the circulars from the database into $rows ...
echo json_encode($rows);
```

### Data files and what the PHP file should return

| Name used in `getData()` | Sample file | PHP should return |
|---|---|---|
| `students` | `data/students.json` | **Replace with `profile.php`** - see note 1 |
| `circulars` | `data/circulars.json` | Published circulars for this student (college + own department), newest first |
| `calendar` | `data/calendar.json` | Academic year, PDF path, list of events |
| `exam_timetable` | `data/exam_timetable.json` | Timetable title, PDF path, list of exams |
| `hallticket` | `data/hallticket.json` | Hall ticket of the logged in student (`available: false` if not released) |
| `results` | `data/results.json` | Logged in student's CGPA and semester results |
| `internal_marks` | `data/internal_marks.json` | Logged in student's internal marks |
| `regulations` | `data/regulations.json` | List of regulations with PDF paths |
| `class_timetable` | `data/class_timetable.json` | Class timetable of the student's section |
| `attendance` | `data/attendance.json` | Logged in student's attendance |
| `departments` | `data/departments.json` | List of departments |
| `activities`, `events`, `faculty`, `achievements` | `data/*.json` | Lists (each item has a `department` code like `CSE`) |
| `fees` | `data/fees.json` | `dues` and `receipts` of the logged in student |
| `discipline` | `data/discipline.json` | Cases of the logged in student (empty list `[]` if none) |
| `notifications` | `data/notifications.json` | Notifications for this student, newest first |
| `documents` | `data/documents.json` | Documents the student can download |
| `services` | `data/services.json` | Certificate types, help desk contacts, grievance types |

**Note 1 - students / login.** `data/students.json` holds *all* students and their passwords. That is
only for the demo. In PHP:
- `loginStudent()` in `api.js` should POST roll number + password to `login.php`, which checks the
  database (use `password_hash` / `password_verify`) and starts a PHP session.
- `getMyProfile()` in `api.js` should call `getData("profile")` and `profile.php` returns only the
  logged in student (one object, same fields as one item of `students.json`).

**Note 2 - "my data" files.** `results`, `internal_marks`, `attendance`, `fees`, `discipline`,
`hallticket` contain data of **one student**. In PHP, read the roll number from the **session**
(never from the page address), so a student can never see another student's data.

### Functions in `api.js` that save data (replace the demo code)

| Function | Used by | What PHP should do |
|---|---|---|
| `loginStudent(roll, password)` | index.html | Check login, start session, return true/false |
| `updateMyProfile(email, mobile, address)` | profile.html | Save the three fields for the logged in student |
| `sendRequest(type, details)` | services.html | Save certificate / grievance / feedback request, return `{ id, ... }` |
| `getMyRequests()` | services.html | Return the student's earlier requests (make it `async` and use `getData("my_requests")`) |
| `markAsRead(kind, id)` / `isRead(kind, id)` | circulars, notifications | Save "read" so the read count can be reported (now saved in the phone) |

Each of these has a comment in `api.js` saying what to change. Use `fetch("api/xyz.php", { method: "POST", body: ... })`.

### File paths
Fields like `attachment`, `pdf`, `file`, `photo` hold a path such as `pdfs/circular_008.pdf`.
In PHP, return the real path or URL of the uploaded file. The app shows "View" and "Download" buttons for it.
An empty text `""` means "no file", and the button is hidden.

### Security reminders for the backend
- Check the PHP session on **every** `api/*.php` file. Return HTTP 401 if not logged in.
- Never keep passwords as plain text. The demo login is only for testing.
- Keep text values plain text. The app already escapes them (`esc()` in `app.js`).

---

## 4. Common changes

**Change the brand colour** - top of `css/style.css` (`--brand`, `--accent`) and `theme-color` / `background_color` in `manifest.json`.

**Change the app icon** - replace the three PNG files in `icons/` (same names and sizes).

**Add a page to the menu** - add one line in the `SECTIONS` list in `more.html`.

**Add a new page** - copy any small page (for example `regulations.html`), change the title and the code at the bottom, then add the file name to `FILES_TO_SAVE` in `service-worker.js`.

**Remove the demo login box** - delete the `Demo login` block in `index.html`.

**After you change any file on a real server** - change `CACHE_NAME` in `service-worker.js` (for example `"rgmcet-v2"`).
Otherwise phones keep showing the old saved files.

---

## 5. What is not included (later phases)

- Faculty, HOD, Admin, Accounts and Super Admin screens (this app is for **students**).
- Push notifications (need the PHP backend and the Web Push standard).
- Online fee payment (the fees page only shows dues and receipts).
- Real login security (needs PHP).
