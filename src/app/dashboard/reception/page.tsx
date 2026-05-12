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
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/users?role=DOCTOR&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setDoctors(data.users);
        if (data.users.length > 0 && !formData.doctorId) {
          setFormData(prev => ({ ...prev, doctorId: data.users[0].id }));
        }
      }
    } catch (err) {} finally { setTimeout(() => setIsRefreshing(false), 600); }
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
        if (data.patients.length === 1 && query === data.patients[0].phone) setSelectedPatient(data.patients[0]);
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
    if (formData.phone.length !== 10) { alert("❌ Enter valid 10-digit number."); setLoading(false); return; }
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
    } catch (err) { alert("An error occurred"); } finally { setLoading(false); }
  };

  const toggleDoctorAvailability = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAvailable: !currentStatus })
      });
      const data = await res.json();
      if (data.success) fetchDoctors();
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
      const data = await res.json();
      if (data.success) { setShowBillModal(false); fetchBills(); }
    } catch (error) { alert("Billing failed"); } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Sidebar - RESTORED PREMIUM DESIGN */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Malar Hospital</h2>
          <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase' }}>Reception Portal</span>
        </div>
        <nav style={{ padding: '30px 0', flexGrow: 1 }}>
          <SidebarItem active={activeTab === 'register'} icon={<UserPlus size={20} />} label="New Patient" onClick={() => setActiveTab('register')} />
          <SidebarItem active={activeTab === 'queue'} icon={<Users size={20} />} label="Today's Queue" onClick={() => setActiveTab('queue')} />
          <SidebarItem active={activeTab === 'future'} icon={<CalendarCheck size={20} />} label="Appointments" onClick={() => setActiveTab('future')} />
          <SidebarItem active={activeTab === 'billing'} icon={<CreditCard size={20} />} label="Billing Center" onClick={() => setActiveTab('billing')} />
          <SidebarItem active={activeTab === 'doctors'} icon={<Stethoscope size={20} />} label="Doctors List" onClick={() => setActiveTab('doctors')} />
        </nav>
        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}><LogoutButton /></div>
      </aside>

      <main style={{ flex: 1, marginLeft: '240px', padding: '60px 80px' }} className="animate-fade-in">
        <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0A4D68', margin: '0 0 10px 0' }}>Reception Dashboard</h1>
            <p style={{ color: '#64748B', fontSize: '18px' }}>Hospital Operations & Patient Lifecycle | Thoothukudi</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ background: '#E2E8F0', padding: '10px 25px', borderRadius: '50px', fontSize: '13px', fontWeight: 'bold', color: '#0A4D68' }}>
               {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} | {shift} Shift
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid #E2E8F0', paddingLeft: '25px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1E293B' }}>{userName}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold' }}>FRONT OFFICE</div>
              </div>
              <div style={{ width: '45px', height: '45px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0A4D68' }}>{userName?.charAt(0)}</div>
            </div>
          </div>
        </header>

        {/* KPI Row - RESTORED GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', marginBottom: '50px' }}>
          <StatCard 
            icon={<Users size={24} />} 
            label="Active Queue" 
            value={queue.filter(v => v.status !== 'CONSULTING').length} 
            trend="-9%" 
            onClick={() => { setStatsModalData({ title: 'Active Queue (Waiting)', list: queue.filter(v => v.status !== 'CONSULTING') }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<Activity size={24} />} 
            label="Consulting Now" 
            value={queue.filter(v => v.status === 'CONSULTING').length} 
            onClick={() => { setStatsModalData({ title: 'Patients in Consultation', list: queue.filter(v => v.status === 'CONSULTING') }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<CheckCircle2 size={24} />} 
            label="Completed Today" 
            value={bills.length} 
            onClick={() => { setStatsModalData({ title: 'Visits Completed Today', list: bills }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<Calendar size={24} />} 
            label="Appointments" 
            value={futureQueue.length} 
            color="amber" 
            onClick={() => { setStatsModalData({ title: 'Future Scheduled Bookings', list: futureQueue }); setShowStatsModal(true); }}
          />
        </div>

        <div className="animate-fade-in">
          {activeTab === 'register' && (
            <div className="glass-card !p-10 bg-white shadow-xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-800">Patient Encounter Info</h2>
                <div className="relative w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" className="form-input !pl-12 !h-12 !bg-slate-50 border-none" placeholder="Search Patient..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); fetchPatients(e.target.value); }} onBlur={() => setTimeout(() => setShowSearchResults(false), 300)} onFocus={() => searchQuery && setShowSearchResults(true)} />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[200] bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden">
                       {searchResults.map(p => (
                         <div key={p.id} className="p-4 hover:bg-slate-50 cursor-pointer border-b last:border-0" onMouseDown={() => selectPatient(p)}>
                            <div className="font-bold text-slate-800">{p.name} <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2">{p.uhid}</span></div>
                            <div className="text-xs text-slate-500 mt-1">{p.phone}</div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedPatient && (
                <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex justify-between items-center">
                   <div className="flex gap-5 items-center">
                      <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-black">{selectedPatient.name.charAt(0)}</div>
                      <div>
                         <h4 className="text-lg font-black text-slate-800 uppercase">{selectedPatient.name}</h4>
                         <div className="text-xs font-bold text-emerald-700/60 mt-2 flex gap-4">
                            <span>ID: {selectedPatient.uhid}</span><span>{selectedPatient.age}Y | {selectedPatient.gender}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button className="btn btn-outline h-11 px-5 border-emerald-600 text-emerald-600 bg-white" onClick={() => fetchHistory(selectedPatient.id)}><History size={16} className="mr-2" /> History</button>
                      <button className="btn h-11 w-11 !p-0 bg-rose-100 text-rose-600 border-none" onClick={clearPatient}><Trash2 size={18} /></button>
                   </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="form-group"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label><input type="text" className="form-input !bg-slate-50 !h-14 font-bold border-none" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} /></div>
                <div className="form-group"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Phone Number</label><input type="tel" className="form-input !bg-slate-50 !h-14 font-bold border-none" maxLength={10} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} /></div>
                <div className="form-group grid grid-cols-2 gap-4">
                  <div><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Age</label><input type="number" className="form-input !bg-slate-50 !h-14 font-bold border-none" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} /></div>
                  <div><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Gender</label><select className="form-input !bg-slate-50 !h-14 font-bold border-none" required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option>Male</option><option>Female</option></select></div>
                </div>
                <div className="form-group"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Doctor</label><select className="form-input !bg-slate-50 !h-14 font-bold border-none" required value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>{doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}</select></div>
                <div className="form-group"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Appt Date</label><input type="date" className="form-input !bg-slate-50 !h-14 font-bold border-none" min={new Date().toISOString().split('T')[0]} value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} /></div>
                {formData.visitDate && (
                  <div className="form-group"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Time Slot</label>
                    <div className="flex gap-4"><select className="form-input !bg-white !h-14 font-bold flex-1" value={timeHour} onChange={e => setTimeHour(e.target.value)}>{Array.from({length: 12}, (_, i) => (i+1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}</select>
                    <select className="form-input !bg-white !h-14 font-bold flex-1" value={timeMinute} onChange={e => setTimeMinute(e.target.value)}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                    <button type="button" onClick={() => setTimePeriod(timePeriod === 'AM' ? 'PM' : 'AM')} className="bg-slate-100 px-6 rounded-full font-black text-primary">{timePeriod}</button></div>
                  </div>
                )}
                <div className="md:col-span-2 flex justify-end"><button type="submit" disabled={loading} className="btn btn-primary !h-16 !px-12 !rounded-2xl shadow-xl font-black">{loading ? 'Processing...' : 'Register Patient'}</button></div>
              </form>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="glass-card !p-8 bg-white"><h2 className="text-2xl font-black text-slate-800 mb-10">OPD Queue</h2>
              <table className="w-full border-separate border-spacing-0">
                <thead><tr className="text-[10px] font-black text-slate-400 uppercase text-left"><th className="pb-4">Token</th><th className="pb-4">Patient</th><th className="pb-4">Status</th><th className="pb-4 text-right">Actions</th></tr></thead>
                <tbody>{queue.map(v => (
                  <tr key={v.id}><td className="py-4 border-b border-slate-50 font-black text-primary">#{v.tokenNumber}</td><td className="py-4 border-b border-slate-50"><b>{v.patient.name}</b><br/><span className="text-[10px] text-slate-400">{v.patient.uhid}</span></td><td className="py-4 border-b border-slate-50"><span className={`px-2 py-1 rounded text-[10px] font-black ${v.status === 'CONSULTING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{v.status}</span></td><td className="py-4 border-b border-slate-50 text-right"><button className="btn btn-outline !h-8 px-4 text-[10px]" onClick={() => fetchHistory(v.patientId)}>History</button></td></tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="glass-card !p-8 bg-white"><h2 className="text-2xl font-black text-slate-800 mb-10">Billing Center</h2>
              <table className="w-full border-separate border-spacing-0">
                <thead><tr className="text-[10px] font-black text-slate-400 uppercase text-left"><th className="pb-4">Patient</th><th className="pb-4">Amount</th><th className="pb-4">Status</th><th className="pb-4 text-right">Actions</th></tr></thead>
                <tbody>{bills.map(b => (
                  <tr key={b.id}><td className="py-4 border-b border-slate-50"><b>{b.visit.patient.name}</b></td><td className="py-4 border-b border-slate-50 font-black text-primary">₹{b.finalAmount}</td><td className="py-4 border-b border-slate-50"><span className={`px-2 py-1 rounded text-[9px] font-black ${b.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{b.paymentStatus}</span></td><td className="py-4 border-b border-slate-50 text-right">{b.paymentStatus === 'UNPAID' && <button className="btn btn-primary !h-8 px-4 text-[10px]" onClick={() => { setSelectedBill(b); setShowBillModal(true); }}>Collect</button>}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="grid grid-cols-3 gap-8">{doctors.map(doc => (
              <div key={doc.id} className="glass-card !p-8 bg-white">
                <div className="flex justify-between items-start mb-6"><div className="w-12 h-12 rounded-xl bg-slate-50 text-primary flex items-center justify-center font-black">{doc.name.charAt(0)}</div><button onClick={() => toggleDoctorAvailability(doc.id, doc.isAvailable !== false)} className={`h-8 w-8 rounded-lg ${doc.isAvailable !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{doc.isAvailable !== false ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}</button></div>
                <h3 className="font-black text-slate-800">Dr. {doc.name}</h3><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{doc.specialization || 'Consultant'}</p>
              </div>
            ))}</div>
          )}
        </div>

        {/* Success Modal - CENTERED */}
        {showSuccessModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card !p-12 !max-w-md bg-white text-center animate-in zoom-in-95"><div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 size={40} /></div><h2 className="text-3xl font-black mb-4 text-emerald-600">{successInfo?.title}</h2><p className="text-slate-500 font-medium mb-10">{successInfo?.message}</p><div className="bg-slate-50 rounded-2xl p-8 mb-10"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Token</div><div className="text-5xl font-black text-primary">#{successInfo?.token}</div></div><button className="btn btn-primary w-full h-16 !rounded-2xl text-lg font-black" onClick={() => setShowSuccessModal(false)}>Proceed</button></div>
          </div>
        )}

        {/* Visit History Modal - CENTERED */}
        {showHistoryModal && historyData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }}>
            <div className="glass-card !max-w-[680px] w-full !p-0 overflow-hidden flex flex-col bg-white shadow-2xl animate-in slide-in-from-bottom-5" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center"><div className="flex gap-4 items-center"><div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold">{historyData.patient.name.charAt(0)}</div><div><div className="font-black text-slate-800">{historyData.patient.name}</div><div className="text-xs text-slate-400 font-bold">{historyData.patient.uhid}</div></div></div><button onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }} className="text-slate-400"><X size={20} /></button></div>
              <div className="p-6 overflow-y-auto">{historyData.history.length === 0 ? <div className="py-12 text-center text-slate-400">No records found.</div> : historyData.history.map((v: any, idx: number) => (
                <div key={v.id} className="border border-slate-100 rounded-xl mb-4"><div className="p-4 cursor-pointer flex justify-between items-center" onClick={() => setExpandedVisitId(expandedVisitId === v.id ? null : v.id)}><div className="flex items-center gap-4"><span className="w-6 h-6 rounded-full bg-slate-50 text-primary text-[10px] flex items-center justify-center font-black">{historyData.history.length - idx}</span><b>{new Date(v.visitDate).toLocaleDateString('en-GB')}</b></div><ChevronDown className={`text-slate-300 transition-transform ${expandedVisitId === v.id ? 'rotate-180' : ''}`} size={18} /></div>
                {expandedVisitId === v.id && <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2"><div className="mb-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Diagnosis</span><p className="text-xs font-black text-primary">{v.diagnosis || 'N/A'}</p></div>{v.prescriptions?.length > 0 && <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Meds</span><div className="flex flex-wrap gap-2">{v.prescriptions.map((p: any) => <span key={p.id} className="px-2 py-1 bg-white text-emerald-700 text-[10px] font-black rounded border border-emerald-100">{p.drugName}</span>)}</div></div>}</div>}</div>
              ))}</div>
            </div>
          </div>
        )}

        {/* Stats Detail Modal - CENTERED */}
        {showStatsModal && statsModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowStatsModal(false)}>
            <div className="glass-card !max-w-[500px] w-full !p-0 overflow-hidden bg-white shadow-2xl animate-in zoom-in-95" style={{ maxHeight: '70vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-black text-slate-800 uppercase">{statsModalData.title}</h3><button onClick={() => setShowStatsModal(false)} className="text-slate-400"><X size={16} /></button></div>
              <div className="p-4 overflow-y-auto">{statsModalData.list.length === 0 ? <div className="py-12 text-center text-slate-400 italic">No records.</div> : <div className="flex flex-col gap-2">{statsModalData.list.map((v: any) => (
                <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center"><div><div className="font-bold text-slate-800">{v.patient?.name || v.patientName || 'Unknown'}</div><div className="text-[10px] text-slate-400 uppercase">{v.patient?.uhid || v.uhid}</div></div><div className={`text-[9px] font-black px-2 py-0.5 rounded-full ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{v.status || 'SCHEDULED'}</div></div>
              ))}</div>}</div>
            </div>
          </div>
        )}

        {/* Bill Modal - CENTERED */}
        {showBillModal && selectedBill && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card !p-10 !max-w-md bg-white animate-in zoom-in-95">
              <h2 className="text-2xl font-black text-slate-800 mb-8">Payment Collection</h2><div className="flex flex-col gap-6"><div className="form-group"><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Method</label><select className="form-input" value={billingForm.paymentMode} onChange={e => setBillingForm({...billingForm, paymentMode: e.target.value})}><option>CASH</option><option>UPI</option></select></div><div className="form-group"><label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Discount</label><input type="number" className="form-input" value={billingForm.discount} onChange={e => setBillingForm({...billingForm, discount: parseInt(e.target.value) || 0})} /></div><button className="btn btn-primary w-full h-14 font-black" onClick={handlePayBill} disabled={loading}>Collect ₹{selectedBill.finalAmount - billingForm.discount}</button><button className="text-slate-400 w-full mt-4" onClick={() => setShowBillModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: active ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.1s ease', userSelect: 'none' }} className="active:scale-95">
      <div style={{ opacity: active ? 1 : 0.4 }}>{icon}</div>
      <span style={{ fontWeight: active ? '800' : '400', fontSize: '14px', letterSpacing: active ? '0.5px' : '0', textTransform: 'uppercase' }}>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, trend, color, onClick }: { icon: any, label: string, value: number, trend?: string, color?: string, onClick?: () => void }) {
  return (
    <div style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '2px solid transparent', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', position: 'relative', cursor: 'pointer', transition: '0.1s ease-in-out', display: 'flex', flexDirection: 'column', gap: '15px' }} className="active:scale-95 hover:shadow-xl" onClick={onClick}>
      <div style={{ width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color === 'amber' ? '#FFFBEB' : '#F1F5F9', color: color === 'amber' ? '#D97706' : '#0A4D68' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '32px', fontWeight: '900', color: '#1E293B' }}>{value}</div>
      </div>
    </div>
  );
}
