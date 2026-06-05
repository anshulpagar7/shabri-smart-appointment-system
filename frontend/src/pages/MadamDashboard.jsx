import { useState, useEffect } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const OFFICER = {
  name: "Mrs. Rekha Sharma",
  designation: "Chief Executive Officer",
  department: "General Administration",
  avatar: "RS",
};

const INITIAL_SCHEDULE = [
  { id: "SHA-00121", name: "Anshul Pagar",   purpose: "Grievance",   time: "10:00 AM", duration: 20, status: "completed",  mobile: "9876543210", notes: "Regarding land dispute in Gadchiroli district", delayMins: 0 },
  { id: "SHA-00122", name: "Ramesh Bhagat",  purpose: "Education",   time: "10:30 AM", duration: 20, status: "completed",  mobile: "9812345678", notes: "School scholarship renewal query",              delayMins: 0 },
  { id: "SHA-00123", name: "Priya Meshram",  purpose: "Employment",  time: "11:00 AM", duration: 30, status: "in-meeting", mobile: "9834567012", notes: "Job placement assistance for tribal youth",       delayMins: 0 },
  { id: "SHA-00124", name: "Manoj Atram",    purpose: "Grievance",   time: "11:30 AM", duration: 20, status: "waiting",    mobile: "9878901234", notes: "Compensation claim follow-up",                   delayMins: 0 },
  { id: "SHA-00125", name: "Kavita Tekam",   purpose: "Scholarship", time: "12:00 PM", duration: 20, status: "waiting",    mobile: "9867890123", notes: "Post-matric scholarship documents",               delayMins: 0 },
  { id: "SHA-00126", name: "Dinesh Uikey",   purpose: "Certificate", time: "02:00 PM", duration: 15, status: "scheduled",  mobile: "9856789012", notes: "Caste validity certificate renewal",              delayMins: 0 },
  { id: "SHA-00127", name: "Lata Dhurve",    purpose: "Employment",  time: "02:30 PM", duration: 20, status: "scheduled",  mobile: "9889012345", notes: "Self-employment scheme application",              delayMins: 0 },
  { id: "SHA-00128", name: "Vijay Markam",   purpose: "Education",   time: "03:00 PM", duration: 20, status: "scheduled",  mobile: "9890123456", notes: "College admission assistance",                   delayMins: 0 },
  { id: "SHA-00129", name: "Asha Parte",     purpose: "Other",       time: "03:30 PM", duration: 15, status: "scheduled",  mobile: "9801234567", notes: "General inquiry",                                delayMins: 0 },
];

const PURPOSE_COLORS = {
  Grievance:   { bg: "#FEF2F2", color: "#EF4444", border: "#FECACA" },
  Education:   { bg: "#EFF6FF", color: "#3B82F6", border: "#BFDBFE" },
  Employment:  { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  Scholarship: { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  Certificate: { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  Other:       { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0" },
};

const STATUS_CONFIG = {
  completed:   { label: "Completed",   color: "#10B981", bg: "#ECFDF5" },
  "in-meeting":{ label: "In Meeting",  color: "#8B5CF6", bg: "#F5F3FF" },
  waiting:     { label: "Waiting",     color: "#F59E0B", bg: "#FFFBEB" },
  scheduled:   { label: "Scheduled",   color: "#6366F1", bg: "#EEF2FF" },
  cancelled:   { label: "Cancelled",   color: "#EF4444", bg: "#FEF2F2" },
  delayed:     { label: "Delayed",     color: "#F97316", bg: "#FFF7ED" },
};

const DELAY_OPTIONS = [10, 15, 20, 30, 45, 60];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:      #1A1F2E;
    --ink2:     #2D3548;
    --muted:    #64748B;
    --border:   #E8EDF5;
    --surface:  #F7F9FC;
    --white:    #FFFFFF;
    --teal:     #0D9488;
    --teal-lt:  #14B8A6;
    --teal-pale:#F0FDFA;
    --amber:    #D97706;
    --amber-lt: #F59E0B;
    --amber-pale:#FFFBEB;
    --rose:     #E11D48;
    --rose-pale:#FFF1F2;
    --violet:   #7C3AED;
    --r:        14px;
    --shadow:   0 2px 16px rgba(26,31,46,0.07);
    --shadow-lg:0 12px 40px rgba(26,31,46,0.14);
  }

  body { font-family: 'Mulish', sans-serif; background: var(--surface); color: var(--ink); -webkit-font-smoothing: antialiased; }

  .shell { display: flex; min-height: 100vh; }

  /* ── Left Panel ── */
  .left-panel {
    width: 280px; flex-shrink: 0;
    background: var(--ink);
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh;
    overflow-y: auto;
  }

  .officer-card-hero {
    padding: 28px 22px 22px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    text-align: center;
  }
  .hero-avatar {
    width: 70px; height: 70px; border-radius: 50%;
    background: linear-gradient(135deg, var(--teal), var(--teal-lt));
    color: white; font-size: 22px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;
    box-shadow: 0 0 0 4px rgba(13,148,136,0.2);
    font-family: 'Playfair Display', serif;
  }
  .hero-name { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: white; }
  .hero-desig { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 4px; }
  .hero-dept  { margin-top: 10px; display: inline-block; background: rgba(13,148,136,0.2); color: var(--teal-lt); font-size: 10px; font-weight: 600; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(13,148,136,0.3); }

  /* Day summary */
  .day-summary { padding: 18px 20px; }
  .ds-title { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
  .ds-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ds-stat {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 12px;
  }
  .ds-num   { font-size: 22px; font-weight: 700; color: white; line-height: 1; }
  .ds-label { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 4px; }

  /* Timeline nav */
  .timeline-nav { padding: 0 14px 20px; flex: 1; overflow-y: auto; }
  .tn-date { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding: 0 6px; }
  .tn-slot {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 10px 8px; border-radius: 10px; cursor: pointer;
    margin-bottom: 4px; transition: all 0.15s; position: relative;
  }
  .tn-slot:hover { background: rgba(255,255,255,0.05); }
  .tn-slot.active { background: rgba(13,148,136,0.15); border: 1px solid rgba(13,148,136,0.2); }
  .tn-slot.current { background: rgba(13,148,136,0.2); border: 1px solid var(--teal); }
  .tn-line-wrap { display: flex; flex-direction: column; align-items: center; }
  .tn-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
  .tn-line { width: 1px; background: rgba(255,255,255,0.08); flex: 1; min-height: 16px; margin: 3px 0; }
  .tn-time { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); font-family: 'Mulish', monospace; margin-bottom: 2px; }
  .tn-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); }
  .tn-purpose { font-size: 10px; color: rgba(255,255,255,0.35); }
  .tn-slot.active .tn-time, .tn-slot.active .tn-name { color: var(--teal-lt); }
  .tn-slot.current .tn-time, .tn-slot.current .tn-name { color: white; }

  /* ── Right Panel ── */
  .right-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; }

  /* Topbar */
  .topbar {
    background: var(--white); border-bottom: 1px solid var(--border);
    padding: 16px 28px; display: flex; align-items: center; gap: 14px;
    position: sticky; top: 0; z-index: 50;
  }
  .tb-greeting { }
  .tb-greeting h1 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: var(--ink); }
  .tb-greeting p  { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .tb-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .status-toggle {
    display: flex; align-items: center; gap: 8px;
    background: var(--teal-pale); border: 1.5px solid var(--teal-lt);
    border-radius: 20px; padding: 6px 14px;
    font-size: 12px; font-weight: 700; color: var(--teal); cursor: pointer;
  }
  .status-toggle-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--teal); animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .break-btn {
    background: var(--amber-pale); border: 1.5px solid var(--amber-lt);
    color: var(--amber); border-radius: 20px; padding: 6px 14px;
    font-family: 'Mulish', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer;
  }

  /* Body */
  .body-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; padding: 24px 28px; }

  /* ── Current Meeting Card ── */
  .current-card {
    background: linear-gradient(135deg, var(--ink), var(--ink2));
    border-radius: var(--r);
    padding: 24px;
    margin-bottom: 20px;
    position: relative; overflow: hidden;
  }
  .current-card::before {
    content: '';
    position: absolute; top: -40px; right: -40px;
    width: 180px; height: 180px;
    background: radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%);
  }
  .current-card::after {
    content: 'NOW';
    position: absolute; top: 20px; right: 20px;
    background: rgba(13,148,136,0.25); color: var(--teal-lt);
    font-size: 10px; font-weight: 800; letter-spacing: 2px;
    padding: 4px 10px; border-radius: 20px;
    border: 1px solid rgba(13,148,136,0.4);
  }
  .cc-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
  .cc-visitor { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .cc-avatar {
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    color: white; font-size: 16px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
  }
  .cc-name { font-size: 20px; font-weight: 700; color: white; font-family: 'Playfair Display', serif; }
  .cc-purpose-tag {
    display: inline-block; font-size: 11px; font-weight: 600;
    padding: 3px 10px; border-radius: 6px; margin-top: 4px;
  }
  .cc-meta { display: flex; gap: 24px; margin-bottom: 18px; }
  .cc-meta-item .cc-mlabel { font-size: 10px; color: rgba(255,255,255,0.35); }
  .cc-meta-item .cc-mval   { font-size: 13px; font-weight: 600; color: white; margin-top: 2px; }
  .cc-notes {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px; padding: 10px 14px;
    font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.5;
    margin-bottom: 18px;
  }
  .cc-actions { display: flex; gap: 10px; }
  .cc-btn-done {
    flex: 1; padding: 12px; background: var(--teal); color: white;
    border: none; border-radius: 10px; font-family: 'Mulish', sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s;
  }
  .cc-btn-done:hover { background: var(--teal-lt); }
  .cc-btn-delay {
    padding: 12px 18px; background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7);
    border-radius: 10px; font-family: 'Mulish', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .cc-btn-delay:hover { background: rgba(255,255,255,0.12); color: white; }
  .cc-btn-cancel {
    padding: 12px 16px; background: rgba(225,29,72,0.12);
    border: 1px solid rgba(225,29,72,0.25); color: #F87171;
    border-radius: 10px; font-family: 'Mulish', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer;
  }

  /* ── Schedule List ── */
  .section-title { font-size: 13px; font-weight: 700; color: var(--ink); margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
  .section-count { font-size: 11px; color: var(--muted); font-weight: 500; }

  .schedule-item {
    background: var(--white); border-radius: var(--r);
    border: 1px solid var(--border);
    padding: 16px 18px;
    margin-bottom: 10px;
    display: flex; align-items: flex-start; gap: 14px;
    box-shadow: var(--shadow);
    transition: all 0.15s; cursor: pointer;
    animation: slideIn 0.3s ease both;
  }
  @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .schedule-item:hover { border-color: var(--teal-lt); transform: translateX(3px); }
  .schedule-item.in-meeting { border-left: 3px solid var(--teal); }
  .schedule-item.completed  { opacity: 0.55; }
  .schedule-item.cancelled  { opacity: 0.45; }

  .si-time {
    min-width: 64px; text-align: center;
    background: var(--surface); border-radius: 8px; padding: 8px 6px;
  }
  .si-time-val { font-size: 13px; font-weight: 700; color: var(--ink); font-family: 'Mulish', monospace; }
  .si-time-dur { font-size: 10px; color: var(--muted); margin-top: 2px; }
  .si-body { flex: 1; min-width: 0; }
  .si-name { font-size: 14px; font-weight: 700; color: var(--ink); }
  .si-purpose {
    display: inline-block; font-size: 10px; font-weight: 700;
    padding: 2px 8px; border-radius: 5px; margin: 4px 0;
    border: 1px solid;
  }
  .si-notes { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .si-status { flex-shrink: 0; }
  .status-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 20px;
    font-size: 10px; font-weight: 700;
  }
  .status-dot { width: 5px; height: 5px; border-radius: 50%; }
  .delayed-badge {
    background: var(--amber-pale); color: var(--amber);
    font-size: 10px; font-weight: 700; padding: 2px 8px;
    border-radius: 5px; border: 1px solid #FDE68A; margin-top: 4px;
    display: inline-block;
  }

  /* ── Right Sidebar ── */
  .right-sidebar { display: flex; flex-direction: column; gap: 16px; }

  /* Next up card */
  .next-card {
    background: var(--white); border-radius: var(--r);
    border: 1px solid var(--border); padding: 18px;
    box-shadow: var(--shadow);
  }
  .next-card-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .next-name { font-size: 16px; font-weight: 700; color: var(--ink); font-family: 'Playfair Display', serif; }
  .next-time { font-size: 13px; font-weight: 600; color: var(--teal); margin-top: 4px; }
  .next-purpose { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .next-notes-box {
    background: var(--surface); border-radius: 8px; padding: 10px 12px;
    font-size: 11px; color: var(--muted); margin-top: 12px; line-height: 1.5;
    border-left: 3px solid var(--teal-lt);
  }

  /* Delay panel */
  .delay-card {
    background: var(--white); border-radius: var(--r);
    border: 1px solid var(--border); padding: 18px;
    box-shadow: var(--shadow);
  }
  .delay-title { font-size: 13px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
  .delay-sub   { font-size: 11px; color: var(--muted); margin-bottom: 14px; }
  .delay-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .delay-btn {
    padding: 10px 6px; border-radius: 8px; text-align: center;
    border: 1.5px solid var(--border); background: var(--surface);
    cursor: pointer; font-family: 'Mulish', sans-serif;
    font-size: 12px; font-weight: 700; color: var(--ink);
    transition: all 0.15s;
  }
  .delay-btn:hover { border-color: var(--amber-lt); background: var(--amber-pale); color: var(--amber); }
  .delay-btn.selected { border-color: var(--amber); background: var(--amber-pale); color: var(--amber); }
  .delay-confirm {
    margin-top: 12px; width: 100%; padding: 11px;
    background: var(--amber); color: white; border: none;
    border-radius: 8px; font-family: 'Mulish', sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s;
  }
  .delay-confirm:hover { background: var(--amber-lt); }
  .delay-confirm:disabled { background: var(--border); color: var(--muted); cursor: not-allowed; }
  .delay-note { font-size: 10px; color: var(--muted); text-align: center; margin-top: 8px; }

  /* Progress ring */
  .day-progress { background: var(--white); border-radius: var(--r); border: 1px solid var(--border); padding: 18px; box-shadow: var(--shadow); }
  .dp-title { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
  .dp-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .dp-label { font-size: 12px; color: var(--ink); }
  .dp-bar-wrap { width: 140px; height: 6px; background: var(--surface); border-radius: 3px; overflow: hidden; }
  .dp-bar { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
  .dp-val { font-size: 12px; font-weight: 700; color: var(--ink); min-width: 28px; text-align: right; }

  /* ── Modal ── */
  .overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(26,31,46,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    background: var(--white); border-radius: 18px;
    width: 100%; max-width: 440px;
    box-shadow: var(--shadow-lg);
    animation: popUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes popUp { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
  .modal-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-size: 16px; font-weight: 700; color: var(--ink); font-family: 'Playfair Display', serif; }
  .modal-close { background: none; border: none; font-size: 22px; color: var(--muted); cursor: pointer; line-height: 1; }
  .modal-body { padding: 20px 22px; }
  .modal-footer { padding: 16px 22px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; }
  .btn-teal {
    background: var(--teal); color: white; border: none; border-radius: 9px;
    padding: 10px 22px; font-family: 'Mulish', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer;
  }
  .btn-ghost {
    background: transparent; color: var(--muted); border: 1px solid var(--border);
    border-radius: 9px; padding: 10px 18px; font-family: 'Mulish', sans-serif; font-size: 13px; cursor: pointer;
  }

  /* ── Toast ── */
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 300;
    background: var(--ink); color: white; border-radius: 10px;
    padding: 12px 20px; font-size: 13px; font-weight: 500;
    display: flex; align-items: center; gap: 10px;
    box-shadow: var(--shadow-lg);
    animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
    border-left: 3px solid var(--teal);
  }
  @keyframes toastIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }

  /* ── Empty ── */
  .no-current {
    background: var(--surface); border: 1.5px dashed var(--border);
    border-radius: var(--r); padding: 32px; text-align: center;
    margin-bottom: 20px; color: var(--muted);
  }
  .no-current h3 { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }

  .fade-in { animation: slideIn 0.3s ease; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusPill({ status, delayMins }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  return (
    <div>
      <span className="status-pill" style={{ background: cfg.bg, color: cfg.color }}>
        <span className="status-dot" style={{ background: cfg.color }} />
        {cfg.label}
      </span>
      {delayMins > 0 && <div className="delayed-badge">+{delayMins}m delay</div>}
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return <div className="toast">✓ {msg}</div>;
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function MadamDashboard() {
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [selectedDelay, setSelectedDelay] = useState(null);
  const [toast, setToast] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [activeSlot, setActiveSlot] = useState("SHA-00123");

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const current    = schedule.find(s => s.status === "in-meeting");
  const waiting    = schedule.filter(s => s.status === "waiting");
  const upcoming   = schedule.filter(s => s.status === "scheduled");
  const done       = schedule.filter(s => s.status === "completed");
  const cancelled  = schedule.filter(s => s.status === "cancelled");
  const nextUp     = waiting[0] || upcoming[0];

  const stats = {
    total:     schedule.length,
    done:      done.length,
    remaining: waiting.length + upcoming.length + (current ? 1 : 0),
    cancelled: cancelled.length,
  };

  const markDone = (id) => {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, status: "completed", delayMins: 0 } : s));
    setToast("Meeting marked as completed");
    setDetailItem(null);
  };

  const applyDelay = () => {
    if (!selectedDelay) return;
    setSchedule(prev => prev.map(s =>
      ["waiting", "scheduled", "in-meeting"].includes(s.status)
        ? { ...s, delayMins: (s.delayMins || 0) + selectedDelay }
        : s
    ));
    setToast(`All upcoming visitors notified — ${selectedDelay}min delay`);
    setSelectedDelay(null);
  };

  const cancelMeeting = (id) => {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, status: "cancelled" } : s));
    setToast("Meeting cancelled — visitor notified");
    setDetailItem(null);
  };

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* ── Left Panel ── */}
        <div className="left-panel">
          <div className="officer-card-hero">
            <div className="hero-avatar">{OFFICER.avatar}</div>
            <div className="hero-name">{OFFICER.name}</div>
            <div className="hero-desig">{OFFICER.designation}</div>
            <div className="hero-dept">{OFFICER.department}</div>
          </div>

          <div className="day-summary">
            <div className="ds-title">Today at a Glance</div>
            <div className="ds-stats">
              {[
                { num: stats.total,     label: "Total",     color: "white" },
                { num: stats.done,      label: "Completed", color: "#10B981" },
                { num: stats.remaining, label: "Remaining", color: "#F59E0B" },
                { num: stats.cancelled, label: "Cancelled", color: "#EF4444" },
              ].map((s, i) => (
                <div className="ds-stat" key={i}>
                  <div className="ds-num" style={{ color: s.color }}>{s.num}</div>
                  <div className="ds-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="timeline-nav">
            <div className="tn-date">{dateStr}</div>
            {schedule.map((s, i) => {
              const cfg = STATUS_CONFIG[s.status];
              const isCurrent = s.status === "in-meeting";
              const isActive  = s.id === activeSlot;
              return (
                <div
                  key={s.id}
                  className={`tn-slot ${isCurrent ? "current" : isActive ? "active" : ""}`}
                  onClick={() => { setActiveSlot(s.id); setDetailItem(s); }}
                >
                  <div className="tn-line-wrap">
                    <div className="tn-dot" style={{ background: cfg?.color || "#6366F1" }} />
                    {i < schedule.length - 1 && <div className="tn-line" />}
                  </div>
                  <div>
                    <div className="tn-time">{s.time}{s.delayMins > 0 ? ` (+${s.delayMins}m)` : ""}</div>
                    <div className="tn-name">{s.name}</div>
                    <div className="tn-purpose">{s.purpose}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="right-panel">

          {/* Topbar */}
          <div className="topbar">
            <div className="tb-greeting">
              <h1>Good Morning, Madam</h1>
              <p>{dateStr} · {timeStr}</p>
            </div>
            <div className="tb-right">
              <button className="break-btn">☕ Take a Break</button>
              <div className="status-toggle">
                <span className="status-toggle-dot" />
                Available
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="body-grid">

            {/* Left column */}
            <div>
              {/* Current meeting */}
              {current ? (
                <div className="current-card">
                  <div className="cc-label">Current Meeting</div>
                  <div className="cc-visitor">
                    <div className="cc-avatar">{current.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="cc-name">{current.name}</div>
                      <span
                        className="cc-purpose-tag"
                        style={{
                          background: PURPOSE_COLORS[current.purpose]?.bg,
                          color: PURPOSE_COLORS[current.purpose]?.color,
                          border: `1px solid ${PURPOSE_COLORS[current.purpose]?.border}`,
                        }}
                      >
                        {current.purpose}
                      </span>
                    </div>
                  </div>
                  <div className="cc-meta">
                    <div className="cc-meta-item"><div className="cc-mlabel">Slot</div><div className="cc-mval">{current.time}</div></div>
                    <div className="cc-meta-item"><div className="cc-mlabel">Duration</div><div className="cc-mval">{current.duration} mins</div></div>
                    <div className="cc-meta-item"><div className="cc-mlabel">Mobile</div><div className="cc-mval">{current.mobile}</div></div>
                  </div>
                  <div className="cc-notes">📝 {current.notes}</div>
                  <div className="cc-actions">
                    <button className="cc-btn-done" onClick={() => markDone(current.id)}>✓ Mark Complete</button>
                    <button className="cc-btn-delay" onClick={() => setSelectedDelay(15)}>⏱ Delay</button>
                    <button className="cc-btn-cancel" onClick={() => cancelMeeting(current.id)}>✕</button>
                  </div>
                </div>
              ) : (
                <div className="no-current">
                  <h3>No Active Meeting</h3>
                  <p>Your next appointment is ready when you are</p>
                </div>
              )}

              {/* Waiting */}
              {waiting.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div className="section-title">
                    Waiting <span className="section-count">{waiting.length} visitor{waiting.length > 1 ? "s" : ""}</span>
                  </div>
                  {waiting.map((s, i) => (
                    <div
                      key={s.id}
                      className="schedule-item"
                      style={{ animationDelay: `${i * 0.06}s` }}
                      onClick={() => setDetailItem(s)}
                    >
                      <div className="si-time">
                        <div className="si-time-val">{s.time}</div>
                        <div className="si-time-dur">{s.duration}m</div>
                      </div>
                      <div className="si-body">
                        <div className="si-name">{s.name}</div>
                        <span
                          className="si-purpose"
                          style={{
                            background: PURPOSE_COLORS[s.purpose]?.bg,
                            color: PURPOSE_COLORS[s.purpose]?.color,
                            borderColor: PURPOSE_COLORS[s.purpose]?.border,
                          }}
                        >{s.purpose}</span>
                        <div className="si-notes">{s.notes}</div>
                      </div>
                      <div className="si-status"><StatusPill status={s.status} delayMins={s.delayMins} /></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div className="section-title">
                    Upcoming <span className="section-count">{upcoming.length} appointments</span>
                  </div>
                  {upcoming.map((s, i) => (
                    <div
                      key={s.id}
                      className="schedule-item"
                      style={{ animationDelay: `${i * 0.05}s` }}
                      onClick={() => setDetailItem(s)}
                    >
                      <div className="si-time">
                        <div className="si-time-val">{s.time}</div>
                        <div className="si-time-dur">{s.duration}m</div>
                      </div>
                      <div className="si-body">
                        <div className="si-name">{s.name}</div>
                        <span
                          className="si-purpose"
                          style={{
                            background: PURPOSE_COLORS[s.purpose]?.bg,
                            color: PURPOSE_COLORS[s.purpose]?.color,
                            borderColor: PURPOSE_COLORS[s.purpose]?.border,
                          }}
                        >{s.purpose}</span>
                        <div className="si-notes">{s.notes}</div>
                      </div>
                      <div className="si-status"><StatusPill status={s.status} delayMins={s.delayMins} /></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed */}
              {done.length > 0 && (
                <div>
                  <div className="section-title">
                    Completed <span className="section-count">{done.length} today</span>
                  </div>
                  {done.map((s, i) => (
                    <div key={s.id} className="schedule-item completed" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => setDetailItem(s)}>
                      <div className="si-time">
                        <div className="si-time-val">{s.time}</div>
                        <div className="si-time-dur">{s.duration}m</div>
                      </div>
                      <div className="si-body">
                        <div className="si-name">{s.name}</div>
                        <span className="si-purpose" style={{ background: PURPOSE_COLORS[s.purpose]?.bg, color: PURPOSE_COLORS[s.purpose]?.color, borderColor: PURPOSE_COLORS[s.purpose]?.border }}>{s.purpose}</span>
                      </div>
                      <div className="si-status"><StatusPill status={s.status} delayMins={0} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="right-sidebar">

              {/* Next up */}
              {nextUp && (
                <div className="next-card">
                  <div className="next-card-label">Up Next</div>
                  <div className="next-name">{nextUp.name}</div>
                  <div className="next-time">⏰ {nextUp.time} · {nextUp.duration} mins</div>
                  <div className="next-purpose">{nextUp.purpose}</div>
                  <div className="next-notes-box">{nextUp.notes}</div>
                </div>
              )}

              {/* Delay panel */}
              <div className="delay-card">
                <div className="delay-title">⏱ Report a Delay</div>
                <div className="delay-sub">Notifies all waiting & upcoming visitors</div>
                <div className="delay-grid">
                  {DELAY_OPTIONS.map(d => (
                    <div
                      key={d}
                      className={`delay-btn ${selectedDelay === d ? "selected" : ""}`}
                      onClick={() => setSelectedDelay(selectedDelay === d ? null : d)}
                    >
                      +{d}m
                    </div>
                  ))}
                </div>
                <button className="delay-confirm" disabled={!selectedDelay} onClick={applyDelay}>
                  {selectedDelay ? `Notify Delay of +${selectedDelay} mins` : "Select delay duration"}
                </button>
                <div className="delay-note">SMS will be sent to all affected visitors</div>
              </div>

              {/* Day progress */}
              <div className="day-progress">
                <div className="dp-title">Day Progress</div>
                {[
                  { label: "Completed", val: stats.done,      total: stats.total, color: "#10B981" },
                  { label: "Remaining", val: stats.remaining,  total: stats.total, color: "#F59E0B" },
                  { label: "Cancelled", val: stats.cancelled,  total: stats.total, color: "#EF4444" },
                ].map((r, i) => (
                  <div className="dp-row" key={i}>
                    <div className="dp-label">{r.label}</div>
                    <div className="dp-bar-wrap">
                      <div className="dp-bar" style={{ width: `${(r.val / r.total) * 100}%`, background: r.color }} />
                    </div>
                    <div className="dp-val">{r.val}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ── Detail Modal ── */}
        {detailItem && (
          <div className="overlay" onClick={() => setDetailItem(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">{detailItem.name}</div>
                <button className="modal-close" onClick={() => setDetailItem(null)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  {[
                    { l: "Appointment ID", v: detailItem.id },
                    { l: "Mobile", v: detailItem.mobile },
                    { l: "Time Slot", v: detailItem.time },
                    { l: "Duration", v: `${detailItem.duration} mins` },
                    { l: "Purpose", v: detailItem.purpose },
                    { l: "Status", v: <StatusPill status={detailItem.status} delayMins={detailItem.delayMins} /> },
                  ].map((r, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 4 }}>{r.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1F2E" }}>{r.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#F7F9FC", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#64748B", borderLeft: "3px solid #14B8A6" }}>
                  📝 {detailItem.notes}
                </div>
              </div>
              <div className="modal-footer">
                {detailItem.status === "in-meeting" && (
                  <button className="btn-teal" onClick={() => markDone(detailItem.id)}>✓ Complete</button>
                )}
                {["waiting", "scheduled", "in-meeting"].includes(detailItem.status) && (
                  <button
                    style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA", borderRadius: 9, padding: "10px 18px", cursor: "pointer", fontFamily: "Mulish", fontSize: 13 }}
                    onClick={() => cancelMeeting(detailItem.id)}
                  >
                    Cancel Meeting
                  </button>
                )}
                <button className="btn-ghost" onClick={() => setDetailItem(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      </div>
    </>
  );
}
