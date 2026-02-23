// === VARIABLES ===
const ADMIN_PASSWORD = 'admin123';
let isLoggedIn = false;
let stations = [];
let db;

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
        console.log('✅ Firebase Admin OK!');
    } catch(e) {
        console.error('❌ Erreur Firebase:', e);
    }

    // Vérifier si déjà connecté
    var loggedIn = sessionStorage.getItem('gazdispo_admin_logged');
    if (loggedIn === 'true') {
        isLoggedIn = true;
        showAdminPanel();
        loadStations();
    }

    // Login form
    var loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var password = document.getElementById('passwordInput').value;
        if (password === ADMIN_PASSWORD) {
            isLoggedIn = true;
            sessionStorage.setItem('gazdispo_admin_logged', 'true');
            showAdminPanel();
            loadStations();
        } else {
            alert('Mot de passe incorrect');
        }
    });

    // Add station form
    var addForm = document.getElementById('addStationForm');
    addForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addStation();
    });
});

// === AFFICHER PANEL ADMIN ===
function showAdminPanel() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
}

// === CHARGER LES STATIONS ===
function loadStations() {
    console.log('Chargement depuis Firebase...');

    db.ref('stations').on('value', function(snapshot) {
        var data = snapshot.val();
        if (data) {
            stations = Object.values(data);
            console.log('Stations chargées:', stations.length);
        } else {
            stations = [];
        }
        afficherStations();
    });
}

// === AFFICHER LES STATIONS ===
function afficherStations() {
    var container = document.getElementById('adminStationsList');

    if (stations.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;color:#999;">Aucune station. Ajoutez-en une !</p>';
        return;
    }

    var html = '';
    for (var i = 0; i < stations.length; i++) {
        var s = stations[i];
        html += '<div class="admin-station-card">';
        html += '<div class="admin-station-info">';
        html += '<div class="admin-station-name">' + s.name + '</div>';
        html += '<div class="admin-station-address">📍 ' + s.address + '</div>';
        html += '</div>';
        html += '<div class="admin-station-actions">';
        html += '<button class="status-btn available' + (s.status === "available" ? " active" : "") + '" onclick="changerStatut(\'' + s.id + '\', \'available\')">✅ Disponible</button>';
        html += '<button class="status-btn limited' + (s.status === "limited" ? " active" : "") + '" onclick="changerStatut(\'' + s.id + '\', \'limited\')">⚠️ Limité</button>';
        html += '<button class="status-btn unavailable' + (s.status === "unavailable" ? " active" : "") + '" onclick="changerStatut(\'' + s.id + '\', \'unavailable\')">❌ Rupture</button>';
        html += '<button class="btn-delete" onclick="supprimerStation(\'' + s.id + '\')">🗑️ Supprimer</button>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

// === AJOUTER UNE STATION ===
function addStation() {
    var name = document.getElementById('stationName').value.trim();
    var address = document.getElementById('stationAddress').value.trim();
    var lat = parseFloat(document.getElementById('stationLat').value);
    var lng = parseFloat(document.getElementById('stationLng').value);
    var status = document.getElementById('stationStatus').value;

    if (!name || !address) {
        alert('Remplissez le nom et l\'adresse !');
        return;
    }

    if (isNaN(lat) || isNaN(lng)) {
        alert('Coordonnées invalides !');
        return;
    }

    var id = 'station_' + Date.now();

    var station = {
        id: id,
        name: name,
        address: address,
        lat: lat,
        lng: lng,
        status: status,
        updatedAt: Date.now()
    };

    console.log('Envoi vers Firebase:', station);

    db.ref('stations/' + id).set(station)
        .then(function() {
            console.log('✅ Sauvegardé dans Firebase!');
            document.getElementById('addStationForm').reset();
            afficherMessage('✅ Station ajoutée !');
        })
        .catch(function(error) {
            console.error('Erreur:', error);
            alert('Erreur: ' + error.message);
        });
}

// === CHANGER STATUT ===
function changerStatut(id, statut) {
    db.ref('stations/' + id).update({
        status: statut,
        updatedAt: Date.now()
    })
    .then(function() {
        afficherMessage('✅ Statut mis à jour !');
    })
    .catch(function(e) {
        alert('Erreur: ' + e.message);
    });
}

// === SUPPRIMER ===
function supprimerStation(id) {
    if (confirm('Supprimer cette station ?')) {
        db.ref('stations/' + id).remove()
            .then(function() {
                afficherMessage('✅ Station supprimée !');
            })
            .catch(function(e) {
                alert('Erreur: ' + e.message);
            });
    }
}

// === MESSAGE ===
function afficherMessage(msg) {
    var el = document.createElement('div');
    el.className = 'success-message';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 3000);
}
