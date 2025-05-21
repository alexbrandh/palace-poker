// Configuración de Firebase para Palace Poker Room
const firebaseConfig = {
    apiKey: "AIzaSyDdTlhwvEzHTnRqGmLhUARucCgw7K76XJE",
    authDomain: "lista-de-espera-palace.firebaseapp.com",
    databaseURL: "https://lista-de-espera-palace-default-rtdb.firebaseio.com",
    projectId: "lista-de-espera-palace",
    storageBucket: "lista-de-espera-palace.appspot.com",
    messagingSenderId: "1001196881051",
    appId: "1:1001196881051:web:9af1c75de15c15b41fc0e0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencia a la base de datos
const db = firebase.database();

// Esta aplicación es específica para Cancún
const currentLocation = 'cancun';
console.log(`Aplicación inicializada para: ${currentLocation}`);

// Referencia a la ubicación actual
const locationRef = db.ref(`locations/${currentLocation}`);
const tablesRef = locationRef.child('tables');
const playersRef = locationRef.child('players');

// Variables para almacenar datos en memoria
let tables = [];
let players = [];
let filteredPlayers = [];

// DOM Elements
const adminButton = document.getElementById('admin-button');
const loginModal = document.getElementById('login-modal');
const adminDashboard = document.getElementById('admin-dashboard');
const closeLoginModal = document.querySelector('#login-modal .close');
const closeAdminModal = document.querySelector('#admin-dashboard .close');
const loginForm = document.getElementById('login-form');
const tableForm = document.getElementById('table-form');
const playerForm = document.getElementById('player-form');
const adminTablesTab = document.getElementById('tables-tab');
const adminPlayersTab = document.getElementById('players-tab');
const tabButtons = document.querySelectorAll('.tab-button');
const adminTablesList = document.getElementById('admin-tables-list');
const adminWaitingLists = document.getElementById('admin-waiting-lists');
const adminListFilter = document.getElementById('admin-list-filter');
const activeTablesContainer = document.getElementById('active-tables-container');
const waitingListsContainer = document.getElementById('waiting-lists-container');
const currentDateTimeElement = document.getElementById('current-date-time');
const currentYearElement = document.getElementById('current-year');

// Authentication (Simplificada para demostración)
const adminCredentials = {
    username: 'admin',
    password: 'poker123'
};

// Función para generar IDs únicos
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update time every minute
    
    // Set up event listeners
    setupEventListeners();
    
    // Update year in footer
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    // Configure Firebase Listeners
    setupRealtimeListeners();
    
    // Add demo data if collections are empty
    checkAndAddDemoData();
});

// Función para configurar escuchas en tiempo real con Firebase
function setupRealtimeListeners() {
    // Escuchar cambios en mesas
    tablesRef.on('value', (snapshot) => {
        tables = [];
        snapshot.forEach((childSnapshot) => {
            const tableId = childSnapshot.key;
            const tableData = childSnapshot.val();
            tables.push({ id: tableId, ...tableData });
        });
        console.log("Mesas actualizadas:", tables.length);
        renderActiveTables();
        renderAdminTablesList();
    }, (error) => {
        console.error("Error obteniendo mesas:", error);
        showToast('Error', 'No se pudieron cargar las mesas', 'error');
    });
    
    // Escuchar cambios en jugadores
    playersRef.on('value', (snapshot) => {
        players = [];
        snapshot.forEach((childSnapshot) => {
            const playerId = childSnapshot.key;
            const playerData = childSnapshot.val();
            players.push({ id: playerId, ...playerData });
        });
        console.log("Jugadores actualizados:", players.length);
        
        // Actualizar jugadores filtrados para la interfaz de administración
        updateFilteredPlayers();
        
        renderWaitingLists();
        renderAdminWaitingLists();
    }, (error) => {
        console.error("Error obteniendo jugadores:", error);
        showToast('Error', 'No se pudieron cargar los jugadores', 'error');
    });
}

// Actualizar lista de jugadores filtrados
function updateFilteredPlayers() {
    if (adminListFilter) {
        const filterValue = adminListFilter.value;
        if (filterValue === 'all') {
            filteredPlayers = [...players];
        } else {
            filteredPlayers = players.filter(player => 
                player.gameType === filterValue || 
                player.status === filterValue
            );
        }
    } else {
        filteredPlayers = [...players];
    }
}

// Comprobar si hay datos y añadir datos de demostración si es necesario
function checkAndAddDemoData() {
    tablesRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            console.log("No hay mesas en la base de datos, añadiendo datos de demostración");
            addDemoTablesData();
        }
    }).catch(error => {
        console.error("Error comprobando mesas:", error);
    });
    
    playersRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            console.log("No hay jugadores en la base de datos, añadiendo datos de demostración");
            addDemoPlayersData();
        }
    }).catch(error => {
        console.error("Error comprobando jugadores:", error);
    });
}

// Funciones para manipular mesas
function addTable(tableData) {
    // Generar nuevo ID si no tiene uno
    const tableId = tableData.id || generateId();
    
    // Añadir marca de tiempo
    tableData.timestamp = firebase.database.ServerValue.TIMESTAMP;
    
    // Añadir la mesa a Firebase
    tablesRef.child(tableId).set(tableData)
        .then(() => {
            showToast('Éxito', `Mesa ${tableData.tableNumber} añadida`, 'success');
            if (tableForm) tableForm.reset();
        })
        .catch(error => {
            console.error("Error añadiendo mesa:", error);
            showToast('Error', `No se pudo añadir la mesa: ${error.message}`, 'error');
        });
}

function updateTable(tableId, tableData) {
    tablesRef.child(tableId).update(tableData)
        .then(() => {
            showToast('Éxito', `Mesa ${tableData.tableNumber || ''} actualizada`, 'success');
        })
        .catch(error => {
            console.error("Error actualizando mesa:", error);
            showToast('Error', `No se pudo actualizar la mesa: ${error.message}`, 'error');
        });
}

function deleteTable(tableId) {
    tablesRef.child(tableId).remove()
        .then(() => {
            showToast('Éxito', 'Mesa eliminada', 'success');
        })
        .catch(error => {
            console.error("Error eliminando mesa:", error);
            showToast('Error', `No se pudo eliminar la mesa: ${error.message}`, 'error');
        });
}

// Funciones para manipular jugadores
function addPlayer(playerData) {
    // Generar nuevo ID si no tiene uno
    const playerId = playerData.id || generateId();
    
    // Añadir marca de tiempo
    playerData.timestamp = firebase.database.ServerValue.TIMESTAMP;
    
    // Si el estado es Jugando, establecer la hora de inicio
    if (playerData.status === 'Jugando') {
        playerData.startTime = new Date().getTime();
    }
    
    // Añadir el jugador a Firebase
    playersRef.child(playerId).set(playerData)
        .then(() => {
            showToast('Éxito', `Jugador ${playerData.name} añadido`, 'success');
            if (playerForm) playerForm.reset();
        })
        .catch(error => {
            console.error("Error añadiendo jugador:", error);
            showToast('Error', `No se pudo añadir el jugador: ${error.message}`, 'error');
        });
}

function updatePlayer(playerId, playerData) {
    // Si se cambia el estado a Jugando y no había hora de inicio, establecerla
    if (playerData.status === 'Jugando' && !playerData.startTime) {
        playerData.startTime = new Date().getTime();
    }
    
    playersRef.child(playerId).update(playerData)
        .then(() => {
            showToast('Éxito', `Jugador ${playerData.name || ''} actualizado`, 'success');
        })
        .catch(error => {
            console.error("Error actualizando jugador:", error);
            showToast('Error', `No se pudo actualizar el jugador: ${error.message}`, 'error');
        });
}

function deletePlayer(playerId) {
    playersRef.child(playerId).remove()
        .then(() => {
            showToast('Éxito', 'Jugador eliminado', 'success');
        })
        .catch(error => {
            console.error("Error eliminando jugador:", error);
            showToast('Error', `No se pudo eliminar el jugador: ${error.message}`, 'error');
        });
}

// Función para configurar todos los event listeners
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Admin button opens login modal
    if (adminButton) {
        console.log('Configurando botón de admin');
        // Eliminar cualquier event listener anterior
        const newAdminButton = adminButton.cloneNode(true);
        adminButton.parentNode.replaceChild(newAdminButton, adminButton);
        
        // Añadir nuevo event listener
        newAdminButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botón de admin clickeado');
            if (loginModal) {
                loginModal.style.display = 'block';
                console.log('Modal mostrado');
            } else {
                console.error('Modal no encontrado');
            }
        });
    } else {
        console.error('Botón de admin no encontrado');
    }
    
    // Close modals
    const closeButtons = document.querySelectorAll('.close');
    console.log('Botones de cierre encontrados:', closeButtons.length);
    
    closeButtons.forEach(button => {
        // Eliminar event listeners anteriores
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Añadir nuevo event listener
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botón de cierre clickeado');
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                console.log('Modal cerrado');
            }
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            // Solo cerrar si se hace click directamente en el modal (no en su contenido)
            if (e.target === this) {
                console.log('Click fuera del modal, cerrando');
                this.style.display = 'none';
            }
        });
    });
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (username === adminCredentials.username && password === adminCredentials.password) {
                loginModal.style.display = 'none';
                adminDashboard.style.display = 'block';
                
                renderAdminTablesList();
                renderAdminWaitingLists();
                
                // Reset form
                loginForm.reset();
            } else {
                showToast('Error', 'Credenciales incorrectas', 'error');
            }
        });
    }
    
    // Tab switching
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const tabName = button.getAttribute('data-tab');
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    }
    
    // Table form submission
    if (tableForm) {
        tableForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const tableData = {
                tableNumber: document.getElementById('table-number').value,
                gameType: document.getElementById('game-type').value,
                stake: document.getElementById('stake').value,
                buyinMin: document.getElementById('buyinMin').value,
                buyinMax: document.getElementById('buyinMax').value,
                availableSeats: document.getElementById('availableSeats').value,
                tableStatus: document.getElementById('tableStatus').value,
                callTime: document.getElementById('callTime').value
            };
            
            addTable(tableData);
        });
    }
    
    // Player form submission
    if (playerForm) {
        playerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const playerData = {
                name: document.getElementById('player-name').value,
                gameType: document.getElementById('player-game-type').value,
                stake: document.getElementById('player-stake').value,
                status: document.getElementById('player-status').value
            };
            
            addPlayer(playerData);
        });
    }
    
    // Admin list filter
    if (adminListFilter) {
        adminListFilter.addEventListener('change', () => {
            updateFilteredPlayers();
            renderAdminWaitingLists();
        });
    }
}
