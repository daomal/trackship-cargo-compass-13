
// Service Worker untuk pelacakan GPS latar belakang
let watchId = null;
let currentShipmentId = null;
const SUPABASE_URL = 'https://adxgzitxnqytdgcdmejt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeGd6aXR4bnF5dGRnY2RtZWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MjI3NjYsImV4cCI6MjA2MjA5ODc2Nn0.vPWGqeHWK7QwFxxv1iL49YOqym3jLydNXN2m9hXkrXk';

const startTracking = (shipmentId) => {
  console.log('SW: Starting tracking for shipment:', shipmentId);
  
  if (watchId) {
    console.log('SW: Tracking already active, stopping previous');
    navigator.geolocation.clearWatch(watchId);
  }
  
  currentShipmentId = shipmentId;
  
  // Check if geolocation is available
  if (!navigator.geolocation) {
    console.error('SW: Geolocation is not supported');
    return;
  }
  
  self.registration.showNotification('TrackShip GPS Aktif', {
    body: 'Pelacakan lokasi real-time sedang berjalan...',
    tag: 'gps-notification',
    icon: '/logo192.png',
    renotify: true,
    requireInteraction: true,
  });

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = new Date(position.timestamp);
      
      console.log('SW: Got location update:', { 
        latitude, 
        longitude, 
        accuracy, 
        timestamp: timestamp.toISOString(),
        shipmentId: currentShipmentId 
      });
      
      // Send location to Edge Function
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
      })
      .then(response => {
        if (!response.ok) {
          console.error('SW: Failed to update location:', response.status, response.statusText);
          return response.text().then(text => {
            console.error('SW: Error response:', text);
          });
        } else {
          console.log('SW: Location updated successfully');
          return response.json();
        }
      })
      .then(data => {
        if (data) {
          console.log('SW: Update response:', data);
        }
      })
      .catch(error => {
        console.error('SW: Network error updating location:', error);
      });
    },
    (error) => {
      console.error('SW: Geolocation Error:', error);
      let errorMessage = 'Error GPS tidak diketahui';
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Izin GPS ditolak. Silakan aktifkan di pengaturan browser.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Lokasi tidak tersedia. Pastikan GPS aktif.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Timeout mendapatkan lokasi. Coba lagi.';
          break;
      }
      
      // Show error notification
      self.registration.showNotification('GPS Error', {
        body: errorMessage,
        tag: 'gps-error',
        icon: '/logo192.png',
      });
    },
    { 
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    }
  );
};

const stopTracking = () => {
  console.log('SW: Stopping tracking');
  
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  // Close all notifications
  self.registration.getNotifications({ tag: 'gps-notification' }).then(notifications => {
    notifications.forEach(notification => notification.close());
  });
  
  self.registration.getNotifications({ tag: 'gps-error' }).then(notifications => {
    notifications.forEach(notification => notification.close());
  });
  
  currentShipmentId = null;
  console.log('SW: Tracking stopped');
};

self.addEventListener('message', (event) => {
  console.log('SW: Received message', event.data);
  if (event.data.command === 'startTracking') {
    startTracking(event.data.shipmentId);
  } else if (event.data.command === 'stopTracking') {
    stopTracking();
  }
});

self.addEventListener('install', (event) => {
  console.log('SW: Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Service Worker activating...');
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
