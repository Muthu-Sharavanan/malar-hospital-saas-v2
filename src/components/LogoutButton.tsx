'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.replace('/');
    } catch (err) {
      console.error("Logout failed", err);
      // Fallback redirect
      router.replace('/');
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-2 mt-auto" 
      style={{ 
        background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', 
        color: 'white', padding: '10px 15px', borderRadius: '8px', fontSize: '14px',
        width: '100%', textAlign: 'left', transition: 'all 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
    >
      <i className="fa-solid fa-right-from-bracket"></i> Sign Out
    </button>
  );
}
