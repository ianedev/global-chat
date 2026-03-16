import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import api from '../api';
import io from 'socket.io-client';

// Custom Pulse Animation for the User Marker
const pulseStyle = `
  @keyframes sonar {
    0% { transform: scale(0.1); opacity: 1; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  .user-marker-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sonar {
    position: absolute;
    width: 20px;
    height: 20px;
    background: #0052FF;
    border-radius: 50%;
    animation: sonar 2s infinite;
  }
`;

// Precision Diamond Markers
const createMarker = (color, isUser = false) => new L.DivIcon({
  html: `
    <div class="user-marker-container">
      ${isUser ? '<div class="sonar"></div>' : ''}
      <div style="width: 10px; height: 10px; background: ${color}; border: 2px solid white; border-radius: 2px; transform: rotate(45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.1); z-index: 10;"></div>
    </div>`,
  className: 'custom-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const icons = {
  global: createMarker('#0f172a'), // Slate 900
  local: createMarker('#0052FF'),  // Precision Blue
  user: createMarker('#0052FF', true), 
};

const FlyToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { animate: true, duration: 1.5 });
  }, [position, map]);
  return null;
};

const MapDashboard = ({ user, onLogout }) => {
  const [position, setPosition] = useState(null);
  const [countryCode, setCountryCode] = useState(null);
  const [globalRoom, setGlobalRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const msgEndRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:3000');
    socketRef.current.on('new_message', (msg) => setMessages((p) => [...p, msg]));
    fetchRooms();
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setPosition([lat, lng]);
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const code = res.data.address?.country_code?.toUpperCase();
        if (code) {
          setCountryCode(code);
          const { data } = await api.get(`/rooms/global/${code}`);
          setGlobalRoom(data);
        }
      } catch (err) { console.error(err); }
    }, () => setPosition([48.8566, 2.3522]));
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchRooms = async () => {
    const { data } = await api.get('/rooms');
    setRooms(data);
  };

  const joinRoom = async (room) => {
    setActiveRoom(room);
    setMessages([]);
    socketRef.current?.emit('join_room', room.id);
    const { data } = await api.get(`/rooms/${room.id}/messages`);
    setMessages(data);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;
    socketRef.current?.emit('send_message', { room_id: activeRoom.id, sender_id: user.id, content: newMessage });
    setNewMessage('');
  };

  return (
    <div className="relative h-screen w-screen bg-[#fafafa] overflow-hidden font-sans text-slate-900 selection:bg-blue-100">
      <style>{pulseStyle}</style>
      
      {/* MAP LAYER: Positron (Muted) */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[20, 0]} zoom={3} zoomControl={false} className="h-full w-full">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {position && <FlyToLocation position={position} />}
          {position && <Marker position={position} icon={icons.user} />}
          {rooms.map((room) => (
            room.lat && room.lng && (
              <Marker 
                key={room.id} 
                position={[room.lat, room.lng]} 
                icon={room.type === 'global' ? icons.global : icons.local}
                eventHandlers={{ click: () => joinRoom(room) }}
              />
            )
          ))}
        </MapContainer>
      </div>

      {/* CHAT PANEL: Golden Ratio Width (324px approx) */}
      {activeRoom && (
        <div className="absolute left-6 top-6 bottom-6 w-[324px] z-[1000] flex flex-col bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-xl overflow-hidden transition-all duration-500 animate-in slide-in-from-left-8">
          <div className="p-5 flex items-center justify-between border-b border-slate-200/50">
            <div>
              <h2 className="text-[13px] font-black uppercase tracking-tight">{activeRoom.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeRoom.type}</span>
              </div>
            </div>
            <button onClick={() => setActiveRoom(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
              <i className="ri-close-line text-slate-400 text-lg"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === user.id;
              return (
                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start animate-in fade-in slide-in-from-bottom-2'}`}>
                  {!isMe && <span className="text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase">{msg.sender?.username}</span>}
                  <div className={`px-3.5 py-2 rounded-lg text-[13px] max-w-[85%] leading-relaxed ${
                    isMe ? 'bg-slate-900 text-white shadow-md' : 'bg-white/50 border border-slate-200/50 text-slate-700'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={msgEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-white/30 border-t border-slate-200/50">
            <div className="flex items-center gap-2 bg-white/80 border border-slate-200 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message..."
                className="flex-1 py-2 text-[13px] bg-transparent outline-none"
              />
              <button type="submit" className="text-blue-600 hover:scale-110 transition-transform disabled:opacity-30">
                <i className="ri-send-plane-2-fill text-lg"></i>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TOP RIGHT NAVIGATION */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3 items-end">
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xl px-4 py-2 border border-white/50 rounded-xl shadow-lg">
          <div className="text-right">
            <p className="text-[11px] font-black uppercase text-slate-900 leading-none">{user.username}</p>
            <p className="text-[9px] text-blue-600 font-bold uppercase tracking-tighter">Verified System</p>
          </div>
          <div className="w-[1px] h-4 bg-slate-200" />
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors">
            <i className="ri-logout-box-r-line text-lg"></i>
          </button>
        </div>

        {/* COMPACT ACTIONS */}
        <div className="flex flex-col gap-2">
            {globalRoom && (
                <button onClick={() => joinRoom(globalRoom)} className="h-10 px-4 bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm flex items-center gap-3 hover:bg-slate-900 hover:text-white transition-all group">
                   <i className="ri-global-line text-blue-600 group-hover:text-white"></i>
                   <span className="text-[11px] font-black uppercase tracking-widest">{countryCode}</span>
                </button>
            )}
            <button onClick={() => setShowCreateModal(true)} className="w-12 h-12 bg-blue-600 text-white rounded-xl shadow-xl shadow-blue-500/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                <i className="ri-add-line text-2xl"></i>
            </button>
        </div>
      </div>

      {/* MINIMAL MODAL */}
      {showCreateModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/10 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-[300px] bg-white border border-slate-200 rounded-xl p-8 shadow-2xl scale-in-95 animate-in">
            <div className="mb-6 text-center">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <i className="ri-map-pin-2-line text-xl"></i>
                </div>
                <h2 className="text-[14px] font-black uppercase tracking-tight">Drop Signal</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); /* handle creation */ setShowCreateModal(false); }} className="space-y-4">
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                placeholder="Signal Name" 
                required
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white text-[11px] font-bold rounded-lg uppercase tracking-widest hover:bg-black transition-all">Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapDashboard;