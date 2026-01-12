// Service Worker for BnBPlug
console.log('Service Worker loaded');

self.addEventListener('install', function(event) {
    console.log('Service Worker installed');
});

self.addEventListener('fetch', function(event) {
    // Let browser handle navigation
    return;
});
