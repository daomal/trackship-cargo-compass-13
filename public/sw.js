
// Enhanced service worker untuk mendukung background GPS tracking

const CACHE_NAME = 'cargo-compass-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json'
];

let gpsTrackingData = {
  isActive: false,
  driverId: null,
  lastPosition: null
};

// Install service worker
self.addEventListener('install', (event) => {
  console.log('📱 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('📱 Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients to ensure immediate control
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data.type === 'GPS_TRACKING_INIT') {
    gpsTrackingData.isActive = true;
    gpsTrackingData.driverId = event.data.driverId;
    console.log('🔧 GPS tracking initialized in service worker for driver:', event.data.driverId);
  }
  
  if (event.data.type === 'GPS_TRACKING_STOP') {
    gpsTrackingData.isActive = false;
    gpsTrackingData.driverId = null;
    gpsTrackingData.lastPosition = null;
    console.log('⏹️ GPS tracking stopped in service worker');
  }
  
  if (event.data.type === 'GPS_POSITION_UPDATE') {
    gpsTrackingData.lastPosition = event.data.position;
    console.log('📍 GPS position updated in service worker:', event.data.position);
  }
});

// Background sync for GPS data when network is available
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'gps-sync') {
    event.waitUntil(syncGPSData());
  }
});

// Function to sync GPS data in background
async function syncGPSData() {
  if (!gpsTrackingData.isActive || !gpsTrackingData.driverId || !gpsTrackingData.lastPosition) {
    console.log('⚠️ No GPS data to sync');
    return;
  }
  
  try {
    console.log('📡 Syncing GPS data in background...');
    
    // Here you would typically make a request to your API
    // For now, we'll just log the data that would be synced
    console.log('📊 GPS data to sync:', {
      driverId: gpsTrackingData.driverId,
      position: gpsTrackingData.lastPosition,
      timestamp: new Date().toISOString()
    });
    
    // In a real implementation, you would make an API call here
    // const response = await fetch('/api/gps-update', { ... });
    
  } catch (error) {
    console.error('❌ Error syncing GPS data:', error);
  }
}

// Periodic background task (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'gps-periodic-sync') {
    console.log('⏰ Periodic GPS sync triggered');
    event.waitUntil(syncGPSData());
  }
});

// Handle push notifications for GPS alerts (future feature)
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'gps-alert') {
      const options = {
        body: data.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'gps-alert',
        requireInteraction: true
      };
      
      event.waitUntil(
        self.registration.showNotification('GPS Alert', options)
      );
    }
  }
});

console.log('✅ Enhanced Service Worker loaded with GPS background support');
