import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, Package, Plus, Search, Settings, Home, MapPin, Clock, DollarSign, ChevronLeft, ChevronRight, X, Check, Edit2, Trash2, Share2, Download, Sun, Moon, CloudSnow, Flame, Coffee, Tent, Car, Heart, Music, Star, Filter, Bell, History, Menu, LogOut, User, Camera, Send } from 'lucide-react';

// ==================== STORAGE UTILITIES ====================
const STORAGE_KEYS = {
  EVENTS: 'kashta_events',
  GLOBAL_ITEMS: 'kashta_global_items',
  PARTICIPANTS: 'kashta_participants',
  LOGS: 'kashta_logs',
  USER: 'kashta_user'
};

const saveToStorage = async (key, data) => {
  try {
    await window.storage.set(key, JSON.stringify(data));
    return true;
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  }
};

const loadFromStorage = async (key, defaultValue) => {
  try {
    const result = await window.storage.get(key);
    return result ? JSON.parse(result.value) : defaultValue;
  } catch (e) {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  }
};

// ==================== DEFAULT DATA ====================
const DEFAULT_CATEGORIES = [
  {
    id: 'coffee',
    name: 'القهوة والدلة',
    icon: 'coffee',
    color: '#8B4513',
    items: [
      { id: 'c1', name: 'دلة عربية', description: 'للقهوة السعودية', common: true },
      { id: 'c2', name: 'فناجين قهوة', description: 'طقم 12 فنجان', common: true },
      { id: 'c3', name: 'قهوة عربية مطحونة', description: 'مع الهيل والزعفران', common: true },
      { id: 'c4', name: 'ترمس حافظ للحرارة', description: 'سعة 2 لتر', common: true },
      { id: 'c5', name: 'تمر سكري', description: 'للضيافة', common: true },
      { id: 'c6', name: 'محماسة القهوة', description: 'للتحميص الطازج', common: false },
    ]
  },
  {
    id: 'grilling',
    name: 'الشوي واللحم',
    icon: 'flame',
    color: '#DC2626',
    items: [
      { id: 'g1', name: 'شواية فحم كبيرة', description: 'حجم عائلي', common: true },
      { id: 'g2', name: 'فحم طبيعي', description: 'كيس 10 كيلو', common: true },
      { id: 'g3', name: 'أسياخ شوي ستيل', description: 'طقم 20 سيخ', common: true },
      { id: 'g4', name: 'لحم غنم طازج', description: 'للشوي والكبسة', common: true },
      { id: 'g5', name: 'دجاج مشوي', description: 'مع البهارات', common: true },
      { id: 'g6', name: 'ملقط وسكاكين', description: 'أدوات الشوي', common: true },
      { id: 'g7', name: 'صحون وملاعق بلاستيك', description: 'للاستخدام الواحد', common: true },
    ]
  },
  {
    id: 'camping',
    name: 'الخيام والفرش',
    icon: 'tent',
    color: '#059669',
    items: [
      { id: 't1', name: 'خيمة كبيرة', description: 'تتسع 8 أشخاص', common: true },
      { id: 't2', name: 'بساط أرضي', description: 'مقاوم للرطوبة', common: true },
      { id: 't3', name: 'فرش جلوس عربي', description: 'مجلس متكامل', common: true },
      { id: 't4', name: 'مساند ظهر', description: 'طقم 6 قطع', common: true },
      { id: 't5', name: 'أعمدة الخيمة', description: 'معدنية قوية', common: true },
      { id: 't6', name: 'حبال وأوتاد', description: 'لتثبيت الخيمة', common: true },
    ]
  },
  {
    id: 'winter',
    name: 'مستلزمات الشتاء',
    icon: 'snowflake',
    color: '#0EA5E9',
    items: [
      { id: 'w1', name: 'دفاية غاز', description: 'للتدفئة الداخلية', common: true },
      { id: 'w2', name: 'أسطوانة غاز صغيرة', description: 'للدفاية', common: true },
      { id: 'w3', name: 'بطانيات صوف', description: 'طقم 4 قطع', common: true },
      { id: 'w4', name: 'جاكيتات شتوية', description: 'للجميع', common: false },
      { id: 'w5', name: 'قفازات وطواقي', description: 'للبرد الشديد', common: false },
      { id: 'w6', name: 'حطب للنار', description: 'حزمة كبيرة', common: true },
    ]
  },
  {
    id: 'lighting',
    name: 'الإضاءة',
    icon: 'sun',
    color: '#F59E0B',
    items: [
      { id: 'l1', name: 'فانوس LED', description: 'قابل للشحن', common: true },
      { id: 'l2', name: 'إضاءة زينة', description: 'سلسلة أضواء', common: true },
      { id: 'l3', name: 'كشاف يدوي قوي', description: '1000 لومن', common: true },
      { id: 'l4', name: 'شموع معطرة', description: 'للأجواء', common: false },
      { id: 'l5', name: 'بطاريات احتياطية', description: 'أحجام مختلفة', common: true },
    ]
  },
  {
    id: 'transport',
    name: 'النقل والسيارات',
    icon: 'car',
    color: '#6366F1',
    items: [
      { id: 'tr1', name: 'سيارة دفع رباعي', description: 'للطرق الوعرة', common: true },
      { id: 'tr2', name: 'مضخة هواء', description: 'للإطارات', common: true },
      { id: 'tr3', name: 'حبل سحب', description: 'للطوارئ', common: true },
      { id: 'tr4', name: 'عدة طوارئ سيارة', description: 'كاملة', common: true },
      { id: 'tr5', name: 'جالونات وقود احتياطي', description: '20 لتر', common: false },
      { id: 'tr6', name: 'ثلاجة سيارة', description: 'للمشروبات', common: true },
    ]
  },
  {
    id: 'health',
    name: 'الصحة والسلامة',
    icon: 'heart',
    color: '#EC4899',
    items: [
      { id: 'h1', name: 'صندوق إسعافات أولية', description: 'متكامل', common: true },
      { id: 'h2', name: 'أدوية أساسية', description: 'مسكنات وغيرها', common: true },
      { id: 'h3', name: 'واقي شمس', description: 'SPF 50', common: true },
      { id: 'h4', name: 'مطفأة حريق صغيرة', description: 'للسلامة', common: true },
      { id: 'h5', name: 'مياه شرب', description: 'جالونات كافية', common: true },
      { id: 'h6', name: 'كريم مرطب', description: 'للجفاف', common: false },
    ]
  },
  {
    id: 'entertainment',
    name: 'الترفيه والألعاب',
    icon: 'music',
    color: '#8B5CF6',
    items: [
      { id: 'e1', name: 'سماعة بلوتوث', description: 'للموسيقى', common: true },
      { id: 'e2', name: 'ورق لعب (بلوت)', description: 'للسمر', common: true },
      { id: 'e3', name: 'كرة قدم', description: 'للشباب', common: true },
      { id: 'e4', name: 'تلسكوب صغير', description: 'لمشاهدة النجوم', common: false },
      { id: 'e5', name: 'عود موسيقي', description: 'للطرب', common: false },
      { id: 'e6', name: 'كتب وقصص', description: 'للقراءة الليلية', common: false },
    ]
  }
];

const DEFAULT_PARTICIPANTS = [
  { id: 'p1', name: 'أبو محمد', phone: '0501234567', avatar: '👨‍🦱', trips: 12 },
  { id: 'p2', name: 'أبو عبدالله', phone: '0557654321', avatar: '👨‍🦳', trips: 8 },
  { id: 'p3', name: 'أبو سعود', phone: '0509876543', avatar: '👨', trips: 15 },
  { id: 'p4', name: 'أبو فهد', phone: '0551112222', avatar: '🧔', trips: 6 },
  { id: 'p5', name: 'أبو خالد', phone: '0503334444', avatar: '👴', trips: 20 },
];

// ==================== UTILITY FUNCTIONS ====================
const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (date) => {
  return new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

const formatHijriDate = (date) => {
  return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));
};

const getWeatherEmoji = (temp) => {
  if (temp < 15) return '❄️';
  if (temp < 25) return '🌤️';
  return '☀️';
};

const getCategoryIcon = (iconName) => {
  const icons = {
    coffee: Coffee,
    flame: Flame,
    tent: Tent,
    snowflake: CloudSnow,
    sun: Sun,
    car: Car,
    heart: Heart,
    music: Music
  };
  return icons[iconName] || Package;
};

// ==================== MAIN APP COMPONENT ====================
export default function KashtaApp() {
  // State Management
  const [currentView, setCurrentView] = useState('home');
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [participants, setParticipants] = useState(DEFAULT_PARTICIPANTS);
  const [logs, setLogs] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [showNewParticipantModal, setShowNewParticipantModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [loadedEvents, loadedCategories, loadedParticipants, loadedLogs] = await Promise.all([
        loadFromStorage(STORAGE_KEYS.EVENTS, []),
        loadFromStorage(STORAGE_KEYS.GLOBAL_ITEMS, DEFAULT_CATEGORIES),
        loadFromStorage(STORAGE_KEYS.PARTICIPANTS, DEFAULT_PARTICIPANTS),
        loadFromStorage(STORAGE_KEYS.LOGS, [])
      ]);
      setEvents(loadedEvents);
      setCategories(loadedCategories);
      setParticipants(loadedParticipants);
      setLogs(loadedLogs);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Save data when changed
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.EVENTS, events);
    }
  }, [events, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.GLOBAL_ITEMS, categories);
    }
  }, [categories, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.PARTICIPANTS, participants);
    }
  }, [participants, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.LOGS, logs);
    }
  }, [logs, isLoading]);

  // Logging function
  const addLog = (action, details) => {
    const newLog = {
      id: generateId(),
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 500));
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Event Management
  const createEvent = (eventData) => {
    const newEvent = {
      id: generateId(),
      ...eventData,
      createdAt: new Date().toISOString(),
      items: [],
      contributions: []
    };
    setEvents(prev => [newEvent, ...prev]);
    addLog('إنشاء طلعة', `تم إنشاء طلعة "${eventData.title}"`);
    showNotification('تم إنشاء الطلعة بنجاح! 🎉');
    setShowNewEventModal(false);
    setSelectedEvent(newEvent);
    setCurrentView('event');
  };

  const updateEvent = (eventId, updates) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
    addLog('تحديث طلعة', `تم تحديث الطلعة`);
  };

  const deleteEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
    addLog('حذف طلعة', `تم حذف طلعة "${event?.title}"`);
    showNotification('تم حذف الطلعة');
    setSelectedEvent(null);
    setCurrentView('home');
  };

  const addItemToEvent = (eventId, categoryId, item, contributorId, cost = 0) => {
    const newContribution = {
      id: generateId(),
      categoryId,
      itemId: item.id,
      itemName: item.name,
      contributorId,
      cost: parseFloat(cost) || 0,
      addedAt: new Date().toISOString()
    };
    
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          contributions: [...(e.contributions || []), newContribution]
        };
      }
      return e;
    }));
    
    const contributor = participants.find(p => p.id === contributorId);
    addLog('إضافة مساهمة', `أضاف ${contributor?.name} "${item.name}"`);
    showNotification(`تمت إضافة "${item.name}" ✓`);
  };

  const removeContribution = (eventId, contributionId) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          contributions: e.contributions.filter(c => c.id !== contributionId)
        };
      }
      return e;
    }));
    addLog('إزالة مساهمة', 'تمت إزالة مساهمة');
  };

  // Category & Item Management
  const addNewItem = (categoryId, itemData) => {
    const newItem = {
      id: generateId(),
      ...itemData,
      common: false,
      addedAt: new Date().toISOString()
    };
    
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, items: [...cat.items, newItem] };
      }
      return cat;
    }));
    
    addLog('إضافة غرض جديد', `تمت إضافة "${itemData.name}" إلى المكتبة`);
    showNotification(`تمت إضافة "${itemData.name}" إلى المكتبة العامة 📦`);
    setShowNewItemModal(false);
  };

  const addNewCategory = (categoryData) => {
    const newCategory = {
      id: generateId(),
      ...categoryData,
      items: []
    };
    setCategories(prev => [...prev, newCategory]);
    addLog('إضافة تصنيف', `تم إضافة تصنيف "${categoryData.name}"`);
    showNotification(`تم إضافة تصنيف "${categoryData.name}" 📁`);
  };

  // Participant Management
  const addParticipant = (participantData) => {
    const newParticipant = {
      id: generateId(),
      ...participantData,
      trips: 0,
      joinedAt: new Date().toISOString()
    };
    setParticipants(prev => [...prev, newParticipant]);
    addLog('إضافة مشارك', `تمت إضافة "${participantData.name}"`);
    showNotification(`مرحباً بـ ${participantData.name}! 👋`);
    setShowNewParticipantModal(false);
  };

  const addParticipantToEvent = (eventId, participantId) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const currentParticipants = e.participants || [];
        if (!currentParticipants.includes(participantId)) {
          return { ...e, participants: [...currentParticipants, participantId] };
        }
      }
      return e;
    }));
  };

  const removeParticipantFromEvent = (eventId, participantId) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          participants: (e.participants || []).filter(p => p !== participantId)
        };
      }
      return e;
    }));
  };

  // Calculate costs
  const calculateEventCosts = (event) => {
    if (!event?.contributions) return { total: 0, perPerson: 0, byParticipant: {} };
    
    const total = event.contributions.reduce((sum, c) => sum + (c.cost || 0), 0);
    const participantCount = (event.participants || []).length || 1;
    const perPerson = total / participantCount;
    
    const byParticipant = {};
    event.contributions.forEach(c => {
      if (!byParticipant[c.contributorId]) {
        byParticipant[c.contributorId] = 0;
      }
      byParticipant[c.contributorId] += c.cost || 0;
    });
    
    return { total, perPerson, byParticipant };
  };

  // Export event as text
  const exportEvent = (event) => {
    const costs = calculateEventCosts(event);
    let text = `🏕️ ${event.title}\n`;
    text += `📅 ${formatDate(event.date)}\n`;
    text += `📍 ${event.location || 'لم يحدد'}\n\n`;
    
    text += `👥 المشاركون:\n`;
    (event.participants || []).forEach(pId => {
      const p = participants.find(p => p.id === pId);
      if (p) text += `• ${p.name}\n`;
    });
    
    text += `\n📦 المستلزمات:\n`;
    categories.forEach(cat => {
      const catContributions = (event.contributions || []).filter(c => c.categoryId === cat.id);
      if (catContributions.length > 0) {
        text += `\n${cat.name}:\n`;
        catContributions.forEach(c => {
          const contributor = participants.find(p => p.id === c.contributorId);
          text += `• ${c.itemName} - ${contributor?.name || 'غير محدد'}`;
          if (c.cost > 0) text += ` (${c.cost} ريال)`;
          text += `\n`;
        });
      }
    });
    
    text += `\n💰 التكاليف:\n`;
    text += `المجموع: ${costs.total} ريال\n`;
    text += `للشخص: ${costs.perPerson.toFixed(0)} ريال\n`;
    
    return text;
  };

  const shareEvent = async (event) => {
    const text = exportEvent(event);
    try {
      await navigator.clipboard.writeText(text);
      showNotification('تم نسخ تفاصيل الطلعة! 📋');
    } catch (e) {
      showNotification('حدث خطأ في النسخ', 'error');
    }
  };

  // ==================== RENDER COMPONENTS ====================
  
  // Loading Screen
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-icon">🏕️</div>
          <div className="loading-text">جاري التحميل...</div>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  // Notification Component
  const NotificationBanner = () => {
    if (!notification) return null;
    return (
      <div className={`notification ${notification.type}`}>
        <span>{notification.message}</span>
        <button onClick={() => setNotification(null)}>
          <X size={16} />
        </button>
      </div>
    );
  };

  // Sidebar Component
  const Sidebar = () => (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🏕️</span>
          <span className="logo-text">كشتة</span>
        </div>
        <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
          <X size={24} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => { setCurrentView('home'); setSidebarOpen(false); }}
        >
          <Home size={20} />
          <span>الرئيسية</span>
        </button>
        
        <button 
          className={`nav-item ${currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => { setCurrentView('calendar'); setSidebarOpen(false); }}
        >
          <Calendar size={20} />
          <span>التقويم</span>
        </button>
        
        <button 
          className={`nav-item ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => { setCurrentView('library'); setSidebarOpen(false); }}
        >
          <Package size={20} />
          <span>مكتبة الأغراض</span>
        </button>
        
        <button 
          className={`nav-item ${currentView === 'participants' ? 'active' : ''}`}
          onClick={() => { setCurrentView('participants'); setSidebarOpen(false); }}
        >
          <Users size={20} />
          <span>المشاركون</span>
        </button>
        
        <button 
          className={`nav-item ${currentView === 'history' ? 'active' : ''}`}
          onClick={() => { setCurrentView('history'); setSidebarOpen(false); }}
        >
          <History size={20} />
          <span>السجل</span>
        </button>
      </nav>
      
      <div className="sidebar-footer">
        <div className="weather-widget">
          <div className="weather-icon">🌙</div>
          <div className="weather-info">
            <span className="weather-temp">18°</span>
            <span className="weather-desc">ليلة مثالية للكشتة</span>
          </div>
        </div>
      </div>
    </aside>
  );

  // Header Component
  const Header = () => (
    <header className="header">
      <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
        <Menu size={24} />
      </button>
      
      <div className="header-center">
        <h1 className="header-title">
          {currentView === 'home' && 'الرئيسية'}
          {currentView === 'calendar' && 'التقويم'}
          {currentView === 'library' && 'مكتبة الأغراض'}
          {currentView === 'participants' && 'المشاركون'}
          {currentView === 'history' && 'السجل'}
          {currentView === 'event' && selectedEvent?.title}
        </h1>
      </div>
      
      <div className="header-actions">
        <button className="icon-btn" onClick={() => setShowNewEventModal(true)}>
          <Plus size={24} />
        </button>
      </div>
    </header>
  );

  // Home View
  const HomeView = () => {
    const upcomingEvents = events
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
    
    const pastEvents = events
      .filter(e => new Date(e.date) < new Date())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return (
      <div className="home-view">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h2>أهلاً وسهلاً</h2>
            <p>جاهز للطلعة الجاية؟</p>
            <button className="btn-primary" onClick={() => setShowNewEventModal(true)}>
              <Plus size={20} />
              <span>إنشاء طلعة جديدة</span>
            </button>
          </div>
          <div className="hero-decoration">
            <div className="stars">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="star" style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }} />
              ))}
            </div>
            <div className="moon">🌙</div>
            <div className="tent">⛺</div>
            <div className="fire">🔥</div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">طلعة</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{participants.length}</div>
            <div className="stat-label">مشارك</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{categories.reduce((sum, c) => sum + c.items.length, 0)}</div>
            <div className="stat-label">غرض</div>
          </div>
        </section>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section className="events-section">
            <div className="section-header">
              <h3>الطلعات القادمة</h3>
              <button className="btn-link" onClick={() => setCurrentView('calendar')}>
                عرض الكل
              </button>
            </div>
            <div className="events-list">
              {upcomingEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => {
                    setSelectedEvent(event);
                    setCurrentView('event');
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="quick-actions">
          <h3>إجراءات سريعة</h3>
          <div className="actions-grid">
            <button className="action-card" onClick={() => setShowNewEventModal(true)}>
              <Calendar size={32} />
              <span>طلعة جديدة</span>
            </button>
            <button className="action-card" onClick={() => setCurrentView('library')}>
              <Package size={32} />
              <span>إضافة أغراض</span>
            </button>
            <button className="action-card" onClick={() => setShowNewParticipantModal(true)}>
              <Users size={32} />
              <span>مشارك جديد</span>
            </button>
            <button className="action-card" onClick={() => setCurrentView('history')}>
              <History size={32} />
              <span>السجل</span>
            </button>
          </div>
        </section>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section className="events-section past">
            <div className="section-header">
              <h3>الطلعات السابقة</h3>
            </div>
            <div className="events-list compact">
              {pastEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event}
                  compact
                  onClick={() => {
                    setSelectedEvent(event);
                    setCurrentView('event');
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏜️</div>
            <h3>لا توجد طلعات بعد</h3>
            <p>ابدأ بإنشاء أول طلعة لك</p>
            <button className="btn-primary" onClick={() => setShowNewEventModal(true)}>
              إنشاء طلعة
            </button>
          </div>
        )}
      </div>
    );
  };

  // Event Card Component
  const EventCard = ({ event, onClick, compact = false }) => {
    const costs = calculateEventCosts(event);
    const participantCount = (event.participants || []).length;
    const contributionCount = (event.contributions || []).length;
    const isUpcoming = new Date(event.date) >= new Date();
    
    return (
      <div className={`event-card ${compact ? 'compact' : ''} ${isUpcoming ? 'upcoming' : 'past'}`} onClick={onClick}>
        <div className="event-date-badge">
          <span className="day">{new Date(event.date).getDate()}</span>
          <span className="month">{new Intl.DateTimeFormat('ar-SA', { month: 'short' }).format(new Date(event.date))}</span>
        </div>
        
        <div className="event-content">
          <h4 className="event-title">{event.title}</h4>
          {event.location && (
            <div className="event-location">
              <MapPin size={14} />
              <span>{event.location}</span>
            </div>
          )}
          
          {!compact && (
            <div className="event-meta">
              <span className="meta-item">
                <Users size={14} />
                {participantCount} مشارك
              </span>
              <span className="meta-item">
                <Package size={14} />
                {contributionCount} غرض
              </span>
              {costs.total > 0 && (
                <span className="meta-item">
                  <DollarSign size={14} />
                  {costs.total} ريال
                </span>
              )}
            </div>
          )}
        </div>
        
        <ChevronLeft size={20} className="event-arrow" />
      </div>
    );
  };

  // Event Detail View
  const EventDetailView = () => {
    const event = selectedEvent;
    if (!event) return null;
    
    const costs = calculateEventCosts(event);
    const [activeTab, setActiveTab] = useState('items');
    const [showAddItem, setShowAddItem] = useState(false);
    const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState(null);
    const [selectedItemForAdd, setSelectedItemForAdd] = useState(null);
    const [selectedContributor, setSelectedContributor] = useState(null);
    const [itemCost, setItemCost] = useState('');

    const handleAddContribution = () => {
      if (selectedItemForAdd && selectedContributor) {
        addItemToEvent(event.id, selectedCategoryForAdd, selectedItemForAdd, selectedContributor, itemCost);
        setShowAddItem(false);
        setSelectedCategoryForAdd(null);
        setSelectedItemForAdd(null);
        setSelectedContributor(null);
        setItemCost('');
        // Refresh selected event
        const updated = events.find(e => e.id === event.id);
        if (updated) setSelectedEvent(updated);
      }
    };

    // Refresh selectedEvent when events change
    useEffect(() => {
      const updated = events.find(e => e.id === event.id);
      if (updated) setSelectedEvent(updated);
    }, [events]);

    return (
      <div className="event-detail-view">
        {/* Event Header */}
        <div className="event-detail-header">
          <button className="back-btn" onClick={() => { setSelectedEvent(null); setCurrentView('home'); }}>
            <ChevronRight size={24} />
          </button>
          
          <div className="event-header-content">
            <h2>{event.title}</h2>
            <div className="event-header-meta">
              <span><Calendar size={16} /> {formatDate(event.date)}</span>
              {event.location && <span><MapPin size={16} /> {event.location}</span>}
            </div>
            <div className="event-header-hijri">
              {formatHijriDate(event.date)}
            </div>
          </div>
          
          <div className="event-header-actions">
            <button className="icon-btn" onClick={() => shareEvent(event)}>
              <Share2 size={20} />
            </button>
            <button className="icon-btn danger" onClick={() => {
              if (confirm('هل أنت متأكد من حذف هذه الطلعة؟')) {
                deleteEvent(event.id);
              }
            }}>
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="cost-summary">
          <div className="cost-item">
            <span className="cost-label">المجموع</span>
            <span className="cost-value">{costs.total} ريال</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">للشخص</span>
            <span className="cost-value">{costs.perPerson.toFixed(0)} ريال</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">المشاركون</span>
            <span className="cost-value">{(event.participants || []).length}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <Package size={18} />
            المستلزمات
          </button>
          <button 
            className={`tab ${activeTab === 'participants' ? 'active' : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            <Users size={18} />
            المشاركون
          </button>
          <button 
            className={`tab ${activeTab === 'costs' ? 'active' : ''}`}
            onClick={() => setActiveTab('costs')}
          >
            <DollarSign size={18} />
            التكاليف
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'items' && (
            <div className="items-tab">
              {/* Add Item Button */}
              <button className="add-item-btn" onClick={() => setShowAddItem(true)}>
                <Plus size={20} />
                إضافة غرض
              </button>

              {/* Categories with contributions */}
              {categories.map(category => {
                const catContributions = (event.contributions || []).filter(c => c.categoryId === category.id);
                if (catContributions.length === 0) return null;
                
                const IconComponent = getCategoryIcon(category.icon);
                
                return (
                  <div key={category.id} className="category-section">
                    <div className="category-header" style={{ borderColor: category.color }}>
                      <IconComponent size={20} style={{ color: category.color }} />
                      <span>{category.name}</span>
                      <span className="category-count">{catContributions.length}</span>
                    </div>
                    
                    <div className="contributions-list">
                      {catContributions.map(contribution => {
                        const contributor = participants.find(p => p.id === contribution.contributorId);
                        return (
                          <div key={contribution.id} className="contribution-item">
                            <div className="contribution-avatar">
                              {contributor?.avatar || '👤'}
                            </div>
                            <div className="contribution-info">
                              <span className="contribution-name">{contribution.itemName}</span>
                              <span className="contribution-by">{contributor?.name || 'غير محدد'}</span>
                            </div>
                            {contribution.cost > 0 && (
                              <div className="contribution-cost">
                                {contribution.cost} ريال
                              </div>
                            )}
                            <button 
                              className="remove-contribution"
                              onClick={() => removeContribution(event.id, contribution.id)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {(event.contributions || []).length === 0 && (
                <div className="empty-state small">
                  <Package size={48} />
                  <p>لم تتم إضافة أي أغراض بعد</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="participants-tab">
              <div className="participants-grid">
                {(event.participants || []).map(pId => {
                  const participant = participants.find(p => p.id === pId);
                  if (!participant) return null;
                  
                  const participantContributions = (event.contributions || []).filter(c => c.contributorId === pId);
                  const participantCost = participantContributions.reduce((sum, c) => sum + (c.cost || 0), 0);
                  
                  return (
                    <div key={pId} className="participant-card">
                      <div className="participant-avatar">{participant.avatar}</div>
                      <div className="participant-info">
                        <span className="participant-name">{participant.name}</span>
                        <span className="participant-contributions">
                          {participantContributions.length} مساهمة
                        </span>
                      </div>
                      <div className="participant-cost">
                        {participantCost} ريال
                      </div>
                      <button 
                        className="remove-participant"
                        onClick={() => removeParticipantFromEvent(event.id, pId)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Participant to Event */}
              <div className="add-participant-section">
                <h4>إضافة مشارك للطلعة</h4>
                <div className="available-participants">
                  {participants
                    .filter(p => !(event.participants || []).includes(p.id))
                    .map(p => (
                      <button
                        key={p.id}
                        className="available-participant"
                        onClick={() => addParticipantToEvent(event.id, p.id)}
                      >
                        <span className="avatar">{p.avatar}</span>
                        <span className="name">{p.name}</span>
                        <Plus size={16} />
                      </button>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {activeTab === 'costs' && (
            <div className="costs-tab">
              <div className="costs-breakdown">
                <h4>تفصيل التكاليف</h4>
                
                {/* By Category */}
                <div className="costs-by-category">
                  {categories.map(category => {
                    const catContributions = (event.contributions || []).filter(c => c.categoryId === category.id);
                    const catTotal = catContributions.reduce((sum, c) => sum + (c.cost || 0), 0);
                    if (catTotal === 0) return null;
                    
                    return (
                      <div key={category.id} className="cost-row">
                        <span className="cost-category">{category.name}</span>
                        <span className="cost-amount">{catTotal} ريال</span>
                      </div>
                    );
                  })}
                </div>

                <div className="costs-divider" />

                {/* By Participant */}
                <h4>مساهمات المشاركين</h4>
                <div className="costs-by-participant">
                  {(event.participants || []).map(pId => {
                    const participant = participants.find(p => p.id === pId);
                    if (!participant) return null;
                    
                    const paid = costs.byParticipant[pId] || 0;
                    const owes = costs.perPerson;
                    const balance = paid - owes;
                    
                    return (
                      <div key={pId} className="participant-cost-row">
                        <div className="participant-info">
                          <span className="avatar">{participant.avatar}</span>
                          <span className="name">{participant.name}</span>
                        </div>
                        <div className="participant-amounts">
                          <span className="paid">دفع: {paid} ريال</span>
                          <span className={`balance ${balance >= 0 ? 'positive' : 'negative'}`}>
                            {balance >= 0 ? `له: ${balance.toFixed(0)}` : `عليه: ${Math.abs(balance).toFixed(0)}`} ريال
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        {showAddItem && (
          <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
            <div className="modal add-item-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>إضافة غرض</h3>
                <button onClick={() => setShowAddItem(false)}><X size={24} /></button>
              </div>
              
              <div className="modal-body">
                {/* Step 1: Select Category */}
                {!selectedCategoryForAdd && (
                  <div className="category-select">
                    <p>اختر التصنيف:</p>
                    <div className="categories-grid">
                      {categories.map(cat => {
                        const IconComponent = getCategoryIcon(cat.icon);
                        return (
                          <button
                            key={cat.id}
                            className="category-option"
                            style={{ borderColor: cat.color }}
                            onClick={() => setSelectedCategoryForAdd(cat.id)}
                          >
                            <IconComponent size={24} style={{ color: cat.color }} />
                            <span>{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Select Item */}
                {selectedCategoryForAdd && !selectedItemForAdd && (
                  <div className="item-select">
                    <button className="back-step" onClick={() => setSelectedCategoryForAdd(null)}>
                      <ChevronRight size={20} /> رجوع
                    </button>
                    <p>اختر الغرض:</p>
                    <div className="items-grid">
                      {categories
                        .find(c => c.id === selectedCategoryForAdd)
                        ?.items.map(item => (
                          <button
                            key={item.id}
                            className="item-option"
                            onClick={() => setSelectedItemForAdd(item)}
                          >
                            <span className="item-name">{item.name}</span>
                            {item.description && (
                              <span className="item-desc">{item.description}</span>
                            )}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Step 3: Select Contributor & Cost */}
                {selectedItemForAdd && (
                  <div className="contributor-select">
                    <button className="back-step" onClick={() => setSelectedItemForAdd(null)}>
                      <ChevronRight size={20} /> رجوع
                    </button>
                    
                    <div className="selected-item-preview">
                      <Package size={24} />
                      <span>{selectedItemForAdd.name}</span>
                    </div>
                    
                    <div className="form-group">
                      <label>من يحضر هذا الغرض؟</label>
                      <div className="contributor-options">
                        {(event.participants || []).map(pId => {
                          const p = participants.find(p => p.id === pId);
                          if (!p) return null;
                          return (
                            <button
                              key={pId}
                              className={`contributor-option ${selectedContributor === pId ? 'selected' : ''}`}
                              onClick={() => setSelectedContributor(pId)}
                            >
                              <span className="avatar">{p.avatar}</span>
                              <span className="name">{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>التكلفة (اختياري)</label>
                      <div className="cost-input">
                        <input
                          type="number"
                          value={itemCost}
                          onChange={e => setItemCost(e.target.value)}
                          placeholder="0"
                        />
                        <span>ريال</span>
                      </div>
                    </div>
                    
                    <button 
                      className="btn-primary full-width"
                      disabled={!selectedContributor}
                      onClick={handleAddContribution}
                    >
                      <Check size={20} />
                      إضافة
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Calendar View
  const CalendarView = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();
    
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();
    
    const monthEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getMonth() === currentMonth.getMonth() &&
             eventDate.getFullYear() === currentMonth.getFullYear();
    });

    const getEventsForDay = (day) => {
      return monthEvents.filter(e => new Date(e.date).getDate() === day);
    };

    const weekDays = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
            <ChevronRight size={24} />
          </button>
          <h3>
            {new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(currentMonth)}
          </h3>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="calendar-day-name">{day}</div>
          ))}
          
          {[...Array(firstDayOfMonth)].map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty" />
          ))}
          
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().getDate() === day && 
                           new Date().getMonth() === currentMonth.getMonth() &&
                           new Date().getFullYear() === currentMonth.getFullYear();
            
            return (
              <div 
                key={day} 
                className={`calendar-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                onClick={() => {
                  if (dayEvents.length === 1) {
                    setSelectedEvent(dayEvents[0]);
                    setCurrentView('event');
                  }
                }}
              >
                <span className="day-number">{day}</span>
                {dayEvents.length > 0 && (
                  <div className="day-events">
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className="day-event-dot" title={e.title} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Events list for current month */}
        <div className="month-events">
          <h4>طلعات هذا الشهر</h4>
          {monthEvents.length === 0 ? (
            <p className="no-events">لا توجد طلعات هذا الشهر</p>
          ) : (
            <div className="events-list">
              {monthEvents.map(event => (
                <EventCard 
                  key={event.id}
                  event={event}
                  compact
                  onClick={() => {
                    setSelectedEvent(event);
                    setCurrentView('event');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Library View
  const LibraryView = () => {
    const [selectedCat, setSelectedCat] = useState(null);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');

    const handleAddCategory = () => {
      if (newCategoryName.trim()) {
        addNewCategory({
          name: newCategoryName,
          icon: 'package',
          color: '#6B7280'
        });
        setNewCategoryName('');
        setShowAddCategory(false);
      }
    };

    const handleAddItem = () => {
      if (selectedCat && newItemName.trim()) {
        addNewItem(selectedCat, {
          name: newItemName,
          description: newItemDesc
        });
        setNewItemName('');
        setNewItemDesc('');
      }
    };

    return (
      <div className="library-view">
        <div className="library-header">
          <p>أضف أغراض جديدة للمكتبة العامة ليستفيد منها الجميع</p>
          <button className="btn-secondary" onClick={() => setShowAddCategory(true)}>
            <Plus size={18} />
            تصنيف جديد
          </button>
        </div>

        {/* Search */}
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="ابحث عن غرض..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="categories-list">
          {categories.map(category => {
            const IconComponent = getCategoryIcon(category.icon);
            const filteredItems = category.items.filter(item =>
              item.name.includes(searchQuery) || item.description?.includes(searchQuery)
            );
            
            if (searchQuery && filteredItems.length === 0) return null;
            
            return (
              <div key={category.id} className="library-category">
                <button
                  className={`category-toggle ${selectedCat === category.id ? 'open' : ''}`}
                  onClick={() => setSelectedCat(selectedCat === category.id ? null : category.id)}
                  style={{ borderRightColor: category.color }}
                >
                  <IconComponent size={24} style={{ color: category.color }} />
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{category.items.length}</span>
                  <ChevronLeft size={20} className="toggle-arrow" />
                </button>
                
                {selectedCat === category.id && (
                  <div className="category-items">
                    {filteredItems.map(item => (
                      <div key={item.id} className="library-item">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          {item.description && (
                            <span className="item-desc">{item.description}</span>
                          )}
                        </div>
                        {item.common && <span className="common-badge">شائع</span>}
                      </div>
                    ))}
                    
                    {/* Add new item form */}
                    <div className="add-item-form">
                      <input
                        type="text"
                        placeholder="اسم الغرض الجديد"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="الوصف (اختياري)"
                        value={newItemDesc}
                        onChange={e => setNewItemDesc(e.target.value)}
                      />
                      <button 
                        className="btn-add"
                        onClick={handleAddItem}
                        disabled={!newItemName.trim()}
                      >
                        <Plus size={18} />
                        إضافة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
            <div className="modal small" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>تصنيف جديد</h3>
                <button onClick={() => setShowAddCategory(false)}><X size={24} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>اسم التصنيف</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="مثال: الأكل والمشروبات"
                  />
                </div>
                <button 
                  className="btn-primary full-width"
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                >
                  إضافة التصنيف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Participants View
  const ParticipantsView = () => {
    return (
      <div className="participants-view">
        <div className="participants-header">
          <p>أضف وأدر المشاركين المعتادين في الطلعات</p>
          <button className="btn-primary" onClick={() => setShowNewParticipantModal(true)}>
            <Plus size={18} />
            مشارك جديد
          </button>
        </div>

        <div className="participants-list">
          {participants.map(participant => {
            const participantEvents = events.filter(e => 
              (e.participants || []).includes(participant.id)
            );
            
            return (
              <div key={participant.id} className="participant-full-card">
                <div className="participant-avatar large">{participant.avatar}</div>
                <div className="participant-details">
                  <h4>{participant.name}</h4>
                  <p className="participant-phone">{participant.phone}</p>
                  <div className="participant-stats">
                    <span>{participantEvents.length} طلعة</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // History View
  const HistoryView = () => {
    return (
      <div className="history-view">
        <div className="history-header">
          <p>سجل جميع الأنشطة والتعديلات</p>
        </div>

        <div className="logs-list">
          {logs.length === 0 ? (
            <div className="empty-state">
              <History size={48} />
              <p>لا يوجد سجل بعد</p>
            </div>
          ) : (
            logs.slice(0, 100).map(log => (
              <div key={log.id} className="log-item">
                <div className="log-icon">
                  <Clock size={16} />
                </div>
                <div className="log-content">
                  <span className="log-action">{log.action}</span>
                  <span className="log-details">{log.details}</span>
                  <span className="log-time">
                    {new Intl.DateTimeFormat('ar-SA', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }).format(new Date(log.timestamp))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // New Event Modal
  const NewEventModal = () => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (title && date) {
        createEvent({
          title,
          date,
          location,
          participants: selectedParticipants
        });
      }
    };

    const toggleParticipant = (pId) => {
      setSelectedParticipants(prev => 
        prev.includes(pId) ? prev.filter(p => p !== pId) : [...prev, pId]
      );
    };

    return (
      <div className="modal-overlay" onClick={() => setShowNewEventModal(false)}>
        <div className="modal new-event-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>طلعة جديدة</h3>
            <button onClick={() => setShowNewEventModal(false)}><X size={24} /></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label>اسم الطلعة</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: كشتة نهاية الأسبوع"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>التاريخ</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>الموقع (اختياري)</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="مثال: روضة خريم"
                />
              </div>
              
              <div className="form-group">
                <label>المشاركون</label>
                <div className="participants-select">
                  {participants.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`participant-chip ${selectedParticipants.includes(p.id) ? 'selected' : ''}`}
                      onClick={() => toggleParticipant(p.id)}
                    >
                      <span className="avatar">{p.avatar}</span>
                      <span className="name">{p.name}</span>
                      {selectedParticipants.includes(p.id) && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowNewEventModal(false)}>
                إلغاء
              </button>
              <button type="submit" className="btn-primary" disabled={!title || !date}>
                إنشاء الطلعة
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // New Participant Modal
  const NewParticipantModal = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatar, setAvatar] = useState('👨');

    const avatarOptions = ['👨', '👨‍🦱', '👨‍🦳', '🧔', '👴', '👨‍🦲', '🧑', '👤'];

    const handleSubmit = (e) => {
      e.preventDefault();
      if (name) {
        addParticipant({ name, phone, avatar });
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setShowNewParticipantModal(false)}>
        <div className="modal small" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>مشارك جديد</h3>
            <button onClick={() => setShowNewParticipantModal(false)}><X size={24} /></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label>الصورة الرمزية</label>
                <div className="avatar-select">
                  {avatarOptions.map(a => (
                    <button
                      key={a}
                      type="button"
                      className={`avatar-option ${avatar === a ? 'selected' : ''}`}
                      onClick={() => setAvatar(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>الاسم</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: أبو محمد"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>رقم الجوال (اختياري)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowNewParticipantModal(false)}>
                إلغاء
              </button>
              <button type="submit" className="btn-primary" disabled={!name}>
                إضافة
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <div className="kashta-app" dir="rtl">
      <NotificationBanner />
      <Sidebar />
      
      <main className="main-content">
        <Header />
        
        <div className="view-container">
          {currentView === 'home' && <HomeView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'library' && <LibraryView />}
          {currentView === 'participants' && <ParticipantsView />}
          {currentView === 'history' && <HistoryView />}
          {currentView === 'event' && <EventDetailView />}
        </div>
      </main>

      {/* Modals */}
      {showNewEventModal && <NewEventModal />}
      {showNewParticipantModal && <NewParticipantModal />}

      <style>{`
        /* ==================== CSS VARIABLES ==================== */
        :root {
          --color-sand-light: #F5E6D3;
          --color-sand: #D4A574;
          --color-sand-dark: #8B6914;
          --color-night: #1A1A2E;
          --color-night-light: #252541;
          --color-fire: #FF6B35;
          --color-fire-glow: #FFD700;
          --color-ember: #E63946;
          --color-sky: #16213E;
          --color-star: #F1FAEE;
          --color-text: #F5E6D3;
          --color-text-muted: #A89F91;
          --color-success: #4ADE80;
          --color-error: #F87171;
          
          --font-arabic: 'Noto Kufi Arabic', 'Tajawal', 'Cairo', sans-serif;
          --font-display: 'Amiri', 'Scheherazade New', serif;
          
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 20px;
          --radius-full: 9999px;
          
          --shadow-soft: 0 4px 20px rgba(0,0,0,0.3);
          --shadow-glow: 0 0 30px rgba(255,107,53,0.3);
          
          --transition: all 0.3s ease;
        }

        /* ==================== GLOBAL STYLES ==================== */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&family=Amiri:wght@400;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .kashta-app {
          font-family: var(--font-arabic);
          background: linear-gradient(135deg, var(--color-night) 0%, var(--color-sky) 50%, var(--color-night-light) 100%);
          min-height: 100vh;
          color: var(--color-text);
          display: flex;
          position: relative;
          overflow-x: hidden;
        }

        /* ==================== LOADING SCREEN ==================== */
        .loading-screen {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, var(--color-night), var(--color-sky));
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .loading-content {
          text-align: center;
        }

        .loading-icon {
          font-size: 4rem;
          animation: bounce 1s ease infinite;
        }

        .loading-text {
          font-size: 1.2rem;
          margin-top: 1rem;
          color: var(--color-sand);
        }

        .loading-bar {
          width: 200px;
          height: 4px;
          background: var(--color-night-light);
          border-radius: var(--radius-full);
          margin-top: 1.5rem;
          overflow: hidden;
        }

        .loading-progress {
          height: 100%;
          width: 30%;
          background: linear-gradient(90deg, var(--color-fire), var(--color-fire-glow));
          border-radius: var(--radius-full);
          animation: loadProgress 1.5s ease infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes loadProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        /* ==================== NOTIFICATION ==================== */
        .notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-success);
          color: var(--color-night);
          padding: 12px 24px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          z-index: 10000;
          animation: slideDown 0.3s ease;
          box-shadow: var(--shadow-soft);
        }

        .notification.error {
          background: var(--color-error);
          color: white;
        }

        .notification button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          opacity: 0.7;
        }

        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        /* ==================== SIDEBAR ==================== */
        .sidebar {
          width: 280px;
          background: rgba(26,26,46,0.95);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(212,165,116,0.2);
          display: flex;
          flex-direction: column;
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          z-index: 1000;
          transform: translateX(100%);
          transition: var(--transition);
        }

        .sidebar.open {
          transform: translateX(0);
        }

        @media (min-width: 1024px) {
          .sidebar {
            position: relative;
            transform: translateX(0);
          }
          
          .close-sidebar, .menu-btn {
            display: none !important;
          }
        }

        .sidebar-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(212,165,116,0.1);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          font-size: 2rem;
        }

        .logo-text {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--color-fire), var(--color-fire-glow));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .close-sidebar {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          background: none;
          border: none;
          border-radius: var(--radius-md);
          color: var(--color-text-muted);
          font-size: 1rem;
          font-family: var(--font-arabic);
          cursor: pointer;
          transition: var(--transition);
          text-align: right;
        }

        .nav-item:hover {
          background: rgba(212,165,116,0.1);
          color: var(--color-text);
        }

        .nav-item.active {
          background: linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,215,0,0.1));
          color: var(--color-fire);
          border-right: 3px solid var(--color-fire);
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(212,165,116,0.1);
        }

        .weather-widget {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255,107,53,0.1);
          border-radius: var(--radius-md);
        }

        .weather-icon {
          font-size: 2rem;
        }

        .weather-info {
          display: flex;
          flex-direction: column;
        }

        .weather-temp {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--color-fire-glow);
        }

        .weather-desc {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        /* ==================== MAIN CONTENT ==================== */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* ==================== HEADER ==================== */
        .header {
          height: 70px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(26,26,46,0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(212,165,116,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .menu-btn, .icon-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212,165,116,0.1);
          border: none;
          border-radius: var(--radius-md);
          color: var(--color-text);
          cursor: pointer;
          transition: var(--transition);
        }

        .menu-btn:hover, .icon-btn:hover {
          background: rgba(255,107,53,0.2);
          color: var(--color-fire);
        }

        .icon-btn.danger:hover {
          background: rgba(230,57,70,0.2);
          color: var(--color-ember);
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        /* ==================== VIEW CONTAINER ==================== */
        .view-container {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        /* ==================== HOME VIEW ==================== */
        .hero-section {
          position: relative;
          background: linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,215,0,0.1));
          border-radius: var(--radius-lg);
          padding: 40px 30px;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .hero-content h2 {
          font-family: var(--font-display);
          font-size: 2rem;
          margin-bottom: 8px;
          color: var(--color-fire-glow);
        }

        .hero-content p {
          font-size: 1.1rem;
          color: var(--color-text-muted);
          margin-bottom: 20px;
        }

        .hero-decoration {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .stars {
          position: absolute;
          inset: 0;
        }

        .star {
          position: absolute;
          width: 3px;
          height: 3px;
          background: var(--color-star);
          border-radius: 50%;
          animation: twinkle 2s ease infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .moon {
          position: absolute;
          top: 20px;
          left: 30px;
          font-size: 3rem;
          animation: float 4s ease infinite;
        }

        .tent {
          position: absolute;
          bottom: 20px;
          left: 100px;
          font-size: 2.5rem;
        }

        .fire {
          position: absolute;
          bottom: 15px;
          left: 60px;
          font-size: 1.8rem;
          animation: flicker 0.5s ease infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.95); }
        }

        /* ==================== BUTTONS ==================== */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: linear-gradient(135deg, var(--color-fire), var(--color-ember));
          color: white;
          border: none;
          border-radius: var(--radius-full);
          font-size: 1rem;
          font-weight: 600;
          font-family: var(--font-arabic);
          cursor: pointer;
          transition: var(--transition);
          box-shadow: 0 4px 15px rgba(255,107,53,0.4);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255,107,53,0.5);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          color: var(--color-fire);
          border: 2px solid var(--color-fire);
          border-radius: var(--radius-full);
          font-size: 0.95rem;
          font-weight: 600;
          font-family: var(--font-arabic);
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-secondary:hover {
          background: rgba(255,107,53,0.1);
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--color-fire);
          font-size: 0.9rem;
          font-family: var(--font-arabic);
          cursor: pointer;
        }

        .btn-link:hover {
          text-decoration: underline;
        }

        .full-width {
          width: 100%;
          justify-content: center;
        }

        /* ==================== STATS SECTION ==================== */
        .stats-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: rgba(26,26,46,0.6);
          border-radius: var(--radius-md);
          padding: 20px;
          text-align: center;
          border: 1px solid rgba(212,165,116,0.1);
        }

        .stat-icon {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--color-fire-glow);
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        /* ==================== EVENTS SECTION ==================== */
        .events-section {
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3 {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .events-list.compact .event-card {
          padding: 12px 16px;
        }

        /* ==================== EVENT CARD ==================== */
        .event-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(26,26,46,0.7);
          border-radius: var(--radius-md);
          border: 1px solid rgba(212,165,116,0.1);
          cursor: pointer;
          transition: var(--transition);
        }

        .event-card:hover {
          background: rgba(255,107,53,0.1);
          border-color: rgba(255,107,53,0.3);
          transform: translateX(-4px);
        }

        .event-card.past {
          opacity: 0.7;
        }

        .event-date-badge {
          min-width: 50px;
          text-align: center;
          padding: 8px;
          background: linear-gradient(135deg, var(--color-fire), var(--color-ember));
          border-radius: var(--radius-sm);
        }

        .event-date-badge .day {
          display: block;
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1;
        }

        .event-date-badge .month {
          display: block;
          font-size: 0.7rem;
          margin-top: 2px;
        }

        .event-content {
          flex: 1;
          min-width: 0;
        }

        .event-title {
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .event-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .event-meta {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        .event-arrow {
          color: var(--color-text-muted);
        }

        /* ==================== QUICK ACTIONS ==================== */
        .quick-actions {
          margin-bottom: 24px;
        }

        .quick-actions h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (min-width: 640px) {
          .actions-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px;
          background: rgba(26,26,46,0.6);
          border: 1px solid rgba(212,165,116,0.1);
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-family: var(--font-arabic);
          cursor: pointer;
          transition: var(--transition);
        }

        .action-card:hover {
          background: rgba(255,107,53,0.1);
          border-color: rgba(255,107,53,0.3);
          color: var(--color-fire);
        }

        .action-card span {
          font-size: 0.9rem;
        }

        /* ==================== EMPTY STATE ==================== */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-state.small {
          padding: 40px 20px;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 1.3rem;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: var(--color-text-muted);
          margin-bottom: 20px;
        }

        /* ==================== EVENT DETAIL VIEW ==================== */
        .event-detail-view {
          max-width: 800px;
          margin: 0 auto;
        }

        .event-detail-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(212,165,116,0.1);
        }

        .back-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212,165,116,0.1);
          border: none;
          border-radius: var(--radius-md);
          color: var(--color-text);
          cursor: pointer;
          flex-shrink: 0;
        }

        .event-header-content {
          flex: 1;
        }

        .event-header-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .event-header-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }

        .event-header-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .event-header-hijri {
          margin-top: 8px;
          font-size: 0.85rem;
          color: var(--color-fire);
          font-family: var(--font-display);
        }

        .event-header-actions {
          display: flex;
          gap: 8px;
        }

        /* ==================== COST SUMMARY ==================== */
        .cost-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .cost-item {
          background: rgba(255,107,53,0.1);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: center;
        }

        .cost-label {
          display: block;
          font-size: 0.85rem;
          color: var(--color-text-muted);
          margin-bottom: 4px;
        }

        .cost-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--color-fire-glow);
        }

        /* ==================== TABS ==================== */
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(212,165,116,0.1);
          padding-bottom: 12px;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: none;
          border: none;
          border-radius: var(--radius-full);
          color: var(--color-text-muted);
          font-size: 0.95rem;
          font-family: var(--font-arabic);
          cursor: pointer;
          transition: var(--transition);
        }

        .tab:hover {
          background: rgba(212,165,116,0.1);
          color: var(--color-text);
        }

        .tab.active {
          background: linear-gradient(135deg, var(--color-fire), var(--color-ember));
          color: white;
        }

        /* ==================== ITEMS TAB ==================== */
        .add-item-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 16px;
          background: rgba(255,107,53,0.1);
          border: 2px dashed rgba(255,107,53,0.4);
          border-radius: var(--radius-md);
          color: var(--color-fire);
          font-size: 1rem;
          font-family: var(--font-arabic);
          cursor: pointer;
          margin-bottom: 20px;
          transition: var(--transition);
        }

        .add-item-btn:hover {
          background: rgba(255,107,53,0.2);
          border-color: var(--color-fire);
        }

        .category-section {
          margin-bottom: 20px;
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(26,26,46,0.6);
          border-radius: var(--radius-md);
          border-right: 4px solid;
          margin-bottom: 12px;
        }

        .category-header span {
          font-weight: 600;
        }

        .category-count {
          margin-right: auto;
          background: rgba(255,255,255,0.1);
          padding: 2px 10px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
        }

        .contributions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 20px;
        }

        .contribution-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(26,26,46,0.4);
          border-radius: var(--radius-md);
        }

        .contribution-avatar {
          font-size: 1.5rem;
        }

        .contribution-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .contribution-name {
          font-weight: 500;
        }

        .contribution-by {
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .contribution-cost {
          color: var(--color-fire-glow);
          font-weight: 600;
        }

        .remove-contribution {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(230,57,70,0.1);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--color-ember);
          cursor: pointer;
          opacity: 0;
          transition: var(--transition);
        }

        .contribution-item:hover .remove-contribution {
          opacity: 1;
        }

        /* ==================== PARTICIPANTS TAB ==================== */
        .participants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .participant-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(26,26,46,0.6);
          border-radius: var(--radius-md);
          border: 1px solid rgba(212,165,116,0.1);
        }

        .participant-avatar {
          font-size: 2rem;
        }

        .participant-avatar.large {
          font-size: 3rem;
        }

        .participant-info {
          flex: 1;
        }

        .participant-name {
          font-weight: 600;
          display: block;
        }

        .participant-contributions {
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .participant-cost {
          font-weight: 600;
          color: var(--color-fire-glow);
        }

        .remove-participant {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(230,57,70,0.1);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--color-ember);
          cursor: pointer;
        }

        .add-participant-section {
          padding-top: 20px;
          border-top: 1px solid rgba(212,165,116,0.1);
        }

        .add-participant-section h4 {
          font-size: 1rem;
          margin-bottom: 12px;
        }

        .available-participants {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .available-participant {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(26,26,46,0.6);
          border: 1px solid rgba(212,165,116,0.2);
          border-radius: var(--radius-full);
          color: var(--color-text);
          font-family: var(--font-arabic);
          cursor: pointer;
          transition: var(--transition);
        }

        .available-participant:hover {
          background: rgba(255,107,53,0.2);
          border-color: var(--color-fire);
        }

        /* ==================== COSTS TAB ==================== */
        .costs-breakdown h4 {
          font-size: 1rem;
          margin-bottom: 12px;
          color: var(--color-text-muted);
        }

        .costs-by-category {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .cost-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(26,26,46,0.4);
          border-radius: var(--radius-sm);
        }

        .costs-divider {
          height: 1px;
          background: rgba(212,165,116,0.1);
          margin: 20px 0;
        }

        .costs-by-participant {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .participant-cost-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(26,26,46,0.4);
          border-radius: var(--radius-md);
        }

        .participant-cost-row .participant-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .participant-cost-row .avatar {
          font-size: 1.5rem;
        }

        .participant-amounts {
          text-align: left;
        }

        .participant-amounts .paid {
          display: block;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }

        .participant-amounts .balance {
          display: block;
          font-weight: 600;
        }

        .participant-amounts .balance.positive {
          color: var(--color-success);
        }

        .participant-amounts .balance.negative {
          color: var(--color-error);
        }

        /* ==================== CALENDAR VIEW ==================== */
        .calendar-view {
          max-width: 800px;
          margin: 0 auto;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .calendar-header button {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212,165,116,0.1);
          border: none;
          border-radius: var(--radius-md);
          color: var(--color-text);
          cursor: pointer;
        }

        .calendar-header h3 {
          font-size: 1.3rem;
          font-family: var(--font-display);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }

        .calendar-day-name {
          text-align: center;
          font-size: 0.85rem;
          color: var(--color-text-muted);
          padding: 8px;
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(26,26,46,0.4);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
        }

        .calendar-day:hover:not(.empty) {
          background: rgba(255,107,53,0.2);
        }

        .calendar-day.empty {
          background: transparent;
          cursor: default;
        }

        .calendar-day.today {
          background: linear-gradient(135deg, var(--color-fire), var(--color-ember));
        }

        .calendar-day.has-events::after {
          content: '';
          position: absolute;
          bottom: 6px;
          width: 6px;
          height: 6px;
          background: var(--color-fire-glow);
          border-radius: 50%;
        }

        .calendar-day.today.has-events::after {
          background: white;
        }

        .day-number {
          font-size: 1rem;
        }

        .month-events h4 {
          font-size: 1.1rem;
          margin-bottom: 16px;
        }

        .no-events {
          text-align: center;
          color: var(--color-text-muted);
          padding: 40px;
        }

        /* ==================== LIBRARY VIEW ==================== */
        .library-view {
          max-width: 800px;
          margin: 0 auto;
        }

        .library-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .library-header p {
          color: var(--color-text-muted);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: rgba(26,26,46,0.6);
          border: 1px solid rgba(212,165,116,0.2);
          border-radius: var(--radius-full);
          margin-bottom: 24px;
        }

        .search-box input {
          flex: 1;
          background: none;
          border: none;
          color: var(--color-text);
          font-size: 1rem;
          font-family: var(--font-arabic);
          outline: none;
        }

        .search-box input::placeholder {
          color: var(--color-text-muted);
        }

        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .library-category {
          background: rgba(26,26,46,0.4);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .category-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: none;
          border: none;
          border-right: 4px solid transparent;
          color: var(--color-text);
          font-size: 1rem;
          font-family: var(--font-arabic);
          cursor: pointer;
          text-align: right;
          transition: var(--transition);
        }

        .category-toggle:hover {
          background: rgba(255,255,255,0.05);
        }

        .category-toggle .category-name {
          flex: 1;
          font-weight: 600;
        }

        .category-toggle .category-count {
          background: rgba(255,255,255,0.1);
          padding: 2px 10px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
        }

        .category-toggle .toggle-arrow {
          transition: var(--transition);
        }

        .category-toggle.open .toggle-arrow {
          transform: rotate(-90deg);
        }

        .category-items {
          padding: 0 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .library-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(26,26,46,0.4);
          border-radius: var(--radius-sm);
        }

        .library-item .item-info {
          display: flex;
          flex-direction: column;
        }

        .library-item .item-name {
          font-weight: 500;
        }

        .library-item .item-desc {
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .common-badge {
          font-size: 0.75rem;
          padding: 2px 8px;
          background: rgba(255,215,0,0.2);
          color: var(--color-fire-glow);
          border-radius: var(--radius-full);
        }

        .add-item-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          background: rgba(255,107,53,0.05);
          border: 1px dashed rgba(255,107,53,0.3);
          border-radius: var(--radius-md);
          margin-top: 12px;
        }

        .add-item-form input {
          padding: 10px 14px;
          background: rgba(26,26,46,0.6);
          border: 1px solid rgba(212,165,116,0.2);
          border-radius: var(--radius-sm);
          color: var(--color-text);
          font-family: var(--font-arabic);
        }

        .add-item-form input::placeholder {
          color: var(--color-text-muted);
        }

        .btn-add {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: var(--color-fire);
          border: none;
          border-radius: var(--radius-sm);
          color: white;
          font-family: var(--font-arabic);
          cursor: pointer;
        }

        .btn-add:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ==================== PARTICIPANTS VIEW ==================== */
        .participants-view {
          max-width: 800px;
          margin: 0 auto;
        }

        .participants-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .participants-header p {
          color: var(--color-text-muted);
        }

        .participants-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .participant-full-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: rgba(26,26,46,0.6);
          border-radius: var(--radius-md);
          border: 1px solid rgba(212,165,116,0.1);
        }

        .participant-full-card .participant-avatar {
          font-size: 3rem;
        }

        .participant-details h4 {
          font-size: 1.1rem;
          margin-bottom: 4px;
        }

        .participant-phone {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          direction: ltr;
          text-align: right;
        }

        .participant-stats {
          margin-top: 8px;
          font-size: 0.85rem;
          color: var(--color-fire);
        }

        /* ==================== HISTORY VIEW ==================== */
        .history-view {
          max-width: 800px;
          margin: 0 auto;
        }

        .history-header {
          margin-bottom: 24px;
        }

        .history-header p {
          color: var(--color-text-muted);
        }

        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .log-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: rgba(26,26,46,0.4);
          border-radius: var(--radius-md);
        }

        .log-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,107,53,0.1);
          border-radius: 50%;
          color: var(--color-fire);
          flex-shrink: 0;
        }

        .log-content {
          display: flex;
          flex-direction: column;
        }

        .log-action {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .log-details {
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }

        .log-time {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 8px;
        }

        /* ==================== MODALS ==================== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .modal {
          background: var(--color-night);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(212,165,116,0.2);
        }

        .modal.small {
          max-width: 400px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(212,165,116,0.1);
        }

        .modal-header h3 {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .modal-header button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(212,165,116,0.1);
        }

        /* ==================== FORM ELEMENTS ==================== */
        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px 16px;
          background: rgba(26,26,46,0.6);
          border: 1px solid rgba(212,165,116,0.2);
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-size: 1rem;
          font-family: var(--font-arabic);
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--color-fire);
        }

        .form-group input::placeholder {
          color: var(--color-text-muted);
        }

        .participants-select {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .participant-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(26,26,46,0.6);
          border: 1px solid rgba(212,165,116,0.2);
          border-radius: var(--radius-full);
          color: var(--color-text);
          font-family: var(--font-arabic);
          cursor: pointer;
          transition: var(--transition);
        }

        .participant-chip:hover {
          background: rgba(255,107,53,0.1);
        }

        .participant-chip.selected {
          background: rgba(255,107,53,0.2);
          border-color: var(--color-fire);
          color: var(--color-fire);
        }

        .participant-chip .avatar {
          font-size: 1.2rem;
        }

        .avatar-select {
          display: flex;
          gap: 8px;
        }

        .avatar-option {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: rgba(26,26,46,0.6);
          border: 2px solid transparent;
          border-radius: 50%;
          cursor: pointer;
          transition: var(--transition);
        }

        .avatar-option:hover {
          background: rgba(255,107,53,0.1);
        }

        .avatar-option.selected {
          border-color: var(--color-fire);
          background: rgba(255,107,53,0.2);
        }

        /* ==================== ADD ITEM MODAL ==================== */
        .add-item-modal .modal-body {
          min-height: 300px;
        }

        .category-select p,
        .item-select p,
        .contributor-select label {
          font-size: 1rem;
          margin-bottom: 16px;
          color: var(--color-text);
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .category-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 16px;
          background: rgba(26,26,46,0.6);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-family: var(--font-arabic);
          cursor: pointer;
          transition: var(--transition);
        }

        .category-option:hover {
          background: rgba(255,107,53,0.1);
        }

        .back-step {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-family: var(--font-arabic);
          cursor: pointer;
          margin-bottom: 16px;
        }

        .items-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .item-option {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 14px 18px;
          background: rgba(26,26,46,0.6);
          border: 1px solid rgba(212,165,116,0.1);
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-family: var(--font-arabic);
          cursor: pointer;
          text-align: right;
          transition: var(--transition);
        }

        .item-option:hover {
          background: rgba(255,107,53,0.1);
          border-color: rgba(255,107,53,0.3);
        }

        .item-option .item-name {
          font-weight: 500;
        }

        .item-option .item-desc {
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .selected-item-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255,107,53,0.1);
          border-radius: var(--radius-md);
          margin-bottom: 20px;
          color: var(--color-fire);
        }

        .contributor-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .contributor-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(26,26,46,0.6);
          border: 2px solid transparent;
          border-radius: var(--radius-full);
          color: var(--color-text);
          font-family: var(--font-arabic);
          cursor: pointer;
          transition: var(--transition);
        }

        .contributor-option:hover {
          background: rgba(255,107,53,0.1);
        }

        .contributor-option.selected {
          border-color: var(--color-fire);
          background: rgba(255,107,53,0.2);
        }

        .cost-input {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cost-input input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(26,26,46,0.6);
          border: 1px solid rgba(212,165,116,0.2);
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-size: 1rem;
          font-family: var(--font-arabic);
          text-align: left;
          direction: ltr;
        }

        .cost-input span {
          color: var(--color-text-muted);
        }

        /* ==================== RESPONSIVE ==================== */
        @media (max-width: 640px) {
          .stats-section {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .stat-card {
            padding: 12px;
          }
          
          .stat-value {
            font-size: 1.4rem;
          }
          
          .cost-summary {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .categories-grid {
            grid-template-columns: 1fr;
          }
          
          .tabs {
            overflow-x: auto;
            padding-bottom: 8px;
          }
          
          .tab {
            white-space: nowrap;
            padding: 8px 16px;
          }
        }

        /* ==================== SCROLLBAR ==================== */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(26,26,46,0.4);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(212,165,116,0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(212,165,116,0.5);
        }
      `}</style>
    </div>
  );
}
