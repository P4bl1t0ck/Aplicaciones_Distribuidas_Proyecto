import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Award, Gift, BarChart3, ShieldCheck, Radio, Calendar, Users, 
  Map, User, CheckCircle2, ChevronRight, Compass, Settings, AlertTriangle, 
  Sparkles, RefreshCw, Send, Check, Bell, Lock, QrCode, LogOut
} from 'lucide-react';
import io from 'socket.io-client';

const API_BASE = 'http://localhost:8000/api/v1';
const SOCKET_URL = 'http://localhost:3007';

// Quito coordinates and bounds reference
const QUITO_CENTER = { lat: -0.22016, lng: -78.51214 };

const POIS = [
  { id: 'plaza_grande', name: 'Plaza Grande', lat: -0.22016, lng: -78.51214, description: 'Corazón histórico.' },
  { id: 'san_francisco', name: 'Iglesia de San Francisco', lat: -0.22055, lng: -78.51428, description: 'Leyenda de Cantuña.' },
  { id: 'basilica', name: 'Basílica del Voto Nacional', lat: -0.21473, lng: -78.50731, description: 'Gárgolas neogóticas.' },
  { id: 'el_panecillo', name: 'Virgen de El Panecillo', lat: -0.23018, lng: -78.51855, description: 'Virgen de aluminio alada.' },
  { id: 'la_ronda', name: 'Calle La Ronda', lat: -0.22485, lng: -78.51522, description: 'Tradición y comida.' }
];

function App() {
  const [activeTab, setActiveTab] = useState('turista'); // 'turista' or 'b2b'
  const [backendMode, setBackendMode] = useState('Checking...'); // 'Real API' or 'Mock Frontend'
  
  // Auth state
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '', isRegister: false });
  const [authError, setAuthError] = useState('');
  
  // User Profile
  const [interests, setInterests] = useState(['HISTORIA', 'GASTRONOMIA']);
  const [profileBio, setProfileBio] = useState('¡Explorando las maravillas de Quito!');

  // Map & Sim GPS state
  const [simGps, setSimGps] = useState({ lat: -0.22000, lng: -78.51000 });
  const [selectedPoi, setSelectedPoi] = useState(POIS[0]);
  const [checkinStatus, setCheckinStatus] = useState({ type: '', msg: '' });

  // Microservices state feeds
  const [missions, setMissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [badges, setBadges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalCheckins: 12,
    totalRedeems: 4,
    poiCounts: { plaza_grande: 5, san_francisco: 4, basilica: 3 },
    partnerCounts: { 'Café Plaza Mayor': 2, 'La Casa del Canelazo': 2 },
    hourlyTraffic: [0,0,0,0,0,0,0,1,3,4,2,5,7,8,6,4,3,2,1,0,0,0,0,0]
  });

  // Real-time notifications toast list
  const [toasts, setToasts] = useState([]);
  const [customEventForm, setCustomEventForm] = useState({ title: '', location: '', category: 'GASTRONOMIA', description: '' });
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponValResult, setCouponValResult] = useState({ type: '', msg: '' });

  // Socket reference
  const socketRef = useRef(null);

  // Check backend health & auto configure mode
  const checkBackendHealth = async () => {
    try {
      const res = await fetch('http://localhost:8000/health');
      if (res.ok) {
        setBackendMode('Conectado');
        return true;
      }
    } catch (e) {
      // Switch silently to mockup simulation mode
      setBackendMode('Modo Simulado (Local)');
      return false;
    }
    return false;
  };

  useEffect(() => {
    checkBackendHealth().then(isReal => {
      loadInitialData(isReal);
    });

    // Clean up socket on unmount
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Connect user websockets once logged in
  useEffect(() => {
    if (user && backendMode === 'Conectado') {
      if (socketRef.current) socketRef.current.disconnect();
      
      socketRef.current = io(SOCKET_URL, {
        query: { userId: user.id },
        transports: ['websocket']
      });

      socketRef.current.on('notification', (notif) => {
        addToast(notif);
        // Refresh dynamic values on update
        refreshUserData();
      });
    }
  }, [user, backendMode]);

  const loadInitialData = async (isReal) => {
    if (isReal) {
      try {
        const eventsRes = await fetch(`${API_BASE}/events/events`);
        const rewardsRes = await fetch(`${API_BASE}/rewards/catalog`);
        const boardRes = await fetch(`${API_BASE}/gamification/leaderboard`);
        const missionsRes = await fetch(`${API_BASE}/gamification/missions`);

        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents(data.events || []);
        }
        if (rewardsRes.ok) {
          const data = await rewardsRes.json();
          setRewards(data.catalog || []);
        }
        if (boardRes.ok) {
          const data = await boardRes.json();
          setLeaderboard(data.leaderboard || []);
        }
        if (missionsRes.ok) {
          const data = await missionsRes.json();
          setMissions(data.missions || []);
        }
      } catch (err) {
        console.error('Error fetching backend data:', err);
      }
    } else {
      // Seed Mock Data in React state
      setEvents([
        { id: 'evt_1', title: 'Noche de Museos - Centro Histórico', description: 'Visitas teatralizadas en el casco colonial.', date: '2026-07-15', location: 'Iglesia de San Francisco', category: 'HISTORIA' },
        { id: 'evt_2', title: 'Feria de Sabores Tradicionales', description: 'Degustación de humitas, helados de paila y chocolate.', date: '2026-07-20', location: 'Calle La Ronda', category: 'GASTRONOMIA' }
      ]);
      setRewards([
        { id: 'rew_cafe_plaza', poiId: 'plaza_grande', partnerName: 'Café Plaza Mayor', title: 'Café Americano + Humita 2x1', description: 'Canje de merienda colonial.' },
        { id: 'rew_museo_sf', poiId: 'san_francisco', partnerName: 'Museo Fray Pedro Gocial', title: 'Entrada Gratuita al Claustro', description: 'Acceso liberado a San Francisco.' }
      ]);
      setMissions([
        { id: 'm_plaza_grande', title: 'Exploración de la Plaza Mayor', description: 'Check-in en la Plaza de la Independencia.', xpReward: 100, poiId: 'plaza_grande' },
        { id: 'm_san_francisco', title: 'El Pacto de Cantuña', description: 'Visita el atrio de San Francisco.', xpReward: 150, poiId: 'san_francisco' },
        { id: 'm_basilica', title: 'Escalador de Torres', description: 'Check-in en la Basílica del Voto Nacional.', xpReward: 200, poiId: 'basilica' }
      ]);
      setLeaderboard([
        { rank: 1, username: 'pablomont10', xp: 1200, level: 12 },
        { rank: 2, username: 'patriciosaa', xp: 950, level: 9 },
        { rank: 3, username: 'carlosmoreta', xp: 800, level: 8 }
      ]);
      setRecommendations([
        { poiId: 'la_ronda', title: 'Cena típica en Calle La Ronda', reason: 'Recomendado por tu interés en GASTRONOMIA.', category: 'GASTRONOMIA' },
        { poiId: 'plaza_grande', title: 'Visita el Palacio de Carondelet', reason: 'Por tu interés en HISTORIA.', category: 'HISTORIA' }
      ]);
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    if (backendMode === 'Conectado') {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const progRes = await fetch(`${API_BASE}/gamification/progress/${user.id}`, { headers });
        const badgeRes = await fetch(`${API_BASE}/gamification/badges/${user.id}`, { headers });
        const coupRes = await fetch(`${API_BASE}/rewards/coupons/${user.id}`, { headers });
        const recRes = await fetch(`${API_BASE}/recommendations/recommendations/${user.id}?interests=${interests.join(',')}`, { headers });
        
        if (progRes.ok) {
          const data = await progRes.json();
          setUser(prev => ({ ...prev, xp: data.progress.xp, level: data.progress.level, completedMissions: data.progress.completedMissions }));
        }
        if (badgeRes.ok) {
          const data = await badgeRes.json();
          setBadges(data.badges || []);
        }
        if (coupRes.ok) {
          const data = await coupRes.json();
          setCoupons(data.coupons || []);
        }
        if (recRes.ok) {
          const data = await recRes.json();
          setRecommendations(data.recommendations || []);
        }
        
        // Refresh B2B Analytics
        const analRes = await fetch(`${API_BASE}/analytics/b2b/summary`, { headers });
        if (analRes.ok) {
          const data = await analRes.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Error refreshing user stats:', err);
      }
    }
  };

  const addToast = (notif) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...notif }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  // Auth Handler
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (backendMode === 'Conectado') {
      const endpoint = authForm.isRegister ? 'register' : 'login';
      try {
        const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: authForm.username || authForm.email.split('@')[0],
            email: authForm.email,
            password: authForm.password
          })
        });
        const data = await res.json();
        if (res.ok) {
          if (authForm.isRegister) {
            addToast({ title: 'Cuenta Creada', message: 'Te has registrado correctamente. Ahora inicia sesión.' });
            setAuthForm(prev => ({ ...prev, isRegister: false }));
          } else {
            localStorage.setItem('token', data.accessToken);
            setUser({
              id: data.user.id,
              username: data.user.username,
              role: data.user.role,
              xp: 0,
              level: 1,
              completedMissions: []
            });
            addToast({ title: 'Bienvenido', message: `Hola ${data.user.username}, ¡has iniciado sesión!` });
            setTimeout(() => refreshUserData(), 500);
          }
        } else {
          setAuthError(data.message || 'Error en autenticación.');
        }
      } catch (err) {
        setAuthError('No se pudo conectar al API Gateway.');
      }
    } else {
      // Mock Login
      const mockId = 'usr_mock_' + Date.now();
      setUser({
        id: mockId,
        username: authForm.isRegister ? authForm.username : authForm.email.split('@')[0],
        role: 'TURISTA',
        xp: 0,
        level: 1,
        completedMissions: []
      });
      addToast({ title: 'Sesión Simulada', message: 'Iniciaste sesión local en memoria.' });
    }
  };

  // Move GPS simulated slider to POI coordinates
  const teleportToPoi = (poi) => {
    setSelectedPoi(poi);
    setSimGps({ lat: poi.lat, lng: poi.lng });
    setCheckinStatus({ type: '', msg: '' });
  };

  // Checkin Validation
  const handleCheckin = async () => {
    if (!user) {
      addToast({ title: 'Acceso Denegado', message: 'Inicia sesión antes de explorar.' });
      return;
    }

    setCheckinStatus({ type: 'pending', msg: 'Verificando ubicación con el microservicio...' });

    if (backendMode === 'Conectado') {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/geo/check-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user.id,
            poiId: selectedPoi.id,
            userLocation: { lat: simGps.lat, lng: simGps.lng }
          })
        });

        const data = await res.json();
        if (res.ok && data.verified) {
          setCheckinStatus({ type: 'success', msg: data.message });
          // Poll updates shortly
          setTimeout(() => refreshUserData(), 1000);
        } else {
          setCheckinStatus({ type: 'error', msg: data.message || 'Check-in fallido.' });
        }
      } catch (e) {
        setCheckinStatus({ type: 'error', msg: 'Fallo al contactar el microservicio de geolocalización.' });
      }
    } else {
      // Mock Checkin logic
      setTimeout(() => {
        // Calculate distance
        const R = 6371e3;
        const phi1 = (simGps.lat * Math.PI) / 180;
        const phi2 = (selectedPoi.lat * Math.PI) / 180;
        const deltaPhi = ((selectedPoi.lat - simGps.lat) * Math.PI) / 180;
        const deltaLambda = ((selectedPoi.lng - simGps.lng) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance <= 50) {
          // Success check-in simulator
          setCheckinStatus({ type: 'success', msg: `¡Check-in Simulado exitoso! Estás a ${Math.round(distance)}m.` });
          
          // XP increment
          const mission = missions.find(m => m.poiId === selectedPoi.id);
          const xpGained = mission ? mission.xpReward : 100;
          
          const newXP = user.xp + xpGained;
          const newLevel = Math.floor(newXP / 100) + 1;
          const levelUp = newLevel > user.level;

          // Update user
          const updatedMissions = [...user.completedMissions];
          if (mission && !updatedMissions.includes(mission.id)) {
            updatedMissions.push(mission.id);
          }

          setUser(prev => ({
            ...prev,
            xp: newXP,
            level: newLevel,
            completedMissions: updatedMissions
          }));

          // Trigger Mock Toasts
          addToast({ title: '🏆 Misión Completada', message: `¡Check-in verificado! Ganaste +${xpGained} XP.` });
          if (levelUp) {
            addToast({ title: '🌟 Subiste de Nivel!', message: `¡Felicidades, alcanzaste el nivel ${newLevel}!` });
          }

          // Mint Mock coupon
          const rew = rewards.find(r => r.poiId === selectedPoi.id);
          if (rew) {
            const code = `QQ-MOCK-${Math.floor(1000 + Math.random() * 9000)}`;
            setCoupons(prev => [...prev, {
              code,
              userId: user.id,
              rewardId: rew.id,
              partnerName: rew.partnerName,
              title: rew.title,
              status: 'ACTIVE',
              issuedAt: new Date().toISOString()
            }]);
            addToast({ title: '🎁 Cupón Otorgado', message: `Reclama tu beneficio en: ${rew.partnerName}.` });
          }

          // Unlock Mock badge
          if (badges.length === 0) {
            setBadges([{ id: 'badge_first', name: 'Primer Check-in', description: 'Primer paso en QuitoQuest.' }]);
            addToast({ title: '🏅 Insignia Obtenida', message: '¡Desbloqueaste el logro: "Primer Paso"!' });
          }
        } else {
          setCheckinStatus({ type: 'error', msg: `Ubicación demasiado lejana. Estás a ${Math.round(distance)}m (Límite: 50m).` });
        }
      }, 800);
    }
  };

  // Add custom event (Scraper Mock B2B)
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (backendMode === 'Conectado') {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/events/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(customEventForm)
        });
        if (res.ok) {
          addToast({ title: 'Evento Creado', message: 'El evento cultural se ha publicado en el clúster.' });
          setCustomEventForm({ title: '', location: '', category: 'GASTRONOMIA', description: '' });
          // reload
          loadInitialData(true);
        }
      } catch (err) {
        addToast({ title: 'Error', message: 'Fallo al registrar evento.' });
      }
    } else {
      const newEvt = {
        id: 'evt_' + Date.now(),
        ...customEventForm,
        date: new Date().toISOString().split('T')[0]
      };
      setEvents(prev => [...prev, newEvt]);
      addToast({ title: 'Evento Simulado', message: `Se registró localmente "${newEvt.title}".` });
      setCustomEventForm({ title: '', location: '', category: 'GASTRONOMIA', description: '' });
    }
  };

  // Coupon validator (B2B check-in code validation)
  const handleValidateCoupon = async (e) => {
    e.preventDefault();
    setCouponValResult({ type: 'pending', msg: 'Consultando código en el base de datos transaccional...' });

    if (backendMode === 'Conectado') {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/rewards/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ code: couponCodeInput })
        });
        const data = await res.json();
        if (res.ok) {
          setCouponValResult({ type: 'success', msg: data.message });
          setCouponCodeInput('');
          // reload
          refreshUserData();
        } else {
          setCouponValResult({ type: 'error', msg: data.message || 'Código inválido.' });
        }
      } catch (err) {
        setCouponValResult({ type: 'error', msg: 'Error de conexión con el microservicio.' });
      }
    } else {
      // Mock validation
      setTimeout(() => {
        const index = coupons.findIndex(c => c.code.toUpperCase() === couponCodeInput.toUpperCase() && c.status === 'ACTIVE');
        if (index >= 0) {
          const updated = [...coupons];
          updated[index].status = 'REDEEMED';
          setCoupons(updated);
          setCouponValResult({ type: 'success', msg: `¡Cupón verificado con éxito en '${updated[index].partnerName}'!` });
          
          // Increment B2B analytics
          setAnalytics(prev => ({
            ...prev,
            totalRedeems: prev.totalRedeems + 1,
            partnerCounts: {
              ...prev.partnerCounts,
              [updated[index].partnerName]: (prev.partnerCounts[updated[index].partnerName] || 0) + 1
            }
          }));

          setCouponCodeInput('');
        } else {
          setCouponValResult({ type: 'error', msg: 'Cupón inválido, ya canjeado o inexistente.' });
        }
      }, 700);
    }
  };

  const toggleInterest = (interest) => {
    const current = [...interests];
    if (current.includes(interest)) {
      setInterests(current.filter(i => i !== interest));
    } else {
      setInterests([...current, interest]);
    }
  };

  // Submit profiles updates
  const handleUpdateProfile = () => {
    refreshUserData();
    addToast({ title: 'Perfil Actualizado', message: 'Se guardaron tus preferencias de exploración.' });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setCoupons([]);
    setBadges([]);
    addToast({ title: 'Sesión Cerrada', message: 'Hasta luego, explorador.' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Dynamic Toasts Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className="glass-panel p-4 border-l-4 border-cyan-400 bg-slate-900/90 shadow-2xl flex gap-3 animate-slide-in">
            <Bell className="text-cyan-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-100">{t.title}</h4>
              <p className="text-xs text-slate-300 mt-1">{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-900/30">
              <Compass className="text-white animate-spin-slow" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-rose-400 to-rose-200 bg-clip-text text-transparent">QuitoQuest</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] text-slate-400 font-medium">Gateway: {backendMode}</span>
              </div>
            </div>
          </div>

          <nav className="flex gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('turista')}
              className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all ${activeTab === 'turista' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <MapPin size={14} /> Explorador (Cliente)
            </button>
            <button 
              onClick={() => setActiveTab('b2b')}
              className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all ${activeTab === 'b2b' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <BarChart3 size={14} /> Gestión B2B & Municipio
            </button>
          </nav>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Auth Guard (Only for Turista view) */}
        {!user && activeTab === 'turista' ? (
          <div className="max-w-md mx-auto my-12 glass-panel p-8">
            <div className="text-center mb-6">
              <Lock className="mx-auto text-rose-500 mb-3" size={32} />
              <h2 className="text-2xl font-bold">{authForm.isRegister ? 'Crear Cuenta' : 'Inicia Sesión'}</h2>
              <p className="text-sm text-slate-400 mt-1">Accede para desbloquear misiones y recompensas</p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              {authForm.isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de Usuario</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-rose-500 outline-none"
                    placeholder="pablomont10"
                    value={authForm.username}
                    onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-rose-500 outline-none"
                  placeholder="ejemplo@quitoquest.com"
                  required
                  value={authForm.email}
                  onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-rose-500 outline-none"
                  placeholder="••••••••"
                  required
                  value={authForm.password}
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>

              {authError && (
                <div className="flex gap-2 p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 font-bold p-3 rounded-lg text-sm transition-all shadow-lg shadow-rose-900/20">
                {authForm.isRegister ? 'Registrarse' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              {authForm.isRegister ? '¿Ya tienes cuenta?' : '¿Nuevo en QuitoQuest?'} &nbsp;
              <button 
                onClick={() => setAuthForm({ ...authForm, isRegister: !authForm.isRegister })}
                className="text-rose-400 font-bold hover:underline"
              >
                {authForm.isRegister ? 'Inicia Sesión' : 'Crea una Cuenta'}
              </button>
            </div>
          </div>
        ) : (
          /* Main Views */
          <div>
            {activeTab === 'turista' ? (
              /* EXPLORER USER TAB */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Panel: Profile */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  <div className="glass-panel p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-700 flex items-center justify-center font-bold text-lg text-white shadow-md">
                        {user.username.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-100">{user.username}</h3>
                        <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">Explorador Colonial</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-400">Progreso Nivel {user.level}</span>
                        <span className="text-rose-400">{user.xp % 100} / 100 XP</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2">
                        <div className="bg-gradient-to-r from-rose-500 to-rose-600 h-2 rounded-full" style={{ width: `${user.xp % 100}%` }}></div>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">Total acumulado: {user.xp} XP</span>
                    </div>

                    <div className="flex justify-between">
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-slate-200">{user.completedMissions.length}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Misiones</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-slate-200">{badges.length}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Logros</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-extrabold text-slate-200">{coupons.length}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Cupones</div>
                      </div>
                    </div>

                    <button onClick={handleLogout} className="w-full mt-5 border border-slate-800 hover:border-red-900 hover:bg-red-950/20 text-slate-400 hover:text-red-400 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all">
                      <LogOut size={12} /> Cerrar Sesión
                    </button>
                  </div>

                  {/* Profile Settings */}
                  <div className="glass-panel p-5">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-rose-400"><Settings size={16} /> Preferencias del Perfil</h3>
                    <div className="flex flex-col gap-3 mb-4">
                      {['GASTRONOMIA', 'HISTORIA', 'ARTE', 'NATURALEZA'].map(cat => (
                        <label key={cat} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={interests.includes(cat)} 
                            onChange={() => toggleInterest(cat)}
                            className="accent-rose-500 rounded border-slate-800 bg-slate-900 w-4 h-4" 
                          />
                          <span>{cat}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={handleUpdateProfile} className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold py-2 rounded-lg text-xs transition-all border border-slate-800">
                      Guardar Preferencias
                    </button>
                  </div>

                  {/* Badges Box */}
                  <div className="glass-panel p-5">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-rose-400"><Award size={16} /> Insignias Desbloqueadas</h3>
                    {badges.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No has desbloqueado insignias aún. ¡Explora un punto de interés!</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {badges.map(b => (
                          <div key={b.id} className="group relative aspect-square rounded-xl bg-slate-900/80 border border-rose-500/20 flex items-center justify-center hover:border-rose-500 transition-all cursor-help" title={`${b.name}: ${b.description}`}>
                            <Award className="text-rose-400 animate-pulse" size={20} />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-slate-900 p-2 border border-slate-800 rounded-lg text-[10px] hidden group-hover:block z-10 text-center">
                              <span className="font-bold">{b.name}</span>
                              <p className="text-slate-400 mt-0.5">{b.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Simulator Map */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                  <div className="glass-panel p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2"><Map size={16} /> Mapa de Control GPS (Quito Centro)</h3>
                        <p className="text-xs text-slate-400">Simula tu ubicación en tiempo real para activar Geofencing</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-bold uppercase tracking-wider">Modo Sandbox</span>
                    </div>

                    {/* Vector Map Simulator Graphic */}
                    <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-slate-950 grid grid-cols-12 grid-rows-6 opacity-30 pointer-events-none">
                        {Array(72).fill(0).map((_, i) => (
                          <div key={i} className="border-t border-l border-slate-800"></div>
                        ))}
                      </div>
                      
                      {/* Compass background watermark */}
                      <Compass size={180} className="text-slate-900/60 absolute transform rotate-12 pointer-events-none" />

                      {/* Map Pins */}
                      {POIS.map(poi => {
                        const x = ((poi.lng - (-78.52)) / 0.015) * 100;
                        const y = (1 - (poi.lat - (-0.232)) / 0.02) * 100;
                        const isActive = selectedPoi.id === poi.id;
                        return (
                          <button
                            key={poi.id}
                            onClick={() => teleportToPoi(poi)}
                            style={{ left: `${x}%`, top: `${y}%` }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all"
                          >
                            <div className={`relative p-2 rounded-full border ${isActive ? 'bg-cyan-500 text-slate-950 border-cyan-300 pulse-marker scale-110 shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-rose-400 hover:text-rose-400'}`}>
                              <MapPin size={14} />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-slate-900 text-white font-bold text-[9px] px-2 py-0.5 rounded border border-slate-700 hidden group-hover:block whitespace-nowrap z-10 shadow-lg">
                                {poi.name}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {/* User Simulated GPS Position Dot */}
                      {(() => {
                        const x = ((simGps.lng - (-78.52)) / 0.015) * 100;
                        const y = (1 - (simGps.lat - (-0.232)) / 0.02) * 100;
                        return (
                          <div
                            style={{ left: `${x}%`, top: `${y}%` }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                          >
                            <span className="absolute w-5 h-5 bg-rose-500/30 rounded-full animate-ping"></span>
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full border border-white shadow-md"></span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Coordinates Simulator Slider Controls */}
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/80 flex flex-col gap-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-400">Coordenadas del Dispositivo Móvil</span>
                        <code className="text-cyan-400">Lat: {simGps.lat.toFixed(5)} , Lng: {simGps.lng.toFixed(5)}</code>
                      </div>
                      
                      <div className="flex gap-4 items-center">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">Ajuste Fino Latitud</label>
                          <input 
                            type="range" 
                            min="-0.232" 
                            max="-0.212" 
                            step="0.0001" 
                            className="w-full accent-rose-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                            value={simGps.lat}
                            onChange={e => setSimGps(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">Ajuste Fino Longitud</label>
                          <input 
                            type="range" 
                            min="-78.520" 
                            max="-78.505" 
                            step="0.0001" 
                            className="w-full accent-rose-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                            value={simGps.lng}
                            onChange={e => setSimGps(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 justify-between items-center mt-2 border-t border-slate-800 pt-3">
                        <div className="text-xs">
                          <span className="text-slate-500 block">Punto Seleccionado para Check-in:</span>
                          <strong className="text-slate-300 font-bold">{selectedPoi.name}</strong>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => teleportToPoi(selectedPoi)}
                            className="px-3 py-1.5 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <RefreshCw size={12} /> Teletransportar
                          </button>
                          <button 
                            onClick={handleCheckin}
                            className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 font-bold text-slate-950 rounded-lg text-xs flex items-center gap-1 transition-all shadow-md shadow-cyan-950/20 animate-bounce"
                          >
                            <ShieldCheck size={14} /> Enviar Check-in
                          </button>
                        </div>
                      </div>

                      {checkinStatus.msg && (
                        <div className={`mt-2 p-3 rounded-lg text-xs font-semibold flex gap-2 border ${
                          checkinStatus.type === 'pending' ? 'bg-slate-950/60 border-slate-800 text-slate-400' :
                          checkinStatus.type === 'success' ? 'bg-emerald-950/25 border-emerald-800 text-emerald-400' :
                          'bg-rose-950/25 border-rose-800 text-rose-400'
                        }`}>
                          <Sparkles size={14} className="shrink-0" />
                          <span>{checkinStatus.msg}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recommedations Box */}
                  <div className="glass-panel p-5">
                    <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2 text-rose-400"><Sparkles size={16} /> Recomendaciones Inteligentes (IA Engine)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.map((rec, i) => (
                        <div key={i} className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-col gap-2 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                          <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl bg-cyan-950/50 border-l border-b border-cyan-800/30 text-[8px] text-cyan-400 font-bold uppercase tracking-wider">{rec.category}</div>
                          <h4 className="font-bold text-xs text-slate-200">{rec.title}</h4>
                          <p className="text-[10px] text-slate-400 leading-normal">{rec.reason}</p>
                          <button 
                            onClick={() => {
                              const p = POIS.find(x => x.id === rec.poiId);
                              if (p) teleportToPoi(p);
                            }}
                            className="mt-1.5 text-left text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                          >
                            Ir al punto <ChevronRight size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Gamification & Coupons */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  
                  {/* Missions List */}
                  <div className="glass-panel p-5">
                    <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2 text-rose-400"><Award size={16} /> Misiones Activas</h3>
                    <div className="flex flex-col gap-3">
                      {missions.map(m => {
                        const isCompleted = user.completedMissions.includes(m.id);
                        return (
                          <div 
                            key={m.id} 
                            onClick={() => {
                              const p = POIS.find(x => x.id === m.poiId);
                              if (p) teleportToPoi(p);
                            }}
                            className={`p-3 rounded-xl border flex gap-3 transition-all cursor-pointer hover:bg-slate-900/40 ${isCompleted ? 'bg-emerald-950/10 border-emerald-950/80' : 'bg-slate-900/40 border-slate-800/60'}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                            ) : (
                              <Compass className="text-slate-500 shrink-0 mt-0.5" size={16} />
                            )}
                            <div>
                              <h4 className={`font-bold text-xs ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{m.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{m.description}</p>
                              <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] text-amber-400 font-bold">+{m.xpReward} XP</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Coupons Wallet */}
                  <div className="glass-panel p-5">
                    <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2 text-rose-400"><Gift size={16} /> Cartera de Cupones</h3>
                    {coupons.length === 0 ? (
                      <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center">
                        <QrCode className="mx-auto text-slate-600 mb-2" size={24} />
                        <p className="text-[10px] text-slate-500 italic">No tienes cupones. Completa check-ins para ganar descuentos.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {coupons.map((c, i) => (
                          <div key={i} className={`p-4 rounded-xl border relative overflow-hidden ${
                            c.status === 'REDEEMED' ? 'bg-slate-900/30 border-slate-800/40 opacity-60' : 'bg-gradient-to-br from-rose-950/20 to-slate-900 border-rose-950'
                          }`}>
                            <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl bg-rose-500/10 border-l border-b border-rose-500/20 text-[8px] text-rose-400 font-bold uppercase tracking-wider">
                              {c.status === 'ACTIVE' ? 'Activo' : 'Canjeado'}
                            </div>
                            <h4 className="font-bold text-xs text-slate-200">{c.partnerName}</h4>
                            <p className="text-[10px] text-slate-400 mt-1">{c.title}</p>
                            
                            <div className="mt-3 flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Código de Barra:</span>
                              <code className="text-xs text-rose-400 font-extrabold">{c.code}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              /* B2B ADMIN & MUNICIPIO TAB */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Panel: Event Creator */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  <div className="glass-panel p-5">
                    <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2 text-cyan-400"><Calendar size={16} /> Crear Evento Cultural</h3>
                    <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Título del Evento</label>
                        <input 
                          type="text" 
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:border-cyan-500 outline-none text-slate-200"
                          placeholder="Festival de Artesanías"
                          value={customEventForm.title}
                          onChange={e => setCustomEventForm({ ...customEventForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Ubicación (POI o Calle)</label>
                        <input 
                          type="text" 
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:border-cyan-500 outline-none text-slate-200"
                          placeholder="Calle La Ronda"
                          value={customEventForm.location}
                          onChange={e => setCustomEventForm({ ...customEventForm, location: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Categoría</label>
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:border-cyan-500 outline-none text-slate-200"
                          value={customEventForm.category}
                          onChange={e => setCustomEventForm({ ...customEventForm, category: e.target.value })}
                        >
                          <option value="GASTRONOMIA">Gastronomía</option>
                          <option value="HISTORIA">Historia</option>
                          <option value="ARTE">Arte</option>
                          <option value="MUSICA">Música</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Descripción</label>
                        <textarea 
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:border-cyan-500 outline-none text-slate-200 h-16 resize-none"
                          placeholder="Breve descripción del evento..."
                          value={customEventForm.description}
                          onChange={e => setCustomEventForm({ ...customEventForm, description: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 font-bold p-2.5 rounded-lg text-xs text-white transition-all shadow-md shadow-cyan-950/20 flex items-center justify-center gap-1">
                        <Send size={12} /> Publicar Evento
                      </button>
                    </form>
                  </div>

                  {/* List of active events */}
                  <div className="glass-panel p-5">
                    <h3 className="font-extrabold text-sm mb-3 text-cyan-400">Eventos Activos</h3>
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {events.map((evt, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[8px] text-cyan-400 font-bold">{evt.category}</span>
                            <span className="text-[8px] text-slate-500">{evt.date}</span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-300">{evt.title}</h4>
                          <span className="text-[10px] text-slate-500">📍 {evt.location}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Center Panel: B2B Charts Analytics Dashboard */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                  <div className="glass-panel p-6 flex flex-col gap-5">
                    <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2"><BarChart3 className="text-cyan-400" /> Analítica B2B y Tráfico de Visitas</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Check-ins Totales</span>
                        <div className="text-2xl font-extrabold text-cyan-400 mt-1">{analytics.totalCheckins}</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Cupones Canjeados</span>
                        <div className="text-2xl font-extrabold text-rose-500 mt-1">{analytics.totalRedeems}</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 col-span-2 md:col-span-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Tasa de Efectividad</span>
                        <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                          {analytics.totalCheckins ? Math.round((analytics.totalRedeems / analytics.totalCheckins) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* SVG Bar Chart for POIs visits */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-3">
                      <span className="text-xs font-semibold text-slate-400">Tráfico por Punto de Interés (POIs)</span>
                      
                      <div className="flex flex-col gap-3.5 py-2">
                        {Object.keys(analytics.poiCounts).map(poiKey => {
                          const count = analytics.poiCounts[poiKey];
                          const max = Math.max(...Object.values(analytics.poiCounts), 1);
                          const pct = (count / max) * 100;
                          return (
                            <div key={poiKey} className="flex items-center gap-3">
                              <span className="w-24 text-[10px] font-bold text-slate-400 truncate">{poiKey.replace('_', ' ').toUpperCase()}</span>
                              <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden">
                                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="w-6 text-[10px] font-extrabold text-slate-200 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SVG Line Chart representing hourly distribution */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-2">
                      <span className="text-xs font-semibold text-slate-400">Curva de Afluencia Horaria Peatonal</span>
                      
                      <div className="relative h-28 w-full flex items-end gap-1.5 pt-4">
                        {analytics.hourlyTraffic.slice(8, 20).map((count, i) => {
                          const hour = i + 8;
                          const max = Math.max(...analytics.hourlyTraffic, 1);
                          const hPct = (count / max) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                              <div className="w-full bg-cyan-600/20 hover:bg-cyan-500 rounded-t transition-all" style={{ height: `${Math.max(hPct, 5)}px` }}></div>
                              <span className="text-[8px] text-slate-500 font-bold">{hour}h</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Coupon Validator */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  <div className="glass-panel p-5">
                    <div className="text-center mb-4">
                      <QrCode className="mx-auto text-cyan-400 mb-2" size={28} />
                      <h3 className="font-extrabold text-sm text-slate-200">Validador de Cupones B2B</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ingresa el código alfanumérico para registrar el canje</p>
                    </div>

                    <form onSubmit={handleValidateCoupon} className="flex flex-col gap-3">
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center text-sm font-extrabold tracking-wider focus:border-cyan-500 outline-none text-slate-200 uppercase"
                        placeholder="QQ-SAN-1234"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value)}
                      />
                      <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 font-bold p-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1 text-white">
                        <Check size={14} /> Registrar Canje
                      </button>
                    </form>

                    {couponValResult.msg && (
                      <div className={`mt-3 p-3 rounded-lg text-[10px] font-bold flex gap-1.5 border ${
                        couponValResult.type === 'pending' ? 'bg-slate-950/60 border-slate-800 text-slate-500' :
                        couponValResult.type === 'success' ? 'bg-emerald-950/25 border-emerald-800 text-emerald-400' :
                        'bg-rose-950/25 border-rose-800 text-rose-400'
                      }`}>
                        {couponValResult.type === 'success' ? <CheckCircle2 size={12} className="shrink-0" /> : <AlertTriangle size={12} className="shrink-0" />}
                        <span>{couponValResult.msg}</span>
                      </div>
                    )}
                  </div>

                  {/* Leaderboard Table preview */}
                  <div className="glass-panel p-5">
                    <h3 className="font-extrabold text-sm mb-3 flex items-center gap-1.5 text-cyan-400"><Users size={16} /> Top Exploradores</h3>
                    <div className="flex flex-col gap-2">
                      {leaderboard.slice(0, 5).map((l, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/40 border border-slate-800/40 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              i === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                              'bg-slate-800 text-slate-500'
                            }`}>{i + 1}</span>
                            <span className="font-semibold text-slate-300">{l.username}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">{l.xp} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
