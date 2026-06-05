import { useState, useEffect } from "react";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const OFFICERS = [
  { id: 1, name: "Mrs. Rekha Sharma", designation: "CEO", department: "General Administration", avatar: "RS" },
  { id: 2, name: "Mr. Dinesh Patil", designation: "Deputy Director", department: "Education & Scholarships", avatar: "DP" },
  { id: 3, name: "Mrs. Sunita Meshram", designation: "Assistant Commissioner", department: "Employment & Welfare", avatar: "SM" },
  { id: 4, name: "Mr. Rajesh Borde", designation: "District Officer", department: "Grievance Redressal", avatar: "RB" },
];

const PURPOSES = [
  { id: "education", label: "Education", icon: "🎓" },
  { id: "scholarship", label: "Scholarship", icon: "📜" },
  { id: "employment", label: "Employment", icon: "💼" },
  { id: "grievance", label: "Grievance", icon: "📣" },
  { id: "certificate", label: "Certificate", icon: "📋" },
  { id: "other", label: "Other", icon: "💬" },
];

const generateSlots = (isToday = false) => {
  const allSlots = [
    "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  ];
  if (isToday) {
    const available = ["11:30 AM", "12:00 PM", "02:30 PM", "03:00 PM"];
    return allSlots.map(s => ({ time: s, available: available.includes(s) }));
  }
  return allSlots.map((s, i) => ({ time: s, available: i % 3 !== 1 }));
};

const getDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const day = d.getDay();
    if (day !== 0 && day !== 6) dates.push(d);
  }
  return dates;
};

const formatDate = (d) =>
  d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

const genID = () => "SHA-" + Math.floor(10000 + Math.random() * 90000);

// ─── Styles / Theme ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --saffron: #FF6B1A;
    --saffron-light: #FF8C47;
    --saffron-pale: #FFF0E8;
    --green: #1A7A4A;
    --green-light: #22A060;
    --green-pale: #E8F7EF;
    --navy: #0F1F3D;
    --navy-mid: #1E3560;
    --slate: #4A5568;
    --mist: #F7F8FA;
    --white: #FFFFFF;
    --border: #E2E8F0;
    --shadow: 0 4px 24px rgba(15,31,61,0.10);
    --shadow-lg: 0 8px 40px rgba(15,31,61,0.16);
    --radius: 16px;
    --radius-sm: 10px;
  }

  body { font-family: 'Sora', sans-serif; background: var(--mist); color: var(--navy); -webkit-font-smoothing: antialiased; }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--mist);
  }

  /* ── Header ── */
  .header {
    background: var(--navy);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-emblem {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--saffron), #FFB347);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: white;
    flex-shrink: 0;
  }
  .header-title { color: white; }
  .header-title h1 { font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
  .header-title p { font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 1px; font-family: 'Noto Sans Devanagari', sans-serif; }
  .header-badge {
    margin-left: auto;
    background: rgba(255,107,26,0.25);
    color: var(--saffron-light);
    font-size: 10px; font-weight: 600;
    padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(255,107,26,0.3);
    letter-spacing: 0.5px;
  }

  /* ── Progress ── */
  .progress-bar {
    background: var(--navy-mid);
    padding: 12px 20px;
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .progress-step {
    flex: 1; height: 3px;
    background: rgba(255,255,255,0.15);
    border-radius: 2px;
    transition: background 0.4s ease;
  }
  .progress-step.done { background: var(--saffron); }
  .progress-step.active { background: rgba(255,107,26,0.5); }
  .progress-label {
    color: rgba(255,255,255,0.5);
    font-size: 10px; font-weight: 500;
    margin-left: 8px;
    white-space: nowrap;
  }
  .progress-label span { color: var(--saffron-light); font-weight: 600; }

  /* ── Main Content ── */
  .content { flex: 1; padding: 20px 16px 40px; max-width: 480px; margin: 0 auto; width: 100%; }

  .step-header { margin-bottom: 24px; }
  .step-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--saffron-pale);
    color: var(--saffron);
    font-size: 11px; font-weight: 600;
    padding: 4px 12px; border-radius: 20px;
    margin-bottom: 10px;
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .step-tag-dot { width: 6px; height: 6px; background: var(--saffron); border-radius: 50%; }
  .step-title { font-size: 22px; font-weight: 700; color: var(--navy); line-height: 1.2; }
  .step-sub { font-size: 13px; color: var(--slate); margin-top: 6px; }

  /* ── Cards ── */
  .card {
    background: var(--white);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    padding: 18px;
    box-shadow: var(--shadow);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .card:hover { border-color: var(--saffron-light); transform: translateY(-1px); box-shadow: var(--shadow-lg); }
  .card.selected { border-color: var(--saffron); background: var(--saffron-pale); }
  .card.selected::before {
    content: '✓';
    position: absolute; top: 12px; right: 14px;
    width: 22px; height: 22px;
    background: var(--saffron);
    color: white; font-size: 11px; font-weight: 700;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .card-grid { display: flex; flex-direction: column; gap: 12px; }

  /* ── Intent Cards ── */
  .intent-card {
    background: var(--white);
    border-radius: var(--radius);
    border: 2px solid var(--border);
    padding: 22px 20px;
    cursor: pointer;
    display: flex; align-items: center; gap: 16px;
    transition: all 0.2s ease;
  }
  .intent-card:hover { border-color: var(--saffron-light); transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  .intent-card.walk-in { border-color: #FFD700; }
  .intent-card.walk-in:hover { background: #FFFEF0; }
  .intent-icon {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; flex-shrink: 0;
  }
  .intent-icon.orange { background: var(--saffron-pale); }
  .intent-icon.green { background: var(--green-pale); }
  .intent-card-body h3 { font-size: 15px; font-weight: 600; color: var(--navy); }
  .intent-card-body p { font-size: 12px; color: var(--slate); margin-top: 3px; }
  .intent-arrow { margin-left: auto; color: var(--slate); font-size: 18px; }

  /* ── Officer Card ── */
  .officer-card { display: flex; align-items: center; gap: 14px; }
  .officer-avatar {
    width: 46px; height: 46px; border-radius: 12px;
    background: linear-gradient(135deg, var(--navy), var(--navy-mid));
    color: white; font-size: 13px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .officer-name { font-size: 14px; font-weight: 600; color: var(--navy); }
  .officer-desig { font-size: 11px; color: var(--slate); margin-top: 2px; }
  .officer-dept {
    margin-top: 5px;
    display: inline-block;
    background: var(--mist);
    color: var(--slate);
    font-size: 10px; font-weight: 500;
    padding: 2px 8px; border-radius: 6px;
  }

  /* ── Purpose Grid ── */
  .purpose-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .purpose-card {
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 16px 12px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
  }
  .purpose-card:hover { border-color: var(--saffron-light); }
  .purpose-card.selected { border-color: var(--saffron); background: var(--saffron-pale); }
  .purpose-emoji { font-size: 26px; margin-bottom: 6px; }
  .purpose-label { font-size: 12px; font-weight: 600; color: var(--navy); }

  /* ── Date Strip ── */
  .date-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; -ms-overflow-style: none; scrollbar-width: none; }
  .date-strip::-webkit-scrollbar { display: none; }
  .date-chip {
    flex-shrink: 0;
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
    min-width: 64px;
  }
  .date-chip:hover { border-color: var(--saffron-light); }
  .date-chip.selected { border-color: var(--saffron); background: var(--saffron-pale); }
  .date-chip-day { font-size: 10px; font-weight: 500; color: var(--slate); text-transform: uppercase; letter-spacing: 0.5px; }
  .date-chip-num { font-size: 18px; font-weight: 700; color: var(--navy); line-height: 1.1; margin: 2px 0; }
  .date-chip-mon { font-size: 10px; color: var(--slate); }
  .date-chip.selected .date-chip-day,
  .date-chip.selected .date-chip-num,
  .date-chip.selected .date-chip-mon { color: var(--saffron); }

  /* ── Slots ── */
  .slot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .slot-btn {
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 8px;
    cursor: pointer;
    text-align: center;
    font-family: 'Sora', sans-serif;
    font-size: 12px; font-weight: 600;
    color: var(--navy);
    transition: all 0.2s;
  }
  .slot-btn:hover:not(:disabled) { border-color: var(--saffron-light); }
  .slot-btn.selected { border-color: var(--saffron); background: var(--saffron-pale); color: var(--saffron); }
  .slot-btn:disabled { background: #F0F0F0; color: #B0B0B0; cursor: not-allowed; border-color: #E0E0E0; }
  .slot-btn.taken { text-decoration: line-through; }

  /* ── Form ── */
  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--navy); margin-bottom: 6px; display: block; letter-spacing: 0.3px; }
  .form-input {
    width: 100%; padding: 13px 16px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'Sora', sans-serif;
    font-size: 14px; color: var(--navy);
    background: var(--white);
    outline: none;
    transition: border 0.2s;
  }
  .form-input:focus { border-color: var(--saffron); }
  .form-input::placeholder { color: #B0B8C8; }

  /* ── Summary Card ── */
  .summary-card {
    background: var(--white);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .summary-header {
    background: linear-gradient(135deg, var(--navy), var(--navy-mid));
    padding: 18px 20px;
    display: flex; align-items: center; gap: 12px;
  }
  .summary-header-icon {
    width: 44px; height: 44px;
    background: rgba(255,107,26,0.2);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  }
  .summary-header-text h3 { font-size: 15px; font-weight: 700; color: white; }
  .summary-header-text p { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }
  .summary-body { padding: 18px 20px; }
  .summary-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .summary-row:last-child { border-bottom: none; }
  .summary-icon { font-size: 16px; width: 20px; flex-shrink: 0; margin-top: 1px; }
  .summary-key { font-size: 11px; color: var(--slate); margin-bottom: 2px; }
  .summary-val { font-size: 13px; font-weight: 600; color: var(--navy); }

  /* ── Buttons ── */
  .btn-primary {
    width: 100%; padding: 16px;
    background: linear-gradient(135deg, var(--saffron), var(--saffron-light));
    color: white; font-family: 'Sora', sans-serif;
    font-size: 15px; font-weight: 700;
    border: none; border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(255,107,26,0.35);
    letter-spacing: 0.3px;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,107,26,0.45); }
  .btn-primary:disabled { background: #D0D5DD; box-shadow: none; cursor: not-allowed; transform: none; }
  .btn-secondary {
    width: 100%; padding: 14px;
    background: transparent;
    color: var(--slate); font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 500;
    border: 1.5px solid var(--border); border-radius: var(--radius-sm);
    cursor: pointer; margin-top: 10px;
    transition: all 0.2s;
  }
  .btn-secondary:hover { border-color: var(--slate); color: var(--navy); }
  .btn-back {
    background: none; border: none; cursor: pointer;
    color: var(--slate); font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 500;
    display: flex; align-items: center; gap: 6px;
    padding: 0; margin-bottom: 20px;
  }
  .btn-back:hover { color: var(--navy); }

  /* ── Confirmation ── */
  .confirm-screen { text-align: center; padding: 20px 0; }
  .confirm-icon {
    width: 80px; height: 80px;
    background: linear-gradient(135deg, var(--green), var(--green-light));
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; margin: 0 auto 20px;
    box-shadow: 0 8px 24px rgba(26,122,74,0.3);
    animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  @keyframes pop { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  .confirm-title { font-size: 24px; font-weight: 700; color: var(--navy); }
  .confirm-sub { font-size: 13px; color: var(--slate); margin-top: 6px; }

  .token-card {
    background: linear-gradient(135deg, var(--navy), var(--navy-mid));
    border-radius: var(--radius);
    padding: 24px 20px;
    margin: 24px 0;
    position: relative; overflow: hidden;
  }
  .token-card::before {
    content: '';
    position: absolute; top: -30px; right: -30px;
    width: 120px; height: 120px;
    background: rgba(255,107,26,0.12);
    border-radius: 50%;
  }
  .token-card::after {
    content: '';
    position: absolute; bottom: -20px; left: -20px;
    width: 80px; height: 80px;
    background: rgba(255,107,26,0.08);
    border-radius: 50%;
  }
  .token-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: 1px; text-transform: uppercase; }
  .token-id { font-size: 32px; font-weight: 700; color: var(--saffron-light); letter-spacing: 2px; margin: 4px 0; }
  .token-meta { display: flex; gap: 20px; margin-top: 16px; }
  .token-meta-item { }
  .token-meta-item .tlabel { font-size: 10px; color: rgba(255,255,255,0.4); }
  .token-meta-item .tval { font-size: 13px; font-weight: 600; color: white; margin-top: 2px; }
  .token-queue {
    position: absolute; top: 20px; right: 20px;
    background: rgba(255,107,26,0.25);
    border: 1px solid rgba(255,107,26,0.4);
    border-radius: 8px; padding: 6px 12px;
    text-align: center;
  }
  .queue-num { font-size: 20px; font-weight: 700; color: var(--saffron-light); }
  .queue-label { font-size: 9px; color: rgba(255,255,255,0.4); }

  .notify-row { display: flex; gap: 10px; margin-top: 0; }
  .notify-btn {
    flex: 1; padding: 13px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--white);
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600;
    color: var(--navy); cursor: pointer;
    transition: all 0.2s;
  }
  .notify-btn:hover { border-color: var(--green-light); background: var(--green-pale); }

  /* ── Info Box ── */
  .info-box {
    background: var(--saffron-pale);
    border-left: 3px solid var(--saffron);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    padding: 12px 14px;
    margin-bottom: 16px;
    font-size: 12px; color: var(--navy);
  }
  .info-box strong { display: block; margin-bottom: 2px; color: var(--saffron); }

  /* ── Today slots indicator ── */
  .slot-legend { display: flex; gap: 16px; margin-bottom: 12px; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--slate); }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  .legend-dot.available { background: var(--green-light); }
  .legend-dot.taken { background: #D0D5DD; }

  /* ── Anim ── */
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0); // 0=intent, 1=officer, 2=purpose, 3=datetime, 4=form, 5=review, 6=confirm
  const [intent, setIntent] = useState(null); // 'walkin' | 'future'
  const [officer, setOfficer] = useState(null);
  const [purpose, setPurpose] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", mobile: "", notes: "" });
  const [appointmentId] = useState(genID());
  const dates = getDates();

  const totalSteps = 6;
  const stepLabels = ["Intent", "Officer", "Purpose", "Date & Time", "Details", "Review"];

  const slots = selectedDate
    ? generateSlots(false)
    : intent === "walkin"
    ? generateSlots(true)
    : [];

  const todaySlots = generateSlots(true);

  const canProceed = () => {
    if (step === 1) return !!officer;
    if (step === 2) return !!purpose;
    if (step === 3) return intent === "walkin" ? !!selectedSlot : !!selectedDate && !!selectedSlot;
    if (step === 4) return form.name.trim().length > 1 && form.mobile.trim().length === 10;
    return true;
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const handleIntent = (val) => {
    setIntent(val);
    setStep(1);
  };

  const formatSelectedDate = () => {
    if (intent === "walkin") return "Today";
    if (!selectedDate) return "—";
    return selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-emblem">अ</div>
          <div className="header-title">
            <h1>Adivasi Vikas Bhavan</h1>
            <p>आदिवासी विकास भवन • Appointment Portal</p>
          </div>
          <div className="header-badge">SHABRI</div>
        </div>

        {/* Progress */}
        {step > 0 && step < 6 && (
          <div className="progress-bar">
            {stepLabels.map((label, i) => (
              <div
                key={i}
                className={`progress-step ${i < step ? "done" : i === step ? "active" : ""}`}
              />
            ))}
            <span className="progress-label">
              <span>{step}</span>/{stepLabels.length}
            </span>
          </div>
        )}

        <div className="content">
          {/* ── STEP 0: Intent ── */}
          {step === 0 && (
            <div className="fade-in">
              <div className="step-header">
                <div className="step-tag"><span className="step-tag-dot" /> Welcome</div>
                <h2 className="step-title">Book an Appointment</h2>
                <p className="step-sub">Are you currently at the office or planning a future visit?</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="intent-card walk-in" onClick={() => handleIntent("walkin")}>
                  <div className="intent-icon orange">🏢</div>
                  <div className="intent-card-body">
                    <h3>I'm Here Now</h3>
                    <p>Book an available slot for today</p>
                  </div>
                  <span className="intent-arrow">›</span>
                </div>
                <div className="intent-card" onClick={() => handleIntent("future")}>
                  <div className="intent-icon green">📅</div>
                  <div className="intent-card-body">
                    <h3>Future Appointment</h3>
                    <p>Schedule for a later date</p>
                  </div>
                  <span className="intent-arrow">›</span>
                </div>
              </div>
              <div style={{ marginTop: 24, background: "white", borderRadius: 12, border: "1.5px solid #E2E8F0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F1F3D" }}>Track Existing Appointment</div>
                  <div style={{ fontSize: 11, color: "#4A5568", marginTop: 2 }}>Enter your appointment ID or mobile number</div>
                </div>
                <span style={{ marginLeft: "auto", color: "#FF6B1A", fontWeight: 700, fontSize: 16 }}>›</span>
              </div>
            </div>
          )}

          {/* ── STEP 1: Officer ── */}
          {step === 1 && (
            <div className="fade-in">
              <button className="btn-back" onClick={back}>← Back</button>
              <div className="step-header">
                <div className="step-tag"><span className="step-tag-dot" /> Step 1 of 5</div>
                <h2 className="step-title">Select Officer</h2>
                <p className="step-sub">Who would you like to meet?</p>
              </div>
              <div className="card-grid">
                {OFFICERS.map(o => (
                  <div
                    key={o.id}
                    className={`card ${officer?.id === o.id ? "selected" : ""}`}
                    onClick={() => setOfficer(o)}
                  >
                    <div className="officer-card">
                      <div className="officer-avatar">{o.avatar}</div>
                      <div>
                        <div className="officer-name">{o.name}</div>
                        <div className="officer-desig">{o.designation}</div>
                        <div className="officer-dept">{o.department}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <button className="btn-primary" onClick={next} disabled={!canProceed()}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Purpose ── */}
          {step === 2 && (
            <div className="fade-in">
              <button className="btn-back" onClick={back}>← Back</button>
              <div className="step-header">
                <div className="step-tag"><span className="step-tag-dot" /> Step 2 of 5</div>
                <h2 className="step-title">Purpose of Visit</h2>
                <p className="step-sub">What is your meeting about?</p>
              </div>
              <div className="purpose-grid">
                {PURPOSES.map(p => (
                  <div
                    key={p.id}
                    className={`purpose-card ${purpose?.id === p.id ? "selected" : ""}`}
                    onClick={() => setPurpose(p)}
                  >
                    <div className="purpose-emoji">{p.icon}</div>
                    <div className="purpose-label">{p.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <button className="btn-primary" onClick={next} disabled={!canProceed()}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Date & Time ── */}
          {step === 3 && (
            <div className="fade-in">
              <button className="btn-back" onClick={back}>← Back</button>
              <div className="step-header">
                <div className="step-tag"><span className="step-tag-dot" /> Step 3 of 5</div>
                <h2 className="step-title">{intent === "walkin" ? "Today's Slots" : "Pick Date & Time"}</h2>
                <p className="step-sub">
                  {intent === "walkin"
                    ? "Available slots for today — choose your time"
                    : "Select a date and an available time slot"}
                </p>
              </div>

              {intent === "walkin" && (
                <div className="info-box">
                  <strong>⚡ Walk-in Mode</strong>
                  Only available slots are shown. Booked slots are greyed out.
                </div>
              )}

              {intent === "future" && (
                <>
                  <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: "#0F1F3D" }}>Select Date</div>
                  <div className="date-strip">
                    {dates.map((d, i) => (
                      <div
                        key={i}
                        className={`date-chip ${selectedDate?.toDateString() === d.toDateString() ? "selected" : ""}`}
                        onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                      >
                        <div className="date-chip-day">{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                        <div className="date-chip-num">{d.getDate()}</div>
                        <div className="date-chip-mon">{d.toLocaleDateString("en-IN", { month: "short" })}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {(intent === "walkin" || selectedDate) && (
                <div style={{ marginTop: intent === "future" ? 20 : 0 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0F1F3D", marginBottom: 8 }}>Select Time Slot</div>
                    <div className="slot-legend">
                      <div className="legend-item"><div className="legend-dot available" /> Available</div>
                      <div className="legend-item"><div className="legend-dot taken" /> Booked</div>
                    </div>
                  </div>
                  <div className="slot-grid">
                    {(intent === "walkin" ? todaySlots : generateSlots(false)).map((s, i) => (
                      <button
                        key={i}
                        className={`slot-btn ${!s.available ? "taken" : ""} ${selectedSlot === s.time ? "selected" : ""}`}
                        disabled={!s.available}
                        onClick={() => s.available && setSelectedSlot(s.time)}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <button className="btn-primary" onClick={next} disabled={!canProceed()}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Form ── */}
          {step === 4 && (
            <div className="fade-in">
              <button className="btn-back" onClick={back}>← Back</button>
              <div className="step-header">
                <div className="step-tag"><span className="step-tag-dot" /> Step 4 of 5</div>
                <h2 className="step-title">Your Details</h2>
                <p className="step-sub">We'll send your appointment confirmation here</p>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Anshul Pagar"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  className="form-input"
                  placeholder="10-digit mobile number"
                  value={form.mobile}
                  maxLength={10}
                  onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Additional Notes (Optional)</label>
                <input
                  className="form-input"
                  placeholder="Any specific details about your visit..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="info-box" style={{ marginTop: 4 }}>
                <strong>📱 Confirmation</strong>
                Your appointment details will be sent via SMS to the above number.
              </div>
              <div style={{ marginTop: 8 }}>
                <button className="btn-primary" onClick={next} disabled={!canProceed()}>
                  Review Appointment →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Review ── */}
          {step === 5 && (
            <div className="fade-in">
              <button className="btn-back" onClick={back}>← Back</button>
              <div className="step-header">
                <div className="step-tag"><span className="step-tag-dot" /> Step 5 of 5</div>
                <h2 className="step-title">Review & Confirm</h2>
                <p className="step-sub">Please verify your appointment details</p>
              </div>
              <div className="summary-card">
                <div className="summary-header">
                  <div className="summary-header-icon">📋</div>
                  <div className="summary-header-text">
                    <h3>Appointment Summary</h3>
                    <p>Adivasi Vikas Bhavan</p>
                  </div>
                </div>
                <div className="summary-body">
                  {[
                    { icon: "👤", key: "Name", val: form.name },
                    { icon: "📱", key: "Mobile", val: form.mobile },
                    { icon: "👩‍💼", key: "Officer", val: officer?.name },
                    { icon: "🏢", key: "Department", val: officer?.department },
                    { icon: "💬", key: "Purpose", val: purpose?.label },
                    { icon: "📅", key: "Date", val: formatSelectedDate() },
                    { icon: "⏰", key: "Time", val: selectedSlot },
                  ].map((row, i) => (
                    <div className="summary-row" key={i}>
                      <span className="summary-icon">{row.icon}</span>
                      <div>
                        <div className="summary-key">{row.key}</div>
                        <div className="summary-val">{row.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <button className="btn-primary" onClick={next}>
                  ✓ Confirm Appointment
                </button>
                <button className="btn-secondary" onClick={back}>
                  Edit Details
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 6: Confirmation ── */}
          {step === 6 && (
            <div className="fade-in confirm-screen">
              <div className="confirm-icon">✓</div>
              <h2 className="confirm-title">Appointment Confirmed!</h2>
              <p className="confirm-sub">Your slot has been successfully booked</p>

              <div className="token-card">
                <div className="token-label">Appointment ID</div>
                <div className="token-id">{appointmentId}</div>
                <div className="token-meta">
                  <div className="token-meta-item">
                    <div className="tlabel">Date</div>
                    <div className="tval">{formatSelectedDate()}</div>
                  </div>
                  <div className="token-meta-item">
                    <div className="tlabel">Time</div>
                    <div className="tval">{selectedSlot}</div>
                  </div>
                  <div className="token-meta-item">
                    <div className="tlabel">Officer</div>
                    <div className="tval">{officer?.name?.split(" ")[2] || officer?.designation}</div>
                  </div>
                </div>
                <div className="token-queue">
                  <div className="queue-num">#4</div>
                  <div className="queue-label">In Queue</div>
                </div>
              </div>

              <div className="notify-row">
                <button className="notify-btn">📱 Send SMS</button>
                <button className="notify-btn">💬 WhatsApp</button>
              </div>

              <div style={{ marginTop: 16, background: "#E8F7EF", borderRadius: 10, padding: "12px 16px", textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A7A4A", marginBottom: 4 }}>📍 What happens next?</div>
                <div style={{ fontSize: 12, color: "#2D6A4F", lineHeight: 1.6 }}>
                  1. Arrive 10 mins before your slot<br />
                  2. Show your Appointment ID at reception<br />
                  3. Staff will mark your arrival<br />
                  4. You'll be called when the officer is ready
                </div>
              </div>

              <button
                className="btn-secondary"
                style={{ marginTop: 20 }}
                onClick={() => {
                  setStep(0);
                  setOfficer(null); setPurpose(null);
                  setSelectedDate(null); setSelectedSlot(null);
                  setForm({ name: "", mobile: "", notes: "" });
                  setIntent(null);
                }}
              >
                Book Another Appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
