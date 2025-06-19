
// Service Worker untuk pelacakan GPS latar belakang
let watchId = null;
let currentShipmentId = null;
const SUPABASE_URL = 'https://adxgzitxnqytdgcdmejt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeGd6aXR4bnF5dGRnY2RtZWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MjI3NjYsImV4cCI6MjA2MjA5ODc2Nn0.vPWGqeHWK7QwFxxv1iL49YOqym3jLydNXN2m9hXkrXk';

const startTracking = (shipmentId) => {
  if (watchId) return; // Hindari memulai jika sudah berjalan
  currentShipmentId = shipmentId;
  
  self.registration.showNotification('TrackShip Sedang Aktif', {
    body: 'Pelacakan lokasi Anda sedang berjalan...',
    tag: 'gps-notification',
    icon: '/logo192.png',
    renotify: true,
    requireInteraction: true,
  });

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetch(`${SUPABASE_URL}/functions/v1/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          shipmentId: currentShipmentId, 
          lat: latitude, 
          lng: longitude 
        }),
      }).catch(error => {
        console.error('Error updating location:', error);
      });
    },
    (error) => {
      console.error('SW Geolocation Error:', error);
    },
    { 
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    }
  );
};

const stopTracking = () => {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  self.registration.getNotifications({ tag: 'gps-notification' }).then(notifications => {
    notifications.forEach(notification => notification.close());
  });
  
  currentShipmentId = null;
};

self.addEventListener('message', (event) => {
  if (event.data.command === 'startTracking') {
    startTracking(event.data.shipmentId);
  } else if (event.data.command === 'stopTracking') {
    stopTracking();
  }
});

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/dashboard-supir');
      }
    })
  );
});
