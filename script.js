
// Configuración
let BASE_DIR = 'To_Send_Files/';

let selectionMode = false;
let selectedFiles = new Set();
let currentPath = '';

// Elementos DOM
const fileGrid = document.getElementById('fileGrid');
const selectBtn = document.getElementById('selectBtn');
const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const refreshBtn = document.getElementById('refreshBtn');
const pathBar = document.getElementById('pathBar');

// Función para construir rutas
function buildFullPath(relativePath) {
    relativePath = relativePath.replace(BASE_DIR, '');
    relativePath = relativePath.replace(/^\//, '');
    return BASE_DIR + relativePath;
}

// Obtener archivos del servidor
async function fetchFiles(path = '') {
    currentPath = path;
    try {
        const fullPath = buildFullPath(path);
        const response = await fetch(`${fullPath}?list=1`);
        if (!response.ok) throw new Error('Error al cargar archivos');

        const data = await response.text();
        return parseFileList(data);
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// Parsear lista de archivos
function parseFileList(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr');
    const files = [];

    rows.forEach(row => {
        if (row.querySelector('th') || row.querySelector('hr')) return;

        const link = row.querySelector('a');
        if (!link) return;

        const name = link.textContent.replace(/\/$/, '');
        const isDir = link.href.endsWith('/');
        const href = link.getAttribute('href');

        if (name !== 'Parent Directory' && !href.includes('?')) {
            files.push({
                name,
                href: href.startsWith(BASE_DIR) ? href : BASE_DIR + href,
                isDir,
            });
        }
    });

    return files;
}

// Mostrar archivos en la interfaz
function renderFiles(files) {
    fileGrid.innerHTML = '';

    files.forEach(file => {
        const card = document.createElement('div');
        card.className = `file-card ${file.isDir ? 'folder' : ''}`;
        card.dataset.href = file.href;

        card.innerHTML = `
            <div class="file-icon">${file.isDir ? '📁' : '📄'}</div>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-actions">
                ${file.isDir ?
                `<button class="btn open-btn" data-href="${file.href}">Abrir</button>` :
                `<button class="btn download-btn" data-href="${file.href}">Descargar</button>`
            }
            </div>
        `;

        // Si el archivo ya estaba seleccionado, aplicamos el estilo
        if (selectedFiles.has(file.href)) {
            card.classList.add('selected');
        }

        fileGrid.appendChild(card);
    });

    // Actualizar barra de ruta
    switchFolderBtn.textContent = `/${BASE_DIR}`;


    // Agregar event listeners para acciones
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => downloadFile(btn.dataset.href));
    });

    document.querySelectorAll('.open-btn').forEach(btn => {
        btn.addEventListener('click', () => openFolder(btn.dataset.href));
    });
}

// Descargar archivo individual
function downloadFile(href) {
    const fullPath = buildFullPath(href);
    const fileName = href.split('/').pop();

    fetch(fullPath)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(err => console.error('Error al descargar:', err));
}

// Abrir carpeta
function openFolder(href) {
    const newPath = buildFullPath(href);
    fetchFiles(newPath.replace(BASE_DIR, '')).then(renderFiles);
}

// Modo selección
function toggleSelectionMode() {
    selectionMode = !selectionMode;
    selectBtn.textContent = selectionMode ? 'Cancel' : 'Select';

    // Activar/desactivar modo de selección visual
    if (selectionMode) {
        document.body.classList.add('selection-mode');
    } else {
        document.body.classList.remove('selection-mode');

        // Limpiar selección al salir del modo
        selectedFiles.clear();
        downloadSelectedBtn.disabled = true;

        // Quitar estilos de selección
        document.querySelectorAll('.file-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
    }
}

// Manejar selección por clic en card
function handleCardSelection(card) {
    const href = card.dataset.href;

    // Ignorar carpetas en modo selección
    if (card.classList.contains('folder')) return;

    if (selectedFiles.has(href)) {
        selectedFiles.delete(href);
        card.classList.remove('selected');
    } else {
        selectedFiles.add(href);
        card.classList.add('selected');
    }

    downloadSelectedBtn.disabled = selectedFiles.size === 0;
}

// Descargar archivos seleccionados
function downloadSelected() {
    selectedFiles.forEach(href => {
        const fullPath = buildFullPath(href);
        const fileName = href.split('/').pop();

        fetch(fullPath)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(err => console.error('Error al descargar:', err));
    });
}

// Descargar todos los archivos
function downloadAllFiles() {
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.click();
    });
}

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');

// Abrir diálogo al hacer clic
uploadBtn.addEventListener('click', () => fileInput.click());

// Manejar subida
fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('upload.php', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Archivo subido con éxito');
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        alert('❌ Error de red o del servidor');
        console.error(error);
    } finally {
        fileInput.value = ''; // Resetear input
    }
});


// Event Listeners
selectBtn.addEventListener('click', toggleSelectionMode);
downloadSelectedBtn.addEventListener('click', downloadSelected);
downloadAllBtn.addEventListener('click', downloadAllFiles);
refreshBtn.addEventListener('click', () => window.location.reload());

// Evento para selección por clic en card
fileGrid.addEventListener('click', function (event) {
    if (!selectionMode) return;

    const card = event.target.closest('.file-card');
    if (card) {
        handleCardSelection(card);
    }
});

const switchFolderBtn = document.getElementById('switchFolderBtn');

switchFolderBtn.addEventListener('click', () => {
    // Alternar entre las dos carpetas raíz
    BASE_DIR = (BASE_DIR === 'To_Send_Files/') ? 'Recieved_Files/' : 'To_Send_Files/';

    // Reiniciar la ruta interna
    currentPath = '';

    // Recargar lista de archivos
    fetchFiles('').then(renderFiles);
});


const backBtn = document.getElementById('backBtn');

backBtn.addEventListener('click', () => {
    if (currentPath) {
        let parts = currentPath.split('/').filter(Boolean);
        parts.pop(); // Quita la última carpeta
        const newPath = parts.join('/');
        fetchFiles(newPath).then(renderFiles);
    }
});



// Inicializar
fetchFiles().then(renderFiles);
