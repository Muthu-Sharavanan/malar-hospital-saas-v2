'use client';
import { useState, useEffect, useRef } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import LogoutButton from '@/components/LogoutButton';
import { 
  Stethoscope, 
  Users, 
  CheckCircle2, 
  Calendar, 
  LayoutDashboard, 
  Bell, 
  Mic, 
  MicOff, 
  PlusCircle, 
  FlaskConical, 
  Pill, 
  Printer, 
  ArrowUpRight, 
  TrendingDown, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon
} from 'lucide-react';

export default function DoctorDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionFilter, setSessionFilter] = useState<'morning' | 'evening'>(
    new Date().getHours() < 12 ? 'morning' : 'evening'
  );

  const [showCalendar, setShowCalendar] = useState(false);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarVisitDetail, setCalendarVisitDetail] = useState<any>(null);
  const [statModalState, setStatModalState] = useState<{ title: string, list: any[] } | null>(null);

  // Toast System
  const [toasts, setToasts] = useState<any[]>([]);
  const previousQueueIds = useRef<string[]>([]);
  const [isListening, setIsListening] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Format doctor name
  let drName = userName
    ? 'Dr. ' + userName.trim().replace(/^(dr\.?\s*)+/i, '')
    : 'Doctor';
    
  if (drName.toLowerCase() === 'dr. malar') {
    drName = 'Dr. Ramaswamy';
  }

  useEffect(() => {
    document.title = `${drName} | Malar Hospital`;
  }, [drName]);

  const [loading, setLoading] = useState(false);
  
  // Consultation State
  const [consultation, setConsultation] = useState({
    chiefComplaints: '',
    history: '',
    examination: '',
    diagnosis: '',
    investigationAdvised: ''
  });

  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [currentDrug, setCurrentDrug] = useState({ name: '', dosage: '1-0-1', duration: '5 Days', instructions: 'After food' });

  const selectVisit = (v: any) => {
    setSelectedVisit(v);
    setConsultation({
      chiefComplaints: v.chiefComplaints || '',
      history: v.history || '',
      examination: v.examination || '',
      diagnosis: v.diagnosis || '',
      investigationAdvised: v.investigationAdvised || ''
    });
    if (v.prescriptions) {
      setDrugs(v.prescriptions.map((p: any) => ({
        name: p.drugName,
        dosage: p.dosage,
        duration: p.duration,
        instructions: p.instructions
      })));
    } else {
      setDrugs([]);
    }
  };

  const commonTests = [
    { name: 'CBC (Complete Blood Count)', category: 'Hematology' },
    { name: 'RBS (Random Blood Sugar)', category: 'Biochemistry' },
    { name: 'Liver Function Test (LFT)', category: 'Biochemistry' },
    { name: 'Kidney Function Test (KFT)', category: 'Biochemistry' },
    { name: 'Lipid Profile', category: 'Biochemistry' },
    { name: 'Urine Routine', category: 'Clinical Pathology' }
  ];

  const handleAddDrug = async () => {
    if (!currentDrug.name || !selectedVisit) return;
    const newDrug = { ...currentDrug };
    setLoading(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: selectedVisit.id, drugs: [newDrug] })
      });
      const data = await res.json();
      if (data.success && data.prescriptions && data.prescriptions[0]) {
        setDrugs([...drugs, data.prescriptions[0]]);
        setCurrentDrug({ name: '', dosage: '1-0-1', duration: '5 Days', instructions: 'After food' });
      } else {
        alert("Failed to commit drug");
      }
    } catch (err) {
      alert("Failed to commit drug");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDrug = async (index: number) => {
    const drug = drugs[index];
    if (drug.id) {
       try { await fetch(`/api/prescriptions?id=${drug.id}`, { method: 'DELETE' }); } catch (e) {}
    }
    setDrugs(drugs.filter((_, i) => i !== index));
  };

  const handlePrescribe = async () => {
    if (!selectedVisit || drugs.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: selectedVisit.id, drugs })
      });
      const data = await res.json();
      if (data.success) {
        setDrugs([]);
      }
    } catch (err) {
      alert("Failed to save prescription");
    } finally {
      setLoading(false);
    }
  };

  const toggleTest = (test: any) => {
    if (selectedTests.find(t => t.name === test.name)) {
      setSelectedTests(selectedTests.filter(t => t.name !== test.name));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleOrderLabs = async () => {
    if (!selectedVisit || selectedTests.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: selectedVisit.id, tests: selectedTests })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTests([]);
      }
    } catch (err) {
      alert("Failed to order labs");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorQueue = async (isPolling: boolean = false) => {
    try {
      const res = await fetch(`/api/consultation?session=${sessionFilter}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue);
        if (isPolling) {
          const newVisits = data.queue.filter((v: any) => !previousQueueIds.current.includes(v.id));
          if (newVisits.length > 0) {
            const newToasts = newVisits.map((v: any) => ({
              id: Date.now() + Math.random().toString(),
              message: `Token #${v.tokenNumber} - ${v.patient.name} has been added to your queue!`
            }));
            setToasts(prev => [...prev, ...newToasts]);
            newToasts.forEach((t: any) => {
              setTimeout(() => {
                setToasts(prev => prev.filter(toast => toast.id !== t.id));
              }, 5000);
            });
          }
        }
        previousQueueIds.current = data.queue.map((v: any) => v.id);
      }
    } catch (err) {
      console.error("Failed to fetch doctor queue", err);
    }
  };

  const fetchAllAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setAllAppointments(data.visits);
    } catch (err) {
      console.error("Failed to fetch all appointments", err);
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
    fetchSession();
    fetchDoctorQueue();
    fetchAllAppointments();

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      // Auto-update shift display
      setShift(now.getHours() < 12 ? 'Morning' : 'Evening');
    }, 1000);
    const intervalId = setInterval(() => fetchDoctorQueue(true), 10000);

    return () => {
      clearInterval(timer);
      clearInterval(intervalId);
    };
  }, [sessionFilter]);

  const handleSubmitConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...consultation, drugs, visitId: selectedVisit.id })
      });
      const data = await res.json();
      if (data.success) {
        window.open(`/dashboard/doctor/prescription/${selectedVisit.id}`, 'prescription_print');
        setSelectedVisit(null);
        setConsultation({ chiefComplaints: '', history: '', examination: '', diagnosis: '', investigationAdvised: '' });
        setDrugs([]);
        fetchDoctorQueue();
        fetchAllAppointments();
      }
    } catch (err) {
      alert("Failed to save consultation");
    } finally {
      setLoading(false);
    }
  };

  const startListening = (field: string) => {
    // If currently listening to this field, stop it
    if (isListening === field) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(null);
      return;
    }
    
    // Stop any other active recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognitionRef.current = recognition;

    const initialText = consultation[field as keyof typeof consultation] || '';

    recognition.onstart = () => setIsListening(field);
    recognition.onend = () => setIsListening(null);
    recognition.onerror = () => setIsListening(null);

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      const medicalAutoCorrect: { [key: string]: string } = {
        'diabetes': 'Diabetes Mellitus',
        'bp': 'Blood Pressure',
        'sugar': 'Blood Glucose',
        'pressure': 'Blood Pressure',
        'paracetmol': 'Paracetamol',
        'pan 40': 'Pantoprazole 40mg',
        'panto': 'Pantoprazole',
        'metformin': 'Metformin',
        'hypertension': 'Hypertension',
        'hyper': 'Hypertension',
        'thyroid': 'Hypothyroidism',
        'asthma': 'Bronchial Asthma',
        'infection': 'Infection',
        'gastritis': 'Gastritis',
        'acidity': 'GERD / Gastritis',
        'fever': 'Fever',
        'cough': 'Cough',
        'vomiting': 'Vomiting',
        'diarrhea': 'Diarrhea',
        'weakness': 'General Weakness',
        'dizziness': 'Dizziness',
        'headache': 'Headache',
        'anemia': 'Anemia',
        'arthritis': 'Osteoarthritis',
        'mi': 'Myocardial Infarction',
        'cad': 'Coronary Artery Disease',
        'ckd': 'Chronic Kidney Disease',
        'uti': 'Urinary Tract Infection'
      };

      for (let i = 0; i < event.results.length; ++i) {
        let txt = event.results[i][0].transcript;
        
        // 1. Initial Cleanup & Acronyms
        txt = txt
          .replace(/\b(full stop|period)\b/gi, '.')
          .replace(/\b(comma)\b/gi, ',')
          .replace(/\b(question mark)\b/gi, '?')
          .replace(/\b(next line|new line)\b/gi, '\n')
          .replace(/\b(bd|b d)\b/gi, 'Twice a day')
          .replace(/\b(od|o d)\b/gi, 'Once a day')
          .replace(/\b(tds|t d s)\b/gi, 'Thrice a day')
          .replace(/\b(tid|t i d)\b/gi, 'Three times a day')
          .replace(/\b(qid|q i d)\b/gi, 'Four times a day')
          .replace(/\b(sos|s o s)\b/gi, 'As needed')
          .replace(/\b(hs|h s)\b/gi, 'At bedtime')
          .replace(/\b(ac|a c)\b/gi, 'Before meals')
          .replace(/\b(pc|p c)\b/gi, 'After meals')
          .replace(/\brx\b/gi, 'Prescription')
          .replace(/\b(cbc|c b c)\b/gi, 'Complete Blood Count');

        // 2. Anti-Stutter & Medical Auto-Correct
        const words = txt.split(/\s+/);
        const cleanedWords: string[] = [];
        
        for (let j = 0; j < words.length; j++) {
          let word = words[j].toLowerCase();
          
          // Remove consecutive duplicates (e.g., "patient patient" -> "patient")
          if (j > 0 && word === words[j-1].toLowerCase() && word.length > 1) {
            continue; 
          }
          
          // Apply Medical Auto-Correct
          const corrected = medicalAutoCorrect[word];
          cleanedWords.push(corrected || words[j]);
        }
        txt = cleanedWords.join(' ');

        if (event.results[i].isFinal) {
          finalTranscript += txt;
        } else {
          interimTranscript += txt;
        }
      }

      // Format the final part
      let processedFinal = (initialText + ' ' + finalTranscript).trim();
      
      // Auto-correct spacing around punctuation
      processedFinal = processedFinal.replace(/\s+([.,!?])/g, '$1');
      processedFinal = processedFinal.replace(/([.,!?])([^\s"'\n])/g, '$1 $2');
      
      // Auto-capitalize first letter of every sentence
      processedFinal = processedFinal.replace(/(^\s*|[\.\!\?\n]\s*)([a-z])/g, function(match, separator, letter) {
          return separator + letter.toUpperCase();
      });

      setConsultation(prev => ({
        ...prev,
        [field]: processedFinal + (interimTranscript ? ' ' + interimTranscript : '')
      }));
    };

    recognition.start();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Sidebar - Standardized Premium Format */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, transition: 'all 0.3s', zIndex: 100 }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'white' }}>Malar Hospital</h2>
          <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'white' }}>Clinical Portal</span>
        </div>

        <nav style={{ padding: '30px 0', flexGrow: 1 }}>
          <button 
             onClick={() => setShowCalendar(false)}
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: !showCalendar ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '15px' }}
          >
            <Stethoscope size={20} /> 
            <span style={{ fontWeight: !showCalendar ? '600' : '400' }}>OPD Consulting</span>
          </button>
          
          <button 
             onClick={() => { setShowCalendar(true); fetchAllAppointments(); }}
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: showCalendar ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '15px' }}
          >
            <Calendar size={20} /> 
            <span style={{ fontWeight: showCalendar ? '600' : '400' }}>Calendar View</span>
          </button>
        </nav>

        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '240px', padding: '60px 80px' }} className="animate-fade-in">
        {/* Header - Standardized Premium Format */}
        <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0A4D68', margin: '0 0 10px 0' }}>Welcome, {drName}</h1>
            <p style={{ color: '#64748B', margin: 0, fontSize: '18px', fontWeight: '400' }}>
               <Clock size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
               {currentTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} | Malar Hospital
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ background: '#E2E8F0', padding: '10px 25px', borderRadius: '50px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#0A4D68' }}>
               {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
            <div className="relative">
               <Bell size={24} style={{ color: '#94A3B8' }} />
               {toasts.length > 0 && <span style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', background: '#F59E0B', borderRadius: '50%', border: '2px solid white' }}></span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid #E2E8F0', paddingLeft: '25px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1E293B', textTransform: 'uppercase' }}>{userName || 'Consultant'}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold' }}>CHIEF MEDICAL OFFICER</div>
              </div>
              <div style={{ width: '45px', height: '45px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0A4D68', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                 {userName ? userName.charAt(0) : 'D'}
              </div>
            </div>
          </div>
        </header>

        {/* KPI Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <StatCard 
              label="Active Queue" 
              value={queue.length} 
              icon={<Users style={{ color: '#0A4D68' }} />} 
              trend={Math.floor(Math.random() * 10) + 5}
              isPositive={false}
              onClick={() => setStatModalState({ title: 'Active Queue', list: queue })}
          />
          <StatCard 
              label="Consulting Now" 
              value={selectedVisit ? 1 : 0} 
              icon={<Activity style={{ color: '#10B981' }} />} 
              isPositive={true}
              onClick={() => {
                if (selectedVisit) setStatModalState({ title: 'Consulting Now', list: [selectedVisit] });
              }}
          />
          <StatCard 
              label="Completed Today" 
              value={allAppointments.filter(v => v.status === 'COMPLETED' && isSameDay(new Date(v.visitDate), new Date())).length} 
              icon={<CheckCircle2 style={{ color: '#14B8A6' }} />} 
              isPositive={true}
              onClick={() => {
                const list = allAppointments.filter(v => v.status === 'COMPLETED' && isSameDay(new Date(v.visitDate), new Date()));
                setStatModalState({ title: 'Completed Today', list });
              }}
          />
          <StatCard 
              label="Advanced Bookings" 
              value={allAppointments.filter(v => new Date(v.visitDate) > new Date()).length} 
              icon={<Calendar style={{ color: '#F59E0B' }} />} 
              onClick={() => {
                const list = allAppointments.filter(v => new Date(v.visitDate) > new Date());
                setStatModalState({ title: 'Advanced Bookings', list });
              }}
          />
        </div>

        {showCalendar ? (
          <div className="glass-card !p-8 animate-fade-in bg-white border-2 border-white shadow-lg">
             <div className="flex justify-between items-center mb-8">
                <h2 style={{ fontSize: '24px', color: '#0A4D68', fontWeight: 'bold' }}>
                   {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-4">
                   <button className="btn btn-outline h-12 w-12 !p-0" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                     <ChevronLeft size={20} />
                   </button>
                   <button className="btn btn-outline h-12 px-6" onClick={() => setCurrentMonth(new Date())}>
                     Today
                   </button>
                   <button className="btn btn-outline h-12 w-12 !p-0" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                     <ChevronRight size={20} />
                   </button>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ textAlign: 'center', fontWeight: '800', color: '#94A3B8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{day}</div>
                ))}
                
                {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) }).map(day => {
                   const dayVisits = allAppointments.filter(v => isSameDay(new Date(v.visitDate), day));
                   const isPending = dayVisits.some(v => v.status !== 'COMPLETED');
                   const isCurrentMonth = isSameMonth(day, currentMonth);

                   return (
                     <div key={day.toString()} style={{ 
                       minHeight: '120px', 
                       background: isSameDay(day, new Date()) ? '#F0F9FF' : (isPending && dayVisits.length > 0 ? '#FEF2F2' : 'white'), 
                       border: `2px solid ${isSameDay(day, new Date()) ? '#0A4D68' : '#F1F5F9'}`, 
                       borderRadius: '16px', 
                       padding: '12px',
                       opacity: isCurrentMonth ? 1 : 0.3,
                       transition: 'all 0.2s'
                     }}>
                        <div style={{ 
                          fontWeight: '800', 
                          fontSize: '15px', 
                          marginBottom: '10px',
                          color: isPending && dayVisits.length > 0 ? '#EF4444' : '#1E293B'
                        }}>
                           {format(day, 'd')}
                        </div>
                        <div className="flex flex-col gap-1.5">
                           {dayVisits.map(v => (
                              <div key={v.id} 
                                   onClick={() => setCalendarVisitDetail(v)}
                                   title={`${v.patient.name} - ${v.chiefComplaints || 'Checkup'}`} 
                                   className="hover:scale-105 transition-transform cursor-pointer"
                                   style={{ 
                                fontSize: '10px', 
                                padding: '4px 8px', 
                                background: v.status === 'COMPLETED' ? '#ECFDF5' : '#FEE2E2',
                                color: v.status === 'COMPLETED' ? '#065F46' : '#991B1B',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                border: `1px solid ${v.status === 'COMPLETED' ? '#D1FAE5' : '#FECACA'}`
                              }}>
                                 {v.patient.name}
                              </div>
                           ))}
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Waiting List */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold flex items-center gap-2 text-[#0A4D68]">
                       <Clock size={20} /> Shift Waiting List
                     </h3>
                     <span className="badge bg-[#088395] text-white border-none font-bold px-4 py-3">{queue.length} Ready</span>
                  </div>

               <div className="flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: '65vh' }}>
                  {queue.length > 0 ? queue.map((v: any) => (
                    <div 
                      key={v.id} 
                      className={`glass-card !p-5 cursor-pointer group hover-scale-102 ${selectedVisit?.id === v.id ? '!border-secondary !shadow-lg bg-secondary/5' : 'bg-white'}`}
                      onClick={async () => { 
                        setSelectedVisit(v); 
                        setSelectedTests([]); 
                        setDrugs([]);
                        try {
                          await fetch('/api/consultation', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ visitId: v.id, status: 'CONSULTING' })
                          });
                        } catch (err) {}
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex flex-col">
                           <span className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Token #{v.tokenNumber}</span>
                           <h4 className="text-base font-bold text-slate-800">{v.patient.name}</h4>
                         </div>
                         <div className={`p-2 rounded-lg ${selectedVisit?.id === v.id ? 'bg-secondary text-white' : 'bg-slate-50 text-slate-400'} transition-all`}>
                           <ChevronRight size={16} />
                         </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400">{v.patient.age}Y | {v.patient.gender}</span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                               <Clock size={10} />
                               {new Date(v.visitDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                         </div>
                         <span className={`text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest ${v.status === 'CONSULTING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                           {v.status === 'CONSULTING' ? 'Consulting' : 'Ready'}
                         </span>
                      </div>
                    </div>
                  )) : (
                    <div className="glass-card flex flex-col items-center justify-center p-12 text-center bg-white/50 border-dashed border-2 border-slate-200">
                       <Users className="text-slate-300 mb-4" size={40} />
                       <h4 className="text-slate-500 font-bold">Queue is Empty</h4>
                       <p className="text-xs text-slate-400">Operational token flow will appear here.</p>
                    </div>
                  )}
               </div>

                {/* Finished Consultations List */}
                <div className="flex flex-col gap-6 mt-8 pt-8 border-t border-slate-100">
                   <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-[#64748B]">
                        <CheckCircle2 size={20} /> Finished Today
                      </h3>
                      <span className="badge bg-slate-100 text-slate-500 border-none font-bold px-3 py-1 text-[10px]">
                        {allAppointments.filter(v => v.status === 'COMPLETED' && isSameDay(new Date(v.visitDate), new Date())).length} DONE
                      </span>
                   </div>

                <div className="flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: '35vh' }}>
                      {allAppointments.filter(v => v.status === 'COMPLETED' && isSameDay(new Date(v.visitDate), new Date())).length > 0 ? (
                        allAppointments.filter(v => v.status === 'COMPLETED' && isSameDay(new Date(v.visitDate), new Date())).map((v: any) => (
                          <div 
                            key={v.id} 
                            className={`glass-card !p-5 cursor-pointer group relative overflow-hidden transition-all duration-500 border-2 ${selectedVisit?.id === v.id ? 'border-[#088395] bg-[#088395]/5 shadow-xl shadow-[#088395]/10' : 'border-transparent bg-white hover:border-[#088395]/30 hover:shadow-lg'}`}
                            onClick={() => selectVisit(v)}
                          >
                            <div className="flex justify-between items-start">
                               <div className="flex flex-col">
                                 <h4 className="text-sm font-bold text-slate-700">{v.patient.name}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400">Token #{v.tokenNumber}</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {new Date(v.visitDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                 </div>
                               </div>
                               <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-500">
                                 <CheckCircle2 size={14} />
                               </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-[10px] font-bold text-slate-300 uppercase py-4">No patients finished yet</p>
                      )}
                   </div>
                </div>
             </div>

            {/* Consultation Form */}
            <div className="lg:col-span-2">
               {selectedVisit ? (
                 <div className="glass-card !p-8 animate-fade-in bg-white h-full border-2 border-white">
                  {/* Consultation Form Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-[#088395]/10 text-[#088395] flex items-center justify-center">
                          <Stethoscope size={20} />
                       </div>
                       <h2 className="text-xl font-bold text-[#0A4D68]">
                          {selectedVisit.status === 'COMPLETED' ? 'Review / Edit Consultation' : 'Active Consultation'}
                       </h2>
                    </div>
                    {selectedVisit.status === 'COMPLETED' && (
                       <span className="badge bg-emerald-500 text-white border-none font-bold px-4 py-2 text-[10px] animate-pulse">EDITING COMPLETED RECORD</span>
                    )}
                  </div>

                  <div style={{ background: '#F0F9FF', borderRadius: '16px', padding: '24px', marginBottom: '30px', border: '1px solid #BAE6FD' }}>
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20">
                               {selectedVisit.patient.name.charAt(0)}
                            </div>
                            <div>
                               <h2 className="text-xl font-bold text-slate-800">{selectedVisit.patient.name}</h2>
                               <p className="text-xs font-bold text-primary tracking-widest uppercase mt-1">
                                  {selectedVisit.patient.uhid} &nbsp;·&nbsp; Token #{selectedVisit.tokenNumber}
                               </p>
                            </div>
                         </div>
                         <button className="btn btn-outline h-12 px-6 gap-2" onClick={() => window.open(`/dashboard/doctor/prescription/${selectedVisit.id}`, '_blank')}>
                            <Printer size={18} /> Print Rx
                         </button>
                      </div>

                       <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 pt-4 border-t border-dashed border-blue-200">
                          {[
                            { label: 'BP', value: selectedVisit.bloodPressure },
                            { label: 'Pulse', value: selectedVisit.pulse },
                            { label: 'SpO₂', value: selectedVisit.spo2, u: '%' },
                            { label: 'Temp', value: selectedVisit.temperature, u: '°F' },
                            { label: 'Weight', value: selectedVisit.weight, u: 'kg' },
                            { label: 'Height', value: selectedVisit.height, u: 'cm' },
                            { label: 'BMI', value: selectedVisit.bmi }
                          ].map(v => (
                            <div key={v.label} className="text-center p-2 rounded-xl bg-white border border-blue-100/50">
                               <div className="text-[10px] font-black text-slate-400 uppercase">{v.label}</div>
                               <div className="text-xs font-black text-primary mt-1">{v.value ? `${v.value}${v.u || ''}` : '---'}</div>
                            </div>
                          ))}
                       </div>
                   </div>

                   <form onSubmit={handleSubmitConsult} className="flex flex-col gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Left Side: Clinical Findings */}
                         <div className="flex flex-col gap-6">
                             {/* Box 1: Chief Complaints */}
                             <div className="form-group relative">
                                <div className="flex justify-between items-center mb-2">
                                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Chief Complaints</label>
                                   <button type="button" onClick={() => startListening('chiefComplaints')} className={`p-2 rounded-full transition-all ${isListening === 'chiefComplaints' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-primary'}`}>
                                      {isListening === 'chiefComplaints' ? <MicOff size={16} /> : <Mic size={16} />}
                                   </button>
                                </div>
                                <textarea 
                                  className="form-input !h-24 !bg-slate-50 border-none transition-all focus:!bg-white focus:!ring-2 font-medium" 
                                  placeholder="Dictate complaints..." required
                                  value={consultation.chiefComplaints} 
                                  onChange={e => setConsultation({...consultation, chiefComplaints: e.target.value})}
                                />
                             </div>

                             {/* Box 2: History */}
                             <div className="form-group relative">
                                <div className="flex justify-between items-center mb-2">
                                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Clinical History</label>
                                   <button type="button" onClick={() => startListening('history')} className={`p-2 rounded-full transition-all ${isListening === 'history' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-primary'}`}>
                                      {isListening === 'history' ? <MicOff size={16} /> : <Mic size={16} />}
                                   </button>
                                </div>
                                <textarea 
                                  className="form-input !h-24 !bg-slate-50 border-none transition-all focus:!bg-white focus:!ring-2 font-medium" 
                                  placeholder="Patient history..." 
                                  value={consultation.history} 
                                  onChange={e => setConsultation({...consultation, history: e.target.value})}
                                />
                             </div>

                             {/* Box 3: Examination */}
                             <div className="form-group relative">
                                <div className="flex justify-between items-center mb-2">
                                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Physical Examination</label>
                                   <button type="button" onClick={() => startListening('examination')} className={`p-2 rounded-full transition-all ${isListening === 'examination' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-primary'}`}>
                                      {isListening === 'examination' ? <MicOff size={16} /> : <Mic size={16} />}
                                   </button>
                                </div>
                                <textarea 
                                  className="form-input !h-24 !bg-slate-50 border-none transition-all focus:!bg-white focus:!ring-2 font-medium" 
                                  placeholder="Examination findings..." 
                                  value={consultation.examination} 
                                  onChange={e => setConsultation({...consultation, examination: e.target.value})}
                                />
                             </div>

                             {/* Box 4: Provisional Diagnosis */}
                             <div className="form-group relative">
                                <div className="flex justify-between items-center mb-2">
                                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Provisional Diagnosis</label>
                                   <button type="button" onClick={() => startListening('diagnosis')} className={`p-2 rounded-full transition-all ${isListening === 'diagnosis' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-primary'}`}>
                                      {isListening === 'diagnosis' ? <MicOff size={16} /> : <Mic size={16} />}
                                   </button>
                                </div>
                                <textarea 
                                  className="form-input !h-24 !bg-slate-50 border-none transition-all focus:!bg-white focus:!ring-2 font-bold" 
                                  placeholder="Clinical diagnosis..." required
                                  value={consultation.diagnosis} 
                                  onChange={e => setConsultation({...consultation, diagnosis: e.target.value.toUpperCase()})}
                                />
                             </div>

                             {/* Box 5: Investigation Advised */}
                             <div className="form-group relative">
                                <div className="flex justify-between items-center mb-2">
                                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Investigation Advised</label>
                                   <button type="button" onClick={() => startListening('investigationAdvised')} className={`p-2 rounded-full transition-all ${isListening === 'investigationAdvised' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-primary'}`}>
                                      {isListening === 'investigationAdvised' ? <MicOff size={16} /> : <Mic size={16} />}
                                   </button>
                                </div>
                                <textarea 
                                  className="form-input !h-24 !bg-slate-50 border-none transition-all focus:!bg-white focus:!ring-2 font-bold text-primary" 
                                  placeholder="Scans, X-rays, etc..." 
                                  value={consultation.investigationAdvised} 
                                  onChange={e => setConsultation({...consultation, investigationAdvised: e.target.value.toUpperCase()})}
                                />
                             </div>
                         </div>

                         {/* Right Side: Rx & Labs */}
                         <div className="flex flex-col gap-6">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-tiny">
                               <div className="flex justify-between items-center mb-4">
                                   <label className="text-[11px] font-black uppercase tracking-widest text-[#0A4D68]/60">Prescription Builder</label>
                                   <div className="flex flex-wrap gap-3 items-center">
                                      {[
                                        { label: 'BEFORE FOOD', icon: <Clock size={14} />, val: 'Before Food' },
                                        { label: 'AFTER FOOD', icon: <Activity size={14} />, val: 'After Food' }
                                      ].map(opt => (
                                        <button 
                                          key={opt.val} type="button" 
                                          onClick={() => setCurrentDrug({...currentDrug, instructions: opt.val})} 
                                          className={`btn !px-5 !py-2.5 !text-[10px] font-black tracking-widest flex items-center gap-2 transition-all ${currentDrug.instructions === opt.val ? 'btn-primary shadow-lg scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:border-[#088395] hover:text-[#088395]'}`}>
                                          {opt.icon}
                                          {opt.label}
                                        </button>
                                      ))}
                                      <div className="w-px h-8 bg-slate-200 mx-1"></div>
                                      {[
                                        { label: 'OD', val: '1-0-0' },
                                        { label: 'MIDDAY', val: '0-1-0' },
                                        { label: 'BD', val: '1-0-1' },
                                        { label: 'TDS', val: '1-1-1' },
                                        { label: 'NIGHT', val: '0-0-1' }
                                      ].map(opt => (
                                        <button 
                                          key={opt.label} type="button" 
                                          onClick={() => setCurrentDrug({...currentDrug, dosage: opt.val})} 
                                          style={{
                                            backgroundColor: currentDrug.dosage === opt.val ? '#088395' : 'white',
                                            color: currentDrug.dosage === opt.val ? 'white' : '#64748B',
                                            padding: '10px 16px',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            fontWeight: '900',
                                            border: '1px solid #E2E8F0',
                                            boxShadow: currentDrug.dosage === opt.val ? '0 10px 25px rgba(8,131,149,0.3)' : 'none',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            transform: currentDrug.dosage === opt.val ? 'scale(1.05)' : 'scale(1)'
                                          }}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                   </div>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                   <input 
                                     className="form-input !bg-white border-none shadow-sm font-black text-slate-800" 
                                     placeholder="Drug Name..." 
                                    value={currentDrug.name} onChange={e => setCurrentDrug({...currentDrug, name: e.target.value.toUpperCase()})}
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                     <select className="form-input !py-1 !px-3 !bg-white !text-xs font-bold" value={currentDrug.dosage} onChange={e => setCurrentDrug({...currentDrug, dosage: e.target.value})}>
                                        <option>1-0-1</option>
                                        <option>1-1-1</option>
                                        <option>1-0-0</option>
                                        <option>0-1-0</option>
                                        <option>0-0-1</option>
                                        <option>SOS</option>
                                     </select>
                                     <div className="relative">
                                       <input 
                                         list="durations"
                                         className="form-input !py-1 !px-3 !bg-white !text-xs font-bold w-full" 
                                         placeholder="Duration..."
                                         value={currentDrug.duration} 
                                         onChange={e => setCurrentDrug({...currentDrug, duration: e.target.value})}
                                       />
                                       <datalist id="durations">
                                          <option value="2 Days" />
                                          <option value="3 Days" />
                                          <option value="5 Days" />
                                          <option value="1 Week" />
                                          <option value="10 Days" />
                                          <option value="15 Days" />
                                          <option value="21 Days" />
                                          <option value="1 Month" />
                                          <option value="2 Months" />
                                          <option value="3 Months" />
                                          <option value="Until next review" />
                                       </datalist>
                                     </div>
                                  </div>
                                  <button type="button" className="btn btn-primary h-12 w-full !rounded-xl font-black text-sm" onClick={handleAddDrug}>
                                     <PlusCircle size={18} className="mr-2" /> Commit Drug
                                  </button>
                               </div>

                               <div className="mt-4 flex flex-col gap-2 max-h-40 overflow-y-auto">
                                  {drugs.map((d, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm animate-in slide-in-from-top-2">
                                       <div className="flex flex-col">
                                          <span className="text-xs font-black text-slate-800">{d.name || d.drugName}</span>
                                          <span className="text-[10px] text-slate-400 font-bold uppercase">{d.instructions}</span>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <div className="text-right">
                                             <span className="text-[11px] font-black text-primary">{d.dosage}</span>
                                             <div className="text-[9px] text-slate-400 font-bold">{d.duration}</div>
                                          </div>
                                          <button type="button" onClick={() => handleRemoveDrug(i)} className="text-rose-100 hover:text-rose-500 transition-colors">
                                             <Trash2 size={14} />
                                          </button>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            </div>

                            <div className="flex flex-col gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                               <label className="text-[11px] font-black uppercase tracking-widest text-[#0A4D68]/60 block line-height-none">Diagnostic Orders</label>
                                   <div className="grid grid-cols-3 gap-3">
                                      {commonTests.map(test => {
                                        const isSelected = selectedTests.find(t => t.name === test.name);
                                        return (
                                          <button 
                                            key={test.name} type="button" 
                                            onClick={() => toggleTest(test)}
                                            className={`btn !px-4 !py-4 !text-[10px] font-black tracking-widest flex flex-col items-center justify-center gap-2 min-h-[70px] transition-all ${isSelected ? 'btn-primary shadow-xl scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:border-[#088395] hover:text-[#088395]'}`}>
                                            <FlaskConical size={14} />
                                            <span className="leading-tight">{test.name.split(' (')[0].toUpperCase()}</span>
                                          </button>
                                        );
                                      })}
                                   </div>
                               {selectedTests.length > 0 && (
                                 <button type="button" className="btn btn-primary w-full h-11 text-xs font-black mt-2" onClick={handleOrderLabs} disabled={loading}>
                                   Order {selectedTests.length} Laboratory Tests
                                 </button>
                               )}
                            </div>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex gap-4">
                         <button type="submit" className="btn btn-primary flex-1 h-16 !rounded-2xl shadow-xl shadow-primary/20 text-lg font-black tracking-tight" disabled={loading}>
                            {loading ? "Syncing..." : selectedVisit.status === 'COMPLETED' ? "Update Consultation & Reprint Rx" : "Finalize Consultation & Print Rx"}
                         </button>
                      </div>
                   </form>
                 </div>
               ) : (
                 <div className="glass-card flex flex-col items-center justify-center p-24 text-center bg-white h-full shadow-soft border-2 border-dashed border-slate-200">
                    <Stethoscope className="text-primary opacity-20 mb-8" size={80} />
                    <h2 className="text-slate-400 font-black mb-2 uppercase tracking-widest">Clinical Ready</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-bold text-sm">Select a token from the waitlist to begin digital consultation and pharmaceutical order generation.</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Calendar Visit Detail Modal */}
      {calendarVisitDetail && (
        <div className="animate-in fade-in" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: '240px', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setCalendarVisitDetail(null)}>
           <div className="bg-white rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: '450px', width: '100%', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div className="p-6 flex justify-between items-start gap-4" style={{ backgroundColor: '#F0F9FF', borderBottom: '1px solid #BAE6FD' }}>
                 <div style={{ flex: 1 }}>
                    <h3 className="text-xl font-bold text-[#0A4D68] m-0 mb-2">{calendarVisitDetail.patient.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 shadow-sm border border-blue-50">{calendarVisitDetail.patient.gender}</span>
                      <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 shadow-sm border border-blue-50">{calendarVisitDetail.patient.age} Y/O</span>
                      <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 shadow-sm border border-blue-50">{calendarVisitDetail.patient.phone || 'No Phone'}</span>
                    </div>
                 </div>
                 <button onClick={() => setCalendarVisitDetail(null)} className="flex items-center justify-center bg-white border border-blue-100 rounded-full text-slate-400 hover:text-rose-500 shadow-sm font-bold text-lg hover:bg-rose-50 transition-colors flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                    &times;
                 </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                 <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status</span>
                    <div className={`mt-1 text-sm font-bold ${calendarVisitDetail.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {calendarVisitDetail.status}
                    </div>
                 </div>
                 <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chief Complaints / Reason</span>
                    <div className="mt-1 text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {calendarVisitDetail.chiefComplaints || 'Pending Consultation'}
                    </div>
                 </div>
                 {calendarVisitDetail.diagnosis && (
                   <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Diagnosis</span>
                      <div className="mt-1 text-sm font-bold text-slate-700">
                        {calendarVisitDetail.diagnosis}
                      </div>
                   </div>
                 )}
                 <div className="pt-2">
                    <button className="btn w-full h-12 bg-slate-100 text-slate-600 font-bold hover:bg-slate-200" onClick={() => setCalendarVisitDetail(null)}>
                       Close Details
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-[1000]">
        {toasts.map(t => (
          <div key={t.id} className="glass-card !p-5 bg-white shadow-2xl border-l-4 border-l-[#F59E0B] flex items-start gap-4 animate-in slide-in-from-right-10 duration-500 max-w-md">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-[#F59E0B] flex items-center justify-center flex-shrink-0">
               <Bell size={20} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Queue Sync</h4>
              <p className="text-xs font-bold text-slate-500 leading-tight">{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* KPI Details Modal */}
      {statModalState && (
        <div className="animate-in fade-in" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: '240px', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setStatModalState(null)}>
           <div className="bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl" style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-6 flex justify-between items-center gap-4 flex-shrink-0" style={{ backgroundColor: '#F0F9FF', borderBottom: '1px solid #BAE6FD' }}>
                 <h3 className="text-xl font-bold text-[#0A4D68] m-0 flex items-center gap-2">
                   {statModalState.title} 
                   <span className="font-bold text-xs px-3 py-1 rounded-full shadow-sm" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>{statModalState.list.length}</span>
                 </h3>
                 <button onClick={() => setStatModalState(null)} className="flex items-center justify-center bg-white border border-blue-100 rounded-full text-slate-400 hover:text-rose-500 shadow-sm font-bold text-lg hover:bg-rose-50 transition-colors flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                    &times;
                 </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                 {statModalState.list.length > 0 ? (
                   <div className="flex flex-col gap-3">
                     {statModalState.list.map((v: any, index: number) => (
                       <div key={v.id || index} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center hover:border-primary hover:shadow-md transition-all cursor-pointer group" onClick={() => {
                           setStatModalState(null);
                           setCalendarVisitDetail(v);
                       }}>
                         <div className="flex flex-col">
                           <span className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">{v.patient.name}</span>
                           <span className="text-xs text-slate-500 font-bold mt-1 uppercase">
                             {v.patient.uhid} • Token #{v.tokenNumber} • {v.patient.gender} • {v.patient.age} Y/O
                           </span>
                           <span className="text-[10px] text-slate-400 font-bold mt-1 max-w-md truncate">
                             {v.chiefComplaints || 'Pending Consultation'}
                           </span>
                         </div>
                         <div className="flex flex-col items-end">
                           <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                             {v.status}
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 mt-2">
                             {new Date(v.visitDate).toLocaleDateString('en-GB')}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="py-12 text-center flex flex-col items-center">
                     <Users className="text-slate-200 mb-4" size={48} />
                     <p className="text-slate-400 font-bold">No patients in this category.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ label, value, icon, trend, isPositive, trendLabel = "vs last shift", onClick }: any) {
  return (
    <div 
       className={`glass-card transition-all duration-300 !border-white bg-white/70 ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl hover:border-primary/30 active:scale-95' : 'hover-scale-102'}`}
       onClick={onClick}
    >
       <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-tiny text-primary">
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {isPositive ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </div>
          )}
       </div>
       <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{label}</span>
          <span className="text-3xl font-black text-slate-800 leading-none tracking-tighter">{value}</span>
       </div>
    </div>
  );
}
