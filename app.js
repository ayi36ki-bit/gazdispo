// === VARIABLES ===
var map;
var markers = [];
var stations = [];
var currentLang = 'fr';
var db;

var translations = {
    fr: {
        available: "Disponible",
        limited: "Stock limité",
        unavailable: "Rupture",
        search: "Rechercher un quartier...",
        updatedAt: "Mis à jour il y a",
        minutes: "min",
        hours: "h",
        noStations: "Aucun point de vente trouvé"
    },
    moore: {
        available: "A be",
        limited: "A tara kelgã",
        unavailable: "A tɩ be",
        search: "Kãsem tẽnga...",
        updatedAt: "Yãmb sã",
        minutes: "minit",
        hours: "wakat",
        noStations: "Gaz yõodo tɩ be"
    }
};

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser Firebase
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp({
                apiKey: "AIzaSyAPRPagTMM5etUPT7T-rBgKikV2QmVHoAQ",
                authDomain: "gazdispo-5a9b1.firebaseapp.com",
                databaseURL: "https://gazdispo-5a9b1-default-rtdb.europe-west1.firebasedatabase.app",
                projectId: "gazdispo-5a9b1",
                storageBucket: "gazdispo-5a9b1.firebasestorage.app",
                messagingSenderId: "815895848815",
                appId: "1:815895848815:web:d6fdc94accc1f670ac6a9a"
            });
        }
        db = firebase.database();
        console.log('✅ Firebase OK!');
    } catch(e) {
        console.error('❌ Erreur Firebase:', e);
    }

    // Langue
    currentLang = localStorage.getItem('gazdispo_lang') || 'fr';
    var langSelector = document.getElementById('languageSelector');
    if (langSelector) langSelector.value = currentLang;

    // Initialiser la carte
    initMap();

    // Charger les stations
    loadStations();

    // Events
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            var query = e.target.value.toLowerCase();
            var filtered = stations.filter(function(s) {
                return s.name.toLowerCase().includes(query) || s.address.toLowerCase().includes(query);
            });
            afficherStations(filtered);
            updateMap(filtered);
        });
    }

    var refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadStations();
        });
    }

    var langSel = document.getElementById('languageSelector');
    if (langSel) {
        langSel.addEventListener('change', function(e) {
            currentLang = e.target.value;
            localStorage.setItem('gazdispo_lang', currentLang);
            afficherStations(stations);
        });
    }
});

// === CARTE ===
function initMap() {
    map = L.map('map').setView([12.3714, -1.5197], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

// === CHARGER STATIONS ===
function loadStations() {
    if (!db) {
        console.error('Firebase non initialisé');
        return;
    }

    console.log('Chargement des stations...');

    db.ref('stations').on('value', function(snapshot) {
        var data = snapshot.val();

        if (data) {
            stations = Object.values(data);
            console.log('✅ Stations:', stations.length);
        } else {
            console.log('Aucune station');
            stations = [];
        }

        afficherStations(stations);
        updateMap(stations);

        // Heure de mise à jour
        var now = new Date();
        var timeEl = document.getElementById('lastUpdateTime');
        if (timeEl) {
            timeEl.textContent = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
        }

        // Cache hors ligne
        localStorage.setItem('gazdispo_cache', JSON.stringify(stations));
    });
}

// === AFFICHER STATIONS ===
function afficherStations(liste) {
    var container = document.getElementById('stationsList');
    if (!container) return;

    var t = translations[currentLang];

    if (liste.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;color:#999;">' + t.noStations + '</p>';
        return;
    }

    var html = '';
    for (var i = 0; i < liste.length; i++) {
        var s = liste[i];
        var statusText = t[s.status] || s.status;
        var diff = Date.now() - s.updatedAt;
        var timeAgo = Math.floor(diff / 60000) + ' ' + t.minutes;
        if (diff > 3600000) timeAgo = Math.floor(diff / 3600000) + ' ' + t.hours;

        html += '<div class="station-card ' + s.status + '" onclick="focusStation(\'' + s.id + '\')">';
        html += '<div class="station-header">';
        html += '<div class="station-name">' + s.name + '</div>';
        html += '<div class="station-status ' + s.status + '">';
        html += '<span class="status-dot ' + s.status + '"></span>' + statusText;
        html += '</div></div>';
        html += '<div class="station-address">📍 ' + s.address + '</div>';
       if (s.phone) {
    html += '<div class="station-phone">📞 <a href="tel:' + s.phone + '" style="color:#00A651;text-decoration:none;">' + s.phone + '</a></div>';
} html += '<div class="station-updated">' + t.updatedAt + ' ' + timeAgo + '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

// === CARTE MARQUEURS ===
function updateMap(liste) {
    markers.forEach(function(m) { map.removeLayer(m); });
    markers = [];

    liste.forEach(function(s) {
        var color = s.status === 'available' ? '#00A651' :
                    s.status === 'limited' ? '#FCD116' : '#EF2B2D';

        var marker = L.marker([s.lat, s.lng], {
            icon: L.divIcon({
                className: '',
                html: '<div style="background:' + color + ';width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
                iconSize: [28, 28]
            })
        }).addTo(map);

        var t = translations[currentLang];
        marker.bindPopup('<strong>' + s.name + '</strong><br>' + s.address + '<br><span style="color:' + color + ';">' + (t[s.status] || s.status) + '</span>');
        markers.push(marker);
    });
}

// === FOCUS STATION ===
function focusStation(id) {
    var s = stations.find(function(st) { return st.id === id; });
    if (s) {
        map.setView([s.lat, s.lng], 15);
        markers.forEach(function(m) {
            if (m.getLatLng().lat === s.lat && m.getLatLng().lng === s.lng) {
                m.openPopup();
            }
        });
    }
}