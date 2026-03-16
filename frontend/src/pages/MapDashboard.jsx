import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import api from '../api';
import io from 'socket.io-client';

// 1. UPDATED CSS: Mobile-first responsiveness + Logout visibility
const customStyles = `
  @keyframes scan {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 0.05; }
    100% { transform: translateY(100%); opacity: 0; }
  }
  @keyframes hover {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .map-scanner {
    position: absolute; inset: 0; z-index: 400; pointer-events: none;
    background: linear-gradient(to bottom, transparent, rgba(0, 82, 255, 0.08), transparent);
    height: 120px; width: 100%; animation: scan 6s linear infinite;
  }
  .beacon-container { display: flex; flex-direction: column; align-items: center; }
  .beacon-head { filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15)); animation: hover 3s ease-in-out infinite; z-index: 2; }
  .diamond { width: 10px; height: 10px; border: 2px solid white; border-radius: 2px; transform: rotate(45deg); }
  .flag-circle { width: 22px; height: 22px; border: 2px solid white; border-radius: 50%; overflow: hidden; background: #eee; display: flex; align-items: center; justify-content: center; }
  .flag-circle img { width: 100%; height: 100%; object-fit: cover; }
  .beacon-stem { width: 1px; height: 14px; background: linear-gradient(to bottom, white, transparent); margin-top: -2px; z-index: 1; opacity: 0.8; }
  .beacon-shadow { width: 8px; height: 3px; background: rgba(0,0,0,0.2); border-radius: 50%; margin-top: 1px; filter: blur(1px); }
  
  /* Hide scrollbars but allow scrolling */
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`;

// 2. CUSTOM ZOOM COMPONENT
const MapControls = () => {
  const map = useMap();
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
      <div className="flex flex-col bg-white/80 backdrop-blur-xl border border-white/50 rounded-lg shadow-xl overflow-hidden">
        <button 
          onClick={() => map.zoomIn()}
          className="h-10 w-10 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all border-b border-slate-100"
        >
          <i className="ri-add-line text-lg"></i>
        </button>
        <button 
          onClick={() => map.zoomOut()}
          className="h-10 w-10 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
        >
          <i className="ri-subtract-line text-lg"></i>
        </button>
      </div>
      <button 
        onClick={() => map.locate()}
        className="h-10 w-10 bg-white/80 backdrop-blur-xl border border-white/50 rounded-lg shadow-xl flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
      >
        <i className="ri-focus-3-line text-lg"></i>
      </button>
    </div>
  );
};

const createBeacon = (type, countryCode = null) => {
  const isGlobal = type === 'global';
  const flagUrl = isGlobal ? `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png` : '';
  return new L.DivIcon({
    html: `<div class="beacon-container"><div class="beacon-head">${isGlobal ? `<div class="flag-circle"><img src="${flagUrl}" /></div>` : `<div class="diamond" style="background: #0052FF"></div>`}</div><div class="beacon-stem"></div><div class="beacon-shadow"></div></div>`,
    className: 'custom-beacon',
    iconSize: [24, 40],
    iconAnchor: [12, 38],
  });
};

const MapDashboard = ({ user, onLogout }) => {
  const [position, setPosition] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    socketRef.current = io(socketUrl);
    
    socketRef.current.on('new_message', (msg) => {
      setMessages((p) => [...p, msg]);
    });

    api.get('/rooms').then(({ data }) => setRooms(data));
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition([pos.coords.latitude, pos.coords.longitude]);
    });

    return () => socketRef.current?.disconnect();
  }, []);

  // Handle room joining
  useEffect(() => {
    if (activeRoom && socketRef.current) {
      setMessages([]); // Clear messages when switching rooms
      socketRef.current.emit('join_room', activeRoom.id);
      
      // Fetch history
      api.get(`/rooms/${activeRoom.id}/messages`).then(({ data }) => {
        setMessages(data);
      });
    }
  }, [activeRoom]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;

    const messageData = {
      room_id: activeRoom.id,
      sender_id: user.id,
      content: input,
    };

    socketRef.current.emit('send_message', messageData);
    setInput('');
  };

  return (
    <div className="relative h-screen w-screen bg-[#fafafa] overflow-hidden font-sans text-slate-900 antialiased">
      <style>{customStyles}</style>
      
      <div className="map-scanner" />

      {/* THE MAP */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[20, 0]} zoom={3} zoomControl={false} className="h-full w-full">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <MapControls />
          {position && <Marker position={position} icon={createBeacon('local')} />}
          {rooms.map((room) => (
            room.lat && room.lng && (
              <Marker 
                key={room.id} 
                position={[room.lat, room.lng]} 
                icon={createBeacon(room.type, room.country_code)}
                eventHandlers={{ click: () => setActiveRoom(room) }}
              />
            )
          ))}
        </MapContainer>
      </div>

      {/* STATUS HEADER - Responsive text */}
      <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 md:gap-6 px-4 py-2 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-full shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Live</span>
        </div>
        <div className="w-[1px] h-3 bg-slate-200" />
        <span className="text-[10px] md:text-[11px] font-bold text-slate-600 truncate max-w-[120px] md:max-w-none">
            {user.username.toLowerCase()}
        </span>
      </div>

      {/* CHAT PANEL - Mobile Bottom Sheet / Desktop Sidebar */}
      {activeRoom && (
        <div className="absolute bottom-24 left-4 right-4 md:right-auto md:top-6 md:bottom-32 md:w-[320px] z-[1000] flex flex-col bg-white/80 backdrop-blur-3xl border border-white shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-left-10 duration-500 max-h-[60vh] md:max-h-none">
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <div>
              <h2 className="text-[12px] font-black uppercase tracking-tight">{activeRoom.name}</h2>
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Active Signal</p>
            </div>
            <button onClick={() => setActiveRoom(null)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
              <i className="ri-close-line text-lg text-slate-400"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                <div className="flex flex-col gap-0.5 max-w-[85%]">
                  <span className="text-[9px] font-bold text-slate-400 px-1">{msg.sender?.username || 'System'}</span>
                  <div className={`px-3 py-2 rounded-xl text-[13px] shadow-sm ${
                    msg.sender_id === user.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="p-3 bg-slate-50/50 border-t border-slate-100">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1 shadow-inner">
              <input 
                className="flex-1 bg-transparent border-none text-[13px] py-2 focus:outline-none" 
                placeholder="Transmit..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="text-blue-600"><i className="ri-send-plane-2-fill text-lg"></i></button>
            </div>
          </form>
        </div>
      )}

      {/* COMMAND DOCK - Bottom Center */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1 p-1.5 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
        <button className="h-10 w-10 md:h-11 md:w-11 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <i className="ri-compass-3-line text-lg md:text-xl"></i>
        </button>
        <div className="w-[1px] h-5 bg-white/10 mx-1" />
        <button className="h-10 px-4 md:h-11 md:px-6 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
            <i className="ri-broadcast-line text-base md:text-lg"></i>
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Broadcast</span>
        </button>
        <div className="w-[1px] h-5 bg-white/10 mx-1" />
        {/* IMPROVED LOGOUT BUTTON */}
        <button 
            onClick={onLogout} 
            className="h-10 w-10 md:h-11 md:w-11 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
            title="Logout"
        >
            <i className="ri-logout-circle-r-line text-lg md:text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default MapDashboard;