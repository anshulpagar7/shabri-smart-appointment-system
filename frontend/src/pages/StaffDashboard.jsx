import { useState, useEffect } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_APPOINTMENTS = [
  { id: "SHA-00121", name: "Anshul Pagar",    mobile: "9876543210", officer: "Mrs. Rekha Sharma",    designation: "CEO",                time: "10:00 AM", purpose: "Grievance",   status: "completed",  avatar: "AP", waitMins: 0  },
  { id: "SHA-00122", name: "Sunita Waghmare", mobile: "9823456701", officer: "Mr. Dinesh Patil",     designation: "Dy. Director",       time: "10:30 AM", purpose: "Scholarship", status: "completed",  avatar: "SW", waitMins: 0  },
  { id: "SHA-00123", name: "Ramesh Bhagat",   mobile: "9812345678", officer: "Mrs. Rekha Sharma",    designation: "CEO",                time: "11:00 AM", purpose: "Education",   status: "in-meeting", avatar: "RB", waitMins: 12 },
  { id: "SHA-00124", name: "Priya Meshram",   mobile: "9834567012", officer: "Mrs. Sunita Meshram",  designation: "Asst. Commissioner", time: "11:00 AM", purpose: "Employment",  status: "arrived",    avatar: "PM", waitMins: 18 },
  { id: "SHA-00125", name: "Dinesh Uikey",    mobile: "9856789012", officer: "Mr. Rajesh Borde",     designation: "District Officer",   time: "11:30 AM", purpose: "Certificate", status: "booked",     avatar: "DU", waitMins: 0  },
  { id: "SHA-00126", name: "Kavita Tekam",    mobile: "9867890123", officer: "Mr. Dinesh Patil",     designation: "Dy. Director",       time: "11:30 AM", purpose: "Scholarship", status: "booked",     avatar: "KT", waitMins: 0  },
  { id: "SHA-00127", name: "Manoj Atram",     mobile: "9878901234", officer: "Mrs. Rekha Sharma",    designation: "CEO",                time: "12:00 PM", purpose: "Grievance",   status: "booked",     avatar: "MA", waitMins: 0  },
  { id: "SHA-00128", name: "Lata Dhurve",     mobile: "9889012345", officer: "Mrs. Sunita Meshram",  designation: "Asst. Commissioner", time: "12:00 PM", purpose: "Employment",  status: "booked",     avatar: "LD", waitMins: 0  },
  { id: "SHA-00129", name: "Vijay Markam",    mobile: "9890123456", officer: "Mr. Rajesh Borde",     designation: "District Officer",   time: "02:00 PM", purpose: "Other",       status: "cancelled",  avatar: "VM", waitMins: 0  },
  { id: "SHA-00130", name: "Asha Parte",      mobile: "9801234567", officer: "Mr. Dinesh Patil",     designation: "Dy. Director",       time: "02:30 PM", purpose: "Education",   status: "booked",     avatar: "AS", waitMins: 0  },
];

const STATUS_CONFIG = {
  booked:     { label: "Booked",     color: "#3B82F6", bg: "#EFF6FF", dot: "#3B82F6" },
  arrived:    { label: "Arrived",    color: "#F59E0B", bg: "#FFFBEB", dot: "#F59E0B" },
  "in-meeting":{ label: "In Meeting", color: "#8B5CF6", bg: "#F5F3FF", dot: "#8B5CF6" },
  completed:  { label: "Completed",  color: "#10B981", bg: "#ECFDF5", dot: "#10B981" },
  cancelled:  { label: "Cancelled",  color: "#EF4444", bg: "#FEF2F2", dot: "#EF4444" },
  "no-show":  { label: "No Show",    color: "#6B7280", bg: "#F9FAFB", dot: "#6B7280" },
};

const TRANSITIONS = {
  booked:      ["arrived", "cancelled", "no-show"],
  arrived:     ["in-meeting", "cancelled"],
  "in-meeting":["completed", "cancelled"],
  completed:   [],
  cancelled:   [],
  "no-show":   [],
};

const ACTION_LABELS = {
  arrived:     "✓ Mark Arrived",
  "in-meeting":"▶ In Meeting",
  completed:   "✓ Completed",
  cancelled:   "✕ Cancel",
  "no-show":   "⊘ No Show",
};

const OFFICERS_FILTER = ["All Officers", "Mrs. Rekha Sharma", "Mr. Dinesh Patil", "Mrs. Sunita Meshram", "Mr. Rajesh Borde"];
const STATUS_FILTER   = ["All", "booked", "arrived", "in-meeting", "completed", "cancelled"];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:    #0D1B2A;
    --navy2:   #1B2D42;
    --navy3:   #253B55;
    --saffron: #F97316;
    --saff-lt: #FB923C;
    --saff-pale:#FFF7ED;
    --green:   #059669;
    --slate:   #64748B;
    --mist:    #F1F5F9;
    --white:   #FFFFFF;
    --border:  #E2E8F0;
    --r:       12px;
    --shadow:  0 2px 12px rgba(13,27,42,0.08);
    --shadow-lg:0 8px 32px rgba(13,27,42,0.14);
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--mist); color: var(--navy); -webkit-font-smoothing: antialiased; }

  .layout { display: flex; min-height: 100vh; }

  /* ── Sidebar ── */
  .sidebar {
    width: 220px; flex-shrink: 0;
    background: var(--navy);
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh;
  }
  .sidebar-logo {
    padding: 20px 18px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .logo-mark {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, var(--saffron), var(--saff-lt));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 800; color: white;
    margin-bottom: 10px;
  }
  .logo-name { font-size: 13px; font-weight: 700; color: white; }
  .logo-sub  { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 1px; }

  .nav { padding: 12px 10px; flex: 1; }
  .nav-section { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.28); letter-spacing: 1.2px; text-transform: uppercase; padding: 10px 8px 6px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 8px;
    cursor: pointer; margin-bottom: 2px;
    color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 500;
    transition: all 0.15s;
  }
  .nav-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
  .nav-item.active { background: rgba(249,115,22,0.15); color: var(--saff-lt); }
  .nav-item.active .nav-icon { color: var(--saffron); }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .nav-badge {
    margin-left: auto; background: var(--saffron); color: white;
    font-size: 10px; font-weight: 700; min-width: 18px; height: 18px;
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    padding: 0 4px;
  }

  .sidebar-user {
    padding: 14px 16px;
    border-top: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; gap: 10px;
  }
  .user-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--saffron), var(--saff-lt));
    color: white; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .user-name { font-size: 12px; font-weight: 600; color: white; }
  .user-role { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 1px; }

  /* ── Main ── */
  .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

  /* ── Topbar ── */
  .topbar {
    background: var(--white); border-bottom: 1px solid var(--border);
    padding: 14px 28px;
    display: flex; align-items: center; gap: 16px;
    position: sticky; top: 0; z-index: 50;
  }
  .topbar-title h1 { font-size: 18px; font-weight: 700; color: var(--navy); }
  .topbar-title p  { font-size: 12px; color: var(--slate); margin-top: 1px; }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .live-badge {
    display: flex; align-items: center; gap: 6px;
    background: #ECFDF5; border: 1px solid #A7F3D0;
    padding: 5px 12px; border-radius: 20px;
    font-size: 11px; font-weight: 600; color: var(--green);
  }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--green);
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
  .btn-new {
    background: var(--saffron); color: white;
    border: none; border-radius: var(--r);
    padding: 9px 16px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
    box-shadow: 0 2px 10px rgba(249,115,22,0.3);
  }
  .btn-new:hover { background: var(--saff-lt); transform: translateY(-1px); }

  /* ── Body ── */
  .body { padding: 24px 28px; flex: 1; }

  /* ── Stat Cards ── */
  .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card {
    background: var(--white); border-radius: var(--r);
    border: 1px solid var(--border);
    padding: 16px 18px;
    box-shadow: var(--shadow);
    position: relative; overflow: hidden;
  }
  .stat-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--accent-color, var(--saffron));
  }
  .stat-label { font-size: 10px; font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 0.8px; }
  .stat-num   { font-size: 28px; font-weight: 700; color: var(--navy); margin: 6px 0 2px; line-height: 1; }
  .stat-sub   { font-size: 11px; color: var(--slate); }
  .stat-icon  { position: absolute; top: 14px; right: 14px; font-size: 22px; opacity: 0.15; }

  /* ── Controls ── */
  .controls {
    background: var(--white); border-radius: var(--r);
    border: 1px solid var(--border);
    padding: 14px 18px;
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 16px;
    box-shadow: var(--shadow);
  }
  .search-box {
    display: flex; align-items: center; gap: 8px;
    background: var(--mist); border-radius: 8px;
    padding: 8px 14px; flex: 1; max-width: 280px;
  }
  .search-input {
    border: none; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: var(--navy); outline: none; width: 100%;
  }
  .search-input::placeholder { color: #94A3B8; }
  .filter-select {
    border: 1px solid var(--border); background: var(--white);
    border-radius: 8px; padding: 8px 12px;
    font-family: 'DM Sans', sans-serif; font-size: 12px;
    color: var(--navy); outline: none; cursor: pointer;
  }
  .controls-right { margin-left: auto; display: flex; gap: 8px; }
  .view-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--white);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 15px; transition: all 0.15s;
  }
  .view-btn.active { background: var(--navy); border-color: var(--navy); color: white; }

  /* ── Table ── */
  .table-wrap {
    background: var(--white); border-radius: var(--r);
    border: 1px solid var(--border); box-shadow: var(--shadow);
    overflow: hidden;
  }
  .table-head {
    display: grid;
    grid-template-columns: 28px 1fr 100px 120px 100px 120px 180px;
    gap: 0;
    background: var(--mist);
    border-bottom: 1px solid var(--border);
    padding: 10px 18px;
  }
  .th { font-size: 10px; font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: 0.7px; }
  .table-body { }
  .table-row {
    display: grid;
    grid-template-columns: 28px 1fr 100px 120px 100px 120px 180px;
    gap: 0;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
    align-items: center;
    transition: background 0.15s;
    animation: rowIn 0.3s ease both;
  }
  @keyframes rowIn { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:none; } }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: #FAFBFC; }
  .row-check {
    width: 16px; height: 16px; border-radius: 4px;
    border: 1.5px solid var(--border); cursor: pointer;
    flex-shrink: 0;
  }
  .visitor-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .v-avatar {
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    background: linear-gradient(135deg, var(--navy2), var(--navy3));
    color: white; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .v-name { font-size: 13px; font-weight: 600; color: var(--navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v-id   { font-size: 10px; color: var(--slate); font-family: 'DM Mono', monospace; margin-top: 1px; }
  .cell   { font-size: 12px; color: var(--navy); }
  .cell-muted { font-size: 12px; color: var(--slate); }
  .time-chip {
    display: inline-flex; align-items: center;
    background: var(--mist); border-radius: 6px;
    padding: 4px 8px; font-size: 12px; font-weight: 600;
    color: var(--navy); font-family: 'DM Mono', monospace;
  }
  .wait-badge {
    font-size: 10px; color: #F59E0B; font-weight: 600;
    background: #FEF3C7; padding: 2px 6px; border-radius: 4px;
    margin-top: 3px; display: inline-block;
  }
  .status-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  /* ── Action Buttons ── */
  .action-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .act-btn {
    padding: 5px 10px; border-radius: 6px;
    border: 1px solid; font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 600; cursor: pointer;
    transition: all 0.15s; white-space: nowrap;
  }
  .act-btn.primary { background: var(--saffron); border-color: var(--saffron); color: white; }
  .act-btn.primary:hover { background: var(--saff-lt); }
  .act-btn.ghost { background: transparent; border-color: var(--border); color: var(--slate); }
  .act-btn.ghost:hover { border-color: var(--slate); color: var(--navy); }
  .act-btn.danger { background: transparent; border-color: #FECACA; color: #EF4444; }
  .act-btn.danger:hover { background: #FEF2F2; }
  .act-btn.purple { background: #F5F3FF; border-color: #DDD6FE; color: #7C3AED; }

  /* ── Card View ── */
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .appt-card {
    background: var(--white); border-radius: var(--r);
    border: 1px solid var(--border); padding: 18px;
    box-shadow: var(--shadow); transition: all 0.15s;
    animation: rowIn 0.3s ease both;
  }
  .appt-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
  .card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .card-avatar {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg, var(--navy2), var(--navy3));
    color: white; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .card-name { font-size: 14px; font-weight: 700; color: var(--navy); }
  .card-id   { font-size: 10px; color: var(--slate); font-family: 'DM Mono', monospace; margin-top: 2px; }
  .card-status { margin-left: auto; }
  .card-details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .cd-item { }
  .cd-label { font-size: 10px; color: var(--slate); margin-bottom: 2px; }
  .cd-val   { font-size: 12px; font-weight: 600; color: var(--navy); }
  .card-actions { display: flex; gap: 6px; padding-top: 14px; border-top: 1px solid var(--border); }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(13,27,42,0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    background: var(--white); border-radius: 16px;
    width: 100%; max-width: 480px;
    box-shadow: 0 24px 64px rgba(13,27,42,0.25);
    animation: slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .modal-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-size: 16px; font-weight: 700; color: var(--navy); }
  .modal-close { background: none; border: none; font-size: 20px; color: var(--slate); cursor: pointer; }
  .modal-body { padding: 20px 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--navy); margin-bottom: 6px; display: block; }
  .form-input {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid var(--border); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--navy);
    outline: none; transition: border 0.2s; margin-bottom: 14px;
  }
  .form-input:focus { border-color: var(--saffron); }
  .form-select {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid var(--border); border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--navy);
    outline: none; background: white; cursor: pointer; margin-bottom: 14px;
  }
  .btn-modal-primary {
    background: var(--saffron); color: white; border: none;
    border-radius: 8px; padding: 10px 20px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
  }
  .btn-modal-primary:hover { background: var(--saff-lt); }
  .btn-modal-ghost {
    background: transparent; color: var(--slate);
    border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 20px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
  }

  /* ── Toast ── */
  .toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--navy); color: white;
    padding: 12px 20px; border-radius: 10px;
    font-size: 13px; font-weight: 500;
    box-shadow: 0 8px 24px rgba(13,27,42,0.3);
    z-index: 300; display: flex; align-items: center; gap: 8px;
    animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
    border-left: 3px solid var(--saffron);
  }
  @keyframes toastIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }

  /* ── Empty ── */
  .empty-state { text-align: center; padding: 60px 20px; color: var(--slate); }
  .empty-state h3 { font-size: 16px; font-weight: 600; color: var(--navy); margin-bottom: 6px; }
  .empty-state p  { font-size: 13px; }

  /* ── Timeline ── */
  .timeline { padding: 8px 0; }
  .tl-item { display: flex; gap: 12px; margin-bottom: 16px; }
  .tl-dot-wrap { display: flex; flex-direction: column; align-items: center; gap: 0; }
  .tl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
  .tl-line { width: 1px; flex: 1; background: var(--border); min-height: 20px; margin-top: 4px; }
  .tl-content { padding-bottom: 4px; }
  .tl-action { font-size: 12px; font-weight: 600; color: var(--navy); }
  .tl-time   { font-size: 11px; color: var(--slate); margin-top: 1px; }
`;

// ─── Components ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.booked;
  return (
    <span className="status-pill" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="status-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return <div className="toast">✓ {msg}</div>;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [officerFilter, setOfficerFilter] = useState("All Officers");
  const [viewMode, setViewMode] = useState("table"); // table | card
  const [activeNav, setActiveNav] = useState("today");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const [newAppt, setNewAppt] = useState({ name: "", mobile: "", officer: "", purpose: "", time: "", date: "" });

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Stats
  const stats = {
    total:     appointments.length,
    booked:    appointments.filter(a => a.status === "booked").length,
    arrived:   appointments.filter(a => a.status === "arrived").length,
    inMeeting: appointments.filter(a => a.status === "in-meeting").length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
  };

  // Filter
  const filtered = appointments.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.mobile.includes(search) ||
      a.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    const matchOfficer = officerFilter === "All Officers" || a.officer === officerFilter;
    return matchSearch && matchStatus && matchOfficer;
  });

  const updateStatus = (id, newStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    setToast(`${id} marked as ${STATUS_CONFIG[newStatus]?.label}`);
    if (showDetail?.id === id) setShowDetail(prev => ({ ...prev, status: newStatus }));
  };

  const handleCreate = () => {
    const id = "SHA-" + Math.floor(10000 + Math.random() * 90000);
    setAppointments(prev => [...prev, {
      id, name: newAppt.name, mobile: newAppt.mobile,
      officer: newAppt.officer || "Mrs. Rekha Sharma",
      designation: "CEO", time: newAppt.time || "02:00 PM",
      purpose: newAppt.purpose || "Other",
      status: "booked", avatar: newAppt.name.slice(0, 2).toUpperCase(), waitMins: 0,
    }]);
    setShowModal(false);
    setNewAppt({ name: "", mobile: "", officer: "", purpose: "", time: "", date: "" });
    setToast("New appointment created — " + id);
  };

  return (
    <>
      <style>{css}</style>
      <div className="layout">

        {/* ── Sidebar ── */}
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">अ</div>
            <div className="logo-name">Shabri System</div>
            <div className="logo-sub">Staff Control Panel</div>
          </div>

          <nav className="nav">
            <div className="nav-section">Main</div>
            {[
              { key: "today",    icon: "📋", label: "Today's Appointments", badge: stats.booked + stats.arrived },
              { key: "all",      icon: "🗂",  label: "All Appointments" },
              { key: "walkins",  icon: "🚶", label: "Walk-ins",           badge: stats.arrived },
              { key: "search",   icon: "🔍", label: "Search" },
            ].map(n => (
              <div key={n.key} className={`nav-item ${activeNav === n.key ? "active" : ""}`} onClick={() => setActiveNav(n.key)}>
                <span className="nav-icon">{n.icon}</span>
                {n.label}
                {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
              </div>
            ))}

            <div className="nav-section">Manage</div>
            {[
              { key: "block",    icon: "🚫", label: "Block Slots" },
              { key: "holidays", icon: "📅", label: "Holidays" },
              { key: "reports",  icon: "📊", label: "Reports" },
            ].map(n => (
              <div key={n.key} className={`nav-item ${activeNav === n.key ? "active" : ""}`} onClick={() => setActiveNav(n.key)}>
                <span className="nav-icon">{n.icon}</span>
                {n.label}
              </div>
            ))}
          </nav>

          <div className="sidebar-user">
            <div className="user-avatar">NK</div>
            <div>
              <div className="user-name">Nilesh Kumar</div>
              <div className="user-role">Staff · Reception</div>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="main">

          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-title">
              <h1>Today's Appointments</h1>
              <p>{today}</p>
            </div>
            <div className="topbar-right">
              <div className="live-badge">
                <span className="live-dot" />
                Live
              </div>
              <button className="btn-new" onClick={() => setShowModal(true)}>
                + New Appointment
              </button>
            </div>
          </div>

          <div className="body">

            {/* Stats */}
            <div className="stats-row">
              {[
                { label: "Total Today", num: stats.total,     sub: "appointments",    color: "#6366F1", icon: "📋" },
                { label: "Pending",     num: stats.booked,    sub: "not yet arrived", color: "#3B82F6", icon: "⏳" },
                { label: "Arrived",     num: stats.arrived,   sub: "in waiting area", color: "#F59E0B", icon: "🚶" },
                { label: "In Meeting",  num: stats.inMeeting, sub: "with officer",    color: "#8B5CF6", icon: "💼" },
                { label: "Completed",   num: stats.completed, sub: "done today",      color: "#10B981", icon: "✓"  },
              ].map((s, i) => (
                <div className="stat-card" key={i} style={{ "--accent-color": s.color }}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="controls">
              <div className="search-box">
                <span style={{ color: "#94A3B8" }}>🔍</span>
                <input
                  className="search-input"
                  placeholder="Search name, mobile, ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {STATUS_FILTER.map(s => <option key={s}>{s === "All" ? "All Statuses" : STATUS_CONFIG[s]?.label || s}</option>)}
              </select>
              <select className="filter-select" value={officerFilter} onChange={e => setOfficerFilter(e.target.value)}>
                {OFFICERS_FILTER.map(o => <option key={o}>{o}</option>)}
              </select>
              <div className="controls-right">
                <div className={`view-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>☰</div>
                <div className={`view-btn ${viewMode === "card" ? "active" : ""}`} onClick={() => setViewMode("card")}>⊞</div>
              </div>
            </div>

            {/* Table View */}
            {viewMode === "table" && (
              <div className="table-wrap">
                <div className="table-head">
                  <div className="th" />
                  <div className="th">Visitor</div>
                  <div className="th">Time</div>
                  <div className="th">Officer</div>
                  <div className="th">Purpose</div>
                  <div className="th">Status</div>
                  <div className="th">Actions</div>
                </div>
                <div className="table-body">
                  {filtered.length === 0 ? (
                    <div className="empty-state">
                      <h3>No appointments found</h3>
                      <p>Try changing your filters or search query</p>
                    </div>
                  ) : filtered.map((a, i) => (
                    <div className="table-row" key={a.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <input type="checkbox" className="row-check" />
                      <div className="visitor-cell" onClick={() => setShowDetail(a)} style={{ cursor: "pointer" }}>
                        <div className="v-avatar">{a.avatar}</div>
                        <div>
                          <div className="v-name">{a.name}</div>
                          <div className="v-id">{a.id}</div>
                        </div>
                      </div>
                      <div>
                        <div className="time-chip">{a.time}</div>
                        {a.waitMins > 0 && <div className="wait-badge">+{a.waitMins}m wait</div>}
                      </div>
                      <div>
                        <div className="cell" style={{ fontSize: 11 }}>{a.officer.split(" ").slice(-1)[0]}</div>
                        <div className="cell-muted">{a.designation}</div>
                      </div>
                      <div className="cell-muted" style={{ fontSize: 11 }}>{a.purpose}</div>
                      <div><StatusPill status={a.status} /></div>
                      <div className="action-row">
                        {TRANSITIONS[a.status]?.slice(0, 1).map(next => (
                          <button key={next} className="act-btn primary" onClick={() => updateStatus(a.id, next)}>
                            {ACTION_LABELS[next]}
                          </button>
                        ))}
                        {TRANSITIONS[a.status]?.slice(1).map(next => (
                          <button key={next} className={`act-btn ${next === "cancelled" ? "danger" : "ghost"}`}
                            onClick={() => updateStatus(a.id, next)}>
                            {ACTION_LABELS[next]}
                          </button>
                        ))}
                        {TRANSITIONS[a.status]?.length === 0 && (
                          <span className="cell-muted" style={{ fontSize: 11 }}>—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card View */}
            {viewMode === "card" && (
              <div className="cards-grid">
                {filtered.map((a, i) => (
                  <div className="appt-card" key={a.id} style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="card-top">
                      <div className="card-avatar">{a.avatar}</div>
                      <div>
                        <div className="card-name" onClick={() => setShowDetail(a)} style={{ cursor: "pointer" }}>{a.name}</div>
                        <div className="card-id">{a.id} · {a.mobile}</div>
                      </div>
                      <div className="card-status"><StatusPill status={a.status} /></div>
                    </div>
                    <div className="card-details">
                      <div className="cd-item"><div className="cd-label">Time</div><div className="cd-val">{a.time}</div></div>
                      <div className="cd-item"><div className="cd-label">Officer</div><div className="cd-val" style={{ fontSize: 11 }}>{a.officer.split(" ").slice(-1)}</div></div>
                      <div className="cd-item"><div className="cd-label">Purpose</div><div className="cd-val">{a.purpose}</div></div>
                      <div className="cd-item"><div className="cd-label">Wait</div><div className="cd-val">{a.waitMins > 0 ? `${a.waitMins} mins` : "—"}</div></div>
                    </div>
                    <div className="card-actions">
                      {TRANSITIONS[a.status]?.slice(0, 1).map(next => (
                        <button key={next} className="act-btn primary" style={{ flex: 1 }} onClick={() => updateStatus(a.id, next)}>
                          {ACTION_LABELS[next]}
                        </button>
                      ))}
                      {TRANSITIONS[a.status]?.slice(1).map(next => (
                        <button key={next} className={`act-btn ${next === "cancelled" ? "danger" : "ghost"}`} onClick={() => updateStatus(a.id, next)}>
                          {ACTION_LABELS[next]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Detail Modal ── */}
        {showDetail && (
          <div className="modal-overlay" onClick={() => setShowDetail(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">{showDetail.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B", fontFamily: "DM Mono", marginTop: 2 }}>{showDetail.id}</div>
                </div>
                <button className="modal-close" onClick={() => setShowDetail(null)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                  {[
                    { l: "Mobile", v: showDetail.mobile },
                    { l: "Status", v: <StatusPill status={showDetail.status} /> },
                    { l: "Officer", v: showDetail.officer },
                    { l: "Purpose", v: showDetail.purpose },
                    { l: "Time Slot", v: showDetail.time },
                    { l: "Designation", v: showDetail.designation },
                  ].map((r, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 10, color: "#64748B", marginBottom: 3, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>{r.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1B2A" }}>{r.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0D1B2A", marginBottom: 10 }}>Activity Timeline</div>
                <div className="timeline">
                  {[
                    { action: "Appointment Booked", time: "Yesterday, 4:32 PM", color: "#3B82F6" },
                    ...(["arrived","in-meeting","completed"].includes(showDetail.status) ? [{ action: "Visitor Arrived", time: "Today, " + showDetail.time, color: "#F59E0B" }] : []),
                    ...(["in-meeting","completed"].includes(showDetail.status) ? [{ action: "Meeting Started", time: "Today, " + showDetail.time, color: "#8B5CF6" }] : []),
                    ...(showDetail.status === "completed" ? [{ action: "Meeting Completed", time: "Today", color: "#10B981" }] : []),
                    ...(showDetail.status === "cancelled" ? [{ action: "Appointment Cancelled", time: "Today", color: "#EF4444" }] : []),
                  ].map((t, i, arr) => (
                    <div className="tl-item" key={i}>
                      <div className="tl-dot-wrap">
                        <div className="tl-dot" style={{ background: t.color }} />
                        {i < arr.length - 1 && <div className="tl-line" />}
                      </div>
                      <div className="tl-content">
                        <div className="tl-action">{t.action}</div>
                        <div className="tl-time">{t.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                {TRANSITIONS[showDetail.status]?.map(next => (
                  <button key={next} className={next === "cancelled" ? "btn-modal-ghost" : "btn-modal-primary"}
                    style={next === "cancelled" ? { color: "#EF4444", borderColor: "#FECACA" } : {}}
                    onClick={() => { updateStatus(showDetail.id, next); setShowDetail(null); }}>
                    {ACTION_LABELS[next]}
                  </button>
                ))}
                <button className="btn-modal-ghost" onClick={() => setShowDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ── New Appointment Modal ── */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">New Appointment</div>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <label className="form-label">Visitor Name *</label>
                <input className="form-input" placeholder="Full name" value={newAppt.name} onChange={e => setNewAppt({ ...newAppt, name: e.target.value })} />
                <label className="form-label">Mobile Number *</label>
                <input className="form-input" placeholder="10-digit number" value={newAppt.mobile} onChange={e => setNewAppt({ ...newAppt, mobile: e.target.value })} />
                <label className="form-label">Officer</label>
                <select className="form-select" value={newAppt.officer} onChange={e => setNewAppt({ ...newAppt, officer: e.target.value })}>
                  <option value="">Select officer...</option>
                  {OFFICERS_FILTER.slice(1).map(o => <option key={o}>{o}</option>)}
                </select>
                <label className="form-label">Purpose</label>
                <select className="form-select" value={newAppt.purpose} onChange={e => setNewAppt({ ...newAppt, purpose: e.target.value })}>
                  <option value="">Select purpose...</option>
                  {["Education","Scholarship","Employment","Grievance","Certificate","Other"].map(p => <option key={p}>{p}</option>)}
                </select>
                <label className="form-label">Time Slot</label>
                <select className="form-select" value={newAppt.time} onChange={e => setNewAppt({ ...newAppt, time: e.target.value })}>
                  <option value="">Select slot...</option>
                  {["10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn-modal-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-modal-primary" onClick={handleCreate} disabled={!newAppt.name || !newAppt.mobile}>
                  Create Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      </div>
    </>
  );
}
