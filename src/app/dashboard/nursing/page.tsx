'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Stethoscope, 
  Activity, 
  Thermometer, 
  Droplets, 
  Weight, 
  LayoutDashboard, 
  Clock, 
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  Sun,
  Moon,
  History
} from 'lucide-react';

export default function NursingDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'morning' | 'evening'>(
    new Date().getHours() < 12 ? 'morning' : 'evening'
  );
  const [showHistorical, setShowHistorical] = useState(false);
  
  // Vitals State
  const [vitals, setVitals] = useState({
    pulse: '',
    bloodPressure: '',
    spo2: '',
    temperature: '',
    weight: '',
    height: '',
    bmi: ''
  });

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/vitals?session=${sessionFilter}&includePast=${showHistorical}&t=${Date.now()}`);
      const data = await res.json();
      if (data.success) setQueue(data.queue);
    } catch (err) {
      console.error("Failed to fetch nursing queue", err);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.success) {
        setUserName(data.user.name);
        setShift(data.shift);
      }
    } catch (err) {
      console.error("Failed to fetch session", err);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchSession();
    const interval = setInterval(fetchQueue, 15000); 
    const shiftTimer = setInterval(() => {
       setShift(new Date().getHours() < 12 ? 'Morning' : 'Evening');
    }, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(shiftTimer);
    };
  }, [sessionFilter, showHistorical]);

  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    const w = parseFloat(vitals.weight);
    const h = parseFloat(vitals.height) / 100; // cm to m
    if (w > 0 && h > 0) {
      const b = (w / (h * h)).toFixed(2);
      setVitals(prev => ({ ...prev, bmi: b }));
    }
  }, [vitals.weight, vitals.height]);

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vitals, visitId: selectedVisit.id })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedVisit(null);
        setVitals({ pulse: '', bloodPressure: '', spo2: '', temperature: '', weight: '', height: '', bmi: '' });
        fetchQueue();
      }
    } catch (err) {
      alert("Failed to save vitals");
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = queue.filter(v => 
    v.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.patient.uhid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.tokenNumber.toString().includes(searchTerm)
  );

  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Sidebar - Shared Premium Style */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Malar Hospital</h2>
          <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase' }}>Nursing Station</span>
        </div>

        <nav style={{ padding: '30px 0', flexGrow: 1 }}>
          <button 
             className="w-full px-8 py-4 flex items-center gap-4 border-none text-white cursor-pointer"
             style={{ background: 'rgba(255,255,255,0.1)', borderLeft: '4px solid #fff' }}
          >
            <Activity size={20} /> 
            <span style={{ fontWeight: 'bold' }}>Triage Queue</span>
          </button>
        </nav>

        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '240px', padding: '60px 80px' }} className="animate-fade-in">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Nursing Dashboard</h1>
            <p className="text-slate-500 font-bold flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              {shift} Shift &nbsp;·&nbsp; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-tiny">
              <div className="text-right">
                <div className="text-sm font-black text-slate-800">{userName || 'Head Nurse'}</div>
                <div className="text-[10px] text-primary font-black uppercase tracking-widest">Triage Specialist</div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xl">
                 {userName ? userName.charAt(0) : 'N'}
              </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Waiting List */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users size={22} className="text-primary" />
                  </div>
                  Active Queue
                </h3>
                
                {/* Enhanced Catchy Session Toggle */}
                {/* Redesigned Session Toggle - Premium Pill Style */}
                <div className="flex bg-white p-1 rounded-full border border-slate-200 shadow-tiny w-fit">
                  <button 
                    onClick={() => setSessionFilter('morning')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black transition-all duration-300 ${sessionFilter === 'morning' ? 'bg-primary text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Sun size={14} /> MORNING
                  </button>
                  <button 
                    onClick={() => setSessionFilter('evening')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black transition-all duration-300 ${sessionFilter === 'evening' ? 'bg-primary text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Moon size={14} /> EVENING
                  </button>
                </div>
              </div>

              {/* Catchy Historical Toggle */}
              <button 
                onClick={() => setShowHistorical(!showHistorical)}
                className={`group relative overflow-hidden flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-500 border-2 ${showHistorical ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-primary/20 shadow-soft'}`}
              >
                <div className="flex items-center gap-4 relative z-10">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showHistorical ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                      <History size={18} />
                   </div>
                   <div className="text-left">
                      <div className="text-[11px] font-black uppercase tracking-[2px]">Clinical Backlog</div>
                      <div className="text-[13px] font-bold opacity-80">{showHistorical ? 'Isolating Previous Days Records' : 'Review Historical Pending Patients'}</div>
                   </div>
                </div>
                <div className="relative z-10 opacity-40 group-hover:opacity-100 transition-opacity">
                   <ChevronRight size={20} className={`transition-transform duration-500 ${showHistorical ? 'rotate-180' : ''}`} />
                </div>
                
                {/* Subtle Background Glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${showHistorical ? 'from-rose-100/0 to-rose-100/50' : 'from-primary/0 to-primary/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              </button>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search UHID / Name..." 
                className="form-input !pl-12 !h-12 !bg-white border-none shadow-tiny !rounded-2xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
              {filteredQueue.length > 0 ? filteredQueue.map((v: any) => (
                <div 
                  key={v.id} 
                  className={`glass-card !p-5 cursor-pointer hover-scale-102 transition-all ${selectedVisit?.id === v.id ? '!border-primary !shadow-lg bg-primary/5' : 'bg-white shadow-tiny border-white'}`}
                  onClick={() => {
                    setSelectedVisit(v);
                    setVitals({ pulse: '', bloodPressure: '', spo2: '', temperature: '', weight: '', height: '', bmi: '' });
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-primary font-black uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">Token #{v.tokenNumber}</span>
                              <span className="text-[10px] text-slate-400 font-black flex items-center gap-1">
                                 <Clock size={10} /> 
                                 {new Date(v.visitDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                           </div>
                           <h4 className="text-base font-bold text-slate-800">{v.patient.name}</h4>
                           {new Date(v.visitDate).toLocaleDateString() !== new Date().toLocaleDateString() && (
                             <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full mt-1 w-fit border border-rose-100">PREVIOUS DAY</span>
                           )}
                         </div>
                    <div className={`p-2 rounded-lg ${selectedVisit?.id === v.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                       <span className="text-[10px] font-bold text-slate-400">{v.patient.age}Y | {v.patient.gender} | {v.doctor?.name || v.assignedDoctorName}</span>
                       <span className={`text-[10px] font-black px-2 py-1 rounded bg-secondary/10 text-secondary uppercase tracking-[1px]`}>
                          READY
                       </span>
                    </div>
                </div>
              )) : (
                <div className="glass-card flex flex-col items-center justify-center p-12 text-center bg-white/50 border-dashed border-2 border-slate-200">
                  <Activity className="text-slate-300 mb-4" size={40} />
                  <h4 className="text-slate-500 font-bold">Queue Empty</h4>
                  <p className="text-xs text-slate-400">Tokens will appear after registration.</p>
                </div>
              )}
            </div>
          </div>

          {/* Vitals Form */}
          <div className="lg:col-span-2">
            {selectedVisit ? (
              <div className="glass-card !p-10 animate-fade-in bg-white border-2 border-white shadow-xl h-full">
                <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-50">
                  <div className="flex gap-5 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl font-black shadow-lg">
                      {selectedVisit.patient.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">{selectedVisit.patient.name}</h2>
                      <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">
                        UHID: {selectedVisit.patient.uhid} &nbsp;·&nbsp; TOKEN #{selectedVisit.tokenNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Doctor Assigned</span>
                    <span className="text-sm font-black text-slate-700">{selectedVisit.doctor.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Left: Patient Context & Reason */}
                   <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-6">
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3">Reason for Visit</label>
                        <div className="p-5 bg-white rounded-2xl border border-blue-100 shadow-tiny">
                           <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                             "{selectedVisit.chiefComplaints || 'Routine health checkup and vital screening.'}"
                           </p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                           <AlertCircle size={20} className="text-amber-500 shrink-0" />
                           <div>
                              <div className="text-[10px] font-black text-amber-700 uppercase">Attention Note</div>
                              <p className="text-[11px] font-bold text-amber-600 mt-1">Ensure patient is seated for 5 minutes before BP measurement.</p>
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Right: Vitals Input */}
                   <form className="flex flex-col gap-5" onSubmit={handleSubmitVitals}>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Document Vitals</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label !text-[10px] !font-black !text-slate-500">PULSE (bpm)</label>
                          <input 
                            type="number" className="form-input !h-12 !bg-slate-50/50 border-none transition-all focus:!bg-white focus:!ring-2" placeholder="72" required 
                            value={vitals.pulse} onChange={e => setVitals({...vitals, pulse: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label !text-[10px] !font-black !text-slate-500">BP (mmHg)</label>
                          <input 
                            type="text" className="form-input !h-12 !bg-slate-50/50 border-none transition-all focus:!bg-white focus:!ring-2" placeholder="120/80" required 
                            value={vitals.bloodPressure} onChange={e => setVitals({...vitals, bloodPressure: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label !text-[10px] !font-black !text-slate-500">SpO₂ (%)</label>
                          <input 
                            type="number" className="form-input !h-12 !bg-slate-50/50 border-none transition-all focus:!bg-white focus:!ring-2" placeholder="98" required 
                            value={vitals.spo2} onChange={e => setVitals({...vitals, spo2: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label !text-[10px] !font-black !text-slate-500">TEMP (°F)</label>
                          <input 
                            type="number" step="0.1" className="form-input !h-12 !bg-slate-50/50 border-none transition-all focus:!bg-white focus:!ring-2" placeholder="98.6" required 
                            value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label !text-[10px] !font-black !text-slate-500">WEIGHT (kg)</label>
                          <input 
                            type="number" step="0.1" className="form-input !h-12 !bg-slate-50/50 border-none transition-all focus:!bg-white focus:!ring-2" placeholder="70" required 
                            value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label !text-[10px] !font-black !text-slate-500">HEIGHT (cm)</label>
                          <input 
                            type="number" className="form-input !h-12 !bg-slate-50/50 border-none transition-all focus:!bg-white focus:!ring-2" placeholder="170" required 
                            value={vitals.height} onChange={e => setVitals({...vitals, height: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label !text-[10px] !font-black !text-slate-500">BMI (Auto-calculated)</label>
                        <input type="text" className="form-input !h-12 !bg-primary/[0.03] border-dashed !text-primary !font-black" readOnly value={vitals.bmi} />
                      </div>

                      <button type="submit" className="btn btn-primary !h-14 !rounded-2xl shadow-lg shadow-primary/20 text-md font-black" disabled={loading}>
                        {loading ? "SAVING..." : "SUBMIT TO DOCTOR"}
                      </button>
                   </form>
                </div>
              </div>
            ) : (
              <div className="glass-card flex flex-col items-center justify-center p-24 text-center bg-white/50 border-2 border-dashed border-slate-200 h-full">
                <Thermometer className="text-slate-200 mb-8" size={80} />
                <h3 className="text-slate-400 font-black mb-2 uppercase tracking-widest">Select Patient</h3>
                <p className="text-slate-500 max-w-xs mx-auto font-bold text-sm">Pick a patient from the waitlist to begin triaging and vitals documentation.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
