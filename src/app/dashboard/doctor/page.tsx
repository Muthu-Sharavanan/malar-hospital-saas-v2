'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
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

  const [currentView, setCurrentView] = useState<'consulting' | 'calendar' | 'reviews' | 'finished'>('consulting');
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
    investigationAdvised: '',
    nextReview: '',
    isReview: false
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
      investigationAdvised: v.investigationAdvised || '',
      nextReview: v.nextReview || '',
      isReview: v.isReview || false
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
    setCurrentView('consulting');
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
              message: `Token ${v.tokenNumber} - ${v.patient.name} has been added to your queue!`
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
    if (!consultation.chiefComplaints || !consultation.diagnosis) {
      alert("⚠️ Please enter Chief Complaints and Provisional Diagnosis before finalizing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Normalize drugs array for Zod validation (ensure 'name' field exists)
      const normalizedDrugs = drugs.map((d: any) => ({
        name: d.name || d.drugName || '',
        dosage: d.dosage || '',
        duration: d.duration || '',
        instructions: d.instructions || ''
      }));

      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...consultation, drugs: normalizedDrugs, visitId: selectedVisit.id })
      });
      const data = await res.json();
      if (data.success) {
        // Try to open prescription in new window
        const printWindow = window.open(`/dashboard/doctor/prescription/${selectedVisit.id}`, 'prescription_print');
        if (!printWindow) {
           alert("✅ Consultation Saved! (Note: Popup was blocked, please click 'Print Rx' manually)");
        }
        
        setSelectedVisit(null);
        setConsultation({ chiefComplaints: '', history: '', examination: '', diagnosis: '', investigationAdvised: '', nextReview: '', isReview: false });
        setDrugs([]);
        fetchDoctorQueue();
        fetchAllAppointments();
      } else {
        const errorDetails = data.details ? JSON.stringify(data.details, null, 2) : "";
        alert(`❌ Failed to save consultation: ${data.error}\n${errorDetails}`);
      }
    } catch (err) {
      alert("Failed to save consultation");
    } finally {
      setLoading(false);
    }
  };

  const startListening = (field: string) => {
    if (isListening === field) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsListening(null);
      return;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
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
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;


    recognition.onstart = () => {
      setIsListening(field);
    };
    recognition.onend = () => {
      if (isListening === field) setIsListening(null);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error", event.error);
      setIsListening(null);
    };

    const medicalAutoCorrect: { [key: string]: string } = {
      'diabetes': 'Diabetes Mellitus',
      'bp': 'Blood Pressure',
      'sugar': 'Blood Glucose',
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
      'uti': 'Urinary Tract Infection',
      'mri': 'MRI Scan',
      'ct': 'CT Scan',
      'xray': 'X-ray',
      'x-ray': 'X-ray',
      'ultrasound': 'Ultrasound',
      'ecg': 'ECG',
      'echo': '2D Echo',
      'eeg': 'EEG'
    };

    const initialText = consultation[field as keyof typeof consultation] || '';

    recognition.onresult = (event: any) => {
      let sessionFinal = '';
      let interim = '';

      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          sessionFinal += (field === 'investigationAdvised' ? transcript.trim() + '\n' : transcript + ' ');
        } else {
          interim += transcript;
        }
      }

      // Command Check
      const fullTranscript = (sessionFinal + interim).toLowerCase();

      // 1. Clear Command (Standalone only to avoid "clear lungs" issues)
      const trimmed = fullTranscript.trim();
      if (trimmed === 'clear' || trimmed === 'clear all' || trimmed === 'clear field') {
        setConsultation((prev: any) => ({ ...prev, [field]: '' }));
        recognition.abort();
        setTimeout(() => startListening(field), 100);
        return;
      }

      // 2. Remove [Word/Phrase] Command (Must start with remove)
      if (fullTranscript.startsWith('remove ')) {
        const targetPhrase = fullTranscript.replace(/^remove\s+/i, '').trim();
        
        if (targetPhrase && targetPhrase.length > 0) {
          recognition.abort();
          setConsultation((prev: any) => {
            const currentText = String(prev[field] || '');
            const escapedTarget = targetPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Target the last instance with word boundaries
            const lastOccurrenceRegex = new RegExp(`\\b${escapedTarget}\\b(?!.*\\b${escapedTarget}\\b)`, 'gi');
            const updatedText = currentText.replace(lastOccurrenceRegex, '').replace(/\s\s+/g, ' ').trim();
            return { ...prev, [field]: updatedText };
          });
          setTimeout(() => startListening(field), 300);
          return;
        }
      }

      // 3. New Line / Paragraph Command
      if (trimmed === 'new line' || trimmed === 'paragraph' || fullTranscript.endsWith(' new line')) {
        recognition.abort();
        setConsultation((prev: any) => {
          const base = String(prev[field] || '').trim();
          return { ...prev, [field]: base + '\n' };
        });
        setTimeout(() => startListening(field), 300);
        return;
      }

      // 4. Undo Command (Standalone only)
      if (trimmed === 'undo' || fullTranscript.endsWith(' undo')) {
        recognition.abort();
        setConsultation((prev: any) => {
          const base = String(prev[field] || '').trim();
          const words = base.split(/\s+/);
          words.pop(); 
          return { ...prev, [field]: words.join(' ') };
        });
        setTimeout(() => startListening(field), 300);
        return;
      }

      // 5. Navigation Commands (Standalone or trailing)
      if (trimmed === 'stop' || trimmed === 'next' || fullTranscript.endsWith(' next') || fullTranscript.endsWith(' stop dictation')) {
        const fieldOrder = ['chiefComplaints', 'history', 'examination', 'diagnosis', 'investigationAdvised', 'nextReview'];
        const currentIndex = fieldOrder.indexOf(field);
        const next = fieldOrder[currentIndex + 1];
        recognition.abort();
        if (next) {
          setTimeout(() => startListening(next), 500);
        }
        return;
      }

      // Apply Medical Autocorrect to the finalized session text
      let correctedFinal = sessionFinal;
      for (const key of Object.keys(medicalAutoCorrect)) {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        correctedFinal = correctedFinal.replace(regex, medicalAutoCorrect[key]);
      }

      setConsultation((prev: any) => {
        const base = String(initialText || '');
        
        // SILENT COMMAND FILTER: Strip commands from the display
        const displayFinal = correctedFinal
          .replace(/remove\s*.*$/gi, '')
          .replace(/new line/gi, '')
          .replace(/paragraph/gi, '')
          .replace(/undo/gi, '')
          .trim();

        const displayInterim = interim
          .replace(/remove\s*.*$/gi, '')
          .replace(/new line/gi, '')
          .replace(/paragraph/gi, '')
          .replace(/undo/gi, '')
          .trim();

        let combined = base + (base && !base.endsWith('\n') && !base.endsWith(' ') ? ' ' : '') + displayFinal;
        
        let processed = combined
          .replace(/ +([.,!?])/g, '$1')
          .replace(/([.,!?])([^\s"'\n])/g, '$1 $2')
          .replace(/(^\s*|[\.\!\?\n]\s*)([a-z])/g, (m, s, l) => s + l.toUpperCase())
          .trim();

        const newValue = processed + (displayInterim ? (processed && !processed.endsWith(' ') ? ' ' : '') + displayInterim : '');
        
        return { ...prev, [field]: newValue };
      });
    };

    setTimeout(() => {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }, 20);
  };

  const stats = useMemo(() => {
    const today = new Date();
    return {
      completedToday: allAppointments.filter((v: any) => 
        v.status === 'COMPLETED' && isSameDay(new Date(v.visitDate), today)
      ),
      advancedBookings: allAppointments.filter((v: any) => 
        new Date(v.visitDate) > today && v.status === 'READY'
      )
    };
  }, [allAppointments]);

  const finishedToday = useMemo(() => stats.completedToday, [stats]);
  const reviewCases = useMemo(() => queue.filter((v: any) => v.isReview), [queue]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Sidebar - Standardized Premium Format */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, transition: 'all 0.3s', zIndex: 100 }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'white' }}>Malar Hospital</h2>
          <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'white' }}>Clinical Portal</span>
        </div>

        <nav style={{ padding: '20px 0', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button 
             onClick={() => setCurrentView('consulting')}
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: currentView === 'consulting' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '14px' }}
          >
            <Stethoscope size={18} /> 
            <span style={{ fontWeight: currentView === 'consulting' ? '700' : '400' }}>OPD Consulting</span>
          </button>
          
          <button 
             onClick={() => { setCurrentView('calendar'); fetchAllAppointments(); }}
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: currentView === 'calendar' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '14px' }}
          >
            <Calendar size={18} /> 
            <span style={{ fontWeight: currentView === 'calendar' ? '700' : '400' }}>Calendar View</span>
          </button>

          <button 
             onClick={() => setCurrentView('reviews')}
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: currentView === 'reviews' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '14px' }}
          >
            <Activity size={18} /> 
            <span style={{ fontWeight: currentView === 'reviews' ? '700' : '400' }}>Review Cases</span>
            {queue.filter(v => v.isReview).length > 0 && (
              <span className="ml-auto bg-[#F59E0B] text-[#0A4D68] text-[9px] font-black px-1.5 py-0.5 rounded">{queue.filter(v => v.isReview).length}</span>
            )}
          </button>

          <button 
             onClick={() => setCurrentView('finished')}
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: currentView === 'finished' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '14px' }}
          >
            <CheckCircle2 size={18} /> 
            <span style={{ fontWeight: currentView === 'finished' ? '700' : '400' }}>Finished Today</span>
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
              trend={12}
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
              value={stats.completedToday.length} 
              icon={<CheckCircle2 style={{ color: '#14B8A6' }} />} 
              isPositive={true}
              onClick={() => setStatModalState({ title: 'Completed Today', list: stats.completedToday })}
          />
          <StatCard 
              label="Advanced Bookings" 
              value={stats.advancedBookings.length} 
              icon={<Calendar style={{ color: '#F59E0B' }} />} 
              onClick={() => setStatModalState({ title: 'Advanced Bookings', list: stats.advancedBookings })}
          />
        </div>

        {currentView === 'calendar' ? (
          <div style={{ backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', border: '2px solid white', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '75vh', animation: 'fade-in 0.5s ease' }}>
             {/* Google Calendar Style Header */}
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', borderBottom: '1px solid #F1F5F9', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(26, 115, 232, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8' }}>
                         <Calendar size={24} />
                      </div>
                      <div>
                         <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', margin: 0 }}>{format(currentMonth, 'MMMM yyyy')}</h3>
                         <p style={{ fontSize: '10px', fontWeight: '900', color: '#1a73e8', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Medical Schedule</p>
                      </div>
                   </div>
                   
                   <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '12px', padding: '4px', border: '1px solid #E2E8F0' }}>
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                         <ChevronLeft size={20} />
                      </button>
                      <button onClick={() => setCurrentMonth(new Date())} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '900', color: '#475569', cursor: 'pointer', textTransform: 'uppercase' }}>
                         Today
                      </button>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                         <ChevronRight size={20} />
                      </button>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                   <button style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>Month</button>
                   <button style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#1a73e8', color: 'white', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(26, 115, 232, 0.3)' }}>+ Appointment</button>
                </div>
             </div>

             {/* Calendar Grid Container */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Weekday Labels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                   {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} style={{ padding: '12px 0', textAlign: 'center', fontSize: '11px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.5px', borderRight: '1px solid #F1F5F9' }}>{day}</div>
                   ))}
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1 flex-1">
                   {calendarDays.map((day, idx) => {
                      const dayVisits = allAppointments.filter(v => isSameDay(new Date(v.visitDate), day));
                      const isToday = isSameDay(day, new Date());
                      const isCurrentMonth = isSameMonth(day, currentMonth);

                         return (
                            <div 
                              key={day.toString()} 
                              style={{ 
                                minHeight: '130px', 
                                padding: '8px', 
                                borderRight: '1px solid #F1F5F9', 
                                borderBottom: '1px solid #F1F5F9', 
                                background: !isCurrentMonth ? '#F9FAFB' : 'white',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column'
                              }}
                            >
                               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', paddingTop: '4px' }}>
                                  <span style={{ 
                                    fontSize: '12px', 
                                    fontWeight: '900', 
                                    width: '32px', 
                                    height: '32px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    borderRadius: '50%',
                                    backgroundColor: isToday ? '#1a73e8' : 'transparent',
                                    color: isToday ? 'white' : !isCurrentMonth ? '#CBD5E1' : '#475569',
                                    boxShadow: isToday ? '0 4px 6px -1px rgba(26, 115, 232, 0.4)' : 'none'
                                  }}>
                                     {format(day, 'd')}
                                  </span>
                               </div>
                               
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                                  {dayVisits.slice(0, 3).map((v) => (
                                     <div 
                                       key={v.id} 
                                       onClick={() => setCalendarVisitDetail(v)}
                                       style={{ 
                                         fontSize: '9px', 
                                         padding: '6px 10px', 
                                         borderRadius: '6px', 
                                         fontWeight: '700', 
                                         whiteSpace: 'nowrap',
                                         overflow: 'hidden',
                                         textOverflow: 'ellipsis',
                                         cursor: 'pointer',
                                         display: 'flex',
                                         alignItems: 'center',
                                         gap: '8px',
                                         borderLeft: `4px solid ${v.status === 'COMPLETED' ? '#10B981' : '#1a73e8'}`,
                                         backgroundColor: v.status === 'COMPLETED' ? '#F0FDF4' : '#EFF6FF',
                                         color: v.status === 'COMPLETED' ? '#065F46' : '#1E40AF',
                                         boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                       }}
                                     >
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: v.status === 'COMPLETED' ? '#10B981' : '#1a73e8' }}></div>
                                        {v.patient.name}
                                     </div>
                                   ))}
                                   {dayVisits.length > 3 && (
                                      <div style={{ fontSize: '9px', fontWeight: '900', color: '#1a73e8', textAlign: 'center', textTransform: 'uppercase', marginTop: '4px', opacity: 0.6 }}>+ {dayVisits.length - 3} more</div>
                                   )}
                               </div>
                            </div>
                         );
                   })}
                </div>
             </div>
          </div>
        ) : currentView === 'reviews' ? (
          <div className="glass-card !p-8 animate-fade-in bg-white border-2 border-white shadow-lg">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                      <Stethoscope className="text-primary" size={32} /> Review Follow-ups
                   </h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Patients tagged for clinical review</p>
                </div>
                <div className="bg-primary/5 text-primary px-6 py-2 rounded-full font-black text-sm">
                   {reviewCases.length} PENDING
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviewCases.length > 0 ? (
                   reviewCases.map((v: any) => (
                      <div 
                        key={v.id} 
                        className="relative overflow-hidden cursor-pointer bg-white border-2 border-transparent hover:border-emerald-500/30 transition-all duration-100 group rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 active:scale-95"
                        onClick={() => selectVisit(v)}
                      >
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        
                        <div className="relative flex justify-between items-start mb-6">
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Token {v.tokenNumber}</span>
                             </div>
                             <h4 className="text-xl font-black text-slate-800 group-hover:text-emerald-700 transition-colors uppercase tracking-tight leading-none">{v.patient.name}</h4>
                           </div>
                           <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
                             <CheckCircle2 size={24} strokeWidth={3} />
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                           <div className="flex flex-col ml-auto text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Consulted At</span>
                              <span className="text-sm font-black text-slate-600 italic">{new Date(v.visitDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                           </div>
                        </div>
                      </div>
                   ))
                ) : (
                   <div className="col-span-full py-20 text-center flex flex-col items-center">
                      <Activity className="text-slate-100 mb-4" size={80} />
                      <h4 className="text-slate-300 font-black text-xl uppercase">No Review Cases Currently</h4>
                      <p className="text-slate-400 text-sm font-bold">Follow-up patients will appear here automatically.</p>
                   </div>
                )}
             </div>
          </div>
        ) : currentView === 'finished' ? (
          <div className="glass-card !p-8 animate-fade-in bg-white border-2 border-white shadow-lg">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={32} /> Finished Consultations
                   </h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Successfully Completed Visits Today</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-full font-black text-sm">
                   {finishedToday.length} DONE
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {finishedToday.length > 0 ? (
                   finishedToday.map((v: any) => (
                      <div 
                        key={v.id} 
                        className="relative overflow-hidden cursor-pointer bg-white border-2 border-transparent hover:border-emerald-500/30 transition-all duration-100 group rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 active:scale-95"
                        onClick={() => selectVisit(v)}
                      >
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        
                        <div className="relative flex justify-between items-start mb-6">
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Token {v.tokenNumber}</span>
                             </div>
                             <h4 className="text-xl font-black text-slate-800 group-hover:text-emerald-700 transition-colors uppercase tracking-tight leading-none">{v.patient.name}</h4>
                           </div>
                           <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
                             <CheckCircle2 size={24} strokeWidth={3} />
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                           <div className="flex flex-col ml-auto text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Consulted At</span>
                              <span className="text-sm font-black text-slate-600 italic">{new Date(v.visitDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                           </div>
                        </div>
                      </div>
                   ))
                ) : (
                   <div className="col-span-full py-20 text-center flex flex-col items-center">
                      <CheckCircle2 className="text-slate-100 mb-4" size={80} />
                      <h4 className="text-slate-300 font-black text-xl uppercase">No Finished Cases Yet</h4>
                      <p className="text-slate-400 text-sm font-bold">Completed consultations will appear here.</p>
                   </div>
                )}
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: All Patient Queues */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                {/* Section 1: Active Waiting List */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-bold flex items-center gap-2 text-[#0A4D68]">
                       <Clock size={20} /> Shift Waiting List
                     </h3>
                     <span className="badge bg-[#088395] text-white border-none font-bold px-4 py-3">{queue.length} Ready</span>
                  </div>

                  <div className="flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: '45vh' }}>
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
                             <span className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Token {v.tokenNumber}</span>
                             <div className="flex items-center gap-2">
                               <h4 className="text-base font-bold text-slate-800">{v.patient.name}</h4>
                               {v.isReview && (
                                 <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-tight">Review Case</span>
                               )}
                             </div>
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
                </div>

            </div>

            {/* Consultation Form */}
            <div className="lg:col-span-2">
               {selectedVisit ? (
                 <div className="glass-card !p-8 animate-fade-in bg-white h-full border-2 border-white">
                    {/* ... (Existing Consultation UI) ... */}

                  <div style={{ background: '#F0F9FF', borderRadius: '16px', padding: '24px', marginBottom: '30px', border: '1px solid #BAE6FD' }}>
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20">
                               {selectedVisit.patient.name.charAt(0)}
                            </div>
                            <div>
                               <h2 className="text-xl font-bold text-slate-800">{selectedVisit.patient.name}</h2>
                               <p className="text-xs font-bold text-primary tracking-widest uppercase mt-1">
                                  {selectedVisit.patient.uhid} &nbsp;·&nbsp; Token {selectedVisit.tokenNumber}
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
                                   placeholder="Dictate complaints..." 
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
                                   placeholder="Clinical diagnosis..." 
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
                                           className={`btn !px-5 !py-2.5 !text-[10px] font-black tracking-widest flex items-center gap-2 transition-all duration-75 active:scale-95 ${currentDrug.instructions === opt.val ? 'btn-primary shadow-lg scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:border-[#088395] hover:text-[#088395]'}`}>
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
                                      <div className="relative">
                                        <input 
                                          list="dosages"
                                          className="form-input !py-1 !px-3 !bg-white !text-xs font-bold w-full" 
                                          placeholder="Dosage..."
                                          value={currentDrug.dosage} 
                                          onChange={e => setCurrentDrug({...currentDrug, dosage: e.target.value})}
                                        />
                                        <datalist id="dosages">
                                           <option value="1-0-1" />
                                           <option value="1-1-1" />
                                           <option value="1-0-0" />
                                           <option value="0-1-0" />
                                           <option value="0-0-1" />
                                           <option value="SOS" />
                                           <option value="Stat" />
                                        </datalist>
                                      </div>
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

                             <div className="flex flex-col gap-4 p-6 bg-[#088395]/5 rounded-2xl border border-[#088395]/10">
                                <div className="flex justify-between items-center">
                                   <label className="text-[11px] font-black uppercase tracking-widest text-[#0A4D68]/60">Review / Follow-up</label>
                                   <label className="flex items-center gap-2 cursor-pointer select-none" style={{ userSelect: 'none' }}>
                                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#088395', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mark as Review Case</span>
                                      <div
                                        onClick={() => setConsultation({...consultation, isReview: !consultation.isReview})}
                                        style={{
                                          width: '20px', height: '20px',
                                          borderRadius: '5px',
                                          border: `2px solid #088395`,
                                          backgroundColor: consultation.isReview ? '#088395' : 'white',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          flexShrink: 0,
                                          boxShadow: consultation.isReview ? '0 4px 10px rgba(8,131,149,0.35)' : 'none'
                                        }}
                                      >
                                        {consultation.isReview && (
                                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                            <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                   </label>
                                </div>
                                {consultation.isReview && (
                                  <textarea 
                                    className="form-input !h-24 border-none shadow-sm transition-all focus:!ring-2 font-bold text-[#0A4D68] animate-in fade-in slide-in-from-top-2 duration-300"
                                    style={{ 
                                      backgroundColor: 'white',
                                      resize: 'none'
                                    }}
                                    placeholder="E.g., Come and meet me after one week..."
                                    value={consultation.nextReview} 
                                    onChange={e => setConsultation({...consultation, nextReview: e.target.value})}
                                  />
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
                             {v.patient.uhid} • Token {v.tokenNumber} • {v.patient.gender} • {v.patient.age} Y/O
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
