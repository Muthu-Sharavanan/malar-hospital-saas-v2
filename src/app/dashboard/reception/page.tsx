'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Users, 
  UserPlus, 
  CalendarCheck, 
  UserRoundCheck, 
  Stethoscope, 
  Search, 
  Phone, 
  MapPin, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Bell,
  Trash2,
  Printer,
  History,
  LayoutDashboard,
  TrendingUp,
  Activity,
  ChevronRight,
  X,
  CreditCard,
  FileText,
  ChevronDown
} from 'lucide-react';

export default function ReceptionDashboard() {
  const [activeTab, setActiveTab] = useState('register');
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionFilter, setSessionFilter] = useState<'morning' | 'evening'>(
    new Date().getHours() < 12 ? 'morning' : 'evening'
  );
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [futureQueue, setFutureQueue] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  
  // Modals
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [billingForm, setBillingForm] = useState({ discount: 0, paymentMode: 'CASH', waiverReason: '', authorizingDoc: '' });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<{patient: any, history: any[]}|null>(null);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsModalData, setStatsModalData] = useState<{title: string, list: any[]}|null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{title: string, message: string, token: string, uhid?: string, whatsappSent?: boolean}|null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '', phone: '', age: '', gender: 'Male', address: '', doctorId: '', patientId: '', visitDate: '', visitTime: '', reason: '', abhaId: '', consentGranted: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Time Picker State
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [timeHour, setTimeHour] = useState('10');
  const [timeMinute, setTimeMinute] = useState('00');

  useEffect(() => {
    let h = parseInt(timeHour);
    if (timePeriod === 'PM' && h < 12) h += 12;
    if (timePeriod === 'AM' && h === 12) h = 0;
    const formattedTime = `${h.toString().padStart(2, '0')}:${timeMinute}`;
    setFormData(prev => ({ ...prev, visitTime: formattedTime }));
  }, [timeHour, timeMinute, timePeriod]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`/api/users?role=DOCTOR&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setDoctors(data.users);
        if (data.users.length > 0 && !formData.doctorId) {
          setFormData(prev => ({ ...prev, doctorId: data.users[0].id }));
        }
      }
    } catch (err) {}
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/register?session=${sessionFilter}`);
      const data = await res.json();
      if (data.success) setQueue(data.visits || data.queue || []);
    } catch (err) {}
  };

  const fetchFutureQueue = async () => {
    try {
      const res = await fetch(`/api/appointments?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const upcoming = data.visits.filter((v: any) => {
          const vDate = new Date(v.visitDate);
          return vDate >= tomorrow && v.status !== 'COMPLETED';
        });
        setFutureQueue(upcoming);
      }
    } catch (err) {}
  };

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/billing');
      const data = await res.json();
      if (data.success) setBills(data.bills);
    } catch (err) {}
  };

  useEffect(() => {
    fetchSession();
    fetchDoctors();
    fetchQueue();
    fetchBills();
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setShift(now.getHours() < 12 ? 'Morning' : 'Evening');
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionFilter]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.success) {
        setUserName(data.user.name);
        setShift(data.shift);
      }
    } catch (err) {}
  };

  const fetchPatients = async (query: string) => {
    if (!query) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/patients?q=${query}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.patients);
        setShowSearchResults(true);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (formData.phone.length === 10) fetchPatients(formData.phone);
    else if (formData.phone.length === 0) setSelectedPatient(null);
  }, [formData.phone]);

  const fetchHistory = async (patientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${patientId}/history`);
      const data = await res.json();
      if (data.success) {
        setHistoryData({ patient: data.patient, history: data.history });
        setShowHistoryModal(true);
      }
    } catch (err) {} finally { setLoading(false); }
  };

  const selectPatient = (patient: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedPatient(patient);
    setFormData({
      ...formData,
      patientId: patient.id,
      name: patient.name,
      phone: patient.phone || '',
      age: patient.age.toString(),
      gender: patient.gender,
      address: patient.address || '',
      visitDate: '',
      visitTime: '',
      reason: ''
    });
    setSearchQuery(patient.phone || patient.name);
    setShowSearchResults(false);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setFormData({ name: '', phone: '', age: '', gender: 'Male', address: '', doctorId: doctors[0]?.id || '', patientId: '', visitDate: '', visitTime: '', reason: '', abhaId: '', consentGranted: false });
    setSearchQuery('');
  };

  useEffect(() => {
    if (activeTab === 'register') fetchDoctors();
    if (activeTab === 'queue') fetchQueue();
    if (activeTab === 'future') fetchFutureQueue();
    if (activeTab === 'billing') { fetchBills(); fetchDoctors(); }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessInfo({
          title: data.isNewPatient ? "New Patient Registered!" : "Registration Successful!",
          message: data.isNewPatient ? `Permanent ID created for ${formData.name}.` : `${formData.name} added to queue.`,
          token: data.visit.tokenNumber,
          uhid: data.uhid,
          whatsappSent: !!formData.visitDate
        });
        setShowSuccessModal(true);
        clearPatient();
        if (formData.visitDate) { setActiveTab('future'); fetchFutureQueue(); } 
        else { setActiveTab('queue'); fetchQueue(); }
      } else alert(`❌ Failed: ${data.error}`);
    } catch (err) {} finally { setLoading(false); }
  };

  const toggleDoctorAvailability = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAvailable: !currentStatus })
      });
      if ((await res.json()).success) fetchDoctors();
    } catch (err) {}
  };

  const handlePayBill = async () => {
    if (!selectedBill) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/billing/${selectedBill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingForm)
      });
      if ((await res.json()).success) { setShowBillModal(false); fetchBills(); }
    } catch (error) {} finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .jakarta-font { font-family: 'Plus Jakarta Sans', sans-serif; }
        .label-style { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.15em; }
        .input-style { background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 12px; height: 52px; padding: 0 16px; font-weight: 500; transition: 0.2s; }
        .input-style:focus { border-color: #0A4D68; outline: none; box-shadow: 0 0 0 4px rgba(10, 77, 104, 0.05); }
        .btn-pill { background: #0A4D68; color: white; border-radius: 9999px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; transition: 0.2s; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
        .btn-pill:hover { background: #083D53; transform: translateY(-1px); box-shadow: 0 10px 20px rgba(10,77,104,0.15); }
        .btn-pill:active { transform: scale(0.96); }
        .glass-card-jakarta { background: white; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 10px 25px rgba(0,0,0,0.02); border: 1px solid #F1F5F9; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
        <div style={{ padding: '35px 30px' }}>
          <h2 className="jakarta-font" style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Malar Hospital</h2>
          <span className="label-style" style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4px', display: 'block', fontSize: '9px' }}>Reception Portal</span>
        </div>
        <nav style={{ padding: '15px 0', flexGrow: 1 }}>
          <SidebarItem active={activeTab === 'register'} icon={<UserPlus size={18} />} label="New Patient" onClick={() => setActiveTab('register')} />
          <SidebarItem active={activeTab === 'queue'} icon={<Users size={18} />} label="Today's Queue" onClick={() => setActiveTab('queue')} />
          <SidebarItem active={activeTab === 'future'} icon={<CalendarCheck size={18} />} label="Appointments" onClick={() => setActiveTab('future')} />
          <SidebarItem active={activeTab === 'billing'} icon={<CreditCard size={18} />} label="Billing Center" onClick={() => setActiveTab('billing')} />
          <SidebarItem active={activeTab === 'doctors'} icon={<Stethoscope size={18} />} label="Doctors List" onClick={() => setActiveTab('doctors')} />
        </nav>
        <div style={{ padding: '25px', borderTop: '1px solid rgba(255,255,255,0.05)' }}><LogoutButton /></div>
      </aside>

      <main style={{ flex: 1, marginLeft: '240px', padding: '45px 60px' }} className="animate-in fade-in duration-500">
        <header style={{ marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="jakarta-font" style={{ fontSize: '30px', fontWeight: '800', color: '#0A4D68', margin: 0, letterSpacing: '-0.5px' }}>Reception Dashboard</h1>
            <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '500', marginTop: '4px' }}>Hospital Operations & Lifecycle | Thoothukudi</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="jakarta-font" style={{ background: '#F1F5F9', padding: '8px 18px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', color: '#0A4D68' }}>
               {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} • {shift}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1.5px solid #E2E8F0', paddingLeft: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="jakarta-font" style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>{userName}</div>
                <div className="label-style" style={{ fontSize: '9px' }}>ADMINISTRATOR</div>
              </div>
              <div style={{ width: '42px', height: '42px', background: '#0A4D68', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>{userName?.charAt(0)}</div>
            </div>
          </div>
        </header>

        {/* KPI Row - CLEAN & ELEGANT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '35px' }}>
          <StatCard icon={<Users size={20} />} label="Active Queue" value={queue.filter(v => v.status !== 'CONSULTING').length} onClick={() => { setStatsModalData({ title: 'Active Queue', list: queue.filter(v => v.status !== 'CONSULTING') }); setShowStatsModal(true); }} />
          <StatCard icon={<Activity size={20} />} label="In Consultation" value={queue.filter(v => v.status === 'CONSULTING').length} onClick={() => { setStatsModalData({ title: 'In Consultation', list: queue.filter(v => v.status === 'CONSULTING') }); setShowStatsModal(true); }} />
          <StatCard icon={<CheckCircle2 size={20} />} label="Completed" value={bills.length} onClick={() => { setStatsModalData({ title: 'Completed Visits', list: bills }); setShowStatsModal(true); }} />
          <StatCard icon={<Calendar size={20} />} label="Upcoming" value={futureQueue.length} color="amber" onClick={() => { setStatsModalData({ title: 'Upcoming Appointments', list: futureQueue }); setShowStatsModal(true); }} />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'register' && (
            <div className="glass-card-jakarta !p-10 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h2 className="jakarta-font text-2xl font-800 text-[#0A4D68] tracking-tight">Patient Encounter Info</h2>
                <div className="relative w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary" size={16} />
                  <input type="text" className="input-style !pl-10 !h-11 !w-full text-xs font-600" placeholder="Search ID/Phone..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); fetchPatients(e.target.value); }} onBlur={() => setTimeout(() => setShowSearchResults(false), 300)} onFocus={() => searchQuery && setShowSearchResults(true)} />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[200] bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
                       {searchResults.map(p => (
                         <div key={p.id} className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors" onMouseDown={() => selectPatient(p)}>
                            <div className="jakarta-font font-700 text-slate-800 text-sm uppercase">{p.name} <span className="label-style !text-[9px] ml-2">{p.uhid}</span></div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-600">{p.phone}</div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedPatient && (
                <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center animate-in zoom-in-95">
                   <div className="flex gap-5 items-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#0A4D68] text-white flex items-center justify-center text-xl font-800 shadow-lg shadow-blue-900/10">
                         {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <h4 className="jakarta-font text-lg font-800 text-slate-800 uppercase tracking-tight">{selectedPatient.name}</h4>
                            <span className="label-style !text-[8px] bg-[#0A4D68] text-white px-2.5 py-1 rounded-full">EXISTING PATIENT</span>
                         </div>
                         <div className="label-style !text-[9px] mt-1.5 flex gap-5">
                            <span>ID: {selectedPatient.uhid}</span><span>AGE: {selectedPatient.age}Y</span><span>PH: {selectedPatient.phone}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button className="btn-pill !h-10 !px-6 !bg-white !text-[#0A4D68] !border-2 !border-[#0A4D68] !text-[10px]" onClick={() => fetchHistory(selectedPatient.id)}><History size={16} className="mr-2" /> History</button>
                      <button className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border-none transition-all active:scale-90" onClick={clearPatient}><Trash2 size={18} /></button>
                   </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="form-group">
                  <label className="label-style mb-2 block">Patient Full Name</label>
                  <input type="text" className="input-style !w-full" placeholder="ENTER FULL NAME" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group">
                  <label className="label-style mb-2 block">Contact Number</label>
                  <input type="tel" className="input-style !w-full" placeholder="+91 XXXXX XXXXX" maxLength={10} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="form-group grid grid-cols-2 gap-6">
                  <div>
                    <label className="label-style mb-2 block">Age (Years)</label>
                    <input type="number" className="input-style !w-full" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div>
                    <label className="label-style mb-2 block">Gender</label>
                    <select className="input-style !w-full" required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label-style mb-2 block">Assigned Specialist</label>
                  <select className="input-style !w-full" required value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                    {doctors.map(d => <option key={d.id} value={d.id}>DR. {d.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                   <label className="label-style mb-2 block">Appointment Date (Opt)</label>
                   <input type="date" className="input-style !w-full" min={new Date().toISOString().split('T')[0]} value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} />
                </div>
                {formData.visitDate && (
                  <div className="form-group">
                    <label className="label-style mb-2 block">Time Preference</label>
                    <div className="flex gap-2">
                      <select className="input-style !flex-1 text-center" value={timeHour} onChange={e => setTimeHour(e.target.value)}>{Array.from({length: 12}, (_, i) => (i+1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}</select>
                      <select className="input-style !flex-1 text-center" value={timeMinute} onChange={e => setTimeMinute(e.target.value)}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                      <button type="button" onClick={() => setTimePeriod(timePeriod === 'AM' ? 'PM' : 'AM')} className="btn-pill !h-auto !px-6 !text-xs !bg-[#F1F5F9] !text-[#0A4D68] !shadow-none">{timePeriod}</button>
                    </div>
                  </div>
                )}
                <div className="md:col-span-2 flex justify-start mt-4">
                  <button type="submit" disabled={loading} className="btn-pill !h-14 !px-10 shadow-xl shadow-blue-900/10 active:scale-95 transition-all">
                    {loading ? 'Processing Transaction...' : 'Generate Clinical Token'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="glass-card-jakarta !p-8 animate-in fade-in">
              <div className="flex justify-between items-center mb-8">
                <h2 className="jakarta-font text-xl font-800 text-[#0A4D68]">Operational OPD Queue</h2>
                <div className="px-4 py-1.5 bg-slate-100 rounded-lg label-style !text-[#0A4D68] !text-[9px]">{queue.length} IN WAIT</div>
              </div>
              <table className="w-full border-separate border-spacing-0">
                <thead><tr className="label-style text-left !text-[10px]"><th className="pb-4 pl-4">Token</th><th className="pb-4">Patient</th><th className="pb-4">Status</th><th className="pb-4">Doctor</th><th className="pb-4 pr-4 text-right">Actions</th></tr></thead>
                <tbody>{queue.map(v => (
                  <tr key={v.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-5 pl-4 border-t border-slate-100 jakarta-font font-800 text-[#0A4D68] text-lg">#{v.tokenNumber}</td>
                    <td className="py-5 border-t border-slate-100">
                      <div className="jakarta-font font-700 text-slate-800 text-sm uppercase">{v.patient.name}</div>
                      <div className="label-style !text-[9px] mt-0.5">{v.patient.uhid}</div>
                    </td>
                    <td className="py-5 border-t border-slate-100"><span className={`px-2.5 py-1 rounded-full label-style !text-[8px] !text-white ${v.status === 'CONSULTING' ? 'bg-amber-500' : 'bg-emerald-500'}`}>{v.status}</span></td>
                    <td className="py-5 border-t border-slate-100 label-style !text-slate-500 !text-[10px]">DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</td>
                    <td className="py-5 pr-4 border-t border-slate-100 text-right"><button className="btn-pill !h-8 !px-4 !bg-transparent !text-[#0A4D68] !border !border-[#0A4D68] !text-[9px]" onClick={() => fetchHistory(v.patientId)}>HISTORY</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="glass-card-jakarta !p-8 animate-in fade-in">
              <h2 className="jakarta-font text-xl font-800 text-[#0A4D68] mb-8 uppercase">Revenue Tracking</h2>
              <table className="w-full border-separate border-spacing-0">
                <thead><tr className="label-style text-left !text-[10px]"><th className="pb-4 pl-4">Patient Subject</th><th className="pb-4">Status</th><th className="pb-4">Amount</th><th className="pb-4 pr-4 text-right">Action</th></tr></thead>
                <tbody>{bills.map(b => (
                  <tr key={b.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-5 pl-4 border-t border-slate-100"><div className="jakarta-font font-700 text-slate-800 text-sm uppercase">{b.visit.patient.name}</div><div className="label-style !text-[9px] mt-0.5">{b.visit.patient.uhid}</div></td>
                    <td className="py-5 border-t border-slate-100"><span className={`px-2.5 py-1 rounded-full label-style !text-[8px] !text-white ${b.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{b.paymentStatus}</span></td>
                    <td className="py-5 border-t border-slate-100 jakarta-font font-800 text-[#0A4D68] text-lg">₹{b.finalAmount}</td>
                    <td className="py-5 pr-4 border-t border-slate-100 text-right">{b.paymentStatus === 'UNPAID' && <button className="btn-pill !h-9 !px-6 !text-[10px]" onClick={() => { setSelectedBill(b); setShowBillModal(true); }}>COLLECT</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="grid grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">{doctors.map(doc => (
              <div key={doc.id} className="glass-card-jakarta !p-8 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-[#0A4D68] flex items-center justify-center font-800 text-xl shadow-inner">{doc.name.charAt(0)}</div>
                  <button onClick={() => toggleDoctorAvailability(doc.id, doc.isAvailable !== false)} className={`h-9 w-9 rounded-xl transition-all active:scale-90 flex items-center justify-center ${doc.isAvailable !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{doc.isAvailable !== false ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}</button>
                </div>
                <h3 className="jakarta-font font-800 text-slate-800 uppercase tracking-tight text-sm">DR. {doc.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</h3>
                <p className="label-style !text-[10px] mt-1">{doc.specialization || 'Clinical'}</p>
              </div>
            ))}</div>
          )}
        </div>

        {/* Modals - ALL CENTERED & ELEGANT */}
        {showSuccessModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card-jakarta !p-10 !max-w-sm text-center animate-in zoom-in-95 rounded-[2rem]">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={32} /></div>
              <h2 className="jakarta-font text-xl font-800 text-[#0A4D68] uppercase mb-2 tracking-tight">{successInfo?.title}</h2>
              <p className="text-slate-500 font-600 text-sm mb-8 leading-snug">{successInfo?.message}</p>
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                <div className="label-style !text-[8px] mb-1">RECORD GENERATED</div>
                <div className="jakarta-font font-800 text-[#0A4D68] text-4xl tracking-tighter">#{successInfo?.token}</div>
              </div>
              <button className="btn-pill !h-14 !w-full" onClick={() => setShowSuccessModal(false)}>PROCEED</button>
            </div>
          </div>
        )}

        {showHistoryModal && historyData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }}>
            <div className="glass-card-jakarta !max-w-[600px] w-full !p-0 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 rounded-[1.5rem]" style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-lg bg-[#0A4D68] text-white flex items-center justify-center text-lg font-800">{historyData.patient.name.charAt(0)}</div>
                  <div>
                    <div className="jakarta-font font-800 text-slate-800 text-base uppercase">{historyData.patient.name}</div>
                    <div className="label-style !text-[9px] mt-0.5">{historyData.patient.uhid}</div>
                  </div>
                </div>
                <button onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-400"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                {historyData.history.length === 0 ? <div className="py-12 text-center label-style opacity-50 uppercase tracking-widest font-800 italic">No records found</div> : historyData.history.map((v: any, idx: number) => (
                  <div key={v.id} className="border border-slate-100 rounded-xl mb-3 overflow-hidden">
                    <div className={`p-4 cursor-pointer flex justify-between items-center transition-colors ${expandedVisitId === v.id ? 'bg-slate-50' : 'bg-white'}`} onClick={() => setExpandedVisitId(expandedVisitId === v.id ? null : v.id)}>
                      <div className="flex items-center gap-3">
                        <span className="jakarta-font font-800 text-[#0A4D68] text-xs">#0{historyData.history.length - idx}</span>
                        <div>
                          <div className="jakarta-font font-800 text-slate-800 uppercase text-[11px]">{new Date(v.visitDate).toLocaleDateString('en-GB')}</div>
                          <div className="label-style !text-[8px] mt-0.5">DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</div>
                        </div>
                      </div>
                      <ChevronDown className={`text-slate-300 transition-transform ${expandedVisitId === v.id ? 'rotate-180' : ''}`} size={18} />
                    </div>
                    {expandedVisitId === v.id && <div className="p-5 bg-white border-t border-slate-50 animate-in slide-in-from-top-2">
                        {v.diagnosis && <div className="mb-4"><span className="label-style !text-[8px] block mb-1.5">Diagnosis</span><p className="jakarta-font font-800 text-[#0A4D68] uppercase text-[11px] leading-relaxed">{v.diagnosis}</p></div>}
                        {v.prescriptions?.length > 0 && <div><span className="label-style !text-[8px] block mb-2">Prescriptions</span><div className="flex flex-wrap gap-2">{v.prescriptions.map((p: any) => <span key={p.id} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-800 rounded-lg border border-emerald-100 uppercase tracking-widest">💊 {p.drugName}</span>)}</div></div>}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showStatsModal && statsModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowStatsModal(false)}>
            <div className="glass-card-jakarta !max-w-[450px] w-full !p-0 overflow-hidden bg-white animate-in zoom-in-95 rounded-[1.5rem]" style={{ maxHeight: '70vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="jakarta-font font-800 text-slate-800 uppercase text-base tracking-tight">{statsModalData.title}</h3><button onClick={() => setShowStatsModal(false)} className="text-slate-400"><X size={18} /></button></div>
              <div className="p-4 overflow-y-auto">{statsModalData.list.length === 0 ? <div className="py-12 text-center label-style opacity-50 italic uppercase font-800 tracking-widest">Empty Audit Trail</div> : <div className="flex flex-col gap-2">{statsModalData.list.map((v: any) => (
                <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center hover:bg-white transition-colors cursor-default">
                  <div>
                    <div className="jakarta-font font-800 text-slate-800 uppercase text-xs tracking-tight">{v.patient?.name || v.patientName || 'RECORD'}</div>
                    <div className="label-style !text-[8px] mt-1 uppercase">{v.patient?.uhid || v.uhid} • TOKEN #{v.tokenNumber || 'XX'}</div>
                  </div>
                  <div className={`text-[8px] font-800 px-3 py-1 rounded-full uppercase tracking-widest ${v.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-[#0A4D68] text-white'}`}>{v.status || 'SCHEDULED'}</div>
                </div>
              ))}</div>}</div>
            </div>
          </div>
        )}

        {showBillModal && selectedBill && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card-jakarta !p-10 !max-w-sm text-center animate-in zoom-in-95 rounded-[2rem]">
              <h2 className="jakarta-font text-xl font-800 text-[#0A4D68] mb-8 uppercase tracking-tight">Collection Hub</h2>
              <div className="flex flex-col gap-5 text-left">
                <div className="form-group"><label className="label-style block mb-2">Instrument</label><select className="input-style !w-full !text-sm" value={billingForm.paymentMode} onChange={e => setBillingForm({...billingForm, paymentMode: e.target.value})}><option>CASH ON COUNTER</option><option>UPI / QR SCAN</option></select></div>
                <div className="form-group"><label className="label-style block mb-2">Authorized Waiver (₹)</label><input type="number" className="input-style !w-full" value={billingForm.discount} onChange={e => setBillingForm({...billingForm, discount: parseInt(e.target.value) || 0})} /></div>
                <button className="btn-pill !h-14 !w-full !mt-2" onClick={handlePayBill} disabled={loading}>CONFIRM ₹{selectedBill.finalAmount - billingForm.discount}</button>
                <button className="label-style !text-[10px] !text-slate-400 w-full mt-1 text-center bg-transparent border-none cursor-pointer" onClick={() => setShowBillModal(false)}>CANCEL TRANSACTION</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: active ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', userSelect: 'none', borderLeft: active ? '4px solid white' : '4px solid transparent' }} className="active:scale-95 group">
      <div style={{ opacity: active ? 1 : 0.4 }}>{icon}</div>
      <span className="jakarta-font" style={{ fontWeight: active ? '800' : '500', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: active ? 'white' : 'rgba(255,255,255,0.5)' }}>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, color, onClick }: { icon: any, label: string, value: number, color?: string, onClick?: () => void }) {
  return (
    <div style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', gap: '12px' }} className="active:scale-95 hover:shadow-lg transition-all group" onClick={onClick}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color === 'amber' ? '#FFFBEB' : '#F1F5F9', color: color === 'amber' ? '#D97706' : '#0A4D68' }} className="group-hover:scale-110 transition-all">{icon}</div>
      <div>
        <div className="label-style" style={{ fontSize: '9px', marginBottom: '4px' }}>{label}</div>
        <div className="jakarta-font" style={{ fontSize: '26px', fontWeight: '800', lineHeight: '1', color: '#1e293b' }}>{value}</div>
      </div>
    </div>
  );
}
