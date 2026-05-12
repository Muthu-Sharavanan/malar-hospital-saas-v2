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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F4F7F9', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .premium-title { font-family: 'Inter', sans-serif; font-weight: 900; letter-spacing: -0.03em; }
        .premium-label { font-family: 'Inter', sans-serif; font-weight: 900; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; }
        .premium-glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(16px); border: 1.5px solid white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .btn-premium { font-family: 'Inter', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>

      {/* Sidebar - FIXED & SHARP */}
      <aside style={{ width: '220px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
        <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="premium-title" style={{ fontSize: '18px', margin: 0 }}>Malar Hospital</h2>
          <span className="premium-label" style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4px', display: 'block', fontSize: '8px' }}>Reception Portal</span>
        </div>
        <nav style={{ padding: '20px 0', flexGrow: 1 }}>
          <SidebarItem active={activeTab === 'register'} icon={<UserPlus size={18} />} label="New Patient" onClick={() => setActiveTab('register')} />
          <SidebarItem active={activeTab === 'queue'} icon={<Users size={18} />} label="Today's Queue" onClick={() => setActiveTab('queue')} />
          <SidebarItem active={activeTab === 'future'} icon={<CalendarCheck size={18} />} label="Appointments" onClick={() => setActiveTab('future')} />
          <SidebarItem active={activeTab === 'billing'} icon={<CreditCard size={18} />} label="Billing Center" onClick={() => setActiveTab('billing')} />
          <SidebarItem active={activeTab === 'doctors'} icon={<Stethoscope size={18} />} label="Doctors List" onClick={() => setActiveTab('doctors')} />
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}><LogoutButton /></div>
      </aside>

      <main style={{ flex: 1, marginLeft: '220px', padding: '40px 60px' }} className="animate-in fade-in duration-300">
        <header style={{ marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="premium-title" style={{ fontSize: '32px', color: '#0A4D68', margin: 0 }}>Reception Dashboard</h1>
            <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>Hospital Operations & Lifecycle | Thoothukudi</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="premium-title" style={{ background: 'white', padding: '8px 20px', borderRadius: '50px', fontSize: '10px', color: '#0A4D68', border: '1.5px solid #E2E8F0' }}>
               {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} • {shift}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="premium-title" style={{ fontSize: '13px', color: '#1E293B' }}>{userName}</div>
                <div className="premium-label" style={{ fontSize: '8px' }}>OFFICE EXECUTIVE</div>
              </div>
              <div style={{ width: '40px', height: '40px', background: '#0A4D68', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px' }}>{userName?.charAt(0)}</div>
            </div>
          </div>
        </header>

        {/* KPI Row - COMPACT WIDGETS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '35px' }}>
          <StatCard 
            icon={<Users size={20} />} 
            label="Active Queue" 
            value={queue.filter(v => v.status !== 'CONSULTING').length} 
            onClick={() => { setStatsModalData({ title: 'Active Queue', list: queue.filter(v => v.status !== 'CONSULTING') }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<Activity size={20} />} 
            label="Consulting" 
            value={queue.filter(v => v.status === 'CONSULTING').length} 
            onClick={() => { setStatsModalData({ title: 'Consultations', list: queue.filter(v => v.status === 'CONSULTING') }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<CheckCircle2 size={20} />} 
            label="Completed" 
            value={bills.length} 
            onClick={() => { setStatsModalData({ title: 'Completed Today', list: bills }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<Calendar size={20} />} 
            label="Appointments" 
            value={futureQueue.length} 
            color="amber" 
            onClick={() => { setStatsModalData({ title: 'Upcoming Bookings', list: futureQueue }); setShowStatsModal(true); }}
          />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'register' && (
            <div className="premium-glass !p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="premium-title text-xl text-slate-800">Patient Encounter Info</h2>
                <div className="relative w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all" size={16} />
                  <input type="text" className="form-input !pl-10 !h-11 !bg-slate-50 border-none group-focus-within:!bg-white group-focus-within:!ring-1 group-focus-within:!ring-primary/20 transition-all font-bold text-xs" placeholder="Search ID/Phone..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); fetchPatients(e.target.value); }} onBlur={() => setTimeout(() => setShowSearchResults(false), 300)} onFocus={() => searchQuery && setShowSearchResults(true)} />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[200] bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95">
                       {searchResults.map(p => (
                         <div key={p.id} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0" onMouseDown={() => selectPatient(p)}>
                            <div className="premium-title text-xs uppercase">{p.name} <span className="premium-label !text-slate-400 ml-2">{p.uhid}</span></div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-bold">{p.phone}</div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedPatient && (
                <div className="mb-6 p-5 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center animate-in zoom-in-95">
                   <div className="flex gap-4 items-center">
                      <div className="w-11 h-11 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-lg font-black">{selectedPatient.name.charAt(0)}</div>
                      <div>
                         <div className="flex items-center gap-2">
                            <h4 className="premium-title text-base uppercase">{selectedPatient.name}</h4>
                            <span className="premium-label !text-white bg-emerald-600 px-2 py-0.5 rounded-full !text-[7px]">VERIFIED</span>
                         </div>
                         <div className="premium-label !text-[8px] mt-1 flex gap-3">
                            <span>ID: {selectedPatient.uhid}</span><span>AGE: {selectedPatient.age}Y</span><span>PH: {selectedPatient.phone}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button className="btn-premium h-9 px-4 border-2 border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-600 hover:text-white rounded-lg text-[9px]" onClick={() => fetchHistory(selectedPatient.id)}>HISTORY</button>
                      <button className="h-9 w-9 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center active:scale-90" onClick={clearPatient}><Trash2 size={16} /></button>
                   </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div className="form-group">
                  <label className="premium-label mb-2 block">Patient Name</label>
                  <input type="text" className="form-input !bg-slate-50 !h-12 font-black border-none text-sm text-slate-800 focus:!bg-white" placeholder="ENTER NAME" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group">
                  <label className="premium-label mb-2 block">Phone Number</label>
                  <input type="tel" className="form-input !bg-slate-50 !h-12 font-black border-none text-sm text-slate-800 focus:!bg-white" placeholder="MOBILE NO" maxLength={10} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="form-group grid grid-cols-2 gap-4">
                  <div>
                    <label className="premium-label mb-2 block">Age</label>
                    <input type="number" className="form-input !bg-slate-50 !h-12 font-black border-none text-sm focus:!bg-white" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div>
                    <label className="premium-label mb-2 block">Gender</label>
                    <select className="form-input !bg-slate-50 !h-12 font-black border-none text-sm focus:!bg-white" required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="premium-label mb-2 block">Assigned Doctor</label>
                  <select className="form-input !bg-slate-50 !h-12 font-black border-none text-sm focus:!bg-white" required value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                    {doctors.map(d => <option key={d.id} value={d.id}>DR. {d.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                   <label className="premium-label mb-2 block">Date (Optional)</label>
                   <input type="date" className="form-input !bg-slate-50 !h-12 font-black border-none text-sm focus:!bg-white" min={new Date().toISOString().split('T')[0]} value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} />
                </div>
                {formData.visitDate && (
                  <div className="form-group">
                    <label className="premium-label mb-2 block">Time</label>
                    <div className="flex gap-2">
                      <select className="form-input !bg-white !h-12 font-black border border-slate-100 rounded-lg flex-1 text-center text-sm" value={timeHour} onChange={e => setTimeHour(e.target.value)}>{Array.from({length: 12}, (_, i) => (i+1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}</select>
                      <select className="form-input !bg-white !h-12 font-black border border-slate-100 rounded-lg flex-1 text-center text-sm" value={timeMinute} onChange={e => setTimeMinute(e.target.value)}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                      <button type="button" onClick={() => setTimePeriod(timePeriod === 'AM' ? 'PM' : 'AM')} className="bg-primary text-white px-5 rounded-lg font-black text-xs">{timePeriod}</button>
                    </div>
                  </div>
                )}
                <div className="md:col-span-2 flex justify-end mt-2">
                  <button type="submit" disabled={loading} className="btn-premium !h-14 !px-10 !bg-primary !text-white !rounded-xl shadow-lg shadow-primary/20 text-sm active:scale-95">{loading ? 'STAGING...' : 'GENERATE TOKEN'}</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="premium-glass !p-8 animate-in fade-in">
              <div className="flex justify-between items-center mb-8">
                <h2 className="premium-title text-xl text-slate-800">Operational Queue</h2>
                <div className="px-4 py-1.5 bg-primary/10 rounded-full premium-label !text-primary !text-[8px]">{queue.length} IN WAIT</div>
              </div>
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="premium-label text-left !text-[9px]">
                    <th className="pb-4 pl-4">Token</th>
                    <th className="pb-4">Patient info</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Specialist</th>
                    <th className="pb-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map(v => (
                    <tr key={v.id} className="group hover:bg-white/50 transition-colors">
                      <td className="py-4 pl-4 border-t border-slate-100 premium-title !text-primary !text-base">#{v.tokenNumber}</td>
                      <td className="py-4 border-t border-slate-100">
                        <div className="premium-title text-sm uppercase">{v.patient.name}</div>
                        <div className="premium-label !text-[8px] !text-slate-400 mt-0.5">{v.patient.uhid}</div>
                      </td>
                      <td className="py-4 border-t border-slate-100">
                        <span className={`px-2 py-0.5 rounded-full premium-label !text-[7px] !text-white ${v.status === 'CONSULTING' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                           {v.status === 'CONSULTING' ? 'CONSULTING' : 'WAITING'}
                        </span>
                      </td>
                      <td className="py-4 border-t border-slate-100 premium-label !text-slate-600 !text-[9px]">DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</td>
                      <td className="py-4 pr-4 border-t border-slate-100 text-right">
                        <button className="btn-premium !h-7 px-3 border border-primary text-primary hover:bg-primary hover:text-white rounded-md !text-[8px]" onClick={() => fetchHistory(v.patientId)}>HISTORY</button>
                      </td>
                    </tr>
                  ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="premium-glass !p-8 animate-in fade-in">
              <h2 className="premium-title text-xl text-slate-800 mb-8 uppercase">Billing center</h2>
              <table className="w-full border-separate border-spacing-0">
                <thead><tr className="premium-label text-left !text-[9px]"><th className="pb-4 pl-4">Invoice Subject</th><th className="pb-4">Status</th><th className="pb-4">Net</th><th className="pb-4 pr-4 text-right">Action</th></tr></thead>
                <tbody>{bills.map(b => (
                  <tr key={b.id} className="group hover:bg-white/50 transition-colors">
                    <td className="py-4 pl-4 border-t border-slate-100"><div className="premium-title text-sm uppercase">{b.visit.patient.name}</div><div className="premium-label !text-[8px] !text-slate-400 mt-0.5">{b.visit.patient.uhid}</div></td>
                    <td className="py-4 border-t border-slate-100"><span className={`px-2 py-0.5 rounded-full premium-label !text-[7px] !text-white ${b.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{b.paymentStatus}</span></td>
                    <td className="py-4 border-t border-slate-100 premium-title !text-primary !text-base">₹{b.finalAmount}</td>
                    <td className="py-4 pr-4 border-t border-slate-100 text-right">{b.paymentStatus === 'UNPAID' && <button className="btn-premium !h-8 px-5 bg-primary text-white rounded-md !text-[8px]" onClick={() => { setSelectedBill(b); setShowBillModal(true); }}>COLLECT</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="grid grid-cols-3 gap-5 animate-in slide-in-from-bottom-4">{doctors.map(doc => (
              <div key={doc.id} className="premium-glass !p-6 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-11 h-11 rounded-lg bg-slate-50 text-primary flex items-center justify-center font-black text-xl shadow-inner">{doc.name.charAt(0)}</div>
                  <button onClick={() => toggleDoctorAvailability(doc.id, doc.isAvailable !== false)} className={`h-8 w-8 rounded-lg transition-all active:scale-90 flex items-center justify-center ${doc.isAvailable !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{doc.isAvailable !== false ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}</button>
                </div>
                <h3 className="premium-title text-sm uppercase tracking-tight">DR. {doc.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</h3>
                <p className="premium-label !text-[8px] mt-1">{doc.specialization || 'Clinical'}</p>
              </div>
            ))}</div>
          )}
        </div>

        {/* Modals - ALL CENTERED & SHARP */}
        {showSuccessModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.6)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="premium-glass !p-10 !max-w-sm bg-white text-center animate-in zoom-in-95 rounded-[2rem]">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={32} /></div>
              <h2 className="premium-title text-xl text-emerald-600 uppercase mb-3">{successInfo?.title}</h2>
              <p className="text-slate-500 font-bold text-sm mb-8 leading-snug">{successInfo?.message}</p>
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                <div className="premium-label !text-[8px] mb-1">CLINICAL TOKEN</div>
                <div className="premium-title !text-primary !text-4xl">#{successInfo?.token}</div>
              </div>
              <button className="btn-premium w-full h-14 bg-primary text-white rounded-xl !text-xs" onClick={() => setShowSuccessModal(false)}>DONE</button>
            </div>
          </div>
        )}

        {showHistoryModal && historyData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.6)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }}>
            <div className="premium-glass !max-w-[600px] w-full !p-0 overflow-hidden flex flex-col bg-white animate-in slide-in-from-bottom-5 rounded-[1.5rem]" style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-lg bg-[#0A4D68] text-white flex items-center justify-center text-lg font-black">{historyData.patient.name.charAt(0)}</div>
                  <div>
                    <div className="premium-title text-base uppercase">{historyData.patient.name}</div>
                    <div className="premium-label !text-[8px] mt-0.5">{historyData.patient.uhid}</div>
                  </div>
                </div>
                <button onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-400"><X size={18} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                {historyData.history.length === 0 ? <div className="py-10 text-center premium-label opacity-40">No historical data</div> : historyData.history.map((v: any, idx: number) => (
                  <div key={v.id} className="border border-slate-100 rounded-xl mb-3 overflow-hidden">
                    <div className={`p-4 cursor-pointer flex justify-between items-center ${expandedVisitId === v.id ? 'bg-slate-50' : 'bg-white'}`} onClick={() => setExpandedVisitId(expandedVisitId === v.id ? null : v.id)}>
                      <div className="flex items-center gap-3">
                        <span className="premium-title !text-primary !text-xs">#0{historyData.history.length - idx}</span>
                        <div>
                          <div className="premium-title uppercase text-[11px]">{new Date(v.visitDate).toLocaleDateString('en-GB')}</div>
                          <div className="premium-label !text-[7px]">DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</div>
                        </div>
                      </div>
                      <ChevronDown className={`text-slate-300 transition-transform ${expandedVisitId === v.id ? 'rotate-180' : ''}`} size={16} />
                    </div>
                    {expandedVisitId === v.id && <div className="p-4 bg-white border-t border-slate-50 animate-in slide-in-from-top-2">
                        {v.diagnosis && <div className="mb-3"><span className="premium-label !text-[7px] block mb-1">Diagnosis</span><p className="premium-title text-primary uppercase text-[10px]">{v.diagnosis}</p></div>}
                        {v.prescriptions?.length > 0 && <div><span className="premium-label !text-[7px] block mb-2">Prescribed</span><div className="flex flex-wrap gap-1.5">{v.prescriptions.map((p: any) => <span key={p.id} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[8px] font-black rounded-md border border-emerald-100 uppercase tracking-widest">💊 {p.drugName}</span>)}</div></div>}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showStatsModal && statsModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.6)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowStatsModal(false)}>
            <div className="premium-glass !max-w-[400px] w-full !p-0 overflow-hidden bg-white animate-in zoom-in-95 rounded-[1.5rem]" style={{ maxHeight: '70vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="premium-title uppercase text-base">{statsModalData.title}</h3><button onClick={() => setShowStatsModal(false)} className="text-slate-400"><X size={16} /></button></div>
              <div className="p-4 overflow-y-auto">{statsModalData.list.length === 0 ? <div className="py-10 text-center premium-label opacity-40 italic uppercase">Empty track</div> : <div className="flex flex-col gap-2">{statsModalData.list.map((v: any) => (
                <div key={v.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="premium-title uppercase text-xs">{v.patient?.name || v.patientName || 'RECORD'}</div>
                    <div className="premium-label !text-[7px] mt-0.5">{v.patient?.uhid || v.uhid}</div>
                  </div>
                  <div className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{v.status || 'SCHEDULED'}</div>
                </div>
              ))}</div>}</div>
            </div>
          </div>
        )}

        {showBillModal && selectedBill && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.6)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="premium-glass !p-8 !max-w-xs bg-white animate-in zoom-in-95 rounded-[2rem]">
              <h2 className="premium-title text-lg mb-6 uppercase text-center">Collection Hub</h2>
              <div className="flex flex-col gap-5">
                <div className="form-group"><label className="premium-label block mb-2">Instrument</label><select className="form-input !h-12 font-black border-none !bg-slate-50 rounded-lg text-xs" value={billingForm.paymentMode} onChange={e => setBillingForm({...billingForm, paymentMode: e.target.value})}><option>CASH</option><option>UPI</option></select></div>
                <div className="form-group"><label className="premium-label block mb-2">Waiver (₹)</label><input type="number" className="form-input !h-12 font-black border-none !bg-slate-50 rounded-lg text-xs" value={billingForm.discount} onChange={e => setBillingForm({...billingForm, discount: parseInt(e.target.value) || 0})} /></div>
                <button className="btn-premium w-full h-14 bg-primary text-white rounded-xl !text-[10px]" onClick={handlePayBill} disabled={loading}>RECEIVE ₹{selectedBill.finalAmount - billingForm.discount}</button>
                <button className="premium-label !text-[8px] !text-slate-400 w-full mt-1 text-center" onClick={() => setShowBillModal(false)}>CANCEL</button>
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
    <button onClick={onClick} style={{ width: '100%', padding: '14px 25px', display: 'flex', alignItems: 'center', gap: '12px', background: active ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', userSelect: 'none', borderLeft: active ? '4px solid white' : '4px solid transparent' }} className="active:scale-95 group">
      <div style={{ opacity: active ? 1 : 0.4 }}>{icon}</div>
      <span className="premium-title" style={{ fontWeight: active ? '900' : '400', fontSize: '13px', textTransform: 'uppercase', color: active ? 'white' : 'rgba(255,255,255,0.5)' }}>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, color, onClick }: { icon: any, label: string, value: number, color?: string, onClick?: () => void }) {
  return (
    <div style={{ padding: '18px', borderRadius: '16px', background: 'white', border: '1.5px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', position: 'relative', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', gap: '10px' }} className="active:scale-95 hover:shadow-lg group" onClick={onClick}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color === 'amber' ? '#FFFBEB' : '#F1F5F9', color: color === 'amber' ? '#D97706' : '#0A4D68' }} className="group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <div className="premium-label" style={{ fontSize: '8px', marginBottom: '2px' }}>{label}</div>
        <div className="premium-title" style={{ fontSize: '24px', lineHeight: '1', color: '#1e293b' }}>{value}</div>
      </div>
    </div>
  );
}
