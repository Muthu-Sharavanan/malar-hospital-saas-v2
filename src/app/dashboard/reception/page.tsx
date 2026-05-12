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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        .outfit-font { font-family: 'Outfit', sans-serif; }
        .label-style { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; }
        .input-style { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; height: 52px; padding: 0 16px; font-weight: 500; transition: all 0.2s; font-family: 'Outfit', sans-serif; }
        .input-style:focus { border-color: #088395; outline: none; box-shadow: 0 0 0 3px rgba(8, 131, 149, 0.1); }
        .btn-premium { background: linear-gradient(135deg, #0A4D68 0%, #088395 100%); color: white; border-radius: 50px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; padding: 12px 30px; }
        .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(10,77,104,0.2); }
        .btn-premium:active { transform: scale(0.96); }
        .glass-card { background: white; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #F1F5F9; }
      `}</style>

      {/* Sidebar - MATCH DOCTOR PAGE */}
      <aside style={{ width: '280px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
        <div style={{ padding: '40px 30px' }}>
          <h2 className="outfit-font" style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Malar Hospital</h2>
          <span className="outfit-font" style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px', display: 'block', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Reception Portal</span>
        </div>
        <nav style={{ padding: '20px 0', flexGrow: 1 }}>
          <SidebarItem active={activeTab === 'register'} icon={<UserPlus size={20} />} label="New Patient" onClick={() => setActiveTab('register')} />
          <SidebarItem active={activeTab === 'queue'} icon={<Users size={20} />} label="Today's Queue" onClick={() => setActiveTab('queue')} />
          <SidebarItem active={activeTab === 'future'} icon={<CalendarCheck size={20} />} label="Appointments" onClick={() => setActiveTab('future')} />
          <SidebarItem active={activeTab === 'billing'} icon={<CreditCard size={20} />} label="Billing Center" onClick={() => setActiveTab('billing')} />
          <SidebarItem active={activeTab === 'doctors'} icon={<Stethoscope size={20} />} label="Doctors List" onClick={() => setActiveTab('doctors')} />
        </nav>
        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.1)' }}><LogoutButton /></div>
      </aside>

      <main style={{ flex: 1, marginLeft: '280px', padding: '50px 60px' }} className="animate-in fade-in duration-500">
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="outfit-font" style={{ fontSize: '32px', fontWeight: '700', color: '#0A4D68', margin: 0 }}>Reception Dashboard</h1>
            <p style={{ color: '#64748B', fontSize: '15px', fontWeight: '500', marginTop: '4px' }}>Hospital Operations & Lifecycle | Thoothukudi</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="outfit-font" style={{ background: 'rgba(10, 77, 104, 0.05)', padding: '10px 20px', borderRadius: '50px', fontSize: '13px', fontWeight: '600', color: '#0A4D68' }}>
               {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} • {shift}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '2px solid #E2E8F0', paddingLeft: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="outfit-font" style={{ fontWeight: '700', fontSize: '15px', color: '#1E293B' }}>{userName}</div>
                <div className="label-style" style={{ fontSize: '10px' }}>ADMINISTRATOR</div>
              </div>
              <div style={{ width: '45px', height: '45px', background: '#0A4D68', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '20px shadow-lg' }}>{userName?.charAt(0)}</div>
            </div>
          </div>
        </header>

        {/* KPI Row - DOCTOR STYLE */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <StatCard icon={<Users size={22} />} label="Active Queue" value={queue.filter(v => v.status !== 'CONSULTING').length} onClick={() => { setStatsModalData({ title: 'Active Queue', list: queue.filter(v => v.status !== 'CONSULTING') }); setShowStatsModal(true); }} />
          <StatCard icon={<Activity size={22} />} label="Consulting Now" value={queue.filter(v => v.status === 'CONSULTING').length} onClick={() => { setStatsModalData({ title: 'Current Consultations', list: queue.filter(v => v.status === 'CONSULTING') }); setShowStatsModal(true); }} />
          <StatCard icon={<CheckCircle2 size={22} />} label="Completed Today" value={bills.length} onClick={() => { setStatsModalData({ title: 'Completed Visits', list: bills }); setShowStatsModal(true); }} />
          <StatCard icon={<Calendar size={22} />} label="Advanced Bookings" value={futureQueue.length} color="amber" onClick={() => { setStatsModalData({ title: 'Upcoming Appointments', list: futureQueue }); setShowStatsModal(true); }} />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
          {activeTab === 'register' && (
            <div className="glass-card !p-10 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h2 className="outfit-font text-2xl font-700 text-[#0A4D68]">Patient Encounter Info</h2>
                <div className="relative w-72 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#088395]" size={18} />
                  <input type="text" className="input-style !pl-12 !h-12 !w-full text-sm font-500" placeholder="Quick Search ID/Phone..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); fetchPatients(e.target.value); }} onBlur={() => setTimeout(() => setShowSearchResults(false), 300)} onFocus={() => searchQuery && setShowSearchResults(true)} />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-[calc(100%+10px)] left-0 right-0 z-[200] bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                       {searchResults.map(p => (
                         <div key={p.id} className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-all" onMouseDown={() => selectPatient(p)}>
                            <div className="outfit-font font-700 text-slate-800 text-sm uppercase">{p.name} <span className="label-style !text-[10px] ml-2">UHID: {p.uhid}</span></div>
                            <div className="text-[11px] text-slate-400 mt-1 font-500">{p.phone}</div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedPatient && (
                <div className="mb-10 p-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl flex justify-between items-center animate-in zoom-in-95">
                   <div className="flex gap-6 items-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#0A4D68] text-white flex items-center justify-center text-2xl font-700 shadow-xl shadow-blue-900/10">
                         {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <h4 className="outfit-font text-xl font-700 text-slate-800 uppercase">{selectedPatient.name}</h4>
                            <span className="label-style !text-[9px] bg-[#0A4D68] text-white px-3 py-1 rounded-full">SYSTEM VERIFIED</span>
                         </div>
                         <div className="label-style !text-[10px] mt-2 flex gap-6">
                            <span>PATIENT ID: {selectedPatient.uhid}</span><span>AGE: {selectedPatient.age}Y</span><span>MOBILE: {selectedPatient.phone}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button className="h-12 px-6 border-2 border-[#0A4D68] text-[#0A4D68] rounded-xl font-700 text-xs outfit-font uppercase hover:bg-[#0A4D68] hover:text-white transition-all flex items-center gap-2" onClick={() => fetchHistory(selectedPatient.id)}><History size={18} /> CLINICAL HISTORY</button>
                      <button className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border-none transition-all active:scale-90" onClick={clearPatient}><Trash2 size={20} /></button>
                   </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="form-group">
                  <label className="label-style mb-3 block">Patient Full Name</label>
                  <input type="text" className="input-style !w-full" placeholder="ENTER NAME" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group">
                  <label className="label-style mb-3 block">Contact Number</label>
                  <input type="tel" className="input-style !w-full" placeholder="MOBILE NO" maxLength={10} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="form-group grid grid-cols-2 gap-8">
                  <div>
                    <label className="label-style mb-3 block">Age (Years)</label>
                    <input type="number" className="input-style !w-full" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div>
                    <label className="label-style mb-3 block">Gender</label>
                    <select className="input-style !w-full" required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label-style mb-3 block">Assigned Doctor</label>
                  <select className="input-style !w-full" required value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                    {doctors.map(d => <option key={d.id} value={d.id}>DR. {d.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                   <label className="label-style mb-3 block">Appointment Date (Optional)</label>
                   <input type="date" className="input-style !w-full" min={new Date().toISOString().split('T')[0]} value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} />
                </div>
                {formData.visitDate && (
                  <div className="form-group">
                    <label className="label-style mb-3 block">Preferred Time</label>
                    <div className="flex gap-3">
                      <select className="input-style !flex-1 text-center" value={timeHour} onChange={e => setTimeHour(e.target.value)}>{Array.from({length: 12}, (_, i) => (i+1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}</select>
                      <select className="input-style !flex-1 text-center" value={timeMinute} onChange={e => setTimeMinute(e.target.value)}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                      <button type="button" onClick={() => setTimePeriod(timePeriod === 'AM' ? 'PM' : 'AM')} className="h-12 px-8 bg-slate-100 text-[#0A4D68] rounded-xl font-700 text-xs outfit-font">{timePeriod}</button>
                    </div>
                  </div>
                )}
                <div className="md:col-span-2 flex justify-start mt-6">
                  <button type="submit" disabled={loading} className="btn-premium !h-14 !px-12 active:scale-95 transition-all">
                    {loading ? 'Processing Transaction...' : 'Generate Clinical Token'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="glass-card !p-8 animate-in fade-in">
              <div className="flex justify-between items-center mb-8">
                <h2 className="outfit-font text-xl font-700 text-[#0A4D68]">Live Hospital Queue</h2>
                <div className="px-5 py-2 bg-[#F1F5F9] rounded-xl label-style !text-[#0A4D68] !text-[10px]">{queue.length} PATIENTS WAITING</div>
              </div>
              <table className="w-full border-separate border-spacing-0">
                <thead><tr className="label-style text-left !text-[11px]"><th className="pb-5 pl-4">Token</th><th className="pb-5">Patient</th><th className="pb-5">Status</th><th className="pb-5">Assigned Specialist</th><th className="pb-5 pr-4 text-right">Actions</th></tr></thead>
                <tbody>{queue.map(v => (
                  <tr key={v.id} className="group hover:bg-[#F8FAFC] transition-all">
                    <td className="py-6 pl-4 border-t border-slate-100 outfit-font font-800 text-[#0A4D68] text-xl">#{v.tokenNumber}</td>
                    <td className="py-6 border-t border-slate-100">
                      <div className="outfit-font font-700 text-slate-800 text-base uppercase">{v.patient.name}</div>
                      <div className="label-style !text-[10px] mt-1">{v.patient.uhid}</div>
                    </td>
                    <td className="py-6 border-t border-slate-100"><span className={`px-3 py-1.5 rounded-full label-style !text-[9px] !text-white ${v.status === 'CONSULTING' ? 'bg-amber-500' : 'bg-emerald-500'}`}>{v.status}</span></td>
                    <td className="py-6 border-t border-slate-100 label-style !text-slate-500 !text-[11px]">DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</td>
                    <td className="py-6 pr-4 border-t border-slate-100 text-right"><button className="h-9 px-5 bg-transparent text-[#0A4D68] border-2 border-[#0A4D68] rounded-xl font-700 text-[10px] outfit-font uppercase hover:bg-[#0A4D68] hover:text-white transition-all" onClick={() => fetchHistory(v.patientId)}>HISTORY</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="glass-card !p-8 animate-in fade-in">
              <h2 className="outfit-font text-xl font-700 text-[#0A4D68] mb-8 uppercase">Billing & Revenue</h2>
              <table className="w-full border-separate border-spacing-0">
                <thead><tr className="label-style text-left !text-[11px]"><th className="pb-5 pl-4">Patient Name</th><th className="pb-5">Payment Status</th><th className="pb-5">Total Amount</th><th className="pb-5 pr-4 text-right">Action</th></tr></thead>
                <tbody>{bills.map(b => (
                  <tr key={b.id} className="group hover:bg-[#F8FAFC] transition-all">
                    <td className="py-6 pl-4 border-t border-slate-100"><div className="outfit-font font-700 text-slate-800 text-base uppercase">{b.visit.patient.name}</div><div className="label-style !text-[10px] mt-1">{b.visit.patient.uhid}</div></td>
                    <td className="py-6 border-t border-slate-100"><span className={`px-3 py-1.5 rounded-full label-style !text-[9px] !text-white ${b.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{b.paymentStatus}</span></td>
                    <td className="py-6 border-t border-slate-100 outfit-font font-800 text-[#0A4D68] text-xl">₹{b.finalAmount}</td>
                    <td className="py-6 pr-4 border-t border-slate-100 text-right">{b.paymentStatus === 'UNPAID' && <button className="btn-premium !h-10 !px-8 !text-[11px]" onClick={() => { setSelectedBill(b); setShowBillModal(true); }}>COLLECT PAYMENT</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="grid grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">{doctors.map(doc => (
              <div key={doc.id} className="glass-card !p-8 hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] text-[#0A4D68] flex items-center justify-center font-700 text-2xl shadow-inner border border-slate-100">{doc.name.charAt(0)}</div>
                  <button onClick={() => toggleDoctorAvailability(doc.id, doc.isAvailable !== false)} className={`h-10 w-10 rounded-xl transition-all active:scale-90 flex items-center justify-center ${doc.isAvailable !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{doc.isAvailable !== false ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}</button>
                </div>
                <h3 className="outfit-font font-700 text-slate-800 uppercase text-base">DR. {doc.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</h3>
                <p className="label-style !text-[11px] mt-2">{doc.specialization || 'General Consulting'}</p>
              </div>
            ))}</div>
          )}
        </div>

        {/* Modals - DOCTOR STYLE COMPACT FRAMES */}
        {showSuccessModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card !p-12 text-center animate-in zoom-in-95 rounded-[2.5rem]" style={{ width: '420px', maxWidth: '90vw' }}>
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10"><CheckCircle2 size={40} /></div>
              <h2 className="outfit-font text-2xl font-700 text-[#0A4D68] uppercase mb-3">{successInfo?.title}</h2>
              <p className="text-slate-500 font-500 text-base mb-10 leading-relaxed">{successInfo?.message}</p>
              <div className="bg-[#F8FAFC] rounded-3xl p-8 mb-10 border border-slate-100">
                <div className="label-style !text-[9px] mb-2 tracking-widest">CLINICAL TOKEN ID</div>
                <div className="outfit-font font-800 text-[#0A4D68] text-5xl tracking-tighter">#{successInfo?.token}</div>
              </div>
              <button className="btn-premium !h-14 !w-full" onClick={() => setShowSuccessModal(false)}>CONTINUE OPERATIONS</button>
            </div>
          </div>
        )}

        {showHistoryModal && historyData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }}>
            <div className="glass-card !p-0 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 rounded-[2rem]" style={{ width: '650px', maxWidth: '95vw', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
                <div className="flex gap-5 items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#0A4D68] text-white flex items-center justify-center text-xl font-700">{historyData.patient.name.charAt(0)}</div>
                  <div>
                    <div className="outfit-font font-700 text-slate-800 text-lg uppercase">{historyData.patient.name}</div>
                    <div className="label-style !text-[10px] mt-1">UHID: {historyData.patient.uhid}</div>
                  </div>
                </div>
                <button onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
              </div>
              <div className="p-8 overflow-y-auto">
                {historyData.history.length === 0 ? <div className="py-16 text-center label-style opacity-50 uppercase tracking-widest font-700 italic">No clinical history recorded</div> : historyData.history.map((v: any, idx: number) => (
                  <div key={v.id} className="border border-slate-100 rounded-2xl mb-4 overflow-hidden shadow-sm">
                    <div className={`p-5 cursor-pointer flex justify-between items-center transition-all ${expandedVisitId === v.id ? 'bg-[#F1F5F9]' : 'bg-white'}`} onClick={() => setExpandedVisitId(expandedVisitId === v.id ? null : v.id)}>
                      <div className="flex items-center gap-4">
                        <span className="outfit-font font-800 text-[#0A4D68] text-sm">VISIT #{historyData.history.length - idx}</span>
                        <div>
                          <div className="outfit-font font-700 text-slate-800 uppercase text-[12px]">{new Date(v.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div className="label-style !text-[9px] mt-1">SPECIALIST: DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</div>
                        </div>
                      </div>
                      <ChevronDown className={`text-slate-400 transition-transform ${expandedVisitId === v.id ? 'rotate-180' : ''}`} size={20} />
                    </div>
                    {expandedVisitId === v.id && <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2">
                        {v.diagnosis && <div className="mb-5"><span className="label-style !text-[9px] block mb-2">Final Diagnosis</span><p className="outfit-font font-700 text-[#0A4D68] uppercase text-[12px] leading-relaxed">{v.diagnosis}</p></div>}
                        {v.prescriptions?.length > 0 && <div><span className="label-style !text-[9px] block mb-3">Prescribed Medications</span><div className="flex flex-wrap gap-2.5">{v.prescriptions.map((p: any) => <span key={p.id} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-700 rounded-xl border border-emerald-100 uppercase tracking-wide">💊 {p.drugName} - {p.dosage}</span>)}</div></div>}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showStatsModal && statsModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowStatsModal(false)}>
            <div className="glass-card !p-0 overflow-hidden bg-white animate-in zoom-in-95 rounded-[2rem]" style={{ width: '480px', maxWidth: '90vw', maxHeight: '75vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]"><h3 className="outfit-font font-700 text-slate-800 uppercase text-lg tracking-tight">{statsModalData.title}</h3><button onClick={() => setShowStatsModal(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button></div>
              <div className="p-5 overflow-y-auto">{statsModalData.list.length === 0 ? <div className="py-16 text-center label-style opacity-50 italic uppercase font-700 tracking-widest">No Active Records</div> : <div className="flex flex-col gap-3">{statsModalData.list.map((v: any) => (
                <div key={v.id} className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-md transition-all cursor-default">
                  <div>
                    <div className="outfit-font font-700 text-slate-800 uppercase text-sm tracking-tight">{v.patient?.name || v.patientName || 'ANONYMOUS RECORD'}</div>
                    <div className="label-style !text-[9px] mt-2 uppercase tracking-wide">{v.patient?.uhid || v.uhid || 'NO UHID'} • TOKEN #{v.tokenNumber || 'XX'}</div>
                  </div>
                  <div className={`text-[10px] font-700 px-4 py-1.5 rounded-full uppercase tracking-widest ${v.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-[#0A4D68] text-white'} shadow-sm`}>{v.status || 'OPD'}</div>
                </div>
              ))}</div>}</div>
            </div>
          </div>
        )}

        {showBillModal && selectedBill && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card !p-12 text-center animate-in zoom-in-95 rounded-[2.5rem]" style={{ width: '420px', maxWidth: '90vw' }}>
              <h2 className="outfit-font text-2xl font-700 text-[#0A4D68] mb-10 uppercase tracking-tight">Revenue Collection</h2>
              <div className="flex flex-col gap-6 text-left">
                <div className="form-group"><label className="label-style block mb-3">Payment Mode</label><select className="input-style !w-full !text-sm" value={billingForm.paymentMode} onChange={e => setBillingForm({...billingForm, paymentMode: e.target.value})}><option>CASH ON COUNTER</option><option>UPI / DIGITAL SCAN</option><option>CARD TRANSACTION</option></select></div>
                <div className="form-group"><label className="label-style block mb-3">Waiver Applied (₹)</label><input type="number" className="input-style !w-full" value={billingForm.discount} onChange={e => setBillingForm({...billingForm, discount: parseInt(e.target.value) || 0})} /></div>
                <button className="btn-premium !h-14 !w-full !mt-4 shadow-xl shadow-blue-900/10" onClick={handlePayBill} disabled={loading}>COMPLETE ₹{selectedBill.finalAmount - billingForm.discount}</button>
                <button className="label-style !text-[11px] !text-slate-400 w-full mt-2 text-center bg-transparent border-none cursor-pointer hover:text-rose-500 transition-all font-700" onClick={() => setShowBillModal(false)}>CANCEL INVOICE</button>
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
    <button onClick={onClick} style={{ width: '100%', padding: '16px 30px', display: 'flex', alignItems: 'center', gap: '18px', background: active ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s', userSelect: 'none', borderLeft: active ? '6px solid #088395' : '6px solid transparent' }} className="active:scale-95 group">
      <div style={{ opacity: active ? 1 : 0.5, transform: active ? 'scale(1.1)' : 'scale(1)', transition: '0.3s' }}>{icon}</div>
      <span className="outfit-font" style={{ fontWeight: active ? '700' : '500', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.8px', color: active ? 'white' : 'rgba(255,255,255,0.6)' }}>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, color, onClick }: { icon: any, label: string, value: number, color?: string, onClick?: () => void }) {
  return (
    <div style={{ padding: '24px', borderRadius: '20px', background: 'white', border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: '15px' }} className="active:scale-95 hover:shadow-xl transition-all group" onClick={onClick}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color === 'amber' ? '#FFFBEB' : 'rgba(10, 77, 104, 0.05)', color: color === 'amber' ? '#D97706' : '#0A4D68' }} className="group-hover:scale-110 transition-all">{icon}</div>
      <div>
        <div className="label-style" style={{ fontSize: '10px', marginBottom: '6px', fontWeight: '700' }}>{label}</div>
        <div className="outfit-font" style={{ fontSize: '30px', fontWeight: '800', lineHeight: '1', color: '#1E293B' }}>{value}</div>
      </div>
    </div>
  );
}
