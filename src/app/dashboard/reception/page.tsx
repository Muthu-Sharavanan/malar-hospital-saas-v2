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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');
        .premium-font { font-family: 'Outfit', sans-serif; }
        .label-font { font-family: 'Inter', sans-serif; letter-spacing: 0.15em; font-weight: 900; font-size: 10px; color: #94a3b8; text-transform: uppercase; }
        .value-font { font-family: 'Outfit', sans-serif; font-weight: 900; color: #1e293b; letter-spacing: -0.02em; }
        .glass-card-premium { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(20px); border: 2px solid white; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
        <div style={{ padding: '35px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="premium-font" style={{ fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Malar Hospital</h2>
          <span className="label-font" style={{ color: 'rgba(255,255,255,0.5)', marginTop: '4px', display: 'block' }}>Reception Portal</span>
        </div>
        <nav style={{ padding: '25px 0', flexGrow: 1 }}>
          <SidebarItem active={activeTab === 'register'} icon={<UserPlus size={20} />} label="New Patient" onClick={() => setActiveTab('register')} />
          <SidebarItem active={activeTab === 'queue'} icon={<Users size={20} />} label="Today's Queue" onClick={() => setActiveTab('queue')} />
          <SidebarItem active={activeTab === 'future'} icon={<CalendarCheck size={20} />} label="Appointments" onClick={() => setActiveTab('future')} />
          <SidebarItem active={activeTab === 'billing'} icon={<CreditCard size={20} />} label="Billing Center" onClick={() => setActiveTab('billing')} />
          <SidebarItem active={activeTab === 'doctors'} icon={<Stethoscope size={20} />} label="Doctors List" onClick={() => setActiveTab('doctors')} />
        </nav>
        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}><LogoutButton /></div>
      </aside>

      <main style={{ flex: 1, marginLeft: '240px', padding: '50px 70px' }} className="animate-in fade-in duration-500">
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="premium-font" style={{ fontSize: '38px', fontWeight: '900', color: '#0A4D68', margin: '0 0 5px 0', letterSpacing: '-1px' }}>Reception Dashboard</h1>
            <p style={{ color: '#64748B', fontSize: '16px', fontWeight: '500' }}>Hospital Operations & Patient Lifecycle | Thoothukudi</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="premium-font" style={{ background: 'white', padding: '10px 22px', borderRadius: '50px', fontSize: '11px', fontWeight: '900', color: '#0A4D68', border: '1px solid #E2E8F0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
               {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} • {shift} Shift
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid #E2E8F0', paddingLeft: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="premium-font" style={{ fontWeight: '900', fontSize: '14px', color: '#1E293B' }}>{userName}</div>
                <div className="label-font">FRONT OFFICE</div>
              </div>
              <div style={{ width: '44px', height: '44px', background: '#0A4D68', color: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' }}>{userName?.charAt(0)}</div>
            </div>
          </div>
        </header>

        {/* KPI Row - COMPACT & PREMIUM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <StatCard 
            icon={<Users size={22} />} 
            label="Active Queue" 
            value={queue.filter(v => v.status !== 'CONSULTING').length} 
            trend="-9% Today" 
            onClick={() => { setStatsModalData({ title: 'Active Queue (Waiting)', list: queue.filter(v => v.status !== 'CONSULTING') }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<Activity size={22} />} 
            label="Consulting Now" 
            value={queue.filter(v => v.status === 'CONSULTING').length} 
            onClick={() => { setStatsModalData({ title: 'Patients in Consultation', list: queue.filter(v => v.status === 'CONSULTING') }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<CheckCircle2 size={22} />} 
            label="Completed Today" 
            value={bills.length} 
            onClick={() => { setStatsModalData({ title: 'Visits Completed Today', list: bills }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<Calendar size={22} />} 
            label="Appointments" 
            value={futureQueue.length} 
            color="amber" 
            onClick={() => { setStatsModalData({ title: 'Future Scheduled Bookings', list: futureQueue }); setShowStatsModal(true); }}
          />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'register' && (
            <div className="glass-card-premium !p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="premium-font text-2xl font-black text-slate-800 tracking-tight">Patient Encounter Info</h2>
                <div className="relative w-72 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all" size={18} />
                  <input type="text" className="form-input !pl-12 !h-12 !bg-slate-50 border-none group-focus-within:!bg-white group-focus-within:!ring-2 group-focus-within:!ring-primary/20 transition-all font-bold text-sm" placeholder="Search ID/Phone..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); fetchPatients(e.target.value); }} onBlur={() => setTimeout(() => setShowSearchResults(false), 300)} onFocus={() => searchQuery && setShowSearchResults(true)} />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-[calc(100%+10px)] left-0 right-0 z-[200] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                       {searchResults.map(p => (
                         <div key={p.id} className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors" onMouseDown={() => selectPatient(p)}>
                            <div className="premium-font font-black text-slate-800 text-sm uppercase">{p.name} <span className="label-font !text-slate-400 !font-bold ml-2">{p.uhid}</span></div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-bold">{p.phone} • {p.age}Y</div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedPatient && (
                <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[1.5rem] flex justify-between items-center animate-in zoom-in-95 shadow-lg shadow-emerald-500/5">
                   <div className="flex gap-5 items-center">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-black shadow-xl shadow-emerald-200">
                         {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <h4 className="premium-font text-lg font-black text-slate-800 uppercase tracking-tight">{selectedPatient.name}</h4>
                            <span className="label-font !text-white bg-emerald-600 px-2 py-0.5 rounded-full">RECORD MATCH</span>
                         </div>
                         <div className="label-font mt-2 flex gap-4">
                            <span>ID: {selectedPatient.uhid}</span><span>AGE: {selectedPatient.age}Y</span><span>PH: {selectedPatient.phone}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button className="btn btn-outline h-10 px-4 border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] tracking-widest" onClick={() => fetchHistory(selectedPatient.id)}><History size={14} className="mr-2" /> HISTORY</button>
                      <button className="btn h-10 w-10 !p-0 bg-rose-100 text-rose-600 border-none active:scale-90" onClick={clearPatient}><Trash2 size={16} /></button>
                   </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                <div className="form-group">
                  <label className="label-font mb-2 block">Patient Full Name</label>
                  <input type="text" className="form-input !bg-slate-50 !h-14 font-black border-none text-base text-slate-800 focus:!bg-white" placeholder="ENTER NAME" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group">
                  <label className="label-font mb-2 block">Contact Number</label>
                  <input type="tel" className="form-input !bg-slate-50 !h-14 font-black border-none text-base text-slate-800 focus:!bg-white" placeholder="MOBILE NO" maxLength={10} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="form-group grid grid-cols-2 gap-5">
                  <div>
                    <label className="label-font mb-2 block">Age (Y)</label>
                    <input type="number" className="form-input !bg-slate-50 !h-14 font-black border-none text-base focus:!bg-white" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div>
                    <label className="label-font mb-2 block">Gender</label>
                    <select className="form-input !bg-slate-50 !h-14 font-black border-none text-base focus:!bg-white" required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label-font mb-2 block">Assigned Specialist</label>
                  <select className="form-input !bg-slate-50 !h-14 font-black border-none text-base focus:!bg-white" required value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                    {doctors.map(d => <option key={d.id} value={d.id}>DR. {d.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                   <label className="label-font mb-2 block">Appointment Date (Opt)</label>
                   <input type="date" className="form-input !bg-slate-50 !h-14 font-black border-none text-base focus:!bg-white" min={new Date().toISOString().split('T')[0]} value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} />
                </div>
                {formData.visitDate && (
                  <div className="form-group">
                    <label className="label-font mb-2 block">Time Slot</label>
                    <div className="flex gap-2">
                      <select className="form-input !bg-white !h-14 font-black border-2 border-slate-100 rounded-xl flex-1 text-center text-lg" value={timeHour} onChange={e => setTimeHour(e.target.value)}>{Array.from({length: 12}, (_, i) => (i+1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}</select>
                      <select className="form-input !bg-white !h-14 font-black border-2 border-slate-100 rounded-xl flex-1 text-center text-lg" value={timeMinute} onChange={e => setTimeMinute(e.target.value)}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                      <button type="button" onClick={() => setTimePeriod(timePeriod === 'AM' ? 'PM' : 'AM')} className="bg-primary text-white px-6 rounded-xl font-black text-sm active:scale-95">{timePeriod}</button>
                    </div>
                  </div>
                )}
                <div className="md:col-span-2 flex justify-end mt-4">
                  <button type="submit" disabled={loading} className="btn btn-primary !h-16 !px-12 !rounded-[1.5rem] shadow-xl shadow-primary/30 text-lg font-black tracking-tight active:scale-95 transition-all">{loading ? 'STAGING...' : 'GENERATE TOKEN'}</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="glass-card-premium !p-8 animate-in fade-in">
              <div className="flex justify-between items-center mb-10">
                <h2 className="premium-font text-2xl font-black text-slate-800 tracking-tight">Operational OPD Queue</h2>
                <div className="px-5 py-2 bg-primary/10 rounded-full label-font !text-primary">{queue.length} PATIENTS IN WAIT</div>
              </div>
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="label-font text-left">
                    <th className="pb-6 pl-6">ID Token</th>
                    <th className="pb-6">Patient info</th>
                    <th className="pb-6">Status</th>
                    <th className="pb-6">Doctor</th>
                    <th className="pb-6 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map(v => (
                    <tr key={v.id} className="group hover:bg-white/50 transition-colors">
                      <td className="py-5 pl-6 border-t border-slate-100 value-font !text-primary !text-lg">#{v.tokenNumber}</td>
                      <td className="py-5 border-t border-slate-100">
                        <div className="premium-font font-black text-slate-800 uppercase text-base">{v.patient.name}</div>
                        <div className="label-font !text-[9px] mt-0.5">{v.patient.uhid} • {v.patient.age}Y</div>
                      </td>
                      <td className="py-5 border-t border-slate-100">
                        <span className={`px-3 py-1 rounded-full label-font !text-[8px] !text-white ${v.status === 'CONSULTING' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                           {v.status === 'CONSULTING' ? 'CONSULTING' : 'WAITING'}
                        </span>
                      </td>
                      <td className="py-5 border-t border-slate-100 label-font !text-slate-600 !text-[11px]">DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</td>
                      <td className="py-5 pr-6 border-t border-slate-100 text-right">
                        <button className="btn btn-outline !h-8 px-4 label-font !text-[9px] hover:bg-primary hover:text-white transition-all" onClick={() => fetchHistory(v.patientId)}>HISTORY</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="glass-card-premium !p-8 animate-in fade-in">
              <h2 className="premium-font text-2xl font-black text-slate-800 mb-10 tracking-tight uppercase">Billing Center</h2>
              <table className="w-full border-separate border-spacing-0">
                <thead><tr className="label-font text-left"><th className="pb-6 pl-6">Invoice Subject</th><th className="pb-6">Status</th><th className="pb-6">Amount</th><th className="pb-6 pr-6 text-right">Action</th></tr></thead>
                <tbody>{bills.map(b => (
                  <tr key={b.id} className="group hover:bg-white/50 transition-colors">
                    <td className="py-5 pl-6 border-t border-slate-100"><div className="premium-font font-black text-slate-800 text-base uppercase">{b.visit.patient.name}</div><div className="label-font !text-[9px] mt-0.5">{b.visit.patient.uhid}</div></td>
                    <td className="py-5 border-t border-slate-100"><span className={`px-3 py-1 rounded-full label-font !text-[8px] !text-white ${b.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{b.paymentStatus}</span></td>
                    <td className="py-5 border-t border-slate-100 value-font !text-primary !text-lg">₹{b.finalAmount}</td>
                    <td className="py-5 pr-6 border-t border-slate-100 text-right">{b.paymentStatus === 'UNPAID' && <button className="btn btn-primary !h-9 px-6 label-font !text-[9px] !text-white active:scale-95" onClick={() => { setSelectedBill(b); setShowBillModal(true); }}>COLLECT</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="grid grid-cols-3 gap-6 animate-in slide-in-from-bottom-6">{doctors.map(doc => (
              <div key={doc.id} className="glass-card-premium !p-8 hover-scale-102 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 text-primary flex items-center justify-center font-black text-2xl shadow-inner">{doc.name.charAt(0)}</div>
                  <button onClick={() => toggleDoctorAvailability(doc.id, doc.isAvailable !== false)} className={`h-10 w-10 rounded-xl transition-all active:scale-90 flex items-center justify-center ${doc.isAvailable !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{doc.isAvailable !== false ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}</button>
                </div>
                <h3 className="premium-font font-black text-slate-800 uppercase tracking-tight">DR. {doc.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</h3>
                <p className="label-font mt-1">{doc.specialization || 'Clinical'}</p>
              </div>
            ))}</div>
          )}
        </div>

        {/* Modals - ALL CENTERED & PREMIUM */}
        {showSuccessModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card-premium !p-10 !max-w-md bg-white text-center animate-in zoom-in-95 rounded-[2.5rem]">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100"><CheckCircle2 size={40} /></div>
              <h2 className="premium-font text-2xl font-black mb-4 text-emerald-600 uppercase tracking-tight">{successInfo?.title}</h2>
              <p className="text-slate-500 font-bold mb-8 leading-snug">{successInfo?.message}</p>
              <div className="bg-slate-50 rounded-[1.5rem] p-8 mb-8 border border-slate-100">
                <div className="label-font mb-2">Token Number</div>
                <div className="value-font !text-primary !text-5xl">#{successInfo?.token}</div>
              </div>
              <button className="btn btn-primary w-full h-16 !rounded-[1.5rem] label-font !text-white !text-sm active:scale-95 transition-all" onClick={() => setShowSuccessModal(false)}>CLOSE WINDOW</button>
            </div>
          </div>
        )}

        {showHistoryModal && historyData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }}>
            <div className="glass-card-premium !max-w-[650px] w-full !p-0 overflow-hidden flex flex-col bg-white animate-in slide-in-from-bottom-5 rounded-[2rem]" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#0A4D68] text-white flex items-center justify-center text-xl font-black">{historyData.patient.name.charAt(0)}</div>
                  <div>
                    <div className="premium-font font-black text-slate-800 text-xl tracking-tight uppercase">{historyData.patient.name}</div>
                    <div className="label-font mt-0.5">{historyData.patient.uhid} • {historyData.patient.age}Y</div>
                  </div>
                </div>
                <button onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 overflow-y-auto">
                {historyData.history.length === 0 ? <div className="py-12 text-center label-font opacity-50">No records found</div> : historyData.history.map((v: any, idx: number) => (
                  <div key={v.id} className="border border-slate-100 rounded-2xl mb-4 overflow-hidden">
                    <div className={`p-4 cursor-pointer flex justify-between items-center ${expandedVisitId === v.id ? 'bg-slate-50' : 'bg-white'}`} onClick={() => setExpandedVisitId(expandedVisitId === v.id ? null : v.id)}>
                      <div className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-black">{historyData.history.length - idx}</span>
                        <div>
                          <div className="premium-font font-black text-slate-800 uppercase text-sm">{new Date(v.visitDate).toLocaleDateString('en-GB')}</div>
                          <div className="label-font !text-[8px]">DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</div>
                        </div>
                      </div>
                      <ChevronDown className={`text-slate-300 transition-transform ${expandedVisitId === v.id ? 'rotate-180' : ''}`} size={20} />
                    </div>
                    {expandedVisitId === v.id && <div className="p-5 bg-white border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
                        {v.diagnosis && <div className="mb-4"><span className="label-font !text-[8px] block mb-1">Diagnosis</span><p className="premium-font font-black text-primary uppercase text-xs">{v.diagnosis}</p></div>}
                        {v.prescriptions?.length > 0 && <div><span className="label-font !text-[8px] block mb-2">Medications</span><div className="flex flex-wrap gap-2">{v.prescriptions.map((p: any) => <span key={p.id} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[8px] font-black rounded-lg border border-emerald-100 uppercase tracking-widest">💊 {p.drugName}</span>)}</div></div>}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showStatsModal && statsModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowStatsModal(false)}>
            <div className="glass-card-premium !max-w-[450px] w-full !p-0 overflow-hidden bg-white animate-in zoom-in-95 rounded-[2rem]" style={{ maxHeight: '70vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="premium-font font-black text-slate-800 uppercase text-lg tracking-tight">{statsModalData.title}</h3><button onClick={() => setShowStatsModal(false)} className="text-slate-400"><X size={18} /></button></div>
              <div className="p-5 overflow-y-auto">{statsModalData.list.length === 0 ? <div className="py-12 text-center label-font opacity-50 italic">Empty audit list</div> : <div className="flex flex-col gap-2">{statsModalData.list.map((v: any) => (
                <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="premium-font font-black text-slate-800 uppercase text-sm">{v.patient?.name || v.patientName || 'UNKNOWN'}</div>
                    <div className="label-font !text-[8px] mt-0.5">{v.patient?.uhid || v.uhid} • TOKEN #{v.tokenNumber || 'XX'}</div>
                  </div>
                  <div className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{v.status || 'SCHEDULED'}</div>
                </div>
              ))}</div>}</div>
            </div>
          </div>
        )}

        {showBillModal && selectedBill && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card-premium !p-10 !max-w-md bg-white animate-in zoom-in-95 rounded-[2.5rem]">
              <h2 className="premium-font text-2xl font-black text-slate-800 mb-8 tracking-tight uppercase text-center">Collection Hub</h2>
              <div className="flex flex-col gap-6">
                <div className="form-group"><label className="label-font block mb-2">Instrument</label><select className="form-input !h-14 font-black border-none !bg-slate-50 rounded-xl" value={billingForm.paymentMode} onChange={e => setBillingForm({...billingForm, paymentMode: e.target.value})}><option>CASH</option><option>UPI / QR</option><option>CARD</option></select></div>
                <div className="form-group"><label className="label-font block mb-2">Waiver (₹)</label><input type="number" className="form-input !h-14 font-black border-none !bg-slate-50 rounded-xl" value={billingForm.discount} onChange={e => setBillingForm({...billingForm, discount: parseInt(e.target.value) || 0})} /></div>
                <button className="btn btn-primary w-full h-16 !rounded-[1.5rem] label-font !text-white !text-xs active:scale-95 transition-all shadow-xl shadow-primary/30" onClick={handlePayBill} disabled={loading}>RECEIVE ₹{selectedBill.finalAmount - billingForm.discount}</button>
                <button className="label-font !text-[9px] !text-slate-400 w-full mt-2 hover:text-rose-500 transition-colors" onClick={() => setShowBillModal(false)}>CANCEL TRANSACTION</button>
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
    <button onClick={onClick} style={{ width: '100%', padding: '16px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: active ? 'rgba(255,255,255,0.12)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', userSelect: 'none', borderLeft: active ? '4px solid white' : '4px solid transparent' }} className="active:scale-95 group">
      <div style={{ opacity: active ? 1 : 0.4 }}>{icon}</div>
      <span className="premium-font" style={{ fontWeight: active ? '900' : '400', fontSize: '14px', letterSpacing: '0.5px', textTransform: 'uppercase', color: active ? 'white' : 'rgba(255,255,255,0.6)' }}>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, trend, color, onClick }: { icon: any, label: string, value: number, trend?: string, color?: string, onClick?: () => void }) {
  return (
    <div style={{ padding: '22px', borderRadius: '24px', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '2px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', position: 'relative', cursor: 'pointer', transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', gap: '15px' }} className="active:scale-95 hover:shadow-xl hover:-translate-y-1 group" onClick={onClick}>
      {trend && <div className="label-font" style={{ position: 'absolute', top: '22px', right: '22px', fontSize: '8px', opacity: 0 }} className="group-hover:opacity-100 transition-opacity flex items-center gap-1"><TrendingUp size={10}/> {trend}</div>}
      <div style={{ width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color === 'amber' ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)', color: color === 'amber' ? '#D97706' : '#0A4D68', transition: '0.3s' }} className="group-hover:scale-110 shadow-sm">{icon}</div>
      <div>
        <div className="label-font" style={{ marginBottom: '4px' }}>{label}</div>
        <div className="value-font" style={{ fontSize: '30px', lineHeight: '1' }}>{value}</div>
      </div>
    </div>
  );
}
