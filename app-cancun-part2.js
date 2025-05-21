// Funciones de renderizado y utilidades para app-cancun.js

// Renderizar mesas activas en la vista principal
function renderActiveTables() {
    if (!activeTablesContainer) return;
    
    // Limpiar contenedor
    activeTablesContainer.innerHTML = '';
    
    // Filtrar mesas activas y ordenarlas por número
    const activeTables = tables
        .filter(table => table.tableStatus === 'active' || table.tableStatus === 'opening')
        .sort((a, b) => a.tableNumber - b.tableNumber);
    
    if (activeTables.length === 0) {
        activeTablesContainer.innerHTML = `
            <div class="no-tables-message">
                <p>No hay mesas activas en este momento</p>
            </div>
        `;
        return;
    }
    
    // Crear elemento para cada mesa
    activeTables.forEach(table => {
        const tableElement = document.createElement('div');
        tableElement.className = `table-card ${getTableColorClass(table.stake)}`;
        tableElement.id = `table-${table.id}`;
        
        tableElement.innerHTML = `
            <div class="table-header">
                <h3>Mesa ${table.tableNumber} - ${table.gameType}</h3>
                <div class="table-stake">${table.stake}</div>
            </div>
            <div class="table-details">
                <div class="seats-info">
                    <span class="available-seats">${table.availableSeats}</span> puestos disponibles
                </div>
                <div class="buyin-info">
                    Buy-in: $${formatNumber(table.buyinMin)} - $${formatNumber(table.buyinMax)}
                </div>
            </div>
        `;
        
        activeTablesContainer.appendChild(tableElement);
    });
}

// Renderizar listas de espera en la vista principal
function renderWaitingLists() {
    if (!waitingListsContainer) return;
    
    // Limpiar contenedor
    waitingListsContainer.innerHTML = '';
    
    if (players.length === 0) {
        waitingListsContainer.innerHTML = `
            <div class="no-lists-message">
                <p>No hay jugadores en lista de espera</p>
            </div>
        `;
        return;
    }
    
    // Agrupar jugadores por tipo de juego y stake
    const groupedPlayers = groupPlayersByGameAndStake(players);
    
    // Ordenar grupos por tipo de juego y stake
    const sortedGroups = Object.entries(groupedPlayers).sort();
    
    // Crear elemento para cada lista de espera
    sortedGroups.forEach(([groupName, groupPlayers]) => {
        const listElement = createWaitingListElement(groupName, groupPlayers);
        waitingListsContainer.appendChild(listElement);
    });
}

// Crear elemento para una lista de espera
function createWaitingListElement(groupName, players) {
    const listElement = document.createElement('div');
    listElement.className = 'waiting-list-card';
    
    // Ordenar jugadores por timestamp (antiguos primero)
    players.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    const listHeader = document.createElement('div');
    listHeader.className = 'waiting-list-header';
    listHeader.innerHTML = `<h3>${groupName}</h3>`;
    
    const playersList = document.createElement('ul');
    playersList.className = 'players-list';
    
    // Crear elemento para cada jugador
    players.forEach((player, index) => {
        const playerItem = document.createElement('li');
        playerItem.className = `player-item ${player.status.toLowerCase()}`;
        playerItem.id = `player-${player.id}`;
        
        // Verificar si ha cumplido el call time
        const hasCompletedCallTime = hasPlayerCompletedCallTime(player);
        
        playerItem.innerHTML = `
            <span class="player-number">${index + 1}</span>
            <span class="player-name">${player.name}</span>
            <span class="player-status">${player.status}</span>
            ${hasCompletedCallTime ? '<span class="call-time-completed"><i class="fas fa-clock"></i> Call Time cumplido</span>' : ''}
        `;
        
        playersList.appendChild(playerItem);
    });
    
    listElement.appendChild(listHeader);
    listElement.appendChild(playersList);
    
    return listElement;
}

// Renderizar mesas en el panel de administración
function renderAdminTablesList() {
    if (!adminTablesList) return;
    
    // Limpiar contenedor
    adminTablesList.innerHTML = '';
    
    if (tables.length === 0) {
        adminTablesList.innerHTML = '<p>No hay mesas activas</p>';
        return;
    }
    
    // Ordenar mesas por número
    const sortedTables = [...tables].sort((a, b) => a.tableNumber - b.tableNumber);
    
    // Crear lista de mesas
    const tableList = document.createElement('ul');
    tableList.className = 'admin-tables-list';
    
    // Crear elemento para cada mesa
    sortedTables.forEach(table => {
        const tableItem = document.createElement('li');
        tableItem.className = `admin-table-item ${table.tableStatus}`;
        tableItem.id = `admin-table-${table.id}`;
        
        tableItem.innerHTML = `
            <div class="admin-table-info">
                <span class="admin-table-number">Mesa ${table.tableNumber}</span>
                <span class="admin-table-game">${table.gameType} ${table.stake}</span>
                <span class="admin-table-seats">${table.availableSeats} puestos disponibles</span>
            </div>
            <div class="admin-table-actions">
                <button class="update-seats-button" data-table-id="${table.id}">Actualizar Puestos</button>
                <button class="delete-table-button" data-table-id="${table.id}">Eliminar</button>
            </div>
        `;
        
        tableList.appendChild(tableItem);
    });
    
    adminTablesList.appendChild(tableList);
    
    // Añadir event listeners
    addTableActionListeners();
}

// Añadir event listeners para acciones de mesas
function addTableActionListeners() {
    // Botones para actualizar puestos
    const updateSeatsButtons = document.querySelectorAll('.update-seats-button');
    updateSeatsButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tableId = button.getAttribute('data-table-id');
            const table = tables.find(t => t.id === tableId);
            
            if (!table) return;
            
            const newSeats = prompt(`Ingrese el nuevo número de puestos disponibles para Mesa ${table.tableNumber}:`, table.availableSeats);
            
            if (newSeats !== null && !isNaN(newSeats) && newSeats >= 0 && newSeats <= 9) {
                updateTable(tableId, { availableSeats: newSeats });
            } else if (newSeats !== null) {
                showToast('Error', 'Por favor ingrese un número válido entre 0 y 9', 'error');
            }
        });
    });
    
    // Botones para eliminar mesas
    const deleteTableButtons = document.querySelectorAll('.delete-table-button');
    deleteTableButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tableId = button.getAttribute('data-table-id');
            const table = tables.find(t => t.id === tableId);
            
            if (!table) return;
            
            if (confirm(`¿Está seguro de que desea eliminar la Mesa ${table.tableNumber}?`)) {
                deleteTable(tableId);
            }
        });
    });
}

// Renderizar listas de espera en el panel de administración
function renderAdminWaitingLists() {
    if (!adminWaitingLists) return;
    
    // Limpiar contenedor
    adminWaitingLists.innerHTML = '';
    
    if (filteredPlayers.length === 0) {
        adminWaitingLists.innerHTML = '<p>No hay jugadores en lista de espera</p>';
        return;
    }
    
    // Agrupar jugadores por tipo de juego y stake
    const groupedPlayers = groupPlayersByGameAndStake(filteredPlayers);
    
    // Ordenar grupos por tipo de juego y stake
    const sortedGroups = Object.entries(groupedPlayers).sort();
    
    // Crear elemento para cada lista de espera
    sortedGroups.forEach(([groupName, groupPlayers]) => {
        const groupElement = createAdminPlayerGroup(groupName, groupPlayers);
        adminWaitingLists.appendChild(groupElement);
    });
    
    // Añadir event listeners
    addPlayerActionListeners();
}

// Crear grupo de jugadores para panel de administración
function createAdminPlayerGroup(groupName, players) {
    const groupElement = document.createElement('div');
    groupElement.className = 'admin-waiting-list';
    
    // Ordenar jugadores por timestamp (antiguos primero)
    players.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    const groupHeader = document.createElement('h4');
    groupHeader.textContent = groupName;
    
    const playersList = document.createElement('ul');
    playersList.className = 'admin-players-list';
    
    // Crear elemento para cada jugador
    players.forEach((player, index) => {
        const playerItem = document.createElement('li');
        playerItem.className = `admin-player-item ${player.status.toLowerCase()}`;
        playerItem.id = `admin-player-${player.id}`;
        
        // Verificar si ha cumplido el call time
        const hasCompletedCallTime = hasPlayerCompletedCallTime(player);
        
        playerItem.innerHTML = `
            <div class="admin-player-info">
                <span class="admin-player-number">${index + 1}</span>
                <span class="admin-player-name">${player.name}</span>
                <span class="admin-player-status">${player.status}</span>
                ${hasCompletedCallTime ? '<span class="call-time-indicator completed"><i class="fas fa-clock"></i></span>' : ''}
            </div>
            <div class="admin-player-actions">
                <button class="update-status-button" data-player-id="${player.id}">Cambiar Estado</button>
                <button class="delete-player-button" data-player-id="${player.id}">Eliminar</button>
            </div>
        `;
        
        playersList.appendChild(playerItem);
    });
    
    // Si no hay jugadores, mostrar mensaje
    if (players.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'empty-list';
        emptyMessage.textContent = 'No hay jugadores en esta lista';
        playersList.appendChild(emptyMessage);
    }
    
    groupElement.appendChild(groupHeader);
    groupElement.appendChild(playersList);
    
    return groupElement;
}

// Añadir event listeners para acciones de jugadores
function addPlayerActionListeners() {
    // Botones para cambiar estado
    const updateStatusButtons = document.querySelectorAll('.update-status-button');
    updateStatusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const playerId = button.getAttribute('data-player-id');
            const player = players.find(p => p.id === playerId);
            
            if (!player) return;
            
            const statusOptions = ['Presente', 'Ausente', 'Jugando', 'Cambio de Mesa'];
            const currentIndex = statusOptions.indexOf(player.status);
            const statusSelect = document.createElement('select');
            
            // Crear opciones para el select
            statusOptions.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = status;
                option.selected = status === player.status;
                statusSelect.appendChild(option);
            });
            
            // Crear modal para cambiar estado
            const modal = document.createElement('div');
            modal.className = 'status-change-modal';
            modal.innerHTML = `
                <div class="status-change-content">
                    <h3>Cambiar Estado de ${player.name}</h3>
                    <div class="form-group">
                        <label for="new-status">Nuevo Estado:</label>
                        <div id="status-select-container"></div>
                    </div>
                    <div class="modal-buttons">
                        <button id="cancel-status-change" class="secondary-button">Cancelar</button>
                        <button id="confirm-status-change" class="gold-button">Guardar</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            document.getElementById('status-select-container').appendChild(statusSelect);
            
            // Event listeners para botones
            document.getElementById('cancel-status-change').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            document.getElementById('confirm-status-change').addEventListener('click', () => {
                const newStatus = statusSelect.value;
                updatePlayer(playerId, { status: newStatus });
                document.body.removeChild(modal);
            });
        });
    });
    
    // Botones para eliminar jugadores
    const deletePlayerButtons = document.querySelectorAll('.delete-player-button');
    deletePlayerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const playerId = button.getAttribute('data-player-id');
            const player = players.find(p => p.id === playerId);
            
            if (!player) return;
            
            if (confirm(`¿Está seguro de que desea eliminar a ${player.name}?`)) {
                deletePlayer(playerId);
            }
        });
    });
}

// Funciones de utilidad
// Agrupar jugadores por tipo de juego y stake
function groupPlayersByGameAndStake(playersList) {
    const grouped = {};
    
    playersList.forEach(player => {
        const key = `${player.gameType} ${player.stake}`;
        
        if (!grouped[key]) {
            grouped[key] = [];
        }
        
        grouped[key].push(player);
    });
    
    return grouped;
}

// Obtener clase de color para mesa según stake
function getTableColorClass(stake) {
    if (stake.includes('$25/$50')) {
        return 'green';
    } else if (stake.includes('$50/$50') || stake.includes('$50/$100')) {
        return 'blue';
    } else if (stake.includes('$100/$100') || stake.includes('$100/$200')) {
        return 'purple';
    } else if (stake.includes('Botón')) {
        return 'orange';
    }
    return 'blue'; // Color por defecto
}

// Formatear número con separador de miles
function formatNumber(num) {
    return new Intl.NumberFormat('es-MX').format(num);
}

// Verificar si un jugador ha cumplido su call time
function hasPlayerCompletedCallTime(player) {
    if (player.status !== 'Jugando' || !player.startTime) {
        return false;
    }
    
    const now = new Date().getTime();
    const elapsedHours = (now - player.startTime) / (1000 * 60 * 60);
    
    // Determinar call time según stake del jugador
    let callTimeHours = 2; // Por defecto para $25/$50
    if (player.stake && 
        (player.stake.includes('$50/$100') || 
         player.stake.includes('$100/$100') || 
         player.stake.includes('$100/$200') ||
         player.stake.includes('Botón'))) {
        callTimeHours = 3;
    }
    
    return elapsedHours >= callTimeHours;
}

// Actualizar fecha y hora en el header
function updateDateTime() {
    if (!currentDateTimeElement) return;
    
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    const formattedDate = now.toLocaleDateString('es-MX', options);
    currentDateTimeElement.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

// Sistema de notificaciones Toast
function showToast(title, message, type = 'info') {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-header">
            <strong>${title}</strong>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Contenedor de toasts
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Añadir toast al contenedor
    toastContainer.appendChild(toast);
    
    // Botón para cerrar toast
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Datos de demostración para mesas
function addDemoTablesData() {
    const demoTables = [
        {
            tableNumber: 1,
            gameType: 'Texas NLHE',
            stake: '$25/$50',
            buyinMin: 2000,
            buyinMax: 10000,
            availableSeats: 3,
            tableStatus: 'active',
            callTime: 2
        },
        {
            tableNumber: 2,
            gameType: 'Omaha PLO',
            stake: '$50/$100',
            buyinMin: 5000,
            buyinMax: 20000,
            availableSeats: 5,
            tableStatus: 'active',
            callTime: 3
        },
        {
            tableNumber: 3,
            gameType: 'Texas NLHE',
            stake: '$100/$200',
            buyinMin: 10000,
            buyinMax: 50000,
            availableSeats: 7,
            tableStatus: 'active',
            callTime: 3
        }
    ];
    
    // Añadir cada mesa a Firebase
    demoTables.forEach(table => {
        const tableId = generateId();
        table.timestamp = firebase.database.ServerValue.TIMESTAMP;
        tablesRef.child(tableId).set(table)
            .then(() => console.log(`Mesa ${table.tableNumber} añadida`))
            .catch(error => console.error(`Error añadiendo mesa ${table.tableNumber}:`, error));
    });
}

// Datos de demostración para jugadores
function addDemoPlayersData() {
    const now = new Date().getTime();
    const oneHourAgo = now - (60 * 60 * 1000);
    const twoHoursAgo = now - (2 * 60 * 60 * 1000);
    const threeHoursAgo = now - (3 * 60 * 60 * 1000);
    
    const demoPlayers = [
        {
            name: 'Miguel Ángel',
            gameType: 'Texas NLHE',
            stake: '$25/$50',
            status: 'Presente',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        },
        {
            name: 'Carlos Ramírez',
            gameType: 'Texas NLHE',
            stake: '$25/$50',
            status: 'Ausente',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        },
        {
            name: 'Ana González',
            gameType: 'Texas NLHE',
            stake: '$25/$50',
            status: 'Jugando',
            startTime: twoHoursAgo,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        },
        {
            name: 'Roberto Torres',
            gameType: 'Omaha PLO',
            stake: '$50/$100',
            status: 'Presente',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        },
        {
            name: 'Laura Sánchez',
            gameType: 'Omaha PLO',
            stake: '$50/$100',
            status: 'Jugando',
            startTime: oneHourAgo,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        },
        {
            name: 'Francisco López',
            gameType: 'Texas NLHE',
            stake: '$100/$200',
            status: 'Jugando',
            startTime: threeHoursAgo,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }
    ];
    
    // Añadir cada jugador a Firebase
    demoPlayers.forEach(player => {
        const playerId = generateId();
        playersRef.child(playerId).set(player)
            .then(() => console.log(`Jugador ${player.name} añadido`))
            .catch(error => console.error(`Error añadiendo jugador ${player.name}:`, error));
    });
}
