import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Activity, Thermometer, ShoppingCart, LogIn, User, CheckCircle, ChevronRight, ChevronLeft, Menu, X, Quote, ChevronDown, Trash2, Plus, Minus, QrCode, Download, ExternalLink, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';

// --- Types ---
interface CartItem {
  id: string;
  name: string;
  basePrice: number;
  quantity: number;
  image: string;
}

// --- Auth Hook ---
const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email signup failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return { user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout };
};

// --- Components ---

const Navbar = ({ user, onLogout, cartCount }: { user: FirebaseUser | null; onLogout: () => void; cartCount: number }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200 overflow-visible">
      <div className="max-w-7xl mx-auto px-6 md:px-16 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-100/50">
            <Activity className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-800">MedyCal</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          <a 
            href="/#features" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', '#features');
              }
            }}
            className="text-[13px] font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors"
          >
            Features
          </a>
          <a 
            href="/#product" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', '#product');
              }
            }}
            className="text-[13px] font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors"
          >
            Product
          </a>
          
          {user && (
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-[13px] font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
          )}
          
          <div className="h-6 w-px bg-slate-200" />

          <button 
            onClick={() => navigate('/cart')}
            className="relative p-2 text-slate-500 hover:text-teal-600 transition-colors group cursor-pointer"
          >
            <ShoppingCart size={20} className="stroke-[2.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-teal-200 ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <User size={12} className="text-teal-500" /> {user.email?.split('@')[0]}
              </span>
              <button 
                onClick={onLogout} 
                className="text-[13px] font-bold uppercase tracking-widest text-slate-800 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <a 
              href="/login" 
              className="px-8 py-3 bg-slate-900 text-white text-[13px] font-bold uppercase tracking-widest rounded-full hover:scale-105 hover:shadow-2xl hover:shadow-slate-300 active:scale-95 transition-all shadow-xl shadow-slate-200"
            >
              Login
            </a>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button 
            onClick={() => navigate('/cart')}
            className="relative p-2 text-slate-500"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button className="p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-xl"
          >
            <a href="/#features" className="block text-lg font-medium text-gray-800" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="/#product" className="block text-lg font-medium text-gray-800" onClick={() => setIsMenuOpen(false)}>Product</a>
            {user ? (
              <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full text-left text-lg font-medium text-red-600">Logout</button>
            ) : (
              <a href="/login" className="block text-lg font-medium text-teal-600" onClick={() => setIsMenuOpen(false)}>Login</a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => (
  <section className="relative pt-44 pb-24 px-16 overflow-hidden">
    {/* Artistic Background Element */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-100/30 rounded-full blur-[120px] -z-10"></div>
    
    <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 lg:items-center gap-20">
      <div className="space-y-10 text-center lg:text-left z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center px-4 py-1.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-full text-xs font-bold uppercase tracking-widest"
        >
          Smart Health Monitoring
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-7xl lg:text-[84px] font-extrabold text-slate-900 leading-[0.9] tracking-tighter"
        >
          Care for your <br />
          <span className="text-teal-500 italic font-serif">everyday</span> life.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-500 font-medium leading-relaxed max-w-md mx-auto lg:mx-0"
        >
          Clinical-grade monitoring in the comfort of your home. MedyCal is the all-in-one box for heart health, oxygen, and more.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start"
        >
          <a href="#product" className="px-10 py-5 bg-teal-600 text-white font-bold text-lg rounded-2xl hover:bg-teal-700 hover:scale-105 hover:shadow-2xl hover:shadow-teal-300 hover:-translate-y-1 transition-all shadow-2xl shadow-teal-200 active:scale-95">
            Buy Now — ₹4,000
          </a>
          
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-slate-${200 + i * 100}`} />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight pl-2">
              +2.4k happy users
            </span>
          </div>
        </motion.div>
      </div>
      <div className="relative flex justify-center lg:justify-end">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-[420px] aspect-square bg-white rounded-[60px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-white p-10 flex flex-col items-center justify-between relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:bg-teal-100 transition-colors"></div>
          
          <div className="w-full h-56 bg-slate-50 rounded-[40px] flex items-center justify-center shadow-inner relative overflow-hidden">
            <img
              src="https://lh3.googleusercontent.com/d/1eYD9a0X1R1kFyiWVFL8qNaHKPM4iEMiq"
              alt="MedyCal Device"
              className="w-48 h-auto mix-blend-multiply drop-shadow-xl group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-4 right-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
            </div>
          </div>
          
          <div className="text-center w-full mt-6">
            <h3 className="text-2xl font-black text-slate-800 mb-1">MedyCal Box v2</h3>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Matte Ceramic Finish</p>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const Features = () => {
  const items = [
    {
      icon: "❤️",
      title: "Heart Rate",
      tagline: "Real-time ECG Precision",
      bgColor: "bg-rose-100",
      textColor: "text-rose-600"
    },
    {
      icon: "🫁",
      title: "SpO2 Track",
      tagline: "Oxygenation Levels",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600"
    },
    {
      icon: "🌡️",
      title: "Temperature",
      tagline: "Infrared Accuracy",
      bgColor: "bg-amber-100",
      textColor: "text-amber-600"
    }
  ];

  return (
    <section id="features" className="py-24 px-16 bg-white border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {items.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 100 }}
            className="flex-1 bg-slate-50 rounded-3xl p-8 border border-slate-100 flex items-center gap-6 group hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.1)] hover:-translate-y-2 transition-all cursor-default"
          >
            <motion.div 
              whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
              className={`w-16 h-16 ${f.bgColor} rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-transform`}
            >
              {f.icon}
            </motion.div>
            <div>
              <h4 className="text-lg font-black text-slate-800 leading-tight">{f.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 whitespace-nowrap">{f.tagline}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const ImageCarousel = () => {
  const [index, setIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const images = [
    "https://lh3.googleusercontent.com/d/1XYWgTQlHr3nnHz4_tSbxlUK8LJKkY4Jn",
    "https://lh3.googleusercontent.com/d/1eYD9a0X1R1kFyiWVFL8qNaHKPM4iEMiq",
    "https://lh3.googleusercontent.com/d/1XYWgTQlHr3nnHz4_tSbxlUK8LJKkY4Jn"
  ];

  const next = () => { setIndex((prev) => (prev + 1) % images.length); setIsZoomed(false); };
  const prev = () => { setIndex((prev) => (prev - 1 + images.length) % images.length); setIsZoomed(false); };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div 
      className={`relative group w-full h-full flex items-center justify-center overflow-hidden transition-colors ${isZoomed ? 'cursor-zoom-out bg-slate-100/50' : 'cursor-zoom-in'}`}
      onMouseMove={handleMouseMove}
      onClick={() => setIsZoomed(!isZoomed)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="w-full h-full flex items-center justify-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          <motion.img
            src={images[index]}
            animate={{ 
              scale: isZoomed ? 2.5 : 1,
              x: isZoomed ? (50 - mousePos.x) * 0.8 : 0,
              y: isZoomed ? (50 - mousePos.y) * 0.8 : 0,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="max-w-[80%] h-auto drop-shadow-2xl z-10 pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>
      
      {!isZoomed && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-6 p-3 bg-white/80 backdrop-blur hover:bg-white rounded-full shadow-xl transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer"
          >
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-6 p-3 bg-white/80 backdrop-blur hover:bg-white rounded-full shadow-xl transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer"
          >
            <ChevronRight size={24} className="text-slate-800" />
          </button>
        </>
      )}

      <div className={`absolute bottom-8 flex gap-3 z-30 transition-opacity duration-300 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}>
        {images.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-teal-600 w-8' : 'bg-slate-300 w-1.5'}`} 
          />
        ))}
      </div>

      {isZoomed && (
        <div className="absolute top-6 left-6 z-30 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-teal-100">
          <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Move Mouse to Pan</span>
        </div>
      )}
    </div>
  );
};

const Testimonials = () => {
  const reviews = [
    {
      name: "Sarah Jenkins",
      role: "Fitness Enthusiast",
      text: "The precision of the MedyCal box is unmatched. I love how it tracks my recovery after high-intensity training sessions.",
      avatar: "SJ"
    },
    {
      name: "Dr. Robert Chen",
      role: "Cardiologist",
      text: "I recommend MedyCal to my patients for home monitoring. Its ease of use and sensor accuracy are truly impressive.",
      avatar: "RC"
    },
    {
      name: "Elena Rodriguez",
      role: "Wellness Coach",
      text: "The design fits perfectly into a modern home. It doesn't look like a medical device, which makes it much more approachable.",
      avatar: "ER"
    }
  ];

  return (
    <section className="py-32 px-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-600 mb-4 block">Our Community</span>
          <h2 className="text-5xl font-black text-slate-800 tracking-tighter">Trusted by Professionals</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              className="bg-slate-50 border border-slate-100 p-10 rounded-[40px] relative hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all group"
            >
              <Quote className="absolute top-8 right-8 text-teal-100 w-12 h-12 group-hover:text-teal-200 transition-colors" />
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8 relative z-10 italic">
                "{r.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                  {r.avatar}
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{r.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-8 flex items-center justify-between group cursor-pointer"
      >
        <span className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-teal-600 transition-colors text-left">{q}</span>
        <div className={`p-2 rounded-xl transition-all ${isOpen ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-slate-500 font-medium leading-relaxed text-lg max-w-3xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => (
  <section className="py-32 px-16 bg-slate-50 overflow-hidden">
    <div className="max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16 px-4"
      >
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-600 mb-4 block">Common Questions</span>
        <h2 className="text-5xl font-black text-slate-800 tracking-tighter">Support & Guidance</h2>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="bg-white rounded-[50px] p-12 shadow-sm border border-white"
      >
        <FAQItem 
          q="How accurate are the sensors?" 
          a="The MedyCal Box uses clinical-grade infrared sensors and advanced algorithms calibrated against standard hospital equipment to ensure ±0.1 precision for temperature and heart rate."
        />
        <FAQItem 
          q="Does it require a monthly subscription?" 
          a="Basic monitoring and device storage are free forever. We offer an optional 'Pro Analytics' subscription for advanced historical data mapping and family sharing."
        />
        <FAQItem 
          q="Is it portable for traveling?" 
          a="Absolutely. MedyCal is designed to be compact and lightweight, fitting easily into any travel bag. The battery lasts up to 7 days on a single charge."
        />
        <FAQItem 
          q="Is the MedyCal device FDA approved?" 
          a="We are currently in the final stages of the FDA 510(k) clearance process for our specific sensor array. We aim to have full clearance by Q4 2026."
        />
      </motion.div>
    </div>
  </section>
);

const Specifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const specs = [
    { label: "Dimensions", value: "85mm x 85mm x 25mm" },
    { label: "Weight", value: "145g (Ultra-Lightweight)" },
    { label: "Connectivity", value: "Bluetooth 5.2 & Wi-Fi 6" },
    { label: "Battery", value: "Lithium Polymer (7-Day Duration)" },
    { label: "Sensors", value: "Clinical-Grade Infrared Array" },
    { label: "Accuracy", value: "±0.1°C / ±1 BPM Precision" }
  ];

  return (
    <div className="mt-8 border-t border-slate-100 pt-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest hover:bg-teal-50 px-4 py-2 rounded-lg transition-colors cursor-pointer"
      >
        Technical Specifications 
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-6 px-2">
              {specs.map((s, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{s.label}</p>
                  <p className="text-xs font-bold text-slate-600">{s.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductSection = ({ onAddToCart }: { onAddToCart: () => void }) => (
  <section id="product" className="py-32 px-6 md:px-16 bg-slate-50 relative overflow-hidden">
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-100/20 rounded-full blur-[100px] -z-0"></div>
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-[60px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-white overflow-hidden flex flex-col lg:flex-row relative z-10">
        <div className="flex-1 bg-slate-50 flex items-center justify-center relative overflow-hidden h-[500px] lg:h-auto">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/50 rounded-bl-full -z-0"></div>
          <ImageCarousel />
        </div>
        <div className="flex-1 p-8 lg:p-24 flex flex-col justify-center bg-white">
          <div className="mb-10">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-600 mb-4 block">Premium Hardware</span>
            <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-4 leading-tight">MedyCal Box v2</h2>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-teal-600 font-black text-3xl tracking-tight">₹4,000</span>
              <span className="text-slate-300 line-through text-sm font-bold">₹5,000</span>
              <span className="bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">Save 20%</span>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed mb-10 text-lg">
              The flagship of smart diagnostics. Matte ceramic finish, clinical sensors, and encrypted cloud sync.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {['FDA Cleared Sensors', 'WiFi & Bluetooth Sync', '7-Day Battery Life', 'Compact Travel Case'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-tight">
                  <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center">
                    <CheckCircle className="text-teal-500 w-3 h-3" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
            
            <Specifications />
          </div>
          <button
            onClick={onAddToCart}
            className="w-full px-10 py-5 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-300 hover:-translate-y-0.5 transition-all shadow-2xl shadow-teal-200 flex items-center justify-center gap-4 group active:scale-95 cursor-pointer"
          >
            <ShoppingCart size={22} className="stroke-[2.5]" />
            <span className="text-lg">Add to Cart</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-white border-t border-slate-100">
    <div className="max-w-7xl mx-auto px-16">
      <div className="grid md:grid-cols-4 gap-16 py-20 px-4">
        <div className="col-span-1 md:col-span-2 space-y-8">
          <div className="flex items-center gap-3">
            <Activity className="text-teal-600 w-8 h-8 stroke-[3]" />
            <span className="text-3xl font-black tracking-tighter text-slate-800">MedyCal</span>
          </div>
          <p className="max-w-sm text-slate-500 font-medium leading-relaxed text-lg">
            Revolutionizing personal health monitoring through smart hardware and intuitive software designed for life.
          </p>
          <div className="flex gap-4">
            {['Certified Device', 'FDA Pending', 'Global Ship'].map((t) => (
              <span key={t} className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] border border-slate-100 px-3 py-1.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-slate-900 font-black uppercase tracking-widest text-xs mb-8">Platform</h4>
          <ul className="space-y-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
            <li><a href="#" className="hover:text-teal-600 transition-colors">Overview</a></li>
            <li><a href="#" className="hover:text-teal-600 transition-colors">Technology</a></li>
            <li><a href="#" className="hover:text-teal-600 transition-colors">Research</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-slate-900 font-black uppercase tracking-widest text-xs mb-8">Legal</h4>
          <ul className="space-y-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
            <li><a href="#" className="hover:text-teal-600 transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-teal-600 transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-teal-600 transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="py-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Designed by MedyCal Labs — 2026
        </span>
        <div className="flex gap-8 items-center">
           <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
           <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">System Status: Nominal</span>
        </div>
      </div>
    </div>
  </footer>
);

// --- Pages ---

const CartPage = ({ cart, onUpdateQty, onRemove, onCheckout, user, isProcessing }: { 
  cart: CartItem[]; 
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  user: FirebaseUser | null;
  isProcessing: boolean;
}) => {
  const subtotal = cart.reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 px-6 md:px-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-600 mb-2 block">Checkout Journey</span>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter">Your Shopping Cart</h1>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-full transition-all"
          >
            Continue Shopping
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-[50px] p-24 text-center border border-slate-100 shadow-sm">
            <ShoppingCart size={64} className="text-slate-100 mx-auto mb-8" />
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Your cart is empty</h2>
            <p className="text-slate-400 max-w-sm mx-auto mb-10 font-medium">Looks like you haven't added any products to your health suite yet.</p>
            <button 
              onClick={() => navigate('/')}
              className="px-10 py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 hover:scale-105 hover:shadow-2xl hover:shadow-teal-300 transition-all shadow-xl shadow-teal-100 transform active:scale-95"
            >
              Discover Products
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <motion.div 
                  layout
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-6 rounded-[35px] border border-slate-100 flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-100 transition-all"
                >
                  <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center p-2">
                    <img src={item.image} alt={item.name} className="max-w-full max-h-full mix-blend-multiply drop-shadow-md" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.name}</h3>
                    <p className="text-teal-600 font-bold text-sm mt-1">₹{item.basePrice.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <button 
                      onClick={() => onUpdateQty(item.id, -1)}
                      className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="w-4 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQty(item.id, 1)}
                      className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                  <button 
                    onClick={() => onRemove(item.id)}
                    className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl shadow-slate-100 sticky top-32">
                <h3 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-4">Order Summary</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="text-slate-800">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Shipping</span>
                    <span className="text-teal-600 tracking-widest uppercase text-[10px]">Free</span>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                    <span className="text-xl font-black text-slate-800 tracking-tight">Total</span>
                    <span className="text-2xl font-black text-teal-600 tracking-tight">₹{subtotal.toLocaleString()}</span>
                  </div>
                </div>

                {!user && (
                   <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                     <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest text-center leading-relaxed">
                       Please <a href="/login" className="underline font-black">Login</a> to complete your purchase securely.
                     </p>
                   </div>
                )}

                <button 
                  disabled={isProcessing || !user}
                  onClick={onCheckout}
                  className={`w-full py-5 font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98] cursor-pointer
                    ${user 
                      ? 'bg-teal-600 text-white shadow-teal-100 hover:bg-teal-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-300 hover:-translate-y-1' 
                      : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed opacity-50'}`}
                >
                  {isProcessing ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart size={20} className="stroke-[3]" />
                      <span className="text-lg">Checkout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewsSection = ({ productId, user }: { productId: string; user: FirebaseUser | null }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId)
      // Removed orderBy to avoid index requirement for new projects
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory to avoid Firestore Index requirement
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setReviews(data);
    }, (error) => {
      console.error("Firestore Error in Reviews:", error);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userEmail: user.email,
        rating,
        comment,
        productId,
        createdAt: serverTimestamp()
      });
      setRating(0);
      setComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reviews');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <section className="py-32 px-6 md:px-16 bg-white overflow-hidden border-t border-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-20">
          
          {/* Summary Column */}
          <div className="lg:w-1/3">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-600 mb-4 block">Feedback</span>
            <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-8 italic">Verified <br /> Experiences.</h2>
            
            <div className="bg-slate-50 p-10 rounded-[50px] border border-slate-100 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-6xl font-black text-slate-900 tracking-tighter">{avgRating}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-teal-600">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={16} fill={i <= Math.round(Number(avgRating)) ? "currentColor" : "none"} strokeWidth={3} />
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reviews.length} Total Reviews</p>
                </div>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed text-sm">
                Real feedback from the MedyCal community about the smart box v2.
              </p>
            </div>

            {user ? (
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-100/50">
                <h3 className="text-lg font-black text-slate-800 mb-6">Leave a review</h3>
                <div className="mb-6">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button 
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        className={`p-1 transition-all transform hover:scale-110 active:scale-90 ${rating >= i ? 'text-teal-600' : 'text-slate-200 hover:text-teal-200'}`}
                      >
                        <Star size={24} fill={rating >= i ? "currentColor" : "none"} strokeWidth={2.5} />
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest ml-1">Click to rate</p>
                </div>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  placeholder="Share your experience..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-medium h-32 resize-none mb-6"
                />
                <button 
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl hover:bg-teal-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-teal-100 disabled:opacity-50 disabled:grayscale"
                >
                  {isSubmitting ? "Posting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="bg-slate-900 p-10 rounded-[40px] text-white text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-4">Community Member?</p>
                <h4 className="text-lg font-bold mb-6">Join the conversation to share your thoughts</h4>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="px-8 py-3 bg-teal-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-500 transition-colors"
                >
                  Log In to Review
                </button>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:w-2/3">
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-[60px] border border-dashed border-slate-200">
                  <Star size={40} className="text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No reviews yet. Be the first!</p>
                </div>
              ) : (
                reviews.map((r, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={r.id} 
                    className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 font-black text-lg">
                          {r.userName?.[0].toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-lg leading-tight">{r.userName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <CheckCircle size={10} className="text-green-500" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-mono">Verified Care Member</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-black">{r.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed text-lg italic">"{r.comment}"</p>
                    <div className="mt-8 flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                        {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                       </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const LandingPage = ({ user, onAddToCart }: { user: FirebaseUser | null; onAddToCart: () => void }) => {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
      <ProductSection onAddToCart={onAddToCart} />
      <ReviewsSection productId="medycal-pro-v2" user={user} />
      <Testimonials />
      <FAQ />
    </div>
  );
};

const LoginPage = ({ onGoogleLogin, onEmailLogin, onEmailSignup, user }: { 
  onGoogleLogin: () => void; 
  onEmailLogin: (e: string, p: string) => Promise<void>;
  onEmailSignup: (e: string, p: string) => Promise<void>;
  user: FirebaseUser | null 
}) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignup) {
        await onEmailSignup(email, password);
      } else {
        await onEmailLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-32">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 md:p-14 rounded-[60px] shadow-[0_40px_80px_-20px_rgba(15,23,42,0.08)] border border-white"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-200">
            <Activity className="text-white w-8 h-8 stroke-[3]" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
            {isSignup ? "Create Account" : "Health Portal"}
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-4">
            {isSignup ? "Join the smart health movement" : "Secure Authentication"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-bold"
              placeholder="name@care.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-bold"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs font-bold text-red-500 px-1">{error}</p>}
          <button className="w-full py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-xl shadow-teal-100 hover:bg-teal-700 hover:scale-105 transition-all cursor-pointer active:scale-[0.98]">
            {isSignup ? "Register" : "Sign In"}
          </button>
        </form>

        <div className="relative flex items-center justify-center mb-8">
          <div className="w-full border-t border-slate-100"></div>
          <span className="absolute bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Or</span>
        </div>
        
        <button 
          onClick={onGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-4 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:scale-[1.02] hover:shadow-lg transition-all active:scale-[0.98] shadow-sm group cursor-pointer"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          <span className="text-sm">Continue with Google</span>
        </button>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsSignup(!isSignup); setError(null); }}
            className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-teal-600 transition-colors"
          >
            {isSignup ? "Already have an account? Log In" : "New to MedyCal? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const OrderConfirmedPage = () => (
  <div className="min-h-screen pt-32 pb-16 px-4 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full text-center p-12 bg-white rounded-[3rem] shadow-2xl border border-teal-50"
    >
      <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-teal-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
      <p className="text-gray-600 leading-relaxed mb-8">
        Thank you for choosing MedyCal. Your smart health journey starts now. Your order details have been saved to your dashboard.
      </p>
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="inline-block px-8 py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:scale-105 hover:-translate-y-1 transition-all"
        >
          Go to Dashboard
        </button>
        <a href="/" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-teal-600">
          Back to Home
        </a>
      </div>
    </motion.div>
  </div>
);

const PatientDashboard = ({ user }: { user: FirebaseUser | null }) => {
  const [userData, setUserData] = useState<any>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    };
    fetchUser();
  }, [user]);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `medycal-qr-${userData?.deviceId || user?.uid}.png`;
      link.click();
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left: Profile Info */}
          <div className="lg:w-2/3 w-full space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-12 rounded-[50px] shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                    {userData?.name || user.displayName || 'Patient'}
                  </h1>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
                    {userData?.role || 'Patient'} Account
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Email Address</label>
                    <p className="text-lg font-bold text-slate-800">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Patient ID</label>
                    <p className="text-sm font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">
                      {user.uid}
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Device ID</label>
                    <p className="text-lg font-black text-teal-600 tracking-tight">#{userData?.deviceId || 'GENERATING...'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Status</label>
                    <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Synced with Firebase
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-teal-600 p-12 rounded-[50px] shadow-2xl shadow-teal-200 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <h3 className="text-3xl font-black tracking-tight">Access Pro Features</h3>
                  <p className="text-teal-50/80 font-medium max-w-sm">
                    Connect your MedyCal Box to see your live health data, heart rate trends, and share reports with your doctor.
                  </p>
                  <button className="px-8 py-3 bg-white text-teal-600 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all">
                    Register Device
                  </button>
                </div>
                <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20">
                  <Activity className="w-16 h-16 stroke-[1.5]" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: QR Code */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-1/3 w-full bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 sticky top-32 flex flex-col items-center"
          >
            <div className="text-center mb-8">
              <QrCode size={32} className="text-teal-600 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Your Health ID</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Scan for Quick Access</p>
            </div>

            <div 
              ref={qrRef}
              className="p-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 mb-8 flex flex-col items-center justify-center group relative cursor-pointer"
              onClick={downloadQR}
            >
              <QRCodeCanvas 
                value={userData?.deviceId || user.uid} 
                size={180}
                level="H"
                includeMargin={false}
                className="mix-blend-multiply transition-transform group-hover:scale-110 duration-500"
              />
              <div className="absolute inset-0 bg-teal-600/0 group-hover:bg-teal-600/5 transition-colors rounded-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Download className="text-teal-600 bg-white p-3 rounded-full shadow-xl" />
              </div>
            </div>

            <button 
              onClick={downloadQR}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200"
            >
              <Download size={18} />
              <span>Download PNG</span>
            </button>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-6 text-center leading-relaxed">
              Stored securely on Firebase <br /> Clinical Registry #v2.4.1
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const navigate = useNavigate();

  // Sync user to Firestore
  useEffect(() => {
    if (user) {
      const syncUser = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            // Generate a random device ID for patient
            const randomId = 'MC-' + Math.floor(100000 + Math.random() * 900000);
            
            await setDoc(userRef, {
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Patient',
              email: user.email,
              role: 'patient',
              deviceId: randomId,
              purchaseStatus: false,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            });
            console.log("New user profile created in Firestore");
          } else {
            // Update last login
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
          }
        } catch (err) {
          console.error("User sync failed", err);
        }
      };
      syncUser();
    }
  }, [user]);

  // Load cart from Firestore
  useEffect(() => {
    if (user) {
      const loadCart = async () => {
        setCartLoading(true);
        try {
          const { getDocs, query, where } = await import('firebase/firestore');
          const cartRef = collection(db, 'carts');
          const q = query(cartRef, where("userId", "==", user.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            setCart(data.items || []);
          }
        } catch (err) {
          console.error("Failed to load cart", err);
        } finally {
          setCartLoading(false);
        }
      };
      loadCart();
    } else {
      setCart([]);
    }
  }, [user]);

  // Sync cart to Firestore
  useEffect(() => {
    if (user && cart.length >= 0) {
      const syncCart = async () => {
        try {
          const { getDocs, query, where, updateDoc, doc, setDoc } = await import('firebase/firestore');
          const cartRef = collection(db, 'carts');
          const q = query(cartRef, where("userId", "==", user.uid));
          const snap = await getDocs(q);
          
          if (snap.empty) {
            await addDoc(cartRef, {
              userId: user.uid,
              items: cart,
              updatedAt: serverTimestamp()
            });
          } else {
             const cartDoc = snap.docs[0];
             await updateDoc(doc(db, 'carts', cartDoc.id), {
               items: cart,
               updatedAt: serverTimestamp()
             });
          }
        } catch (err) {
          console.error("Cart sync failed", err);
        }
      };
      
      const timeoutId = setTimeout(syncCart, 1000); // Debounce sync
      return () => clearTimeout(timeoutId);
    }
  }, [cart, user]);

  const handleAddToCart = () => {
    const defaultProduct = {
      id: 'medycal-pro-v2',
      name: 'MedyCal Box v2',
      basePrice: 4000,
      image: "https://lh3.googleusercontent.com/d/1XYWgTQlHr3nnHz4_tSbxlUK8LJKkY4Jn",
      quantity: 1
    };

    setCart(prev => {
      const existing = prev.find(i => i.id === defaultProduct.id);
      if (existing) {
        return prev.map(i => i.id === defaultProduct.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, defaultProduct];
    });
    
    // Smooth scroll to top and navigate if needed, but let's just toast/alert-lite by going to cart
    navigate('/cart');
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const handleRemove = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckout = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const subtotal = cart.reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);
      
      // 1. Get Razorpay Key and create Order
      const [keyRes, orderRes] = await Promise.all([
        fetch("/api/razorpay/key"),
        fetch("/api/razorpay/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: subtotal })
        })
      ]);

      const { key } = await keyRes.json();
      const order = await orderRes.json();

      if (!order.id) throw new Error("Could not create Razorpay order");
      if (!key) throw new Error("Razorpay Key ID missing in server environment");

      // 2. Load Modal
      const options = {
        key, 
        amount: order.amount,
        currency: order.currency,
        name: "MedyCal Labs",
        description: "Order Checkout",
        order_id: order.id,
        handler: async (response: any) => {
          // 3. Verify Payment
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response)
          });
          const verifyData = await verifyRes.json();

          if (verifyData.status === "success") {
            // Update purchaseStatus in user document
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { purchaseStatus: true }, { merge: true });

            // Save order to Firestore
            for (const item of cart) {
              await addDoc(collection(db, 'orders'), {
                userId: user.uid,
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                amount: item.basePrice * item.quantity,
                status: 'completed',
                createdAt: serverTimestamp()
              });
            }
            setCart([]);
            navigate('/order-confirmed');
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#0d9488",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Checkout error:", error);
      alert("There was an error processing your checkout. Please ensure RAZORPAY_KEY_ID is set in the backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Activity className="text-teal-600 w-6 h-6" />
          </div>
        </div>
      </div>
    );
  }

  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="font-sans antialiased text-slate-900 selection:bg-teal-100 selection:text-teal-900 bg-slate-50">
      <Navbar user={user} onLogout={logout} cartCount={cartCount} />
      
      <Routes>
        <Route path="/" element={<LandingPage user={user} onAddToCart={handleAddToCart} />} />
        <Route 
          path="/login" 
          element={
            <LoginPage 
              onGoogleLogin={loginWithGoogle} 
              onEmailLogin={loginWithEmail}
              onEmailSignup={signupWithEmail}
              user={user} 
            />
          } 
        />
        <Route 
          path="/cart" 
          element={
            <CartPage 
              cart={cart} 
              onUpdateQty={handleUpdateQty} 
              onRemove={handleRemove} 
              onCheckout={handleCheckout} 
              user={user}
              isProcessing={isProcessing}
            />
          } 
        />
        <Route path="/order-confirmed" element={user ? <OrderConfirmedPage /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <PatientDashboard user={user} /> : <Navigate to="/login" />} />
      </Routes>

      <Footer />
    </div>
  );
}
