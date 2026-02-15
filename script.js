// ---------------------------------------------------------------------------------------------------
    // INICIO DEL BLOQUE JAVASCRIPT MEJORADO
    // ---------------------------------------------------------------------------------------------------

    document.addEventListener('DOMContentLoaded', async () => {

   // ---------------------------------------------------------------------------------------------------
    // MODIFICACIÓN 3: ROBUSTEZ DOM (Función de seguridad)
    // INICIO BLOQUE MODIFICADO
    // ---------------------------------------------------------------------------------------------------
    
    // Función helper para obtener elementos de forma segura sin romper la ejecución
    const safeGet = (id) => {
        const el = document.getElementById(id);
        if (!el) console.warn(`⚠️ Advertencia DOM: El elemento con ID '${id}' no existe en este HTML.`);
        return el;
    };

    // Uso de safeGet en referencias críticas para evitar errores de "null"
    const welcome = safeGet('welcome');
    const auth = safeGet('auth');
    const subjectsScreen = safeGet('subjects');
    const profileScreen = safeGet('profile');
    const dashboardScreen = safeGet('dashboard'); 
    const modalMask = safeGet('protectedModal');

    // ---------------------------------------------------------------------------------------------------
    // FIN BLOQUE MODIFICADO
    // ---------------------------------------------------------------------------------------------------
  
    // -------------------------------------------------------------------
    // CORRECCIÓN ESTRUCTURAL DE AVATAR (Parche de Inicio)
    // -------------------------------------------------------------------
    // Esto se ejecuta al abrir la web: Busca la etiqueta <img> rota y la cambia por un <div>
    (function fixAvatarStructure() {
        const brokenAvatar = document.getElementById('dashAvatar');
        // Solo actuamos si es una IMAGEN (que es lo que da el error del icono oscuro)
        if (brokenAvatar && brokenAvatar.tagName === 'IMG') {
            const fixedDiv = document.createElement('div');
            fixedDiv.id = 'dashAvatar'; // Mantenemos el ID para que showDashboard lo encuentre
            fixedDiv.className = brokenAvatar.className; // Mantenemos tus estilos
            
            // Forzamos que sea un círculo gris claro perfecto para Emojis
            fixedDiv.style.cssText = `
                width: 100px; 
                height: 100px; 
                border-radius: 50%; 
                background: #f1f5f9; 
                border: 2px solid #cbd5e1;
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-size: 3.5rem; 
                margin: 0 auto 15px auto;
                line-height: 1;
            `;
            fixedDiv.textContent = "👤"; // Emoji por defecto mientras carga el usuario
            
            brokenAvatar.parentNode.replaceChild(fixedDiv, brokenAvatar);
            console.log("✅ Estructura de Avatar reparada: IMG -> DIV");
        }
    })();

    // ---------------------------------------------------------------------------------------------------
    // BLOQUE 1: ESTADO GLOBAL Y PERSISTENCIA (MEJORADO CON INDEXEDDB - Appuntes V16)
    // ---------------------------------------------------------------------------------------------------
    let userAlias="", currentCourse="", userRol="", userLevels=[];
    let createdNotes=0, consultedNotes=0;
    
    // Variables en memoria
    let notesDB = {};
    let registeredUsers = {};
    let requestsDB = []; 
    
    let announcementsDB = []; // 📢 Variable para el Tablón de Anuncios

    // Estado de actividad del profesor logueado
    let isTeacherInactive = false; 

    // --- LISTA DE AVATARES (VARIABLES GLOBALES - SOLUCIÓN V41) ---
    // Esta lista define los emojis disponibles para elegir en el registro
    const AVATARS = [
        '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍💻', '🤓', 
        '📚', '🎒', '🎓', '✏️', '🖥️', '🔬', 
        '⚽', '🏀', '🎾', '🏆', '🥇', '🎨', 
        '🦉', '🦁', '🦊', '🐼', '🚀', '💡'
    ];

    // Variable global crítica para guardar la selección del usuario
    let selectedAvatar = '';

    // VARIABLES NUEVAS PARA EDICIÓN DE SOLICITUDES (V21)
    let currentRequestId = null; 
    let tempFileData = null;

    // V17: LISTA DE AVATARES DISPONIBLES
    const AVAILABLE_AVATARS = ['👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '💻', '📚', '🎨', '⚽', '🦁', '🚀', '💡', '🎸'];
    
    // V18: FRASES MOTIVACIONALES
    const MOTIVATIONAL_QUOTES = [
        "El éxito es la suma de pequeños esfuerzos repetidos cada día.",
        "No te detengas hasta que te sientas orgulloso.",
        "La educación es el arma más poderosa para cambiar el mundo.",
        "Cree en ti mismo y en lo que eres.",
        "Tus sueños no tienen fecha de caducidad.",
        "Estudia no para saber una cosa más, sino para saberla mejor.",
        "Lo único imposible es aquello que no intentas."
    ];
    // --- DEFINICIÓN DE LOGROS (MEDALLAS) ---
    const APPUNTES_MEDALS = {
        'fuego_eterno': { name: 'Fuego Eterno', icon: '🔥', desc: 'Racha de 7 días', check: (u) => (u.streak || 0) >= 7 },
        'bibliotecario': { name: 'Bibliotecario', icon: '📚', desc: 'Consultar 20 apuntes', check: (u) => (u.consulted || 0) >= 20 },
        'creador_estrella': { name: 'Creador Top', icon: '⭐', desc: 'Crear 5 apuntes', check: (u) => (u.created || 0) >= 5 },
        'samaritano': { name: 'Gran Compañero', icon: '🤝', desc: 'Recibir 10 manzanas', check: (u) => (u.mentionsReceived || 0) >= 10 },
        'noctambulo': { name: 'Noctámbulo', icon: '🦉', desc: 'Uso nocturno', check: () => new Date().getHours() >= 22 || new Date().getHours() <= 5 }
    };

    // Función vigilante para desbloquear logros
    window.checkAchievements = async function() {
        const u = registeredUsers[userAlias];
        if (!u) return;
        if (!u.medals) u.medals = [];

        let unlockedNew = false;
        for (let id in APPUNTES_MEDALS) {
            if (!u.medals.includes(id)) {
                const medal = APPUNTES_MEDALS[id];
                if (medal.check(u)) {
                    u.medals.push(id);
                    unlockedNew = true;
                    showToast(`🏆 ¡Logro Desbloqueado: ${medal.name}!`, 'success');
                }
            }
        }

        if (unlockedNew) {
            await saveData();
            // Si estamos en el perfil, refrescamos visualmente
            if (document.getElementById('profileScreen').classList.contains('active')) {
                updateProfileScreen();
            }
        }
    };
  // ---------------------------------------------------------------------------------------------------
    // MODIFICACIÓN 3: SEGURIDAD AUMENTADA (PEGAR AQUÍ)
    // INICIO BLOQUE MODIFICADO (Borra el const profanityFilterDB antiguo y pon este)
    // ---------------------------------------------------------------------------------------------------
    const profanityFilterDB = {
        censurable: ["tonto", "estupido", "mierda", "imbecil", "gilipollas", "puta", "joder", "cabron"],
        // Añadimos vectores de ataque comunes ahora que usamos innerHTML
        hardProhibited: [
            "script", "alert(", "eval(", "document.cookie", "window.", 
            "javascript:", "vbscript:", "onload", "onerror", "onclick", 
            "onmouseover", "onfocus", "iframe", "object", "embed" 
        ]
    };
    // ---------------------------------------------------------------------------------------------------
    // FIN BLOQUE MODIFICADO
    // --

    // Variables para la paginación y ordenación/filtrado
    const NOTES_PER_PAGE = 5;
    let currentPage = 1;
    let currentSortCriteria = 'timestamp';
    let currentFilter = 'all'; 
    let currentSubject = '';
    let currentTopic = '';
    
    // V18: Variables de tema
    let currentTheme = localStorage.getItem('appTheme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Variables para modales V20
    let structuredSearchState = {
        step: 0, 
        course: null,
        subject: null,
    };
    let requestNoteState = {
        step: 0, 
        course: null,
        subject: null,
        topic: null,
    };
    
    let currentStudentTab = 'pending'; 

    // NUEVO V21: Variables para Flashcards
    let currentNoteForFlashcards = null;
    let currentFlashcardIndex = 0;
    let isFlipped = false;

    // Variables Admin
    const adminAuthModal = document.getElementById('adminAuthModal');
    const adminPanelScreen = document.getElementById('adminPanelScreen');
    const flashcardsModal = document.getElementById('flashcardsModal');
    

    // --- NUEVO SISTEMA INDEXEDDB (Capacidad casi ilimitada) ---
    const DB_NAME = 'AppuntesBigData';
    const DB_VERSION = 4; // <--- CAMBIA A 4 PARA LIMPIAR ERRORES INTERNOS
    const STORE_NAME = 'HeavyData';

    // Helper para operaciones con IndexedDB (CORREGIDO)
    const dbHelper = {
        open: () => {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME);
                    }
                };
                
                request.onsuccess = (e) => resolve(e.target.result);
                request.onerror = (e) => reject(e.target.error);
            });
        },
        save: async (key, data) => {
            const db = await dbHelper.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put(data, key);
                
                tx.oncomplete = () => {
                    db.close(); // <--- CAMBIO 2: Cerramos conexión al terminar
                    resolve();
                };
                
                tx.onerror = () => {
                    db.close(); // <--- CAMBIO 3: Cerramos también si hay error
                    reject(tx.error);
                };
            });
        },
        get: async (key) => {
            const db = await dbHelper.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(key);
                
                req.onsuccess = () => {
                    resolve(req.result);
                    db.close(); // <--- CAMBIO 4: Cerramos conexión tras leer
                };
                
                req.onerror = () => {
                    reject(req.error);
                    db.close(); // <--- CAMBIO 5: Cerramos tras error de lectura
                };
            });
        }
    };

    // FUNCIONES DE GUARDADO Y CARGA ACTUALIZADAS

    async function saveData() {
        // 1. GUARDADO CRÍTICO (Síncrono): Guardar usuarios en LocalStorage
        try {
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
            console.log("Usuarios guardados en LocalStorage OK.");
        } catch (e) {
            // Detección específica de almacenamiento lleno
            if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
                alert("⚠️ ¡ALERTA CRÍTICA DE MEMORIA!\n\nEl almacenamiento del navegador está lleno. No se pueden guardar nuevos usuarios o cambios.\n\nSOLUCIÓN: Elimina apuntes antiguos con archivos pesados (PDF/Imágenes) inmediatamente.");
            } else {
                console.error("Error crítico guardando usuarios:", e);
                alert("⚠️ Error desconocido al guardar datos. Revisa la consola.");
            }
        }
        
        // 2. Datos Pesados (Apuntes)... (El resto de tu código sigue aquí)
        try {
            await dbHelper.save('registeredUsers', registeredUsers);
            await dbHelper.save('notesDB', notesDB);
            await dbHelper.save('requestsDB', requestsDB);
            await dbHelper.save('announcementsDB', announcementsDB);
        } catch (err) {
            console.error("Error IndexedDB:", err);
        }
    }


   // -----------------------------------------------------------------------
    // FUNCIÓN DE CARGA DE DATOS (LOAD DATA) - VERSIÓN SEGURA
    // -----------------------------------------------------------------------
    async function loadData() {
        console.log("🔄 Iniciando carga de datos del sistema...");

        // 1. CARGAR USUARIOS
        try {
            const loadedUsers = await dbHelper.get('registeredUsers');
            if (loadedUsers && Object.keys(loadedUsers).length > 0) {
                registeredUsers = loadedUsers;
                console.log(`✅ Usuarios cargados: ${Object.keys(registeredUsers).length}`);
            } else {
                // Intento de migración si IndexedDB está vacío
                const oldUsers = localStorage.getItem('registeredUsers');
                if(oldUsers) {
                    console.log("⚠️ Migrando usuarios de LocalStorage...");
                    registeredUsers = JSON.parse(oldUsers);
                    await dbHelper.save('registeredUsers', registeredUsers);
                    // No borramos localStorage todavía por seguridad
                }
            }
        } catch (e) {
            console.error("❌ Error cargando usuarios:", e);
            alert("Hubo un error cargando los usuarios. Revisa la consola.");
        }

        // 2. CARGAR APUNTES
        try {
            const loadedNotes = await dbHelper.get('notesDB');
            if (loadedNotes) {
                notesDB = loadedNotes;
                // Parche para asegurar compatibilidad de versiones antiguas
                Object.keys(notesDB).forEach(key => {
                    notesDB[key].forEach(note => {
                        if (!note.ratings) note.ratings = [];
                        if (!note.openedBy) note.openedBy = [];
                        if (typeof note.verified === 'undefined') note.verified = false;
                        if (!note.flashcards) note.flashcards = [];
                    });
                });
            } else {
                // Migración apuntes
                const oldNotes = localStorage.getItem('notesDB');
                if (oldNotes) {
                    notesDB = JSON.parse(oldNotes);
                    await dbHelper.save('notesDB', notesDB);
                }
            }
        } catch (e) {
            console.error("❌ Error cargando apuntes:", e);
        }

        // 3. CARGAR SOLICITUDES
        try {
            const loadedRequests = await dbHelper.get('requestsDB');
            if (loadedRequests) {
                requestsDB = loadedRequests.map(req => ({
                    ...req,
                    status: req.status || 'Pendiente',
                    supporters: req.supporters || []
                }));
            } else {
                // Migración solicitudes
                const oldRequests = localStorage.getItem('requestsDB');
                if (oldRequests) {
                    const parsedReqs = JSON.parse(oldRequests);
                    requestsDB = parsedReqs.map(req => ({ 
                        ...req, 
                        status: req.status || 'Pendiente',
                        supporters: req.supporters || []
                    }));
                    await dbHelper.save('requestsDB', requestsDB);
                }
            }
            if (!requestsDB) requestsDB = [];
        } catch (e) {
            console.error("❌ Error cargando solicitudes:", e);
            requestsDB = [];
        }

        // 4. CARGAR TABLÓN DE ANUNCIOS
        try {
            const loadedAds = await dbHelper.get('announcementsDB');
            if (loadedAds) {
                const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                announcementsDB = loadedAds.filter(ad => (Date.now() - ad.timestamp) < thirtyDaysMs);
            } else {
                announcementsDB = [];
            }
        } catch (e) {
            console.error("❌ Error cargando tablón:", e);
            announcementsDB = [];
        }

        console.log("✅ Datos cargados. Mostrando pantalla de acceso.");
        
        // Forzamos siempre la pantalla de login al arrancar
        renderLogin(); 

        // (Hemos borrado el bloque 'if (savedUser)...' que hacía el auto-login)
    }
 // ---------------------------------------------------------------------------------------------------
    // INICIO BLOQUE AÑADIDO: FUNCIÓN renderLogin (Esencial para el arranque)
    // ---------------------------------------------------------------------------------------------------
   // --- FUNCIÓN RESTAURADA: NAVEGACIÓN ENTRE PANTALLAS ---
    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        if(screen) screen.classList.add('active');
    }

 function renderLogin() {
        // 1. Ocultar todas las pantallas
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        
        // 2. Mostrar pantalla de bienvenida (usando la variable segura 'welcome' declarada al inicio)
        if (welcome) welcome.classList.add('active');
        
        // 3. Resetear visualmente el panel de auth (opcional, por seguridad visual)
        if (typeof showAuth === 'function') {
            // Aquí podríamos llamar a lógica extra si fuera necesario
        }
    }      

// --- FUNCIÓN RECUPERADA: Contar apuntes por tema ---
    function getNoteCount(subject, topic) {
        const key = `${subject}:${topic}`;
        return (notesDB[key] || []).length;
    }

    // --- NUEVA FUNCIÓN: Sumar apuntes de toda la asignatura ---
    function getSubjectNoteCount(course, subject) {
        let total = 0;
        let topics = [];
        
        // 1. Detectar si es lengua cooficial para cargar sus temas especiales
        const userData = registeredUsers[userAlias];
        const coOfficialName = (typeof coOfficialLanguageSubjects !== 'undefined') && userData ? coOfficialLanguageSubjects[userData.comunidad] : null;

        if (subject === coOfficialName && typeof coOfficialLanguageTopics !== 'undefined') {
            topics = coOfficialLanguageTopics;
        } else if (curriculum[course] && curriculum[course][subject]) {
            // 2. Si es asignatura normal, cargamos del currículo
            topics = curriculum[course][subject];
        }
        
        // 3. Sumar apuntes de cada tema
        if (topics) {
            topics.forEach(t => {
                total += getNoteCount(subject, t);
            });
        }
        return total;
    }
    
    // Helper para buscar una nota por ID en toda la DB (usado para Favoritos)
    function findNoteById(id) {
        for (const key in notesDB) {
            const found = notesDB[key].find(n => n.id === id);
            if (found) return found;
        }
        return null;
    }
// ---------------------------------------------------------------------------------------------------
    // BLOQUE 2: REFERENCIAS DEL DOM (CRÍTICO)
    // ---------------------------------------------------------------------------------------------------
    

    const panel = document.querySelector('#auth .panel');
    const startBtn = document.getElementById('startBtn');
    
    const rolSelect = document.getElementById('rol');
    const registroForm = document.getElementById('registroForm');
    const loginForm = document.getElementById('loginForm');
    
    const alumnoFields = document.getElementById('alumnoFields');
    const profesorFields = document.getElementById('profesorFields');
    
    const loginFormWrap = document.getElementById('loginFormWrap');
    const registroFormWrap = document.getElementById('registroFormWrap');

    const courseSelectOverlay = document.getElementById('courseSelectOverlay');
    const authTeacherCourseContainer = document.getElementById('authTeacherCourseContainer');
    const authErrorMessage = document.getElementById('authErrorMessage');
    
    const cursoSelect = document.getElementById('curso');
    const colegioInput = document.getElementById('colegio');

    // Referencias de Modales y Botones
    const btnStructuredSearch = document.getElementById('btnStructuredSearch');
    const btnRequestNote = document.getElementById('btnRequestNote');
    const structuredSearchModal = document.getElementById('structuredSearchModal');
    
    // Referencias SOLICITUDES (NUEVAS V22)
    const requestNoteModal = document.getElementById('requestNoteModal');
    const requestsModal = document.getElementById('requestsModal');
    const requestsContainer = document.getElementById('requestsContainer');
    const requestEditorModal = document.getElementById('requestEditorModal');
    
    const searchFlowContainer = document.getElementById('searchFlowContainer');
    const requestFlowContainer = document.getElementById('requestFlowContainer');
    const searchGoBackBtn = document.getElementById('searchGoBackBtn');
    const requestGoBackBtn = document.getElementById('requestGoBackBtn');
    const submitRequestBtn = document.getElementById('submitRequestBtn');
    
    // Nuevas referencias para flujo alumno
    const newRequestBtn = document.getElementById('newRequestBtn');
    const studentRequestsList = document.getElementById('studentRequestsList');
    
    const themeToggleBtn = document.getElementById('themeToggle');


    // ---------------------------------------------------------------------------------------------------
    // BLOQUE 3: FUNCIONES DE UTILIDAD Y NAVEGACIÓN
    // ---------------------------------------------------------------------------------------------------
    // V18: Lógica de tema

    themeToggleBtn.addEventListener('click', () => {
        if(currentTheme === 'light') {
            currentTheme = 'dark';
            themeToggleBtn.textContent = '☀️';
        } else {
            currentTheme = 'light';
            themeToggleBtn.textContent = '🌓';
        }
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('appTheme', currentTheme);
    
    });

// --- FUNCIÓN SHOWAUTH (LOGIN) - VERSIÓN V41 ---
    function showAuth() {
        const authScreen = document.getElementById('auth');
        showScreen(authScreen);
        
        const panel = document.querySelector('.panel');
        if(panel) {
            // FIX RESPONSIVE: Si es pantalla grande (>768px) forzamos tamaño PC
            // Si es móvil, dejamos 'unset' para que el CSS controle el 100% del ancho
            if (window.innerWidth > 768) {
                panel.style.minHeight = '400px'; 
                panel.style.minWidth = '600px';
            } else {
                panel.style.minHeight = 'auto'; 
                panel.style.minWidth = 'unset'; 
                panel.style.width = '100%';
            }
        }
        if(typeof clearError === 'function') clearError();
        
        // Generación de la cuadrícula de avatares
        const avatarContainer = document.getElementById('avatarSelectionContainer');
        
        // Solo generamos si está vacío para no duplicar botones
        if (avatarContainer && avatarContainer.innerHTML.trim() === '') {
            
            // ESTILOS: 6 columnas, altura limitada para scroll
            avatarContainer.style.display = 'grid';
            // FIX RESPONSIVE: Adaptamos columnas según el ancho de pantalla
            // Si es móvil (<768px) usamos 4 columnas grandes. Si es PC, 6 columnas.
            const columns = window.innerWidth < 768 ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)';
            avatarContainer.style.gridTemplateColumns = columns;
            avatarContainer.style.gap = '8px';
            avatarContainer.style.maxHeight = '110px'; // Altura para ver ~2 filas
            avatarContainer.style.overflowY = 'auto'; // Scroll vertical
            avatarContainer.style.padding = '5px';
            avatarContainer.style.border = '1px solid #e2e8f0';
            avatarContainer.style.borderRadius = '8px';
            avatarContainer.style.background = '#f8fafc';

            // Usamos la variable global AVATARS definida al inicio
            AVATARS.forEach(av => {
                const btn = document.createElement('button');
                btn.className = 'avatar-option';
                btn.textContent = av;
                btn.type = "button"; 
                
                // Estilos del botón
                btn.style.fontSize = '1.5rem';
                btn.style.cursor = 'pointer';
                btn.style.background = 'transparent';
                btn.style.border = 'none';
                btn.style.padding = '5px';
                btn.style.borderRadius = '50%';
                
                btn.onclick = (e) => {
                    e.preventDefault();
                    // Limpiar selección previa visual
                    document.querySelectorAll('.avatar-option').forEach(b => {
                        b.classList.remove('selected');
                        b.style.background = 'transparent';
                    });
                    // Marcar nuevo
                    btn.classList.add('selected');
                    btn.style.background = '#e0e7ff'; // Azulito al seleccionar
                    
                    // GUARDAR EN VARIABLE GLOBAL
                    selectedAvatar = av;
                };
                avatarContainer.appendChild(btn);
            });
        }
    }



  // V39: Dashboard FINAL - Corrector Universal de Avatares (Header + Body + Perfil)
    function showDashboard() {
        // 1. Verificar usuario
        const u = registeredUsers[userAlias];
        if (!u) {
            console.error("Error: Usuario no encontrado en DB.");
            return renderLogin(); 
        }

        // 2. FUNCIÓN DE REPARACIÓN DE AVATARES (La "Cirugía")
        // Esta función busca un elemento, y si es una imagen rota, la convierte en Emoji.
        const fixAvatarElement = (elementId, size = '100px', fontSize = '3.5rem') => {
            const el = document.getElementById(elementId);
            if (!el) return;

            const userEmoji = u.avatar || '👤';

            // CASO A: Es una IMAGEN (<img>) -> La destruimos y ponemos un DIV
            if (el.tagName === 'IMG') {
                const newDiv = document.createElement('div');
                newDiv.id = elementId;
                newDiv.className = el.className; // Mantener clases originales
                
                // Estilos forzados para garantizar que se vea
                newDiv.style.cssText = `
                    width: ${size}; 
                    height: ${size}; 
                    border-radius: 50%; 
                    background-color: #f1f5f9; 
                    border: 2px solid var(--border);
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: ${fontSize}; 
                    line-height: 1;
                    margin: 0 auto;
                    cursor: pointer;
                    object-fit: cover; /* Por si acaso */
                `;
                newDiv.textContent = userEmoji;
                
                // Reemplazo quirúrgico
                el.parentNode.replaceChild(newDiv, el);
            } 
            // CASO B: Ya es un DIV -> Solo actualizamos el emoji
            else {
                el.textContent = userEmoji;
                // Nos aseguramos que tenga flex para centrar
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
            }
        };

        // --- APLICAMOS LA CORRECCIÓN A TODOS LOS POSIBLES AVATARES ---
        
        // 1. El Avatar grande del Dashboard
        fixAvatarElement('dashAvatar', '100px', '3.5rem');

        // 2. El Avatar pequeño del botón de perfil (Si existe dentro del botón)
        // A veces el botón TIENE una imagen dentro. Vamos a buscarla.
        const btnProfile = document.getElementById('dashBtnProfile');
        if (btnProfile) {
            const imgInside = btnProfile.querySelector('img');
            if (imgInside) {
                // Si hay una imagen dentro del botón, le damos un ID temporal y la arreglamos
                if (!imgInside.id) imgInside.id = 'temp-header-avatar';
                fixAvatarElement(imgInside.id, '35px', '1.2rem');
            }
        }

        // 3. El Avatar de la pantalla de Perfil (por si acaso está visible)
        fixAvatarElement('profileAvatar', '80px', '3rem');


        // 3. Rellenar textos
        const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
        setText('dashName', userAlias.split('-')[0]);
        // CÁLCULO DINÁMICO: Contar apuntes reales en DB (Igual que en Perfil)
        let activeNotesCount = 0;
        for (const key in notesDB) {
            activeNotesCount += notesDB[key].filter(n => n.author === userAlias).length;
        }
        
        // Sincronizamos la variable interna del usuario para evitar desajustes futuros
        if (u.created !== activeNotesCount) {
            u.created = activeNotesCount;
            saveData(); // Guardado silencioso
        }

        setText('dashCreated', activeNotesCount);
        setText('dashConsulted', u.consulted || 0);

        // 4. Racha (Sin duplicados)
     let streakDisplay = document.getElementById('dashStreak');
        if (!streakDisplay) {
            const consultedElem = document.getElementById('dashConsulted');
            if(consultedElem && consultedElem.parentNode && consultedElem.parentNode.parentNode) {
                const statsContainer = consultedElem.parentNode.parentNode;
                const div = document.createElement('div');
                div.className = 'stat-card';
                div.innerHTML = `<h3>🔥 Racha</h3><p id="dashStreak">0 días</p>`;
                statsContainer.appendChild(div);
                streakDisplay = document.getElementById('dashStreak');
            }
        }
        if(streakDisplay) {
            const currentStreak = u.streak || 0;
            streakDisplay.textContent = `${currentStreak} ${currentStreak === 1 ? 'día' : 'días'}`;
        }
        
        if(streakDisplay) {
            const currentStreak = u.streak || 0;
            streakDisplay.textContent = `${currentStreak} ${currentStreak === 1 ? 'día' : 'días'}`;
        }

        // 5. Frase
        if(typeof MOTIVATIONAL_QUOTES !== 'undefined') {
             const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
             setText('dashQuote', randomQuote);
        }
        
        // 6. CABECERA: BOTÓN BUSCADOR
        let headerUserSearchBtn = document.getElementById('headerBtnUserSearch');
        if (!headerUserSearchBtn && btnProfile && btnProfile.parentNode) {
            headerUserSearchBtn = document.createElement('button');
            headerUserSearchBtn.id = 'headerBtnUserSearch';
            headerUserSearchBtn.className = 'btn secondary'; 
            headerUserSearchBtn.innerHTML = '👥 Usuarios';
            headerUserSearchBtn.style.marginLeft = '10px';
            btnProfile.parentNode.appendChild(headerUserSearchBtn);
        }
        if (headerUserSearchBtn) headerUserSearchBtn.onclick = showUserSearchModal;

        const oldUserSearchBtn = document.getElementById('dashBtnUserSearch');
        if(oldUserSearchBtn) oldUserSearchBtn.remove();

        // 7. GESTIÓN DE BOTONES
        const btnSub = document.getElementById('dashBtnSubjects');
        const btnReq = document.getElementById('dashBtnRequest');

        if (!btnSub || !btnReq) {
            showScreen(dashboardScreen);
            return;
        }

        const actionsContainer = btnReq.parentNode;

        // Limpiar botones extra
        ['dashBtnBackpack', 'dashBtnAgenda', 'dashBtnBoard'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.remove();
        });

        // Helper botones
        const appendBtn = (id, text, color, onClickFn) => {
            const btn = document.createElement('button');
            btn.id = id;
            btn.className = 'btn';
            btn.style.marginTop = '10px';
            btn.style.background = color;
            btn.innerHTML = text;
            btn.onclick = onClickFn;
            actionsContainer.appendChild(btn);
        };
// --- BLOQUE PROFESOR (CORREGIDO: Llamada a Badge Real) ---
        if (userRol === 'Profesor') {
            btnSub.textContent = "🎓 Panel Docente";
            btnSub.onclick = showTeacherWorkPanel; 
            
            // 1. Asignamos la acción al botón existente (btnReq ya está capturado arriba)
            btnReq.onclick = () => {
                showTeacherRequestsOverview();
                // Truco: Al cerrar modales y volver, forzamos actualización tras un instante
                setTimeout(() => { if(window.updateTeacherBadge) window.updateTeacherBadge(); }, 500);
            };

            // 2. Llamada inicial para pintar la campanita si hay pendientes
            if (typeof window.updateTeacherBadge === 'function') {
                window.updateTeacherBadge();
            } else {
                btnReq.innerHTML = "📊 Gestión de Solicitudes"; // Fallback visual
            }

            appendBtn('dashBtnAgenda', '📅 Mi Agenda', '#16a34a', window.openAgendaManager);
            appendBtn('dashBtnBoard', '📢 Publicar en tablón', '#0ea5e9', window.openTeacherBulletinManager);

        } else {
            // ... (Aquí empieza el else { ... } del Alumno, que no tocamos)
       
            // ... (El bloque 'else' de Alumno se queda igual que estaba)
            btnSub.textContent = "📚 Mis Asignaturas";
            btnSub.onclick = () => goToSubjects(u.curso);
            
            const hasCompletedReqs = requestsDB.some(r => r.requester === userAlias && r.status === 'Completada' && !r.seenByStudent);
            btnReq.innerHTML = hasCompletedReqs ? `📝 Mis Solicitudes <span class="notification-bell">🔔</span>` : "📝 Mis Solicitudes";
            btnReq.onclick = showStudentRequestsPanel;
            appendBtn('dashBtnBackpack', '🎒 Mis Mochilas', '#6366f1', window.openBackpackManager);
            appendBtn('dashBtnAgenda', '📅 Mi Agenda', '#16a34a', window.openAgendaManager);
            
            const currentUserData = registeredUsers[userAlias];
            if (!currentUserData.seenAds) currentUserData.seenAds = [];
            const myCourse = currentUserData.curso || "";
            const unreadCount = announcementsDB.filter(ad => myCourse.includes(ad.targetCourse) && !currentUserData.seenAds.includes(ad.id)).length;
            const badge = unreadCount > 0 ? ` <span style="background:#ef4444; color:white; padding:2px 8px; border-radius:10px; font-size:0.8rem; margin-left:5px;">${unreadCount}</span>` : '';
            appendBtn('dashBtnBoard', `📢 Tablón de anuncios${badge}`, '#0ea5e9', window.openBulletinBoard);
        }

        // Listeners cabecera
        if(btnProfile) btnProfile.onclick = updateProfileScreen;
        const btnSearch = document.getElementById('dashBtnSearch');
        if(btnSearch) btnSearch.onclick = showStructuredSearchModal;
  
        // LÓGICA DE ACTUALIZACIÓN DE RACHA
        const hoy = new Date().toLocaleDateString();
        if (u.lastLoginDate !== hoy) {
            const ayer = new Date();
            ayer.setDate(ayer.getDate() - 1);
            if (u.lastLoginDate === ayer.toLocaleDateString()) {
                u.streak = (u.streak || 0) + 1;
            } else {
                u.streak = 1;
            }
            u.lastLoginDate = hoy;
            saveData();
        }

        // 8. MOSTRAR PANTALLA
        const finalScreen = document.getElementById('dashboard'); 
        showScreen(finalScreen);
        
        window.checkBadges('login');
    }
        

    function hashPassword(password) {
        // Simulación de hashing simple
        return password.split('').reverse().join('');
    }

   function showError(message) {
    // 1. Mostrar SOLO el Toast moderno (Rojo y automático)
    showToast(message, 'error'); 

    // 2. Desactivar el mensaje antiguo feo
    // authErrorMessage.textContent = message;
    // authErrorMessage.style.display = 'block';
}

    function clearError() {
        authErrorMessage.style.display = 'none';
        authErrorMessage.textContent = '';
    }

    function resetAuthForms() {
        registroForm.reset();
        loginForm.reset();
        alumnoFields.classList.remove('hidden');
        profesorFields.classList.add('hidden');
        cursoSelect.required = true;
        colegioInput.required = true;
        // Reset avatar selection to first
        const opts = document.querySelectorAll('.avatar-option');
        if(opts.length > 0) opts[0].click();
    }
    
    // ---------------------------------------------------------------------------------------------------
    // CORRECCIÓN: sanitizeText ROBUSTA (SOPORTA CARACTERES ESPECIALES)
    // INICIO BLOQUE MODIFICADO
    // ---------------------------------------------------------------------------------------------------
    function sanitizeText(text) {
        if (!text) return null;
        let sanitized = text;

        // 1. Filtrado de palabras totalmente prohibidas (Seguridad XSS)
        // Usamos .includes() en lugar de RegExp para evitar errores con símbolos como '(' o '.'
        const lowerText = sanitized.toLowerCase();
        const hardProhibitedFound = profanityFilterDB.hardProhibited.some(word => 
            lowerText.includes(word.toLowerCase())
        );

        if (hardProhibitedFound) return null; // Bloqueo total si hay código malicioso

        // 2. Censura de palabras censurables (Insultos)
        for (const word of profanityFilterDB.censurable) {
            try {
                // Aquí sí usamos Regex para buscar la palabra completa (\b)
                sanitized = sanitized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '****');
            } catch (e) {
                console.warn("Error filtrando palabra:", word);
            }
        }

        return sanitized;
    }
    // ---------------------------------------------------------------------------------------------------
    // FIN BLOQUE MODIFICADO
    // -----------------------------------------------------------
    
    function calculateRating(ratings) {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, r) => acc + r.value, 0);
        return sum / ratings.length;
    }

    // V18: Solo estrellas sin valor numérico
    function getStarRating(rating) {
        const roundedRating = Math.round(rating);
        const fullStars = '★'.repeat(roundedRating);
        const emptyStars = '☆'.repeat(5 - roundedRating);
        if(rating === 0) return '—';
        return `${fullStars}${emptyStars}`;
    }
    function getRichAliasHTML(aliasKey) {
        const u = registeredUsers[aliasKey];
        // Si no existe usuario o algo falla, devolvemos el nombre limpio
        const cleanName = aliasKey ? aliasKey.split('-')[0] : 'Usuario';
        
        if (!u || u.rol !== 'Profesor') return cleanName;

        const mentions = u.mentionsReceived || 0;
        const goldenCount = Math.floor(mentions / 10);

        if (goldenCount > 0) {
            // Aplicamos el MISMO estilo dorado que en el perfil
            return `${cleanName} <span style="color: #b45309; text-shadow: 0 0 8px gold; margin-left:5px; filter: sepia(100%) saturate(300%) hue-rotate(20deg); font-size:1.1em;" title="Manzanas Doradas">🍎x${goldenCount}</span>`;
        }
        return cleanName;
    }
    function sortNotes(notes, criteria) {
        const notesWithIndex = notes.map((n, index) => ({ ...n, originalIndex: index }));
        return notesWithIndex.sort((a, b) => {
            let valA, valB;
            switch (criteria) {
                case 'name':
                    return a.displayName.localeCompare(b.displayName);
                case 'rating':
                    valA = calculateRating(a.ratings);
                    valB = calculateRating(b.ratings);
                    return valB - valA; // Descendente (mejor rating primero)
                case 'consults':
                    valA = a.openedBy ? a.openedBy.length : 0;
                    valB = b.openedBy ? b.openedBy.length : 0;
                    return valB - valA; // Descendente (más consultados primero)
                case 'timestamp':
                default:
                    // Orden por defecto: más reciente primero (descendente)
                    return b.timestamp - a.timestamp; 
            }
        });
    }

    // V29: Función para eliminar un apunte desde el perfil
    function handleDeleteNote(noteId, noteName) {
        if (!confirm(`¿Estás seguro de que quieres eliminar el apunte "${noteName}"? Esta acción es irreversible.`)) {
            return;
        }

        let foundAndDeleted = false;
        
        // Iterar a través de todas las claves (asignatura:tema) en notesDB
        for (const key in notesDB) {
            if (notesDB.hasOwnProperty(key)) {
                const initialLength = notesDB[key].length;
                
                // Filtrar el apunte con el ID coincidente
                const updatedNotes = notesDB[key].filter(note => note.id !== noteId);
                
                // Verificar si se produjo una eliminación en esta clave
                if (updatedNotes.length < initialLength) {
                    notesDB[key] = updatedNotes;
                    foundAndDeleted = true;
                    
                    // Decrementar el contador de apuntes creados del usuario
                    if (registeredUsers[userAlias] && registeredUsers[userAlias].created > 0) {
                        registeredUsers[userAlias].created--;
                        createdNotes = registeredUsers[userAlias].created;
                    }
                    // Limpieza profunda: Eliminar este apunte de los favoritos de TODOS los usuarios
                    for (const uKey in registeredUsers) {
                        const u = registeredUsers[uKey];
                        if (u.favorites && u.favorites.includes(noteId)) {
                            u.favorites = u.favorites.filter(fid => fid !== noteId);
                        }
                    }
                    break; // Salir del bucle una vez que se encuentra y elimina
                }
            }
        }

        if (foundAndDeleted) {
            saveData();
            alert(`Apunte "${noteName}" eliminado con éxito.`);
            // Volver a renderizar la pantalla de perfil para mostrar la lista actualizada
            updateProfileScreen();
        } else {
            alert("Error: No se encontró el apunte para eliminar.");
        }
    }

// ---------------------------------------------------------------------------------------------------
    // BLOQUE 4: GESTIÓN DE PERFIL Y AUTENTICACIÓN
    // ---------------------------------------------------------------------------------------------------
    
    function updateProfileScreen() {
        showScreen(profileScreen);
        const userData = registeredUsers[userAlias];

        // CHECK DE SEGURIDAD: Si no hay usuario cargado, salimos para evitar error
        if (!userData) return;
        
        // V17: Mostrar Avatar en Perfil
        document.getElementById('profileAvatarDisplay').textContent = userData.avatar || '👤';

        // --- MODIFICACIÓN: MANZANA DORADA JUNTO AL ALIAS ---
        const aliasElem = document.getElementById('profileAlias');
        
        // Lógica para mostrar Manzanas Doradas
        if (userData.rol === 'Profesor') {
            const mentions = userData.mentionsReceived || 0;
            const goldenCount = Math.floor(mentions / 10);
            
            if (goldenCount > 0) {
                // Usamos filtros CSS (sepia+saturate) para convertir el ROJO en DORADO visualmente
                aliasElem.innerHTML = `${userAlias} <span style="color: #b45309; text-shadow: 0 0 8px gold; margin-left:5px; filter: sepia(100%) saturate(300%) hue-rotate(20deg);" title="Manzanas Doradas">🍎x${goldenCount}</span>`;
            } else {
                aliasElem.textContent = userAlias;
            }
        } else {
            aliasElem.textContent = userAlias;
        }

        
        document.getElementById('profileRol').textContent = userRol;
        document.getElementById('profileComunidad').textContent = userData.comunidad;
        
        document.getElementById('profileVisits').textContent = userData.visits || 0;
       // CAMBIO: Calcular apuntes activos en tiempo real (los eliminados restan)
        let activeCount = 0;
        for (const key in notesDB) {
            activeCount += notesDB[key].filter(n => n.author === userAlias).length;
        }
        document.getElementById('profileCreated').textContent = activeCount;
        
        document.getElementById('profileConsulted').textContent = userData.consulted || 0;
        
        // --- NUEVO: Mostrar conteo de agradecimientos ---
      // Creamos el elemento si no existe en el HTML original, o lo inyectamos
      let mentionsDisplay = document.getElementById('profileMentions');
      if (!mentionsDisplay) {
          const p = document.createElement('p');
          p.innerHTML = `Agradecimientos/Menciones: <strong id="profileMentions">0</strong>`;
          // Insertamos después de 'Apuntes consultados'
          document.getElementById('profileConsulted').parentNode.after(p);
          mentionsDisplay = document.getElementById('profileMentions');
      }
     // --- MODIFICACIÓN: Texto (Manzanas/Abrazos) solo si hay más de 0 ---
      const countMentions = userData.mentionsReceived || 0;
      let textSuffix = "";
      
      if (countMentions > 0) {
          if (userData.rol === 'Profesor') {
              textSuffix = countMentions === 1 ? " manzana" : " manzanas";
          } else {
              // Asumimos que es Alumno
              textSuffix = countMentions === 1 ? " abrazo" : " abrazos";
          }
      }
      
      // Si es 0, textSuffix se queda vacío y solo se muestra el número
      mentionsDisplay.textContent = countMentions + textSuffix;

        const profileUserDetails = document.getElementById('profileUserDetails');
        profileUserDetails.innerHTML = '';
        const profileWrap = document.querySelector('#profile .title-wrap');
        const statusDiv = document.getElementById('profileAccountStatus');
        
        // Lógica de visualización del formulario de subsanación
        const missingDataContainer = document.getElementById('teacherMissingDataContainer');
        if(missingDataContainer) missingDataContainer.classList.add('hidden'); // Ocultar por defecto

        // Manejo de detalles específicos del rol y estado
        if (userData.accountStatus === 'Active') {
            statusDiv.textContent = 'Estado: ACTIVO ✅';
            statusDiv.style.backgroundColor = '#dcfce7';
            statusDiv.style.color = '#166534';
            statusDiv.style.border = '1px solid #bbf7d0';
        } else {
            // Si está inactivo
            let statusMessage = 'Estado: INACTIVO';
            if (userRol === 'Profesor') {
                 // Verificar si faltan datos
                 if (!userData.realName || !userData.school || !userData.docData) {
                     statusMessage += ' (Faltan Datos) ❌';
                     if(missingDataContainer) missingDataContainer.classList.remove('hidden'); // Mostrar formulario
                 } else {
                     statusMessage += ' (Esperando Revisión) ⏳';
                 }
            } else {
                statusMessage += ' ❌';
            }
            
            statusDiv.textContent = statusMessage;
            statusDiv.style.backgroundColor = '#fee2e2';
            statusDiv.style.color = '#991b1b';
            statusDiv.style.border = '1px solid #fca5a5';
        }

        if (userRol === 'Alumno') {
            profileUserDetails.innerHTML = `<p>Curso: <strong>${userData.curso}</strong></p><p>Colegio: <strong>${userData.colegio}</strong></p>`;
        } else if (userRol === 'Profesor') {
            profileUserDetails.innerHTML = `
                <p>Niveles que Imparte: <strong>${userData.nivelesImparte.join(', ')}</strong></p>
                <p>Nombre Real: <strong>${userData.realName ? '***' : '<span style="color:red">Falta</span>'}</strong></p>
                <p>Colegio: <strong>${userData.school ? '***' : '<span style="color:red">Falta</span>'}</strong></p>
            `;
        }
// 1. RECOPILAR APUNTES (ACTIVOS Y MODERADOS)
        let userNotes = [];
        // Apuntes activos
        for (const key in notesDB) {
            userNotes.push(...notesDB[key].filter(note => note.author === userAlias));
        }
        // Apuntes eliminados (moderados) recuperados del perfil
        if (userData.moderatedNotes) {
             userData.moderatedNotes.forEach(modNote => {
                 // Evitamos duplicados por seguridad
                 if(!userNotes.some(n => n.id === modNote.id)) userNotes.push(modNote);
             });
        }

        // 2. CREACIÓN DEL CONTENEDOR VISUAL (El Visor)
        const createdNotesContainer = document.createElement('div');
        createdNotesContainer.id = 'userCreatedNotesContainer';
        createdNotesContainer.style.marginTop = '20px';
        createdNotesContainer.innerHTML = `<h3 style="color:var(--brand); border-bottom:2px solid var(--brand); padding-bottom:5px; margin-bottom:15px;">Tus Apuntes Creados (${userNotes.length})</h3>`;

        if (userNotes.length === 0) {
            createdNotesContainer.innerHTML += '<p style="color:var(--muted); font-style:italic;">Aún no has creado ningún apunte.</p>';
        } else {
            // Contenedor con Scroll
            const scrollContainer = document.createElement('div');
            scrollContainer.style.maxHeight = '250px';
            scrollContainer.style.overflowY = 'auto';
            scrollContainer.style.background = 'var(--bg-screen)';
            scrollContainer.style.borderRadius = '8px';
            scrollContainer.style.padding = '10px';
            scrollContainer.style.border = '1px solid var(--border)';

            const notesList = document.createElement('div');
            
            userNotes.forEach(note => {
                const isModerated = !!note.moderated;
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                noteItem.style.cssText = `
                    padding: 10px; margin-bottom: 8px; background: white; border-radius: 6px;
                    display: flex; justify-content: space-between; align-items: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    border: ${isModerated ? '1px solid #fee2e2' : '1px solid transparent'};
                `;
                if (isModerated) noteItem.style.background = "#fff1f2";

                // Información del apunte (Título)
                const info = document.createElement('span');
                info.textContent = `${note.displayName} (${note.subject})`;
                info.style.cssText = 'font-size:0.9rem; font-weight:500; color:var(--ink); flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; margin-right:10px;';

                if (isModerated) {
                     info.style.color = '#991b1b'; 
                     info.style.filter = 'blur(1px)'; 
                     info.style.opacity = '0.6';
                     info.style.textDecoration = 'line-through';
                }

                // Botonera
                const actions = document.createElement('div');
                actions.style.cssText = 'display:flex; gap:8px; align-items:center;';

                if (isModerated) {
                    // BOTÓN: CAUSA (Abre Modal de la App)
                    const reasonBtn = document.createElement('button');
                    reasonBtn.innerHTML = '🚫 <b>CAUSA</b>';
                    reasonBtn.className = 'btn secondary';
                    reasonBtn.style.cssText = 'font-size:0.7rem; background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; padding:4px 8px;';
                    reasonBtn.onclick = () => {
                         // --- VENTANA MODAL PERSONALIZADA ---
                         const overlay = document.createElement('div');
                         overlay.className = 'custom-modal-overlay';
                         overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:11000; backdrop-filter:blur(4px);';
                         
                         const dialog = document.createElement('div');
                         dialog.style.cssText = 'background:white; padding:25px; border-radius:15px; width:90%; max-width:400px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.5); border:1px solid #fee2e2; animation:popIn 0.3s ease;';
                         dialog.innerHTML = `
                            <div style="font-size:3rem; margin-bottom:10px;">👮‍♂️</div>
                            <h3 style="color:#991b1b; margin:0 0 10px 0;">Apunte Eliminado</h3>
                            <div style="background:#fff1f2; padding:15px; border-radius:8px; border:1px dashed #fca5a5; margin-bottom:20px; text-align:left;">
                                <p style="margin:0 0 5px 0; font-size:0.85rem; color:#991b1b; font-weight:bold;">Moderador:</p>
                                <p style="margin:0 0 15px 0; color:#333;">${note.moderatorName || 'Profesor'} (${note.moderatorRole})</p>
                                <p style="margin:0 0 5px 0; font-size:0.85rem; color:#991b1b; font-weight:bold;">Motivo:</p>
                                <p style="margin:0; font-style:italic; color:#333;">"${note.rejectionReason || 'Sin motivo especificado'}"</p>
                            </div>
                            <button class="btn" style="width:100%; background:#991b1b; border:none; color:white;" onclick="this.closest('.custom-modal-overlay').remove()">Entendido</button>
                         `;
                         overlay.appendChild(dialog);
                         document.body.appendChild(overlay);
                    };
                    actions.appendChild(reasonBtn);
                } else {
                    // BOTÓN VER (Apunte normal)
                    const viewBtn = document.createElement('button');
                    viewBtn.innerHTML = '🔍';
                    viewBtn.className = 'btn secondary';
                    viewBtn.style.padding = '5px 10px';
                    viewBtn.onclick = () => openLinkedNote(note.id);
                    actions.appendChild(viewBtn);
                }

                // BOTÓN BORRAR (Papelera)
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '🗑️'; 
                deleteBtn.className = 'btn secondary';
                deleteBtn.style.cssText = 'background:#fee2e2; color:#991b1b; border:1px solid #fecaca; padding:5px 10px;';
                deleteBtn.onclick = async () => {
                    if(confirm("¿Borrar definitivamente?")) {
                        if(isModerated) {
                            // Si ya estaba moderado, lo borramos del backup personal
                            if(userData.moderatedNotes) userData.moderatedNotes = userData.moderatedNotes.filter(n => n.id !== note.id);
                        } else {
                            // Si era normal, usamos la función estándar
                            handleDeleteNote(note.id, note.displayName);
                        }
                        await saveData();
                        updateProfileScreen(); // Refrescar perfil
                    }
                };

                actions.appendChild(deleteBtn);
                noteItem.appendChild(info);
                noteItem.appendChild(actions);
                notesList.appendChild(noteItem);
            });
            
            scrollContainer.appendChild(notesList);
            createdNotesContainer.appendChild(scrollContainer);
        }
      

        // Limpiar y añadir la nueva sección antes del grupo de botones
        const existingNoteList = profileWrap.querySelector('#userCreatedNotesContainer');
        if (existingNoteList) existingNoteList.remove();
        
        // Obtener la referencia del contenedor de botones para insertar la lista antes
        const favoritesContainer = document.getElementById('userFavoritesContainer');
        if (favoritesContainer) {
            profileWrap.insertBefore(createdNotesContainer, favoritesContainer);
        } else {
            const buttonGroup = profileWrap.querySelector('.group[style*="margin-top: 20px"]');
            if(buttonGroup) profileWrap.insertBefore(createdNotesContainer, buttonGroup);
            else profileWrap.appendChild(createdNotesContainer);
        }

        // --- LÓGICA DE RENDERIZADO DE FAVORITOS (FEATURE 1) ---
        const favoritesListContent = document.getElementById('favoritesListContent');
        favoritesListContent.innerHTML = '';
        const userFavs = userData.favorites || [];

        if (userFavs.length === 0) {
            favoritesListContent.innerHTML = '<p style="color:var(--muted)">Aún no tienes favoritos guardados.</p>';
        } else {
            userFavs.forEach(favId => {
                const note = findNoteById(favId);
                if (note) {
                    const div = document.createElement('div');
                    div.className = 'note-item';
                    div.style.padding = '8px 0';
                    div.style.borderBottom = '1px dotted var(--border)';
                    div.innerHTML = `
                        <div style="flex:1">
                            <strong>${note.displayName}</strong><br>
                            <small>${note.subject} > ${note.topic}</small>
                        </div>
                    `;
                    const btn = document.createElement('button');
                    btn.className = 'btn secondary';
                    btn.textContent = 'Ver';
                    btn.onclick = () => showProtectedNote(note);
                    
                    div.appendChild(btn);
                    favoritesListContent.appendChild(div);
                }
            });
        }

       
// --- SECCIÓN DE MEDALLAS (VITRINA) ---
        const existingBadges = profileWrap.querySelector('.trophy-case-wrapper');
        if (existingBadges) existingBadges.remove();

        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'trophy-case-wrapper'; 
        badgesContainer.innerHTML = '<h3>🏆 Mis Logros</h3>';
      
        const trophyCase = document.createElement('div');
        trophyCase.className = 'trophy-case';

        const userBadges = userData.badges || [];
        // Simulamos un contador de menciones si no existe (empezará en 0)
        const currentMentions = userData.mentionsReceived || 0; 

        if (typeof BADGES_CONFIG !== 'undefined') {
            Object.values(BADGES_CONFIG).forEach(badge => {
                
                // 1. FILTRO DE ROL
                if (badge.targetRole && badge.targetRole !== userData.rol) return;
                
                // 2. CÁLCULO DE ESTADO (Desbloqueado vs Contador)
                let isUnlocked = userBadges.includes(badge.id);
                let counterHTML = '';
                
                // Si la medalla tiene un límite numérico (threshold), verificamos el contador REAL
                if (badge.threshold) {
                    let currentCount = userData.mentionsReceived || 0;
            
                    // Lógica cíclica para la manzana del profesor
                    if (badge.id === 'teacher_apple') {
                        currentCount = currentCount % 10;
                        isUnlocked = false; // Forzamos que parezca 'bloqueada' visualmente
                    }
                
                    if (currentCount >= badge.threshold) {
                        isUnlocked = true;
                    } else {
                        isUnlocked = false;
                        counterHTML = `<span class="badge-counter">${currentCount}/${badge.threshold}</span>`;
                    }
                }

                // 3. GENERAR HTML
                const item = document.createElement('div');
                item.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
                item.style.position = 'relative'; 
                item.title = `${badge.title}\n${badge.desc}`;
                // Opacidad visual extra si está bloqueada
                if(!isUnlocked) item.style.opacity = "0.5";
                item.innerHTML = `
                    <div class="badge-icon">${badge.icon}</div>
                    <div class="badge-name">${badge.title}</div>
                    ${counterHTML} 
                `;
                item.onclick = () => {
                     // Feedback visual al hacer click
                     let status = isUnlocked ? "¡Conseguido! 🎉" : "En progreso...";
                     if(badge.threshold && !isUnlocked) {
                         const count = userData.mentionsReceived || 0;
                         status = `Progreso: ${count} de ${badge.threshold}`;
                     }
                     showToast(`ℹ️ <b>${badge.title}</b><br>${badge.desc}<br><small>${status}</small>`, 'info');
                };

                trophyCase.appendChild(item);
            });
        }
        badgesContainer.appendChild(trophyCase);
        
        // Insertamos antes de los botones
        const buttonGroup = profileWrap.querySelector('.group[style*="margin-top: 20px"]');
        if (buttonGroup) {
            profileWrap.insertBefore(badgesContainer, buttonGroup);
        } else {
            profileWrap.appendChild(badgesContainer);
        }

        // --- SECCIÓN DE MOCHILAS (SOLO ALUMNOS) ---
        // 1. Limpieza previa por si se redibuja
        const existingBackpacks = profileWrap.querySelector('.backpack-section-wrapper');
        if (existingBackpacks) existingBackpacks.remove();

        // 2. Filtro de Seguridad: Solo entra si es Alumno
        if (userData.rol === 'Alumno') {
            const backpackContainer = document.createElement('div');
            backpackContainer.className = 'backpack-section-wrapper';
            backpackContainer.style.marginTop = '20px';
            backpackContainer.style.borderTop = '1px dashed #cbd5e1';
            backpackContainer.style.paddingTop = '15px';
            
            let packsHTML = '<h3 style="color:var(--brand); display:flex; align-items:center; gap:5px;">🎒 Mis Mochilas de Estudio</h3>';
            const packs = userData.backpacks || [];
            
            if (packs.length === 0) {
                packsHTML += '<p style="color:#999; font-style:italic; font-size:0.9rem;">No has creado mochilas de estudio aún.</p>';
            } else {
                packsHTML += '<div style="display:flex; flex-direction:column; gap:8px; max-height: 200px; overflow-y: auto;">';
                packs.forEach(p => {
                    packsHTML += `
                    <div style="background:white; border:1px solid #e2e8f0; padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>${p.name}</strong>
                            <div style="font-size:0.75rem; color:#64748b;">${p.notes.length} apuntes</div>
                        </div>
                        <button class="btn secondary" style="font-size:0.75rem; padding:4px 8px;" 
                            onclick="document.getElementById('profile').classList.remove('active'); document.getElementById('requestNoteModal').classList.add('active'); document.getElementById('requestNoteTitle').textContent = '🎒 Mochila'; window.viewBackpack('${p.id}');">
                            Gestionar
                        </button>
                    </div>`;
                });
                packsHTML += '</div>';
            }
            backpackContainer.innerHTML = packsHTML;

            // Insertamos las mochilas debajo de las medallas (antes de los botones finales)
            if (buttonGroup) profileWrap.insertBefore(backpackContainer, buttonGroup);
            else profileWrap.appendChild(backpackContainer);
        }

    } // <--- CIERRE CORRECTO DE LA FUNCIÓN UPDATEPROFILESCREEN
        

    // Listener para el formulario de actualización de datos del profesor
    document.getElementById('teacherUpdateForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const realName = document.getElementById('updateRealName').value.trim();
        const school = document.getElementById('updateSchool').value.trim();
        const file = document.getElementById('updateDoc').files[0];
        
        if (!realName || !school || !file) {
            alert("Todos los campos son obligatorios.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
            const docData = evt.target.result;
            
            // Actualizar usuario en DB
            if (registeredUsers[userAlias]) {
                registeredUsers[userAlias].realName = realName;
                registeredUsers[userAlias].school = school;
                registeredUsers[userAlias].docData = docData;
                registeredUsers[userAlias].docName = file.name;
                // El estado sigue siendo 'Inactive' hasta que el admin lo cambie
                saveData();
                alert("Datos enviados correctamente. Espera a que el administrador revise tu cuenta.");
                updateProfileScreen(); // Refrescar pantalla
            }
        };
        reader.onerror = function() {
            alert("Error al leer el archivo.");
        };
        reader.readAsDataURL(file);
    });

    // Nuevo Modal para Selección de Curso (Profesor)
    function openTeacherCourseModal() {
        const modal = document.getElementById('teacherCourseModal');
        const container = document.getElementById('teacherCourseContainer');
        container.innerHTML = '';
        
        const userData = registeredUsers[userAlias];
        const availableCourses = Object.keys(curriculum).filter(course => {
            if (userData.nivelesImparte.includes('IB')) {
                if (course.startsWith('IB')) return true;
            }
            if (userData.nivelesImparte.includes('Bachiller')) {
                if (course.includes('Bachillerato')) return true;
            }
            if (userData.nivelesImparte.includes('ESO')) {
                if (course.includes('ESO')) return true;
            }
            return false;
        });

        if (availableCourses.length === 0) {
            container.innerHTML = '<p style="color: #ef4444; font-weight: bold;">⚠️ Error: No hay cursos curriculares que coincidan con tus niveles asignados.</p>';
        } else {
            availableCourses.forEach(course => {
                const btn = document.createElement('button');
                btn.textContent = course;
                btn.className = 'btn';
                btn.onclick = () => {
                    currentCourse = course;
                    modal.classList.remove('active');
                    goToSubjects(currentCourse);
                };
                container.appendChild(btn);
            });
        }
        
        modal.classList.add('active');
    }
    
    document.getElementById('closeTeacherCourseModal').addEventListener('click', () => {
        document.getElementById('teacherCourseModal').classList.remove('active');
    });
  

    // ---------------------------------------------------------------------------------------------------
    // BLOQUE 5: LISTENERS DE AUTENTICACIÓN
    // ---------------------------------------------------------------------------------------------------
    startBtn?.addEventListener('click', function handleStartClick() {
        showAuth();
    });

    // --- CORRECCIÓN 1: Lógica de Rol Robusta ---
    rolSelect?.addEventListener('change', () => {
        // Capturamos los elementos al momento para evitar errores de referencia
        const fAlumno = document.getElementById('alumnoFields');
        const fProfe = document.getElementById('profesorFields');
        const inCurso = document.getElementById('curso');
        const inColegio = document.getElementById('colegio');

        // Campos de profesor
        const inRealName = document.getElementById('nombreReal');
        const inColegioProfe = document.getElementById('colegioProfe');
        const inDocProfe = document.getElementById('docProfe');

        if (rolSelect.value === 'Profesor') {
            fAlumno.classList.add('hidden');
            fProfe.classList.remove('hidden');
            
            // Desactivar obligatoriedad de alumno
            if(inCurso) inCurso.required = false;
            if(inColegio) inColegio.required = false;
            
            // Profesor: Campos no requeridos en registro inicial
            if(inRealName) inRealName.required = false;
            if(inColegioProfe) inColegioProfe.required = false;
            if(inDocProfe) inDocProfe.required = false;

        } else {
            // Caso ALUMNO
            fAlumno.classList.remove('hidden');
            fProfe.classList.add('hidden');
            
            // Activar obligatoriedad de alumno
            if(inCurso) inCurso.required = true;
            if(inColegio) inColegio.required = true;

            // Limpiar validaciones de profesor
            if(inRealName) inRealName.required = false;
            if(inColegioProfe) inColegioProfe.required = false;
            if(inDocProfe) inDocProfe.required = false;
        }
        clearError();
    });
// -----------------------------------------------------------------------
    // INICIO DE SESIÓN (VERSIÓN CLÁSICA Y ESTABLE)
    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------
    // INICIO DE SESIÓN (VERSIÓN DIAGNÓSTICO)
    // -----------------------------------------------------------------------
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Captura segura de inputs
        const aliasEl = document.getElementById('loginAlias');
        const passEl = document.getElementById('loginPassword'); // OJO: Verifica si en tu HTML es 'loginPass' o 'loginPassword'

        if (!aliasEl || !passEl) {
            console.error("ERROR CRÍTICO HTML: No encuentro 'loginAlias' o 'loginPassword'.");
            alert("Error interno: Faltan campos en el HTML. Revisa los IDs.");
            return;
        }

        const aliasInput = aliasEl.value.trim();
        const passwordInput = passEl.value;

        if (!aliasInput || !passwordInput) return showError("Introduce usuario y contraseña.");

        // Recuperación de emergencia si la memoria falla
        if (Object.keys(registeredUsers).length === 0) {
            console.warn("Memoria vacía. Intentando recuperar de LocalStorage...");
            try {
                const stored = localStorage.getItem('registeredUsers');
                if(stored) registeredUsers = JSON.parse(stored);
            } catch(err) { console.error(err); }
        }

        const aliasBase = aliasInput.toLowerCase();
        
        // Claves posibles
        const studentKey = aliasBase + "-alumno";
        const teacherKey = aliasBase + "-profesor";

        // Buscar usuario
        const validUser = registeredUsers[studentKey] || registeredUsers[teacherKey];

        // Verificar password
        const hashedPassword = (typeof hashPassword === 'function') ? hashPassword(passwordInput) : btoa(passwordInput);
        
        console.log(`Intento Login: ${aliasBase} | Hash generado: ${hashedPassword}`);

        if (!validUser) {
            console.warn("Usuario no encontrado en DB.");
            return showError("Usuario no registrado o incorrecto.");
        }
        
        if (validUser.password !== hashedPassword) {
            console.warn(`Pass incorrecta. Esperada: ${validUser.password}`);
            return showError("Contraseña incorrecta.");
        }

        // --- ÉXITO ---
        console.log("Credenciales OK. Iniciando carga...");
        userAlias = (validUser.rol === 'Alumno') ? studentKey : teacherKey;
        userRol = validUser.rol;
        
        localStorage.setItem('appuntes_user', userAlias); // Guardamos la sesión simple

        if (userRol === 'Alumno') currentCourse = validUser.curso;
        if (userRol === 'Profesor') userLevels = validUser.nivelesImparte || [];

        loginForm.reset();
        
        // INTENTO DE CARGA DEL DASHBOARD PROTEGIDO
        try {
            showDashboard();
        } catch (err) {
            console.error("CRASH EN SHOWDASHBOARD:", err);
            alert("Error al abrir el panel: " + err.message);
        }
    });
    

  // --- CORRECCIÓN 2: Registro Blindado para Alumnos y Profesores ---
    registroForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError(); 
        
        console.log("Iniciando registro..."); // Log para depurar

        const rol = document.getElementById('rol').value;
        const aliasRaw = document.getElementById('alias').value.trim();
        const password = document.getElementById('password').value;
        const comunidad = document.getElementById('comunidad').value;
        const avatar = selectedAvatar || '👤';
        
        // 1. Validaciones Generales
        if (!aliasRaw || aliasRaw.length < 3 || aliasRaw.length > 20) {
            return showError("El alias debe tener entre 3 y 20 caracteres.");
        }
        if (profanityFilterDB.hardProhibited.some(word => aliasRaw.toLowerCase().includes(word))) {
            return showError("El alias contiene palabras no permitidas.");
        }
        if (!password || password.length < 5) {
            return showError("La contraseña debe tener al menos 5 caracteres.");
        }
        if (!comunidad) {
            return showError("Debes seleccionar una Comunidad Autónoma.");
        }

        const hashedPassword = hashPassword(password);
        const aliasBase = aliasRaw.toLowerCase();
        let aliasFinal, userData;

        // 2. Lógica por Rol
        if (rol === 'Alumno') {
            // ALUMNO: Captura directa y segura
            const elCurso = document.getElementById('curso');
            const elColegio = document.getElementById('colegio');
            
            const cursoVal = elCurso ? elCurso.value : '';
            const colegioVal = elColegio ? elColegio.value.trim() : '';
            
            if (!cursoVal) return showError("Debes seleccionar un curso.");
            if (!colegioVal || colegioVal.length < 2) return showError("El nombre del colegio es obligatorio.");

            aliasFinal = aliasBase + "-alumno";
            currentCourse = cursoVal; // Guardar contexto sesión actual
            
            // Objeto de datos del alumno
            userData = {
                rol: 'Alumno',
                avatar: selectedAvatar,
                password: hashedPassword,
                comunidad: comunidad,
                curso: cursoVal,
                colegio: colegioVal,
                visits: 1,
                created: 0,
                consulted: 0,
                accountStatus: 'Active', // Alumno siempre nace activo
                registrationDate: new Date().toISOString(),
                favorites: [] 
            };

        } else if (rol === 'Profesor') {
            // PROFESOR: Lógica existente
            const niveles = Array.from(document.querySelectorAll('input[name="nivelesImparte"]:checked')).map(cb => cb.value);
            
            if (niveles.length === 0) return showError("Debes seleccionar al menos un nivel educativo.");
            
            const nombreReal = document.getElementById('nombreReal').value.trim();
            const colegioProfe = document.getElementById('colegioProfe').value.trim();
            const docFile = document.getElementById('docProfe').files[0];

            aliasFinal = aliasBase + "-profesor";
            
            userData = {
                rol: 'Profesor',
                avatar: selectedAvatar,
                password: hashedPassword,
                comunidad: comunidad,
                nivelesImparte: niveles,
                visits: 1,
                created: 0,
                consulted: 0,
                accountStatus: 'Inactive', // Profesor nace inactivo
                registrationDate: new Date().toISOString(),
                realName: nombreReal || null,
                school: colegioProfe || null,
                docData: null,
                docName: null,
                favorites: []
            };
            userLevels = niveles;

            // Procesar archivo si existe (Profesor)
            if (docFile) {
             // Validación de seguridad: Evitar archivos gigantes que bloqueen el navegador
                if (docFile.size > 5 * 1024 * 1024) { // Límite de 5MB
                    return showError("El archivo de documentación es demasiado grande (Máx 5MB).");
                }
                try {
                    const readerResult = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (evt) => resolve(evt.target.result);
                        reader.onerror = () => reject("Error leyendo archivo");
                        reader.readAsDataURL(docFile);
                    });
                    userData.docData = readerResult;
                    userData.docName = docFile.name;
                } catch (err) {
                    console.error(err);
                }
            }
        }

        // 3. Guardado Final
        try {
            // Verificar duplicados
            if (registeredUsers[aliasFinal]) {
                return showError("Ya existe una cuenta con ese alias. Prueba otro nombre.");
            }

            // A) Guardar en memoria RAM
            registeredUsers[aliasFinal] = userData;
            userAlias = aliasFinal;
            userRol = userData.rol;

            // B) Guardar en Base de Datos (Esencial)
            await saveData();
            
            console.log("Usuario registrado OK:", userAlias);
            registroForm.reset();

            // C) Redirección
            if (userRol === 'Alumno') {
                showDashboard();
            } else {
                alert("Cuenta de profesor creada. Tu estado es INACTIVO hasta revisión.");
                isTeacherInactive = true;
                showDashboard();
            }

        } catch (err) {
            console.error("Error crítico guardando usuario:", err);
            showError("Ocurrió un error al guardar. Inténtalo de nuevo.");
        }
    });
    document.getElementById('authTeacherLogout')?.addEventListener('click', () => {
        userAlias = "";
        currentCourse = "";
        userRol = "";
        userLevels = [];
        isTeacherInactive = false;
        authTeacherCourseContainer.innerHTML = '';
        panel.style.minHeight = ''; 
        panel.style.minWidth = '';
        auth.classList.add('active');
        courseSelectOverlay.classList.add('hidden');
        loginFormWrap.classList.remove('hidden'); 
        registroFormWrap.classList.remove('hidden'); 
        resetAuthForms();
        saveData();
    });

// ---------------------------------------------------------------------------------------------------
    // BLOQUE 6: LOGICA DE ADMINISTRADOR (CORREGIDO Y ACTUALIZADO)
    // ---------------------------------------------------------------------------------------------------
    
    // Trigger (Botón discreto "administrador")
    document.getElementById('adminTrigger')?.addEventListener('click', () => {
        adminAuthModal.classList.add('active');
    });

    // Cerrar Modal de Login Admin
    document.getElementById('closeAdminAuth')?.addEventListener('click', () => {
        document.getElementById('adminAuthForm').reset();
        adminAuthModal.classList.remove('active');
    });

    // Enviar Login Admin
    document.getElementById('adminAuthForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('adminUser').value;
        const p = document.getElementById('adminPass').value;
        // Verificación mediante hash Base64 para no exponer texto plano en código
        
        if (btoa(u) === 'Z2FsaWV0ZXJv' && btoa(p) === 'MTcwMTEx') {
            document.getElementById('adminAuthForm').reset();
            adminAuthModal.classList.remove('active');
            openAdminPanel();
        } else {
            alert("Credenciales de administrador incorrectas.");
        }
        
      
    });

    // --- CÓDIGO CORREGIDO: Cerrar Panel de Admin ---
    document.getElementById('closeAdminPanel')?.addEventListener('click', () => {
        document.getElementById('adminPanelScreen').classList.remove('active');
        const tbody = document.getElementById('adminTableBody');
        if(tbody) tbody.innerHTML = '';
        showAuth();
    });

    // --- Abrir Panel ---
    async function openAdminPanel() {
        // Recargar datos por seguridad
        const storedUsers = localStorage.getItem('registeredUsers');
        if (storedUsers) {
            registeredUsers = JSON.parse(storedUsers);
        }
        showScreen(adminPanelScreen);
        renderAdminTable();
    }

    // --- NUEVA FUNCIÓN: ELIMINAR USUARIO ---
    function deleteUser(alias) {
        if (confirm(`⚠️ ¿Estás seguro de que quieres ELIMINAR DEFINITIVAMENTE al usuario "${alias}"?\n\nEsta acción borrará su cuenta y no se puede deshacer.`)) {
            delete registeredUsers[alias];
            saveData();
            renderAdminTable();
            alert("Usuario eliminado correctamente.");
        }
    }

    // --- Función Cambiar Estado (Bloquear/Activar) ---
    function toggleUserStatus(alias) {
        if (registeredUsers[alias]) {
            const current = registeredUsers[alias].accountStatus;
            registeredUsers[alias].accountStatus = current === 'Active' ? 'Inactive' : 'Active';
            saveData();
            renderAdminTable();
        }
    }

    // --- Helper Descargar Doc ---
    window.downloadDoc = function(alias) {
        const u = registeredUsers[alias];
        if(u && u.docData) {
            const link = document.createElement('a');
            link.href = u.docData;
            link.download = u.docName || `Documentacion_${alias}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("No hay documento disponible.");
        }
    }

    // --- FUNCIÓN MEJORADA: Renderizar Tabla con Botón de Borrado ---
    function renderAdminTable() {
        const tbody = document.getElementById('adminTableBody');
        tbody.innerHTML = ''; 
        
        const users = Object.entries(registeredUsers);

        if(users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">⚠️ No hay usuarios registrados.</td></tr>';
            return;
        }

        users.forEach(([alias, data]) => {
            const tr = document.createElement('tr');
            
            // Lógica de estilos
            let isTeacherMissingData = false;
            if (data.rol === 'Profesor') {
                if(!data.docData || !data.realName || !data.school) {
                    isTeacherMissingData = true;
                } else if(data.accountStatus === 'Inactive') {
                    tr.classList.add('row-pending-review');
                }
            }

            let dateStr = 'N/A';
            if(data.registrationDate) {
                try { dateStr = new Date(data.registrationDate).toLocaleDateString(); } catch(e){}
            }
            
            let schoolInfo = '';
            if (data.rol === 'Alumno') {
                schoolInfo = data.colegio || 'N/A';
            } else {
                if (data.realName && data.school) {
                    schoolInfo = `<strong>${data.realName}</strong> (${data.school})`;
                    if(data.docData) {
                        schoolInfo += `<br><a href="#" onclick="downloadDoc('${alias}'); return false;" style="font-size:0.8rem;">📄 Ver Doc</a>`;
                    }
                } else {
                    schoolInfo = '<span style="color:var(--muted); font-style:italic;">Datos incompletos</span>';
                }
            }

            let statusClass = data.accountStatus === 'Active' ? 'status-active' : 'status-inactive';
            if (isTeacherMissingData) statusClass = 'status-missing-data';
            let statusText = data.accountStatus === 'Active' ? 'ACTIVO' : 'INACTIVO';
            if (isTeacherMissingData) statusText += ' (Faltan Datos)';

            // Botones de acción
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '5px';

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn secondary action-btn-admin';
            if (data.accountStatus === 'Active') {
                toggleBtn.textContent = 'Bloquear';
                toggleBtn.style.color = '#ef4444';
            } else {
                toggleBtn.textContent = 'Activar';
                toggleBtn.style.color = 'var(--accent)';
            }
            toggleBtn.onclick = () => toggleUserStatus(alias);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn danger action-btn-admin';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Eliminar';
            deleteBtn.onclick = () => deleteUser(alias);

            actionsDiv.appendChild(toggleBtn);
            actionsDiv.appendChild(deleteBtn);

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td style="font-size:1.5rem;">${data.avatar || '👤'}</td>
                <td><strong>${alias}</strong></td>
                <td>${data.rol}</td>
                <td>${data.comunidad || '-'}</td>
                <td>${schoolInfo}</td>
                <td class="${statusClass}">${statusText}</td>
                <td></td> 
            `;
            tr.cells[7].appendChild(actionsDiv);
            tbody.appendChild(tr);
        });
    }
   

    // ---------------------------------------------------------------------------------------------------
    // BLOQUE 7: GESTIÓN DE CURRÍCULO Y APUNTES
    // ---------------------------------------------------------------------------------------------------

 function goToSubjects(course){
        showScreen(subjectsScreen);
        // --- ACTIVAR BOTÓN VOLVER (Para todos) ---
        document.getElementById('btnBackToDash').onclick = showDashboard; 
        // -----------------------------------------
	currentCourse = course; 
        currentSubject = ''; 
        currentTopic = '';
        currentPage = 1;

        
	document.getElementById('subjectsTitle').textContent = `Asignaturas de ${course}`;

	// ---  Forzar el funcionamiento del botón "Volver" ---
        document.getElementById('btnBackToDash').onclick = showDashboard; 
        // -----------------------------------------------------------------------

        document.getElementById("topicsContainer").innerHTML = '<h3>Selecciona una asignatura</h3>';
        document.getElementById("optionsContainer").innerHTML = '';
        document.getElementById("notesContainer").innerHTML = '<p>Selecciona un tema para ver los apuntes.</p>';

        const isProfessor = userRol === 'Profesor';
        
        // CORRECCIÓN: Asegurar que el botón existe antes de asignarle eventos
        if (btnRequestNote) {
            // Limpiamos listeners antiguos clonando el botón (truco rápido) o simplemente reasignando onclick
            btnRequestNote.onclick = null; 
            
            if (isProfessor) {
                btnRequestNote.textContent = '📊 Estado de Solicitudes'; // Icono y texto actualizados
                btnRequestNote.style.background = 'var(--brand)'; 
                btnRequestNote.onclick = showTeacherRequestsOverview; // <--- AHORA LLAMA AL RESUMEN
            } else {
                btnRequestNote.textContent = '📝 Mis Solicitudes';
                btnRequestNote.style.background = 'var(--accent)'; // Color verde para alumno
                btnRequestNote.onclick = showStudentRequestsPanel;
            }
        }

        showSubjects(course);
    }
    
    function showSubjects(course){
        const subjectsContainer = document.getElementById("subjectsContainer");
        subjectsContainer.innerHTML = '';
        
        let subjects = curriculum[course] ? Object.keys(curriculum[course]) : [];
        
        // V17: Añadir asignatura de lengua cooficial si corresponde
        const userData = registeredUsers[userAlias];
        const userComunidad = userData ? userData.comunidad : '';
        const coOfficialSubjectName = coOfficialLanguageSubjects[userComunidad];

        if (coOfficialSubjectName && !subjects.includes(coOfficialSubjectName)) {
            subjects = [coOfficialSubjectName, ...subjects];
        }
	subjects.forEach(subj => {
            const btn = document.createElement("button");
            
            // --- CAMBIO: Usamos 'warning' (Naranja) para mejor contraste ---
            const count = getSubjectNoteCount(course, subj);
            
            if (count > 0) {
                btn.innerHTML = `${subj} <span style="color:var(--warning); font-weight:bold; font-size:0.9em;">(${count} apuntes)</span>`;
            } else {
                btn.textContent = subj;
            }
            // -------------------------------------------------------------

            btn.className = "btn secondary";
            btn.style.width = "100%";
            btn.style.marginBottom = "5px";
            btn.setAttribute('data-subject', subj); 
            btn.onclick = ()=>{ 
                currentSubject = subj;
                currentTopic = '';
                currentPage = 1;
                document.getElementById("topicsContainer").innerHTML = `<h3>Temas de: ${subj}</h3>`;
                document.getElementById("optionsContainer").innerHTML = '';
                document.getElementById("notesContainer").innerHTML = '<p>Selecciona un tema para ver los apuntes.</p>';
                showTopics(course, subj);
            };
            subjectsContainer.appendChild(btn);
        });
    }
    
    function renderCourseSelection(container, callback, stateKey) {
        container.innerHTML = '<div class="selection-step-container"><p>Selecciona un Curso:</p></div>';
        const contentContainer = container.querySelector('.selection-step-container');
        const courseGroup = document.createElement('div');
        courseGroup.className = 'group';

        const userData = registeredUsers[userAlias];
        const availableCourses = Object.keys(curriculum).filter(course => {
            if (userData.rol === 'Alumno') return userData.curso === course;
            else if (userData.rol === 'Profesor') {
                if (userData.nivelesImparte.includes('IB') && course.startsWith('IB')) return true;
                if (userData.nivelesImparte.includes('Bachiller') && course.includes('Bachillerato')) return true;
                if (userData.nivelesImparte.includes('ESO') && course.includes('ESO')) return true;
                return false;
            }
            return false;
        });

        if (availableCourses.length === 0) contentContainer.innerHTML = '<p style="color: #ef4444;">No hay cursos disponibles.</p>';
        else {
             availableCourses.forEach(course => {
                const btn = document.createElement('button');
                btn.textContent = course;
                btn.className = 'btn secondary';
                btn.onclick = () => callback(course);
                courseGroup.appendChild(btn);
            });
             contentContainer.appendChild(courseGroup);
        }

        // CORRECCIÓN LÓGICA AQUÍ:
        if(stateKey === 'search') {
            searchGoBackBtn.classList.add('hidden'); // En búsqueda, paso 0 no tiene atrás
        } else if(stateKey === 'request') {
            // En solicitud, el botón atrás SIRVE para cancelar el asistente y volver a la lista
            requestGoBackBtn.classList.remove('hidden'); 
        }
    }
    function renderSubjectSelection(course, container, callback, stateKey) {
        container.innerHTML = '<div class="selection-step-container"><p>Selecciona una Asignatura:</p></div>';
        const contentContainer = container.querySelector('.selection-step-container');
        const subjectGroup = document.createElement('div');
        subjectGroup.className = 'group';

        let subjects = curriculum[course] ? Object.keys(curriculum[course]) : [];
        const userData = registeredUsers[userAlias];
        const coOfficialSubjectName = coOfficialLanguageSubjects[userData ? userData.comunidad : ''];

        if (coOfficialSubjectName && !subjects.includes(coOfficialSubjectName)) subjects = [coOfficialSubjectName, ...subjects];

        subjects.forEach(subj => {
            const btn = document.createElement("button");
            
            // --- CAMBIO: Naranja para contraste ---
            const count = getSubjectNoteCount(course, subj);
            
            if (count > 0) {
                btn.innerHTML = `${subj} <span style="color:var(--warning); font-weight:bold; font-size:0.9em;">(${count} apuntes)</span>`;
            } else {
                btn.textContent = subj;
            }
            
            btn.className = "btn secondary";
            btn.onclick = () => callback(subj);
            subjectGroup.appendChild(btn);
        });
        contentContainer.appendChild(subjectGroup);
        if(stateKey === 'search') searchGoBackBtn.classList.remove('hidden');
        else if(stateKey === 'request') requestGoBackBtn.classList.remove('hidden');
    }

    function renderTopicSelection(course, subject, container, callback, stateKey) {
        container.innerHTML = '<div class="selection-step-container"><p>Selecciona un Tema:</p></div>';
        const contentContainer = container.querySelector('.selection-step-container');
        const topicGroup = document.createElement('div');
        topicGroup.className = 'group';
        topicGroup.style.flexDirection = 'column';

        let topicsList;
        const userData = registeredUsers[userAlias];
        const coOfficialSubjectName = coOfficialLanguageSubjects[userData ? userData.comunidad : ''];

        if (subject === coOfficialSubjectName) topicsList = coOfficialLanguageTopics;
        else topicsList = curriculum[course] ? curriculum[course][subject] : [];

     topicsList.forEach(topic => {
            const btn = document.createElement("button");
            
            // --- CAMBIO: Naranja para contraste ---
            const count = getNoteCount(subject, topic);
            
            if (count > 0) {
                btn.innerHTML = `${topic} <span style="color:var(--warning); font-weight:bold; font-size:0.9em;">(${count} apuntes)</span>`;
            } else {
                btn.textContent = topic;
            }
            
            btn.className = "btn secondary";
            btn.style.width = "100%";
            btn.style.marginBottom = "5px";
            btn.onclick = () => callback(topic);
            topicGroup.appendChild(btn);
        });
        contentContainer.appendChild(topicGroup);
        if(stateKey === 'search') searchGoBackBtn.classList.remove('hidden');
        else if(stateKey === 'request') requestGoBackBtn.classList.remove('hidden');
    }

    // MODIFICADO: Ahora acepta un 'targetTopic' para aplicar el resaltado visual
    function showTopics(course, subject, targetTopic = null){
        const container = document.getElementById("topicsContainer");
        container.innerHTML = `<h3>Temas de: ${subject}</h3>`;

        let topicsList;
        const userData = registeredUsers[userAlias];
        const coOfficialSubjectName = (typeof coOfficialLanguageSubjects !== 'undefined') ? coOfficialLanguageSubjects[userData ? userData.comunidad : ''] : null;
        
        if (subject === coOfficialSubjectName) topicsList = coOfficialLanguageTopics;
        else topicsList = curriculum[course] ? curriculum[course][subject] : [];

        topicsList.forEach(topic => {
            const topicCount = getNoteCount(subject, topic);
            const topicBtn = document.createElement("button");
            
            if (topicCount > 0) {
                topicBtn.innerHTML = `${topic} <span style="color:var(--warning); font-weight:bold; font-size:0.9em;">(${topicCount} apuntes)</span>`;
            } else {
                topicBtn.textContent = topic;
            }
            
            topicBtn.className = "btn secondary";
            topicBtn.style.width = "100%";
            topicBtn.style.marginBottom = "5px";
            topicBtn.setAttribute('data-topic', topic);

            // --- LÓGICA DE RESALTADO ---
            if (targetTopic && topic === targetTopic) {
                topicBtn.classList.add('highlight-topic');
            }

            topicBtn.onclick = ()=>{ 
                // Al tocarlo, el alumno ya sabe dónde está, quitamos el efecto
                topicBtn.classList.remove('highlight-topic');
                currentTopic = topic;
                document.getElementById("topicsContainer").innerHTML = `<h3>Tema Seleccionado: ${topic}</h3>`;
                showTopicOptions(subject, topic);
                consultNotes(subject, topic);
            };
            container.appendChild(topicBtn);
        });
    }

    function showTopicOptions(subject, topic){
        const optionsContainer = document.getElementById("optionsContainer");
        optionsContainer.innerHTML = `<h3>Opciones: ${topic}</h3>`;
        const createBtn = document.createElement("button");
        createBtn.textContent = `Crear Apunte para ${topic}`;
        createBtn.className = "btn";
        createBtn.style.width = "100%";
        createBtn.onclick = () => {
            clearRightPanel();
            document.getElementById("topicsContainer").innerHTML = `<h3>Creando en: ${subject} / ${topic}</h3>`;
            showCreateNoteForm(subject, topic);
        };
        optionsContainer.appendChild(createBtn);

        const sortControl = document.createElement('div');
        sortControl.style.marginTop = '15px';
        sortControl.innerHTML = '<label for="sortCriteria">Ordenar por:</label>';
        const sortSelect = document.createElement('select');
        sortSelect.id = 'sortCriteria';
        sortSelect.innerHTML = `
            <option value="timestamp" ${currentSortCriteria === 'timestamp' ? 'selected' : ''}>Fecha (Más Recientes)</option>
            <option value="rating" ${currentSortCriteria === 'rating' ? 'selected' : ''}>Puntuación (Mejor Valorados)</option>
            <option value="consults" ${currentSortCriteria === 'consults' ? 'selected' : ''}>Consultas (Más Vistos)</option>
            <option value="name" ${currentSortCriteria === 'name' ? 'selected' : ''}>Nombre</option>
        `;
        sortSelect.onchange = (e) => {
            currentSortCriteria = e.target.value;
            currentPage = 1; 
            consultNotes(subject, topic);
        };
        sortControl.appendChild(sortSelect);
        optionsContainer.appendChild(sortControl);
    }

    function clearRightPanel() {
        document.getElementById("optionsContainer").innerHTML = '';
        document.getElementById("notesContainer").innerHTML = '';
    }

    function prepareEditNote(note) {
        showScreen(subjectsScreen);
        currentSubject = note.subject;
        currentTopic = note.topic;
        
        // Renderizar cabecera y limpiar paneles
        document.getElementById("topicsContainer").innerHTML = `<h3>Editando: ${note.subject} / ${note.topic}</h3>`;
        document.getElementById("optionsContainer").innerHTML = '';
        document.getElementById("notesContainer").innerHTML = '';
        
        // Llamar al formulario en MODO EDICIÓN
        showCreateNoteForm(note.subject, note.topic, note);
    }
    /* ===================================================================================================
   CORRECCIÓN DEFINITIVA: GRABADORA CON DIAGNÓSTICO DE SEGURIDAD
   =================================================================================================== */
    function showCreateNoteForm(subject, topic, noteToEdit = null) {
        if (isTeacherInactive) {
            showToast("Cuenta inactiva. Acción denegada.", "error");
            showTopicOptions(subject, topic);
            consultNotes(subject, topic);
            return;
        }

        const notesContainer = document.getElementById("notesContainer");
        const modeTitle = noteToEdit ? "✏️ Editar Apunte" : "📝 Crear Nuevo Apunte";
        notesContainer.innerHTML = `<h3>${modeTitle}</h3>`;
        
        const form = document.createElement('form');
        form.id = 'createNoteForm';
        
        const initialTitle = noteToEdit ? noteToEdit.displayName : '';
        const initialText = noteToEdit ? noteToEdit.text : '';
        
        // --- 1. CONFIGURACIÓN DE AUDIO ---
        let tempAudioBase64 = noteToEdit ? noteToEdit.audioData : null;
        
        let recorderHTML = '';
        // VERIFICACIÓN DE ROL: Solo el Profesor ve la grabadora
        if (userRol === 'Profesor') {
            const hasAudio = !!tempAudioBase64;
            
            // Forzamos estilos 'flex' para asegurar que se vean los contenedores
            const displayRec = hasAudio ? 'none' : 'flex';
            const displayPlay = hasAudio ? 'flex' : 'none';

            recorderHTML = `
                <label style="margin-top:15px; color:var(--brand); font-weight:bold;">🎙️ Nota de Voz (Profesor)</label>
                <div style="background:#f0f9ff; padding:10px; border:1px solid #bae6fd; border-radius:6px; margin-bottom:15px;">
                    
                    <div id="recordControls" style="display:${displayRec}; gap:10px; align-items:center;">
                        <button type="button" id="btnRecord" class="btn secondary" style="background:white; border:1px solid #ccc; color:#333; min-width:100px;">🔴 Grabar</button>
                        <span id="recTimer" style="font-family:monospace; font-size:1.1rem; color:#666; display:none;">00:00</span>
                        <button type="button" id="btnStop" class="btn secondary" style="background:#fee2e2; border:1px solid #fca5a5; color:#991b1b; display:none;">⏹️ Parar y Guardar</button>
                    </div>

                    <div id="playbackControls" style="display:${displayPlay}; gap:5px; align-items:center;">
                        <button type="button" id="btnPlay" class="btn success" style="flex:1;">▶️ Escuchar Grabación</button>
                        <button type="button" id="btnDeleteAudio" class="btn danger" style="width:50px;" title="Borrar Audio">🗑️</button>
                    </div>

                    <p id="recStatus" style="font-size:0.85rem; color:#666; margin:5px 0 0 0; font-style:italic;">
                        ${hasAudio ? '✅ Audio adjunto listo.' : 'Pulsa grabar para añadir voz.'}
                    </p>
                </div>
            `;
        }

        let fileMsg = '';
        if (noteToEdit && noteToEdit.fileDataURL) {
            fileMsg = `<p style="color:var(--accent); font-size:0.9rem; margin-bottom:5px;">✅ Archivo actual: <strong>${noteToEdit.fileName}</strong></p>`;
        }

        form.innerHTML = `
            <label>Título (Máx. 50 caracteres)</label>
            <input type="text" id="noteName" maxlength="50" value="${initialTitle}" required />
            <label>Contenido</label>
            <textarea id="noteText" style="min-height:100px;">${initialText}</textarea>
            ${recorderHTML}
            <label>Archivo Adjunto (PDF/IMG)</label>
            ${fileMsg}
            <input type="file" id="noteFile" accept=".pdf, .jpg, .jpeg, .png" />
${userRol === 'Profesor' ? `
            <div style="margin-top:10px; padding:10px; background:#f0f9ff; border:1px dashed #3b82f6; border-radius:6px;">
                <label style="color:#0369a1; font-weight:bold; display:block; margin-bottom:5px;">📸 Escanear Apunte (Cámara)</label>
                <input type="file" id="noteCamera" accept="image/*" capture="environment" class="btn" style="width:100%; background:#0f172a; color:white;">
                <img id="noteCameraPreview" style="display:none; width:100%; margin-top:10px; border-radius:6px; border:2px solid #3b82f6;">
                <input type="hidden" id="noteCameraBase64" value="${noteToEdit && noteToEdit.fileDataURL && noteToEdit.fileDataURL.startsWith('data:image') ? noteToEdit.fileDataURL : ''}">
            </div>` : ''}
        `;
        
        notesContainer.appendChild(form);

        // --- 2. LÓGICA DE LA GRABADORA ---
       // --- 1.5 LÓGICA DE CÁMARA (NUEVO) ---
        if (userRol === 'Profesor') {
            const camInput = document.getElementById('noteCamera');
            if (camInput) {
                camInput.addEventListener('change', (e) => {
                    const f = e.target.files[0];
                    if (f) {
                        const r = new FileReader();
                        r.onload = (evt) => {
                            document.getElementById('noteCameraBase64').value = evt.target.result;
                            const img = document.getElementById('noteCameraPreview');
                            img.src = evt.target.result;
                            img.style.display = 'block';
                            showToast("📸 Foto procesada", "success");
                        };
                        r.readAsDataURL(f);
                    }
                });
                // Si estamos editando y ya había foto, mostrarla
                const existing = document.getElementById('noteCameraBase64').value;
                if(existing) {
                    const img = document.getElementById('noteCameraPreview');
                    img.src = existing;
                    img.style.display = 'block';
                }
            }
        }
//================================================================================================
   //CORRECCIÓN: LOGICA DE GRABACIÓN CON MODO SIMULACIÓN (BYPASS LOCAL)
   //=================================================================================================== */
        if (userRol === 'Profesor') {
            let mediaRecorder;
            let audioChunks = [];
            let timerInterval;
            let isSimulating = false; // Variable de control para el modo pruebas
            
            const btnRecord = document.getElementById('btnRecord');
            const btnStop = document.getElementById('btnStop');
            const recTimer = document.getElementById('recTimer');
            const recControls = document.getElementById('recordControls');
            const playControls = document.getElementById('playbackControls');
            const btnPlay = document.getElementById('btnPlay');
            const btnDelete = document.getElementById('btnDeleteAudio');
            const statusLabel = document.getElementById('recStatus');

            if (btnRecord) {
                // ACCIÓN: GRABAR
                btnRecord.onclick = async () => {
                    // --- MODO SIMULACIÓN PARA DESARROLLO LOCAL (FILE://) ---
                    if (window.location.protocol === 'file:') {
                        const confirmSim = confirm("⚠️ ESTÁS EN MODO LOCAL (FILE://)\n\nPor seguridad, los navegadores bloquean el micrófono real en este modo.\n\n¿Quieres activar el 'Modo Simulación' para probar la interfaz con un audio de prueba?");
                        if (confirmSim) {
                            isSimulating = true;
                            // Iniciamos interfaz visual simulada
                            btnRecord.style.display = 'none';
                            recTimer.style.display = 'block';
                            btnStop.style.display = 'block';
                            statusLabel.textContent = "🎙️ GRABANDO (Simulado)...";
                            statusLabel.style.color = "var(--warning)";
                            
                            let seconds = 0;
                            recTimer.textContent = "00:00";
                            timerInterval = setInterval(() => {
                                seconds++;
                                const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
                                const secs = (seconds % 60).toString().padStart(2, '0');
                                recTimer.textContent = `${mins}:${secs}`;
                            }, 1000);
                            return; // Salimos para no ejecutar el código real
                        } else {
                            return;
                        }
                    }

                    // --- MODO REAL (SERVIDOR/WEB) ---
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                        return showToast("Tu navegador no soporta grabación.", "error");
                    }

                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaRecorder = new MediaRecorder(stream);
                        audioChunks = [];
                        
                        mediaRecorder.start();
                        
                        btnRecord.style.display = 'none';
                        recTimer.style.display = 'block';
                        btnStop.style.display = 'block';
                        statusLabel.textContent = "🎙️ GRABANDO...";
                        statusLabel.style.color = "var(--danger)";

                        let seconds = 0;
                        recTimer.textContent = "00:00";
                        timerInterval = setInterval(() => {
                            seconds++;
                            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
                            const secs = (seconds % 60).toString().padStart(2, '0');
                            recTimer.textContent = `${mins}:${secs}`;
                        }, 1000);

                        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

                        mediaRecorder.onstop = () => {
                            clearInterval(timerInterval);
                            const blob = new Blob(audioChunks, { type: 'audio/mp3' });
                            const reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = () => {
                                tempAudioBase64 = reader.result; 
                                finishRecordingUI("✅ Audio grabado correctamente.");
                            };
                            stream.getTracks().forEach(track => track.stop()); 
                        };

                    } catch (e) {
                        console.error(e);
                        showToast("Error de micrófono: " + e.message, "error");
                    }
                };

                // Helper para actualizar UI al terminar (común para real y simulado)
                const finishRecordingUI = (msg) => {
                    recControls.style.display = 'none';
                    playControls.style.display = 'flex';
                    statusLabel.textContent = msg;
                    statusLabel.style.color = "var(--accent)";
                };

                // ACCIÓN: PARAR
                btnStop.onclick = () => {
                    if (isSimulating) {
                        clearInterval(timerInterval);
                        isSimulating = false;
                        // Generamos un audio "dummy" (silencio breve base64) para que el sistema funcione
                        tempAudioBase64 = "data:audio/mp3;base64,//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"; 
                        finishRecordingUI("✅ Audio simulado listo (Prueba de interfaz).");
                    } else if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                };

                // ACCIÓN: REPRODUCIR
                btnPlay.onclick = () => {
                    if (tempAudioBase64) {
                        if(tempAudioBase64.includes("//uQxAAAAANIAAAAAExBTUU")) {
                            showToast("🔊 Reproduciendo audio simulado (bip)...", "info");
                        } else {
                            const audio = new Audio(tempAudioBase64);
                            audio.play();
                        }
                    } else showToast("No hay audio.", "warning");
                };

                // ACCIÓN: BORRAR
                let deleteConfirm = false;
                btnDelete.onclick = () => {
                    if (!deleteConfirm) {
                        btnDelete.textContent = "??"; 
                        showToast("Pulsa otra vez para confirmar borrado", "warning");
                        deleteConfirm = true;
                        setTimeout(() => { btnDelete.textContent = "🗑️"; deleteConfirm = false; }, 3000);
                    } else {
                        tempAudioBase64 = null;
                        playControls.style.display = 'none';
                        recControls.style.display = 'flex'; 
                        
                        btnRecord.style.display = 'block';
                        recTimer.style.display = 'none';
                        btnStop.style.display = 'none';
                        
                        statusLabel.textContent = "Listo para grabar.";
                        statusLabel.style.color = "#666";
                        showToast("Audio borrado", "info");
                        deleteConfirm = false;
                        btnDelete.textContent = "🗑️";
                    }
                };
            }
        }
/* ===================================================================================================
   FIN BLOQUE MODIFICADO
   =================================================================================================== */

        // --- 4. BARRA DE HERRAMIENTAS EDITOR ---
        const textArea = document.getElementById('noteText'); 
        if (textArea && !document.getElementById('editorToolbar')) {
            const toolbar = document.createElement('div');
            toolbar.id = 'editorToolbar';
            toolbar.style.marginBottom = '5px';
            toolbar.style.display = 'flex';
            toolbar.style.gap = '5px';

            const insertTag = (s, e) => {
                const start = textArea.selectionStart;
                const end = textArea.selectionEnd;
                const text = textArea.value;
                textArea.value = text.substring(0, start) + s + text.substring(start, end) + e + text.substring(end);
            };
            const mkBtn = (lbl, s, e) => {
                const b = document.createElement('button');
                b.type = 'button'; b.innerHTML = lbl; b.className = 'btn secondary'; b.style.padding = '2px 10px';
                b.onclick = () => insertTag(s, e);
                return b;
            };
            toolbar.appendChild(mkBtn('<b>B</b>', '<b>', '</b>'));
            toolbar.appendChild(mkBtn('<i>I</i>', '<i>', '</i>'));
            textArea.parentNode.insertBefore(toolbar, textArea);
        }

        // --- 5. BOTONES DE GUARDADO ---
        const actions = document.createElement('div');
        actions.className = 'group';
        actions.style.marginTop = '20px';

        const btnSave = document.createElement("button");
        btnSave.textContent = noteToEdit ? "💾 Guardar Cambios" : "💾 Guardar Apunte";
        btnSave.className = "btn";
        btnSave.style.flex = '1';
        
        // --- LÓGICA DE GUARDADO CORREGIDA ---
        btnSave.onclick = async (e) => {
            e.preventDefault();
            const noteName = document.getElementById('noteName').value.trim();
            const textRaw = document.getElementById('noteText').value.trim();
            const file = document.getElementById('noteFile').files[0];
            const text = sanitizeText(textRaw);

            if (!noteName || noteName.length < 5) return showToast("Título muy corto", "warning");

            let fileDataURL = null;
            let fileName = null;

            // 1. Capturamos la foto de la cámara si existe
            const cameraData = document.getElementById('noteCameraBase64') ? document.getElementById('noteCameraBase64').value : null;

            // 2. Procesamiento de archivos (Con lógica async/await correcta)
            if (file) {
                if (file.size > 10 * 1024 * 1024) return showToast("Archivo > 10MB", "error");
                try {
                    fileDataURL = await new Promise((resolve, reject) => { 
                        const re = new FileReader(); 
                        re.onload = evt => resolve(evt.target.result); 
                        re.onerror = err => reject(err);
                        re.readAsDataURL(file); 
                    });
                    fileName = file.name;
                } catch (e) { return showToast("Error leyendo archivo", "error"); }
            } 
            // Prioridad a la cámara
            else if (cameraData && cameraData.length > 50) {
                fileDataURL = cameraData;
                fileName = "Escaneo_" + new Date().toLocaleDateString().replace(/\//g,'-') + ".jpg";
            }
            // Mantener archivo si editamos
            else if (noteToEdit) {
                fileDataURL = noteToEdit.fileDataURL;
                fileName = noteToEdit.fileName;
            }

            if (!text && !fileDataURL && !tempAudioBase64) return showToast("Apunte vacío.", "warning");

            // --- CORRECCIÓN CRÍTICA: DEFINIR LA VARIABLE KEY ---
            const key = `${subject}:${topic}`;
            if (!notesDB[key]) notesDB[key] = [];
            // ---------------------------------------------------

            const newNote = {
                id: noteToEdit ? noteToEdit.id : Date.now().toString(),
                displayName: noteName,
                author: userAlias,
                timestamp: Date.now(),
                subject: subject,
                topic: topic,
                text: text,
                fileName: fileName,
                fileDataURL: fileDataURL,
                audioData: tempAudioBase64,
                ratings: noteToEdit ? noteToEdit.ratings : [],
                openedBy: noteToEdit ? noteToEdit.openedBy : [],
                flashcards: noteToEdit ? noteToEdit.flashcards : [],
                verified: noteToEdit ? noteToEdit.verified : false
            };

            if (noteToEdit) {
                // Modo Edición
                const index = notesDB[key].findIndex(n => n.id === noteToEdit.id);
                if (index !== -1) notesDB[key][index] = newNote;
                showToast("Actualizado", "success");
            } else {
                // Modo Creación
                notesDB[key].push(newNote);
                if(registeredUsers[userAlias]) {
                    registeredUsers[userAlias].created = (registeredUsers[userAlias].created || 0) + 1;
                }
                
                // Vincular con solicitud si existe
                if (typeof currentRequestId !== 'undefined' && currentRequestId) {
                    const rIx = requestsDB.findIndex(r => r.id === currentRequestId);
                    if (rIx !== -1) {
                        requestsDB[rIx].status = 'Completada'; 
                        requestsDB[rIx].linkedNoteId = newNote.id; 
                        requestsDB[rIx].assignedTo = userAlias;
                        checkBadges('solve');
                    }
                    currentRequestId = null; 
                }
                checkBadges('create');
                showToast("Apunte creado", "success");
            }

            await saveData();
            
            // Refrescar interfaz
            document.getElementById("topicsContainer").innerHTML = `<h3>Tema: ${topic}</h3>`;
            showTopicOptions(subject, topic);
            consultNotes(subject, topic);
        };
        actions.appendChild(btnCancel);
        
        notesContainer.appendChild(actions);
    }
/* ===================================================================================================
   FIN DE FUNCIÓN CORREGIDA
   =================================================================================================== */
  function consultNotes(subject, topic) {
        currentSubject = subject;
        currentTopic = topic;
        // Eliminamos la variable currentPage

        const notesContainer = document.getElementById("notesContainer");
        notesContainer.innerHTML = `<h3>Apuntes Disponibles</h3>`;

        const key = `${subject}:${topic}`;
        const notes = notesDB[key] || [];

        // Filtros
        let filteredNotes = [...notes];
        if (currentFilter === 'file') filteredNotes = filteredNotes.filter(n => !!n.fileDataURL);
        else if (currentFilter === 'text') filteredNotes = filteredNotes.filter(n => !!n.text);
        
        if(filteredNotes.length === 0) {
            notesContainer.innerHTML += `<p>No hay apuntes disponibles.</p>`;
            return;
        }

        // Ordenación
        const sortedNotes = sortNotes([...filteredNotes], currentSortCriteria);
        
        // Controles de Filtro (Sin paginación)
        const filterControls = document.createElement('div');
        filterControls.id = 'filterControls';
        filterControls.style.marginBottom = '10px';
        filterControls.innerHTML = `
            <div>
                <label>Filtrar:</label>
                <select id="filterCriteria" onchange="currentFilter=this.value; consultNotes('${subject}','${topic}')">
                    <option value="all" ${currentFilter === 'all' ? 'selected' : ''}>Todos</option>
                    <option value="text" ${currentFilter === 'text' ? 'selected' : ''}>Texto</option>
                    <option value="file" ${currentFilter === 'file' ? 'selected' : ''}>Archivo</option>
                </select>
            </div>
            <div style="font-size:0.8rem; color:var(--muted);">
                Mostrando <strong>${sortedNotes.length}</strong> apuntes
            </div>
        `;
        notesContainer.appendChild(filterControls);

        // LISTADO DE NOTAS (Con Scroll limitado a ~4 elementos)
        const scrollWrapper = document.createElement('div');
        // AJUSTE: 360px es aprox la altura de 4 tarjetas. Si hay más, sale scroll.
        scrollWrapper.style.maxHeight = "360px"; 
        scrollWrapper.style.overflowY = "auto";
        scrollWrapper.style.paddingRight = "5px"; 
        scrollWrapper.style.border = "1px solid var(--border)";
        scrollWrapper.style.borderRadius = "8px";
        scrollWrapper.style.background = "var(--bg-screen)";

        const list = document.createElement('div');
        list.style.padding = "10px";

        sortedNotes.forEach(note => {
            const item = document.createElement('div');
            item.className = 'note-item';
            // Forzamos estilos para consistencia de altura
            item.style.marginBottom = "10px";
            item.style.padding = "10px";
            item.style.background = "white";
            item.style.border = "1px solid #e2e8f0";
            item.style.borderRadius = "6px";
            
            const authorData = registeredUsers[note.author];
            const authorAvatar = authorData ? (authorData.avatar || '👤') : '👤';
            
            // Badge de Rol
            let roleBadge = '';
            if (registeredUsers[note.author]?.rol === 'Profesor') {
                roleBadge = `<span style="background:var(--brand); color:#fff; padding:2px 6px; border-radius:4px; font-size:0.75rem; margin-left:5px;">Profesor</span>`;
            }

            const verifiedBadge = note.verified ? '<span class="verified-icon" title="Verificado">✅</span>' : '';
            
            const info = document.createElement('div');
            info.innerHTML = `<span class="user-avatar-small">${authorAvatar}</span><strong>${note.displayName}</strong>${verifiedBadge} <span style="font-size: 0.8rem; color: var(--muted);">(${getRichAliasHTML(note.author)})</span> ${roleBadge}`;
            
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.alignItems = 'center';
            actions.style.marginTop = '8px';

            const ratingSpan = document.createElement('span');
            ratingSpan.textContent = getStarRating(calculateRating(note.ratings));
            ratingSpan.style.marginRight = '10px';
            ratingSpan.style.color = 'gold'; 
            actions.appendChild(ratingSpan);

            // Botón Flashcards: SOLO SI EXISTEN
            const u = registeredUsers[userAlias];
            const hasFlashcards = u.personalFlashcards && u.personalFlashcards[note.id] && u.personalFlashcards[note.id].length > 0;

            if (hasFlashcards) {
                const fcBtn = document.createElement('button');
                fcBtn.textContent = '🃏 Repasar'; 
                fcBtn.className = 'btn secondary';
                fcBtn.style.marginRight = '5px';
                fcBtn.style.padding = '5px 10px';
                fcBtn.style.fontSize = '0.8rem';
                fcBtn.style.background = '#fef3c7';
                fcBtn.style.color = '#d97706';
                fcBtn.style.border = '1px solid #fcd34d';
                fcBtn.onclick = (e) => {
                     e.stopPropagation(); 
                     openFlashcardsModal(note.id);
                };
                actions.appendChild(fcBtn);
            }

            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'Ver';
            viewBtn.className = 'btn';
            viewBtn.style.padding = '5px 15px';
            viewBtn.style.fontSize = '0.9rem';
            viewBtn.onclick = () => showProtectedNote(note);
            
            actions.appendChild(viewBtn);
            item.appendChild(info);
            item.appendChild(actions);
            list.appendChild(item);
        });
        
        scrollWrapper.appendChild(list);
        notesContainer.appendChild(scrollWrapper);
    }

        
    
    // --- FUNCIÓN DE TOGGLE FAVORITO (NUEVO V19) ---
    function toggleFavorite(noteId) {
        const user = registeredUsers[userAlias];
        if (!user.favorites) user.favorites = [];
        
        const idx = user.favorites.indexOf(noteId);
        if(idx === -1) {
            user.favorites.push(noteId);
            alert("❤️ Apunte añadido a Favoritos");
        } else {
            user.favorites.splice(idx, 1);
            alert("💔 Apunte eliminado de Favoritos");
        }
        saveData();
        // Recargar la vista del modal si está abierta para actualizar el icono
        const currentNote = findNoteById(noteId);
        if(currentNote) showProtectedNote(currentNote);
    }
    
    // --- FUNCIÓN VERIFICAR APUNTE (NUEVO V20) ---
    function verifyNote(noteId) {
        // NUEVO V20.1: Check inactivo
        if (isTeacherInactive) {
            return alert("No puedes validar apuntes porque tu cuenta está en estado INACTIVO.");
        }

        const note = findNoteById(noteId);
        if(note) {
            if(confirm("¿Confirmas que has revisado este apunte y es correcto? Se añadirá un sello de verificación.")) {
                note.verified = true;
                note.verifiedBy = userAlias;
                saveData();
                alert("Apunte validado correctamente.");
               checkBadges('verify');
                showProtectedNote(note); // Refrescar modal
                consultNotes(note.subject, note.topic, currentPage); // Refrescar lista fondo
            }
        }
    }

// --- FUNCIÓN VISOR DEFINITIVA: BOTONES DE ZOOM INTUITIVOS ---
    function showProtectedNote(note) {
        const currentScreen = document.querySelector('.screen.active');
        if (currentScreen && currentScreen.id !== 'protectedModal') {
            window.previousScreen = currentScreen;
        }

        showScreen(modalMask);
        document.getElementById('modalTitle').textContent = ''; 
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = ''; 
        
        // --- 1. VARIABLES ---
        const isAuthor = userAlias === note.author;

      // ---------------------------------------------------------------------------------------------------
        // MODIFICACIÓN 2: VISOR PRO (SOPORTE HTML + VIDEO YOUTUBE EN EL MISMO MARCO)
        // INICIO BLOQUE MODIFICADO
        // ---------------------------------------------------------------------------------------------------
        
        let rawText = note.text || '<em style="color:#888;">(Este apunte no contiene texto, solo archivo adjunto)</em>';
        
        // 1. Detección automática de enlaces de YouTube
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/g;
        
        // El estilo 'width:100%' y 'padding-bottom:56.25%' obliga al video a quedarse DENTRO del marco
        let processedText = rawText.replace(youtubeRegex, (match, videoID) => {
            return `<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; margin:15px 0; border-radius:8px;">
                        <iframe style="position:absolute; top:0; left:0; width:100%; height:100%;" 
                                src="https://www.youtube.com/embed/${videoID}" 
                                frameborder="0" allowfullscreen>
                        </iframe>
                    </div>`;
        });

        // 2. Respetar los párrafos (saltos de línea)
        processedText = processedText.replace(/\n/g, '<br>');

        const noteText = processedText;

        // ---------------------------------------------------------------------------------------------------
        // FIN BLOQUE MODIFICADO
        // -----------------------------------
       
        const hasFile = !!note.fileDataURL;

        // --- 2. ESTRUCTURA ---
        const mainContainer = document.createElement('div');
        mainContainer.id = 'noteMainContainer';
        
        const leftCol = document.createElement('div');
        leftCol.id = 'noteLeftCol';

        const rightCol = document.createElement('div');
        rightCol.id = 'noteRightCol';
        rightCol.className = 'split-right';
        rightCol.style.display = 'none';

        // --- 3. CONTENIDO IZQUIERDA (TEXTO) ---
        let linkedReq = null;
        if (requestsDB && requestsDB.length > 0) linkedReq = requestsDB.find(r => r.linkedNoteId === note.id);

        let contentHTML = '';
        if (linkedReq) {
            const studentAlias = linkedReq.requester.split('-')[0];
            contentHTML += `
                <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 5px solid var(--brand); margin-bottom: 20px;">
                    <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--brand); font-weight: bold; margin-bottom: 5px;">📩 Solicitud de Alumno</div>
                    <p style="font-style: italic; color: #334155; font-size: 1.1rem; margin: 0;">"${linkedReq.text}"</p>
                    <div style="text-align: right; margin-top: 10px; font-size: 0.9rem; color: #64748b;">Solicitado por: <strong>${studentAlias}</strong></div>
                </div>`;
        }
        
        contentHTML += `
            <div style="background: white; padding: 10px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:start;">
    <h2 style="margin-top: 0; color: var(--brand); font-size: 1.8rem; flex:1;">${note.displayName}</h2>
    <button class="btn secondary" style="font-size:1.2rem; padding:5px 10px;" onclick="speakText(\`${noteText.replace(/"/g, '&quot;')}\`)" title="Leer en voz alta">🗣️</button>
    </div>
                <div style="margin-bottom: 15px; font-size: 0.9rem; color: var(--muted); border-bottom: 1px solid var(--border); padding-bottom: 10px;">
    Creado por: <strong>${getRichAliasHTML(note.author)}</strong> | Tema: ${note.topic}
</div>
                <div id="fileToggleZone" style="margin-bottom: 20px;"></div>
                <div style="font-size: 1.1rem; line-height: 1.6; color: var(--ink);">
                    ${noteText}
                </div>
            </div>
        `;
        leftCol.innerHTML = contentHTML;
        // --- PANEL DE VALIDACIÓN (V33) ---
        const validationPanel = document.createElement('div');
        validationPanel.style.cssText = 'display:flex; gap:15px; margin-top:20px; padding:15px; background:#f8fafc; border-radius:10px; border:1px solid var(--border); align-items:center; justify-content: space-between;';

        if (userRol === 'Profesor') {
            // VISTA PROFESOR: Corregido el error visual del style
            validationPanel.innerHTML = `
                <span style="font-weight:bold; font-size:0.9rem;">Moderación Docente:</span>
                <div style="display:flex; gap:10px;">
                    <button id="btnApprove" class="btn" style="background:#16a34a; font-size:0.8rem; padding:6px 10px;">✅ Aprobar</button>
                    <button id="btnEliminarProfe" class="btn" style="background:#ef4444; font-size:0.8rem; padding:6px 10px;">🗑️ Eliminar</button>
                </div>`;
            
            // Reconexión de botones (necesaria para que funcionen)
            setTimeout(() => {
                const bA = validationPanel.querySelector('#btnApprove');
                const bE = validationPanel.querySelector('#btnEliminarProfe');
                if(bA) bA.onclick = () => window.handleNoteValidation(note.id, 'approve');
                if(bE) bE.onclick = () => {
                    // Lógica de eliminación con ventana modal
                    const overlay = document.createElement('div');
                    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10000;';
                    overlay.innerHTML = `
                        <div style="background:white; padding:20px; border-radius:12px; width:90%; max-width:400px; text-align:center;">
                            <h3 style="margin-top:0; color:#991b1b;">Eliminar Apunte</h3>
                            <textarea id="delReason" placeholder="Motivo..." style="width:100%; height:80px; margin:10px 0; padding:10px;"></textarea>
                            <div style="display:flex; gap:10px;"><button id="confDel" class="btn danger" style="flex:1;">Confirmar</button><button id="cancDel" class="btn secondary" style="flex:1;">Cancelar</button></div>
                        </div>`;
                    document.body.appendChild(overlay);
                    overlay.querySelector('#cancDel').onclick = () => overlay.remove();
                    overlay.querySelector('#confDel').onclick = () => {
                        const r = document.getElementById('delReason').value.trim();
                        if(!r) return alert("Indica un motivo.");
                        window.executeProfessorDeletion(note.id, r);
                        overlay.remove();
                    };
                };
            }, 0);
        } else {
            // VISTA ALUMNO: Solo muestra "Aprobado" (oculta "No Apto")
            validationPanel.innerHTML = `
                <span style="font-weight:bold; font-size:0.9rem;">Calidad:</span>
                <span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:6px; font-size:0.8rem;">✅ Aprobado: ${note.approvedCount || 0}</span>`;
        }

        
        leftCol.appendChild(validationPanel);
        // --- 4. BOTÓN ACTIVAR VISOR ---
        if (hasFile) {
            const toggleZone = leftCol.querySelector('#fileToggleZone');
            const btnToggle = document.createElement('button');
            btnToggle.className = "btn secondary";
            btnToggle.style.width = "100%";
            btnToggle.style.border = "1px solid var(--brand)";
            btnToggle.style.color = "var(--brand)";
            btnToggle.style.background = "#eff6ff";
            btnToggle.innerHTML = `👁️ Ver Archivo Adjunto`;
            
            btnToggle.onclick = () => {
                const container = document.getElementById('noteMainContainer');
                const right = document.getElementById('noteRightCol');
                const left = document.getElementById('noteLeftCol');
                
                if (right.style.display === 'none') {
                    right.style.display = 'flex';
                   // --- MODIFICACIÓN MÓVIL: SCROLL AUTOMÁTICO ---
                    right.style.flexDirection = 'column';
                    container.className = 'split-view-container';
                    left.className = 'split-left';
                    btnToggle.innerHTML = `❌ Cerrar Archivo`;
                    btnToggle.style.borderColor = "var(--danger)";
                    btnToggle.style.color = "var(--danger)";
                    btnToggle.style.background = "#fef2f2";

                    // Truco: Si es móvil, bajamos la pantalla suavemente hasta el archivo
                    if (window.innerWidth < 768) {
                        setTimeout(() => {
                            right.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100); // Pequeña pausa para asegurar que se ha pintado
                    }
                } else {
                    right.style.display = 'none';
                    container.className = ''; 
                    left.className = ''; 
                    btnToggle.innerHTML = `👁️ Ver Archivo Adjunto`;
                    btnToggle.style.borderColor = "var(--brand)";
                    btnToggle.style.color = "var(--brand)";
                    btnToggle.style.background = "#eff6ff";
                }
            };
            toggleZone.appendChild(btnToggle);
        } else {
             leftCol.querySelector('#fileToggleZone').innerHTML = `<span style="font-size:0.8rem; color:var(--muted);">Sin adjuntos</span>`;
        }

        // --- 5. CONTENIDO DERECHA (VISOR) ---
        if (hasFile) {
            // CABECERA CON CONTROLES INTUITIVOS
            const downloadHeader = document.createElement('div');
            downloadHeader.style.padding = '8px';
            downloadHeader.style.background = '#f1f5f9';
            downloadHeader.style.borderBottom = '1px solid var(--border)';
            downloadHeader.style.display = 'flex';
            downloadHeader.style.justifyContent = 'space-between';
            downloadHeader.style.alignItems = 'center';
            
            // --- AQUÍ ESTÁ LA NUEVA BOTONERA ---
            const zoomControls = document.createElement('div');
            zoomControls.style.display = 'flex';
            zoomControls.style.alignItems = 'center';
            zoomControls.style.background = 'white';
            zoomControls.style.padding = '4px';
            zoomControls.style.borderRadius = '6px';
            zoomControls.style.border = '1px solid #ccc';
            zoomControls.style.gap = '10px';

            zoomControls.innerHTML = `
                <span style="font-size:0.8rem; color:#666; margin-right:5px; margin-left:5px;">🔍 Zoom:</span>
                <button id="zOut" class="btn secondary" style="font-weight:bold; font-size:1.1rem; padding: 2px 10px; margin:0;">−</button>
                <span id="zLabel" style="font-weight:bold; min-width: 50px; text-align: center; color: var(--brand);">100%</span>
                <button id="zIn" class="btn secondary" style="font-weight:bold; font-size:1.1rem; padding: 2px 10px; margin:0;">+</button>
            `;
            
            const dlBtn = document.createElement('a');
            dlBtn.href = note.fileDataURL;
            dlBtn.download = note.fileName || 'archivo';
            dlBtn.className = 'btn secondary';
            dlBtn.style.fontSize = '0.8rem';
            dlBtn.style.padding = '5px 10px';
            dlBtn.innerHTML = '⬇️ Descargar';

            downloadHeader.appendChild(zoomControls);
            downloadHeader.appendChild(dlBtn);
            rightCol.appendChild(downloadHeader);

            // WRAPPER (Contenedor con Scroll)
            const wrapper = document.createElement('div');
            wrapper.className = 'zoom-wrapper'; 
            
            // CONTENIDO (Imagen o PDF)
            let contentEl;
            const isPDF = note.fileDataURL.startsWith('data:application/pdf');
            
            if (isPDF) {
                contentEl = document.createElement('embed');
                // #view=FitH fuerza a que ocupe el ancho (y el zoom modificará ese ancho)
                contentEl.src = note.fileDataURL + "#toolbar=0&navpanes=0&scrollbar=0&view=FitH"; 
                contentEl.type = "application/pdf";
                contentEl.style.pointerEvents = "auto"; 
                contentEl.style.width = "100%";
                contentEl.style.minHeight = "100%"; 
            } else {
                contentEl = document.createElement('img');
                contentEl.src = note.fileDataURL;
                contentEl.style.width = "100%";
                contentEl.style.display = "block";
            }
            
            contentEl.className = 'zoom-content';
            wrapper.appendChild(contentEl);
            rightCol.appendChild(wrapper);

            // --- LÓGICA DE ZOOM (INTUITIVA) ---
            let currentWidthPercent = 100;
            const zLabel = downloadHeader.querySelector('#zLabel');
            
            const applyZoom = () => {
                // Cambiamos el ancho %, lo que fuerza al navegador a recalcular la altura y poner scrollbars
                contentEl.style.width = `${currentWidthPercent}%`;
                
                // Ajuste especial para PDFs para que no se queden cortos de altura
                if(isPDF) {
                   contentEl.style.height = `${currentWidthPercent}%`; 
                }
                
                zLabel.textContent = `${currentWidthPercent}%`;
            };

            // BOTÓN MENOS (-)
            downloadHeader.querySelector('#zOut').onclick = () => {
                if(currentWidthPercent > 50) { 
                    currentWidthPercent -= 10; // Bajamos de 10 en 10
                    applyZoom(); 
                }
            };

            // BOTÓN MÁS (+)
            downloadHeader.querySelector('#zIn').onclick = () => {
                if(currentWidthPercent < 400) { 
                    currentWidthPercent += 10; // Subimos de 10 en 10
                    applyZoom(); 
                }
            };
        }

        // --- 6. INTERACCIÓN (Votos, Favoritos...) ---
        // (El resto del código de gamificación sigue igual)
        if (!note.openedBy.includes(userAlias) && !isAuthor) {
            note.openedBy.push(userAlias);
            consultedNotes = (consultedNotes || 0) + 1;
            if(registeredUsers[userAlias]) registeredUsers[userAlias].consulted = consultedNotes;
            saveData();
            checkBadges('read');
        }
const interactionContainer = document.createElement('div');
        interactionContainer.style.marginTop = "30px";

        // 1. Preparamos el botón de Flashcards (Solo si es Alumno)
        let flashcardBtnHtml = '';
        if (userRol === 'Alumno') {
            flashcardBtnHtml = `<button class="btn secondary" style="margin-left:10px; border:1px dashed #f59e0b; color:#d97706; background:#fffbeb;" onclick="window.openFlashcardsModal('${note.id}')" title="Mis Flashcards">🃏 Estudiar</button>`;
        }

        // 2. Preparamos el botón de Favoritos y Mochila
        let favBtnHtml = '';
        if (!isAuthor) {
            const user = registeredUsers[userAlias];
            const isFav = user.favorites && user.favorites.includes(note.id);
            const favClass = isFav ? 'btn-fav active' : 'btn-fav';
            const favIcon = isFav ? '❤️' : '🤍';
            
            favBtnHtml = `<button class="${favClass}" onclick="window.toggleFavorite('${note.id}')" title="Favorito">${favIcon}</button>`;
            favBtnHtml += `<button class="btn-fav" style="margin-left:10px;" onclick="window.promptAddToBackpack('${note.id}')" title="Añadir a Mochila">🎒+</button>`;
            
            // Añadimos el botón de Flashcards aquí para el alumno
            favBtnHtml += flashcardBtnHtml;
        } else {
            // Si soy el autor y soy alumno, también quiero ver mi botón de estudiar
            if (userRol === 'Alumno') {
                 favBtnHtml += flashcardBtnHtml;
            }
        }

        const currentRating = calculateRating(note.ratings);
        const starsHtml = getStarRating(currentRating);
        
        interactionContainer.innerHTML = `
            <hr style="border: 0; border-top: 1px solid var(--border); margin: 20px 0;">
            <div style="display:flex; justify-content:center; align-items:center; gap: 15px;">
                <div>
                    <h3 style="font-size: 2rem; margin: 0; color: gold;">${starsHtml}</h3>
                    <p style="font-size: 0.8rem; color: var(--muted); margin:0;">(${note.ratings.length} votos)</p>
                </div>
                ${favBtnHtml} 
            </div>
        `;
    

        const userRatingControl = document.createElement('div');
        userRatingControl.style.textAlign = 'center';
        userRatingControl.style.marginTop = '15px';
        const existingRating = note.ratings.find(r => r.alias === userAlias);
        const hasVoted = !!existingRating;
        
        if (isAuthor) userRatingControl.innerHTML = `<p style="font-size:0.8rem; color:var(--muted);">Eres el autor</p>`;
        else if (hasVoted) userRatingControl.innerHTML = `<p style="font-weight: bold; color: var(--warning);">✅ Tu voto: ${existingRating.value}★</p>`;
        else userRatingControl.innerHTML = `<p style="font-weight: bold;">Puntuar:</p><div id="starsContainer" class="rating-stars"><span data-rating="1">★</span><span data-rating="2">★</span><span data-rating="3">★</span><span data-rating="4">★</span><span data-rating="5">★</span></div>`;
        interactionContainer.appendChild(userRatingControl);

        if (!isAuthor && !hasVoted) {
            setTimeout(() => { 
                const starsContainer = userRatingControl.querySelector('#starsContainer');
                if(starsContainer) {
                    const updateStarVisuals = (value) => {
                        starsContainer.querySelectorAll('span').forEach(star => {
                            star.style.color = (parseInt(star.dataset.rating) <= value) ? 'gold' : '#ccc';
                        });
                    };
                    starsContainer.addEventListener('mouseover', (e) => { const s = e.target.closest('span'); if (s) updateStarVisuals(parseInt(s.dataset.rating)); });
                    starsContainer.addEventListener('mouseout', () => updateStarVisuals(0));
                    starsContainer.addEventListener('click', (e) => {
                        const s = e.target.closest('span');
                        if (s) {
                            note.ratings.push({ alias: userAlias, value: parseInt(s.dataset.rating) });
                            saveData();
                            alert("Voto registrado.");
                            checkBadges('vote');
                            showProtectedNote(note); 
                        }
                    });
                }
            }, 50);
        }

        const thanksContainer = document.createElement('div');
        thanksContainer.style.marginTop = "20px";
        thanksContainer.style.paddingTop = "15px";
        thanksContainer.style.borderTop = "1px dashed var(--border)";
        thanksContainer.style.textAlign = "center";
        const authorData = registeredUsers[note.author];
   // --- MODIFICACIÓN: DETECCIÓN CORRECTA DE ROL (Manzana vs Apretón) ---
        const isAuthorTeacher = authorData && authorData.rol === 'Profesor';
        
        const thanksIcon = isAuthorTeacher ? '🍎' : '🤝';
        // AQUÍ ESTÁ EL CAMBIO DE TEXTO QUE PEDISTE:
        const thanksLabel = isAuthorTeacher ? 'Enviar manzana de agradecimiento' : '¡Gracias, compañero!';
        
        // SOLO ALUMNOS pueden dar las gracias (y no a sí mismos)
        if (!isAuthor && userRol === 'Alumno') {
            const thanksBtn = document.createElement('button');
            thanksBtn.className = "btn secondary";
            thanksBtn.style.fontSize = "0.9rem";
            thanksBtn.innerHTML = `<span style="font-size:1.2rem; margin-right:5px;">${thanksIcon}</span> ${thanksLabel}`;
            thanksBtn.onclick = () => {
                giveMention(note.id, note.author, isAuthorTeacher ? 'teacher' : 'peer');
            };
            thanksContainer.appendChild(thanksBtn);
        }
        if (authorData) {
            const count = authorData.mentionsReceived || 0;
            const statsMsg = document.createElement('p');
            statsMsg.style.fontSize = "0.8rem";
            statsMsg.style.color = "var(--muted)";
            statsMsg.style.marginTop = "8px";
            statsMsg.innerHTML = `Este autor ha recibido <strong>${count}</strong> ${isAuthorTeacher ? 'manzanas 🍎' : 'agradecimientos 🤝'}.`;
            thanksContainer.appendChild(statsMsg);
        }
        interactionContainer.appendChild(thanksContainer);

        if (isAuthor) {
            const authorPanel = document.createElement('div');
            authorPanel.style.textAlign = 'center';
            authorPanel.style.marginTop = '20px';
            authorPanel.style.padding = '10px';
            authorPanel.style.borderTop = '1px solid var(--border)';
            authorPanel.style.background = '#f8fafc';
            
            const fcBtn = document.createElement('button');
            fcBtn.className = "btn secondary";
            fcBtn.style.border = "1px dashed var(--warning)";
            fcBtn.style.color = "var(--warning)";
            fcBtn.style.background = "#fffbeb";
            fcBtn.style.marginRight = "10px";
            fcBtn.textContent = "🃏 Flashcards";
            fcBtn.onclick = () => openFlashcardsModal(note.id);
            
            const editBtn = document.createElement('button');
            editBtn.className = "btn";
            editBtn.style.background = "var(--brand)"; 
            editBtn.textContent = "✏️ Editar Apunte";
            editBtn.onclick = () => {
                document.getElementById('protectedModal').classList.remove('active');
                prepareEditNote(note);
            };
          authorPanel.appendChild(fcBtn);
            authorPanel.appendChild(editBtn);
            interactionContainer.appendChild(authorPanel);
        }

       // --- SECCIÓN DE COMENTARIOS (LIMPIA) ---
        const commentsContainer = document.createElement('div');
        commentsContainer.style.marginTop = "30px";
        commentsContainer.style.borderTop = "2px solid var(--border)";
        commentsContainer.style.paddingTop = "20px";

        commentsContainer.innerHTML = `<h3 style="color:var(--brand);">💬 Comentarios y Dudas</h3>`;
        
        // 1. Lista de Comentarios
        const commList = document.createElement('div');
        commList.style.maxHeight = "300px";
        commList.style.overflowY = "auto";
        commList.style.marginBottom = "15px";
        
        const comments = note.comments || [];
        if(comments.length === 0) {
            commList.innerHTML = `<p style="color:var(--muted); font-style:italic;">No hay comentarios aún.</p>`;
        } else {
            comments.forEach(c => {
                const cUser = registeredUsers[c.author];
                // ELIMINADO: cUser.realName para proteger la privacidad
                const cName = c.author ? c.author.split('-')[0] : "Usuario";
                const isProf = c.author.includes('profesor');
                const badge = isProf ? `<span style="background:var(--brand); color:white; font-size:0.7rem; padding:2px 4px; border-radius:4px; margin-left:5px;">Profe</span>` : '';
                
                // LIMPIEZA DE CURSIVAS ANTIGUAS
                let displayText = c.text;
                const oldFormatRegex = /^<i>.*?<\/i>:\s*/i; 
                displayText = displayText.replace(oldFormatRegex, ''); 
                let deleteBtnHTML = '';
                if (c.author === userAlias || isAuthor) {
                    deleteBtnHTML = `<button onclick="window.deleteComment('${note.id}', '${c.id}')" style="background:none; border:none; cursor:pointer; font-size:0.8rem; color:#ef4444;" title="Borrar comentario">🗑️</button>`;
                }

                const div = document.createElement('div');
                div.style.cssText = "background:var(--bg-screen); padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid var(--border);";
                div.innerHTML = `
                    <div style="font-size:0.85rem; color:var(--muted); margin-bottom:4px; display:flex; justify-content:space-between;">
                        <span><strong>${cName}</strong> ${badge}</span>
                        <div>
                            <span>${new Date(c.timestamp).toLocaleDateString()}</span>
                            ${deleteBtnHTML}
                        </div>
                    </div>
                    <div style="color:var(--ink);">${displayText}</div>
                `;
                
                commList.appendChild(div);
            });
        }
        commentsContainer.appendChild(commList);

        // 2. Botonera de Escritura
        const actionZone = document.createElement('div');
        actionZone.id = 'commentActionZone';
        
        const btnWrite = document.createElement('button');
        btnWrite.className = 'btn';
        btnWrite.style.width = '100%';
        btnWrite.innerHTML = '✍️ Escribir un comentario';
        
        btnWrite.onclick = () => {
            // Desplegar formulario LIMPIO
            actionZone.innerHTML = `
                <div style="animation: slideIn 0.3s;">
                    <textarea id="newCommentText" placeholder="Escribe aquí tu duda..." style="width:100%; height:80px; margin-bottom:10px; border:1px solid #ccc; border-radius:6px; padding:10px;"></textarea>
                    <div style="display:flex; gap:5px;">
                        <button class="btn" id="btnPublish" style="flex:1;">Publicar</button>
                        <button class="btn secondary" onclick="showProtectedNote(findNoteById('${note.id}'))">Cancelar</button>
                    </div>
                </div>
            `;
            setTimeout(() => {
                const txt = document.getElementById('newCommentText');
                if(txt) txt.focus();
            }, 100);
            
            document.getElementById('btnPublish').onclick = () => window.postComment(note.id);
        };
        
        actionZone.appendChild(btnWrite);
        commentsContainer.appendChild(actionZone);

        leftCol.appendChild(interactionContainer);
        leftCol.appendChild(commentsContainer); 
        
        mainContainer.appendChild(leftCol);
        mainContainer.appendChild(rightCol);
        modalContent.appendChild(mainContainer);
    }

    // ---------------------------------------------------------------------------------------------------
    // INICIALIZACIÓN
    // ---------------------------------------------------------------------------------------------------
    
   
    
    

    // --- FUNCIÓN GLOBAL PARA BORRAR SOLICITUDES (Correctamente integrada) ---
    // La definimos dentro del evento para que pueda acceder a 'requestsDB' y 'saveData'
    window.deleteRequest = async function(reqId) {
        if(!confirm("¿Borrar esta solicitud de tu lista? (El apunte creado NO se borrará, solo esta notificación).")) return;
        
        // Filtramos la DB para quitar esa solicitud
        requestsDB = requestsDB.filter(r => r.id !== reqId);
        
        await saveData();
        renderStudentRequests(); // Refrescamos la lista
    };
// --- NUEVA FUNCIÓN HELPER: ACTUALIZAR CAMPANITA EN TIEMPO REAL ---
    window.updateTeacherBadge = function() {
        // CORRECCIÓN: Usamos 'dashBtnRequest' (singular) que es como se llama en showDashboard
        const btn = document.getElementById('dashBtnRequest'); 
        if (!btn) return; 

        const userData = registeredUsers[userAlias];
        if (!userData) return;

        const myLevels = userData.nivelesImparte || [];
        
        // Recalculamos pendientes (Excluyendo las ignoradas)
        const pendingCount = requestsDB.filter(r => 
            r.status === 'Pendiente' && 
            r.course && 
            myLevels.some(level => r.course.includes(level)) &&
            (!r.ignoredBy || !r.ignoredBy.includes(userAlias))
        ).length;

        // Pintamos: Si > 0 mostramos campana, si no, texto limpio
        if (pendingCount > 0) {
            btn.innerHTML = `Gestión Solicitudes <span class="bell-ringing" style="font-size:1.2rem; margin-left:5px;">🔔</span> <span class="notification-badge">${pendingCount}</span>`;
        } else {
            btn.innerHTML = "📊 Gestión de Solicitudes";
        }
    };


    // --- NUEVA FUNCIÓN CORREGIDA: VISTA GENERAL DE SOLICITUDES POR CURSO ---
    function showTeacherRequestsOverview() {
        const modal = document.getElementById('teacherCourseModal');
        const container = document.getElementById('teacherCourseContainer');
        const title = modal.querySelector('h3') || modal.querySelector('.modal-title');
        
        // Cambiamos el título del modal temporalmente
        if(title) title.textContent = "Selecciona un curso para ver solicitudes";
        
        container.innerHTML = '';
        const userData = registeredUsers[userAlias];
        
        // 1. Obtener los niveles del profesor (ej: 2ESO, 1BACH)
        const myLevels = userData.nivelesImparte || [];

        if (myLevels.length === 0) {
            container.innerHTML = '<p>No tienes niveles asignados.</p>';
        } else {
            // 2. Crear un botón por cada nivel con el contador
            myLevels.forEach(level => {
                
                // CORRECCIÓN AQUÍ: 
                // Antes contábamos todas las pendientes. 
                // Ahora descontamos las que este profesor específico ha ignorado.
                const pendingCount = requestsDB.filter(r => 
                    r.status === 'Pendiente' && 
                    r.course && r.course.includes(level) &&
                    (!r.ignoredBy || !r.ignoredBy.includes(userAlias)) // <--- ESTA LÍNEA FALTABA
                ).length;

                const btn = document.createElement('button');
                btn.className = 'btn secondary';
                btn.style.width = '100%';
                btn.style.marginBottom = '10px';
                btn.style.display = 'flex';
                btn.style.justifyContent = 'space-between';
                
                // Texto del botón: Nombre del curso + Número en rojo si hay pendientes REALES para ti
                const countBadge = pendingCount > 0 
                    ? `<span style="background:red; color:white; padding:2px 8px; border-radius:10px; font-size:0.9rem;">${pendingCount}</span>` 
                    : `<span style="color:#aaa;">0</span>`;
                
                btn.innerHTML = `<span>📂 ${level}</span> ${countBadge}`;

                // Al hacer clic, vamos a la lista detallada filtrada por este nivel
                btn.onclick = () => {
                    modal.classList.remove('active');
                    // Restaurar título original por si acaso (opcional)
                    if(title) title.textContent = "Selecciona tu Curso";
                    showTeacherRequestsPanel(level); // Pasamos el nivel como filtro
                };
                container.appendChild(btn);
            });
        }
        modal.classList.add('active');
    }

// --- LISTA DE SOLICITUDES DEL CURSO (3 OPCIONES: Adquirir, Rechazar, Eliminar) ---
    function showTeacherRequestsPanel(filterLevel = null) {
        const modal = document.getElementById('requestNoteModal');
        modal.classList.add('active');
        if(newRequestBtn) newRequestBtn.classList.add('hidden');
        
        const list = document.getElementById('studentRequestsList');
        list.classList.remove('hidden');
        list.innerHTML = '';
        
        document.getElementById('requestNoteTitle').textContent = filterLevel ? `Solicitudes en ${filterLevel}` : "Todas las Solicitudes";

        // FILTRO: 
        // 1. Estado 'Pendiente'
        // 2. Coincide el curso
        // 3. NO está en mi lista de ignoradas (Rechazadas por mí pero disponibles para otros)
        const pending = requestsDB.filter(req => {
            const isPending = req.status === 'Pendiente';
            const matchesLevel = filterLevel ? req.course.includes(filterLevel) : true;
            const isIgnoredByMe = req.ignoredBy && req.ignoredBy.includes(userAlias);
            
            // Seguridad: profe tiene acceso a ese nivel
            const teacherHasAccess = registeredUsers[userAlias].nivelesImparte.some(l => req.course.includes(l));
            
            return isPending && matchesLevel && !isIgnoredByMe && teacherHasAccess;
        });

        if (pending.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding:30px; color:#888;">✅ No hay solicitudes nuevas para ti en <b>${filterLevel || 'tus cursos'}</b>.</div>`;
            return;
        }

        pending.forEach(req => {
            const card = document.createElement('div');
            card.className = 'request-card';
            card.style.borderLeft = '4px solid var(--brand)';
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <span style="font-size:0.8rem; background:#eff6ff; color:var(--brand); padding:2px 6px; border-radius:4px;">${req.course}</span>
                    <small>${new Date(req.timestamp).toLocaleDateString()}</small>
                </div>
                <strong style="display:block; margin:5px 0; font-size:1.1rem;">${req.topic}</strong>
                <div style="font-size:0.9rem; margin-bottom:10px;">${req.subject} <span style="color:#aaa;">| Alumno: ${req.requester.split('-')[0]}</span></div>
                <p style="background:#f9f9f9; padding:10px; font-style:italic; margin-bottom:10px;">"${req.text}"</p>
                
                <div style="display:flex; gap:5px; margin-top:10px;">
                    <button class="btn success" style="flex:1; font-size:0.8rem;" onclick="acquireRequest('${req.id}')">📥 Adquirir</button>
                    
                    <button class="btn warning" style="flex:1; font-size:0.8rem;" onclick="ignoreRequest('${req.id}')">🙈 Rechazar</button>
                    
                    <button class="btn danger" style="flex:1; font-size:0.8rem;" onclick="deleteRequestWithReasonInput('${req.id}')">⛔ Eliminar</button>
                </div>
                
                <div id="delete-reason-box-${req.id}" style="display:none; margin-top:10px; background:#fee2e2; padding:10px; border-radius:6px;">
                    <p style="margin:0 0 5px; color:#991b1b; font-size:0.9rem;">Indica la causa de la eliminación (se verá en el panel del alumno):</p>
                    <input type="text" id="reason-${req.id}" placeholder="Ej: Duplicada, Falta información..." style="width:100%; margin-bottom:5px;">
                    <button class="btn danger" style="width:100%" onclick="confirmDeleteRequest('${req.id}')">Confirmar Eliminación</button>
                </div>
            `;
            list.appendChild(card);
        });
    }
// --- FIN DE showTeacherRequestsPanel ---

    // =========================================================================
    // LÓGICA DE ALUMNO Y DOCENTE (CORREGIDA)
    // =========================================================================
// --- NUEVA FUNCIÓN: PANEL DE SOLICITUDES DEL ALUMNO (CORREGIDA) ---
    function showStudentRequestsPanel() {
        const modal = document.getElementById('requestNoteModal');
        modal.classList.add('active');
        
        // Ocultar botones de "Crear nueva" temporalmente para limpiar la vista
        if(newRequestBtn) newRequestBtn.classList.remove('hidden'); 
        // Asegurar que el contenedor de flujo de creación esté oculto
        const flowContainer = document.getElementById('requestFlowContainer');
        if(flowContainer) flowContainer.classList.add('hidden');

        // Referencia a la lista
        const list = document.getElementById('studentRequestsList');
        list.classList.remove('hidden');
        list.innerHTML = ''; // Limpiar contenido anterior
        
        document.getElementById('requestNoteTitle').textContent = "📝 Mis Solicitudes";

        // 1. CREAR NAVEGACIÓN DE PESTAÑAS (SOLO UNA VEZ)
        const tabsDiv = document.createElement('div');
        tabsDiv.style.cssText = 'display:flex; margin-bottom:15px; border-bottom:2px solid #e2e8f0; gap:5px;';
        
        const createTabBtn = (id, text, color) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            const isActive = currentStudentTab === id;
            btn.style.cssText = `
                flex:1; padding:10px; border:none; cursor:pointer; font-weight:bold; border-radius: 6px 6px 0 0;
                background: ${isActive ? 'white' : '#f1f5f9'};
                color: ${isActive ? color : '#64748b'};
                border-bottom: ${isActive ? `3px solid ${color}` : '3px solid transparent'};
                transition: all 0.2s;
            `;
            btn.onclick = () => { 
                currentStudentTab = id; 
                showStudentRequestsPanel(); // Recargar vista con nueva pestaña
            };
            return btn;
        };

        tabsDiv.appendChild(createTabBtn('pending', '⏳ Pendientes', '#f59e0b')); 
        tabsDiv.appendChild(createTabBtn('completed', '✅ Contestadas', '#16a34a')); 
        tabsDiv.appendChild(createTabBtn('deleted', '🗑️ Eliminadas', '#ef4444')); 
        
        list.appendChild(tabsDiv);

        // 2. CONTENEDOR DE LA LISTA
        const container = document.createElement('div');
        container.style.maxHeight = '350px'; 
        container.style.overflowY = 'auto'; // Scroll nativo
        container.style.padding = '10px';
        container.style.border = '1px solid var(--border)';
        container.style.borderRadius = '6px';
        container.style.marginBottom = '10px';
        container.style.background = 'var(--bg-screen)';

        // Filtrar solicitudes
        const myReqs = requestsDB.filter(r => r.requester === userAlias);
        let itemsToShow = [];

        if (currentStudentTab === 'pending') {
            itemsToShow = myReqs.filter(r => r.status === 'Pendiente' || r.status === 'En Proceso');
        } else if (currentStudentTab === 'completed') {
            itemsToShow = myReqs.filter(r => r.status === 'Completada');
        } else if (currentStudentTab === 'deleted') {
            itemsToShow = myReqs.filter(r => r.status === 'Eliminada');
        }

        itemsToShow.sort((a,b) => b.timestamp - a.timestamp);

        if (itemsToShow.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:30px; color:#aaa;">No tienes solicitudes en esta sección.</div>`;
        } else {
            itemsToShow.forEach(req => {
                const item = document.createElement('div');
                item.className = 'request-card'; 
                item.style.borderLeftWidth = '4px';
                item.style.borderLeftStyle = 'solid';

                // Color del borde según estado
                let borderColor = '#ccc';
                if(req.status === 'Completada') borderColor = '#16a34a';
                else if(req.status === 'Eliminada') borderColor = '#ef4444';
                else if(req.status === 'En Proceso') borderColor = '#3b82f6';
                else borderColor = '#f59e0b'; // Pendiente
                item.style.borderLeftColor = borderColor;

                let extraContent = '';
                if (currentStudentTab === 'deleted') {
                     const reason = req.rejectionReason || "Sin motivo especificado.";
                     extraContent = `<div style="margin-top:10px; background:#fee2e2; color:#991b1b; padding:10px; border-radius:6px;">⛔ Motivo: "<em>${reason}</em>"</div><button class="btn secondary" style="margin-top:10px; font-size:0.8rem; width:100%;" onclick="deleteRequest('${req.id}')">Borrar notificación</button>`;
                } 
                else if (currentStudentTab === 'completed') {
                    extraContent = `<div style="margin-top:10px; padding:10px; background:#dcfce7; color:#166534; border-radius:6px;">¡Respondida!</div><button class="btn success" style="width:100%; margin-top:10px;" onclick="markAsSeenAndOpen('${req.id}', '${req.linkedNoteId}')">📄 Ver Apunte</button>`;
                }
                else {
                    const statusLabel = req.status === 'En Proceso' 
                        ? `<span style="color:#2563eb; font-weight:bold;">🏃 En Proceso</span>` 
                        : `<span style="color:#d97706;">⏳ Esperando...</span>`;
                    
                    extraContent = `<div style="margin-top:10px; font-size:0.9rem;">${statusLabel}</div><button class="btn danger" style="margin-top:10px; font-size:0.8rem; padding: 5px 10px;" onclick="deleteRequest('${req.id}')">Cancelar</button>`;
                }

                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold; color:var(--brand); font-size:1.1rem;">${req.topic}</span>
                        <small style="color:#64748b;">${new Date(req.timestamp).toLocaleDateString()}</small>
                    </div>
                    <div style="font-size:0.9rem; color:#475569; margin-bottom:8px;">${req.subject}</div>
                    <div style="background:#f8fafc; padding:10px; border-radius:6px; font-style:italic; border:1px dashed #cbd5e1;">"${req.text}"</div>
                    ${extraContent}
                `;
                container.appendChild(item);
            });
        }
        
        list.appendChild(container);
    }
   
 

    // --- ACCIONES DOCENTE ---

   // 1. ADQUIRIR (Pasa a "En Proceso")
    window.acquireRequest = async (reqId) => {
        const req = requestsDB.find(x => x.id === reqId);
        if(req) {
            req.status = 'En Proceso'; 
            req.assignedTo = userAlias;
            await saveData();
     
            // ACTUALIZACIÓN VISUAL INMEDIATA
            if(typeof window.updateTeacherBadge === 'function') window.updateTeacherBadge();

            const titleElem = document.getElementById('requestNoteTitle');
            const currentFilter = titleElem ? titleElem.textContent.split(' en ')[1] : null;
            showTeacherRequestsPanel(currentFilter || null); 
            alert("Solicitud adquirida. Pasa a pestaña 'En Proceso' de tu panel.");
        }
    }

    // 2. RECHAZAR (Ignorar localmente)
    window.ignoreRequest = async (reqId) => {
        const req = requestsDB.find(x => x.id === reqId);
        if(req) {
            if(!req.ignoredBy) req.ignoredBy = [];
            req.ignoredBy.push(userAlias); 
            await saveData();

            // ACTUALIZACIÓN VISUAL INMEDIATA
            if(typeof window.updateTeacherBadge === 'function') window.updateTeacherBadge();

            const titleElem = document.getElementById('requestNoteTitle');
            const currentFilter = titleElem ? titleElem.textContent.split(' en ')[1] : null;
            showTeacherRequestsPanel(currentFilter || null);
        }
    }

    // 3. ELIMINAR (Mostrar Input)
    window.deleteRequestWithReasonInput = (reqId) => {
        const box = document.getElementById(`delete-reason-box-${reqId}`);
        if(box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
    }

    // 4. CONFIRMAR ELIMINACIÓN
    window.confirmDeleteRequest = async (reqId) => {
        const reason = document.getElementById(`reason-${reqId}`).value;
        if(!reason) return alert("Debes indicar una causa.");
        
        const req = requestsDB.find(x => x.id === reqId);
        if(req) {
            req.status = 'Eliminada'; 
            req.rejectionReason = reason;
            req.assignedTo = userAlias; 
            await saveData();
            
            // ACTUALIZACIÓN VISUAL INMEDIATA
            if(typeof window.updateTeacherBadge === 'function') window.updateTeacherBadge();

            const titleElem = document.getElementById('requestNoteTitle');
            const currentFilter = titleElem ? titleElem.textContent.split(' en ')[1] : null;
            showTeacherRequestsPanel(currentFilter || null);
        }
    }
// --- PANEL DOCENTE (PESTAÑAS MEJORADAS: Proceso, Historial, Apuntes) ---
    let currentTeacherTab = 'process';

    // Función auxiliar para borrar mis propios apuntes (NUEVA)
    window.deleteNote = async (noteId) => {
        if(!confirm("¿Estás seguro de que quieres eliminar este apunte permanentemente?")) return;
        
        // Iteramos por todas las asignaturas para encontrar y borrar el apunte
        for (let key in notesDB) {
            notesDB[key] = notesDB[key].filter(n => n.id !== noteId);
        }
        await saveData();
        // Recargamos el panel si estamos en él
        if(window.showTeacherWorkPanel) window.showTeacherWorkPanel(); 
    };

    window.showTeacherWorkPanel = () => {
        const modal = document.getElementById('requestNoteModal');
        modal.classList.add('active');
        if(typeof newRequestBtn !== 'undefined' && newRequestBtn) newRequestBtn.classList.add('hidden');
        
        const list = document.getElementById('studentRequestsList');
        list.classList.remove('hidden');
        list.innerHTML = '';
        
        document.getElementById('requestNoteTitle').textContent = "🎓 Mi Panel Docente";

        // 1. CREAR NAVEGACIÓN DE PESTAÑAS
        const tabsContainer = document.createElement('div');
        tabsContainer.style.cssText = 'display:flex; margin-bottom:15px; border-bottom:2px solid #e2e8f0; gap:10px; padding-bottom:10px;';

        const tabs = [
            { id: 'process', label: '🛠️ En Proceso', color: '#3b82f6' },
            { id: 'history', label: '📜 Historial', color: '#64748b' },
            { id: 'my-notes', label: '📚 Mis Apuntes', color: '#8b5cf6' }
        ];

        tabs.forEach(t => {
            const btn = document.createElement('button');
            btn.textContent = t.label;
            btn.className = 'btn';
            btn.style.flex = '1';
            
            if(currentTeacherTab === t.id) {
                btn.style.background = t.color;
                btn.style.color = 'white';
                btn.style.border = `2px solid ${t.color}`;
            } else {
                btn.style.background = '#f1f5f9';
                btn.style.color = '#64748b';
                btn.style.border = '1px solid #e2e8f0';
            }
            
            btn.onclick = () => {
                currentTeacherTab = t.id;
                showTeacherWorkPanel(); 
            };
            tabsContainer.appendChild(btn);
        });

        list.appendChild(tabsContainer);

        // 2. RENDERIZAR CONTENIDO
        const contentDiv = document.createElement('div');
        contentDiv.id = 'teacherPanelContent';
        contentDiv.style.height = '400px';
        contentDiv.style.overflowY = 'auto';
        list.appendChild(contentDiv);

        if (currentTeacherTab === 'process') {
            // -- PESTAÑA 1: EN PROCESO --
            const items = requestsDB.filter(r => r.assignedTo === userAlias && r.status === 'En Proceso');
            if(items.length === 0) contentDiv.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No tienes solicitudes en proceso.</p>';
            
            items.forEach(req => {
                const card = document.createElement('div');
                card.style.cssText = "background:white; padding:12px; margin-bottom:10px; border-radius:6px; border-left:4px solid #3b82f6; box-shadow:0 1px 2px rgba(0,0,0,0.05);";
                card.innerHTML = `
                    <div style="font-weight:bold; color:var(--brand);">${req.topic}</div>
                    <div style="font-size:0.9rem; color:#555; margin-bottom:5px;">${req.subject}</div>
                    <p style="background:#f8fafc; padding:8px; font-style:italic;">"${req.text}"</p>
                    <button class="btn" style="width:100%; margin-top:5px;" onclick="openTeacherResponseFormV33('${req.id}')">✍️ Resolver Ahora</button>
                `;
                contentDiv.appendChild(card);
            });

        } else if (currentTeacherTab === 'history') {
            // -- PESTAÑA 2: HISTORIAL --
            const history = requestsDB.filter(r => 
                (r.assignedTo === userAlias || r.respondedBy === userAlias) &&
                ['Completada', 'Rechazada', 'Eliminada'].includes(r.status)
            );
            history.sort((a,b) => b.timestamp - a.timestamp);

            if(history.length === 0) contentDiv.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No hay historial reciente.</p>';
            
            history.forEach(req => {
                const card = document.createElement('div');
                card.className = 'request-card';
                let statusColor = '#94a3b8';
                if(req.status === 'Completada') statusColor = '#16a34a';
                if(req.status === 'Eliminada') statusColor = '#ef4444';
                
                card.style.borderLeft = `4px solid ${statusColor}`;
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${req.topic}</strong>
                        <span style="color:${statusColor}; font-weight:bold; font-size:0.8rem;">${req.status}</span>
                    </div>
                    <small style="color:#64748b;">${new Date(req.timestamp).toLocaleDateString()}</small>
                    <p style="font-size:0.9rem; margin-top:5px; color:#333;">"${req.text}"</p>
                    ${req.rejectionReason ? `<div style="background:#fee2e2; color:#991b1b; padding:5px; font-size:0.8rem; margin-top:5px;">Causa: ${req.rejectionReason}</div>` : ''}
                `;
                contentDiv.appendChild(card);
            });

        } else if (currentTeacherTab === 'my-notes') {
            // -- PESTAÑA 3: MIS APUNTES CREADOS --
            let myNotes = [];
            // Buscamos en toda la DB de apuntes
            for(let key in notesDB) {
                notesDB[key].forEach(n => {
                    if(n.author === userAlias) myNotes.push(n);
                });
            }
            myNotes.sort((a,b) => b.timestamp - a.timestamp);

            if(myNotes.length === 0) contentDiv.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">Aún no has creado apuntes.</p>';
            
            myNotes.forEach(note => {
                const card = document.createElement('div');
                card.style.cssText = "background:white; padding:10px; margin-bottom:10px; border:1px solid #e2e8f0; border-radius:6px; display:flex; justify-content:space-between; align-items:center;";
                
                card.innerHTML = `
                    <div>
                        <div style="font-weight:bold;">📄 ${note.displayName}</div>
                        <div style="font-size:0.8rem; color:#64748b;">${note.subject} > ${note.topic}</div>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button class="btn secondary" style="padding:5px 10px;" onclick="showProtectedNote(findNoteById('${note.id}'))">Ver</button>
                        <button class="btn danger" style="padding:5px 10px;" onclick="deleteNote('${note.id}')">🗑️</button>
                    </div>
                `;
                contentDiv.appendChild(card);
            });
        }
    };
   
window.openTeacherResponseFormV33 = (reqOrId) => {
        let req = (typeof reqOrId === 'string') ? requestsDB.find(r => r.id === reqOrId) : reqOrId;
        if (!req) return;

        // 1. Ocultar panel y entrar en subjectsScreen
        document.getElementById('requestNoteModal').classList.remove('active');
        currentRequestId = req.id; 
        showScreen(subjectsScreen);

    // ACTIVAR BOTÓN VOLVER AL DASHBOARD
        const btnBack = document.getElementById('btnBackToDash');
        if(btnBack) btnBack.onclick = () => showDashboard();

        // CAMBIAR TÍTULO CON CONTRASTE
        const titleElem = document.getElementById('subjectsTitle');
        if (titleElem) {
            titleElem.innerHTML = `
                <span style="color:var(--brand); font-weight:800; font-size:1.4rem;">✍️ Respondiendo a:</span> 
                <span style="color:var(--ink);">${req.subject}</span>
                <br>
                <div style="margin-top:5px; padding:4px 10px; background:var(--bg-screen); border-radius:5px; display:inline-block; border:1px solid var(--border);">
                    <small style="color:var(--muted); font-weight:600;">📌 TEMA: ${req.topic}</small>
                </div>`;
        }

        const bSearch = document.getElementById('btnStructuredSearch');
        const bRequest = document.getElementById('btnRequestNote');
        const subjectsBox = document.querySelector('#subjects .box.list');
        const notesContainer = document.getElementById('notesContainer');
        
        if(bSearch) bSearch.style.display = 'none';
        if(bRequest) bRequest.style.display = 'none';
        if(subjectsBox) subjectsBox.style.display = 'none';

        // AMPLIAR ZONA CENTRAL Y DAR CONTRASTE AL PANEL
        const subjectsContainer = document.querySelector('#subjects .container');
        if(subjectsContainer) subjectsContainer.style.gridTemplateColumns = '1fr';
        if(notesContainer) {
            notesContainer.parentElement.style.background = '#ffffff';
            notesContainer.parentElement.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
            notesContainer.parentElement.style.border = '2px solid var(--brand)';
        }

        // 2. ELIMINAR SOLO BUSQUEDA ESTRUCTURADA Y SOLICITAR APUNTE
        const busqueda = document.getElementById('structured-response-section');
        if(busqueda) busqueda.style.display = 'none';
        
        const solicitar = document.querySelector('.request-actions-bar');
        if(solicitar) solicitar.style.display = 'none';

        // 3. CONFIGURAR BOTÓN VOLVER (btnProfile)
        const btnProfile = document.getElementById('btnProfile');
        if(btnProfile) {
            const header = btnProfile.parentNode;
            Array.from(header.children).forEach(child => {
                if(child.id !== 'btnProfile') child.style.display = 'none';
            });

            if(!btnProfile._oldHTML) btnProfile._oldHTML = btnProfile.innerHTML;
            if(!btnProfile._oldClick) btnProfile._oldClick = btnProfile.onclick;

            btnProfile.innerHTML = "🔙 Volver al Panel";
            btnProfile.onclick = () => {
                // Restaurar visibilidad
                if(busqueda) busqueda.style.display = '';
                if(solicitar) solicitar.style.display = '';
                Array.from(header.children).forEach(child => child.style.display = '');
                
               btnProfile.innerHTML = btnProfile._oldHTML;
                btnProfile.onclick = btnProfile._oldClick;
                currentRequestId = null;
                showDashboard(); 
            };
}
        // 4. ABRIR TU EDITOR (Limpia contenedores y lanza showCreateNoteForm)
        document.getElementById("optionsContainer").innerHTML = '';
        document.getElementById("notesContainer").innerHTML = '';
        showCreateNoteForm(req.subject, req.topic);
    };

    // --- NUEVA FUNCIÓN: MARCAR COMO VISTA Y ABRIR APUNTE ---
    window.markAsSeenAndOpen = async (reqId, noteId) => {
        const req = requestsDB.find(r => r.id === reqId);
        if (req) {
            req.seenByStudent = true; // Marcamos que ya la vio
            await saveData(); // Guardamos en DB
            
            // Actualizamos la campana del dashboard si el usuario vuelve atrás
            showDashboard(); 
        }
        openLinkedNote(noteId); // Abrimos el apunte normalmente
    };
	// --- FUNCIÓN FALTANTE: ABRIR APUNTE VINCULADO ---
    	window.openLinkedNote = (noteId) => {
        const note = findNoteById(noteId);
        if (note) {
            // Cerramos modal de solicitudes si está abierto
            if(requestNoteModal) requestNoteModal.classList.remove('active');
            if(requestsModal) requestsModal.classList.remove('active');
            // Mostramos el apunte
            showProtectedNote(note);
        } else {
            alert("Error: El apunte respuesta no se encuentra (quizás fue borrado).");
        }
    };
/* ===================================================================================================
   MEJORA V9: BUSCADOR PERFECTO (Elimina botones duplicados en Avisos)
   =================================================================================================== */
    
    let lastUserQuery = ""; // Memoria persistente

    window.showUserSearchModal = function() {
        const modal = document.getElementById('requestNoteModal');
        modal.classList.add('active');
        document.getElementById('requestNoteTitle').textContent = "🔍 Buscador de Usuarios";
        
        // Limpieza inicial
        if(typeof newRequestBtn !== 'undefined' && newRequestBtn) newRequestBtn.classList.add('hidden');
        const list = document.getElementById('studentRequestsList');
        list.classList.remove('hidden');
        list.innerHTML = '';

        // 1. FORMULARIO
        const searchDiv = document.createElement('div');
        searchDiv.style.textAlign = 'center';
        searchDiv.innerHTML = `
            <input type="text" id="userSearchInput" placeholder="Nombre de usuario (alias)..." value="${lastUserQuery}"
                style="padding: 10px; width: 70%; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 10px;">
            <button id="btnSearchUserAction" class="btn" style="background:var(--brand); width: 25%;">Buscar</button>
        `;
        list.appendChild(searchDiv);

        const resultDiv = document.createElement('div');
        resultDiv.id = 'userSearchResult';
        resultDiv.style.marginTop = '20px';
        list.appendChild(resultDiv);

        // LÓGICA DE BÚSQUEDA
        const performSearch = () => {
            const query = document.getElementById('userSearchInput').value.trim().toLowerCase();
            if(!query) return showToast("Escribe un nombre.", "warning");
            
            lastUserQuery = query;

            const foundKey = Object.keys(registeredUsers).find(k => k.startsWith(query + '-'));
            if (!foundKey) {
                resultDiv.innerHTML = `<div style="background:#fee2e2; color:#991b1b; padding:15px; border-radius:8px; text-align:center;">❌ El usuario "${query}" no existe.</div>`;
                return;
            }

            const u = registeredUsers[foundKey];
            const cleanName = foundKey.split('-')[0];
            const dateStr = u.registrationDate ? new Date(u.registrationDate).toLocaleDateString() : 'Desconocida';
            
            // Logros
            let badgesHTML = '<span style="color:#999; font-style:italic; font-size:0.9rem;">Sin logros.</span>';
            if (u.badges && u.badges.length > 0) {
                badgesHTML = `<div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:5px;">`;
                u.badges.forEach(bId => {
                     if(typeof BADGES_CONFIG !== 'undefined' && BADGES_CONFIG[bId]) {
                        badgesHTML += `<span style="font-size:1.4rem; cursor:help;" title="${BADGES_CONFIG[bId].title}">${BADGES_CONFIG[bId].icon}</span>`;
                     }
                });
                badgesHTML += `</div>`;
            }

            // Actividad
            const activities = [];
            // Apuntes
            Object.values(notesDB).flat().forEach(n => {
                if(n.author === foundKey) {
                    activities.push({ 
                        type: '📝 Apunte', text: n.displayName, time: n.timestamp,
                        actionId: n.id, actionType: 'note' 
                    });
                }
            });
            // Avisos
            if(typeof announcementsDB !== 'undefined') {
                announcementsDB.forEach(a => {
                    if(a.author === foundKey) {
                        activities.push({ 
                            type: '📢 Aviso', text: `en ${a.targetCourse}`, time: a.timestamp,
                            actionId: a.id, actionType: 'ad' 
                        });
                    }
                });
            }
            activities.sort((a,b) => b.time - a.time);
            
            let activityHTML = '';
            if(activities.length === 0) {
                activityHTML = '<div style="color:#999; font-style:italic; font-size:0.9rem;">Sin actividad pública.</div>';
            } else {
                activities.forEach(act => {
                    let exists = false;
                    if (act.actionType === 'note') exists = !!findNoteById(act.actionId);
                    else if (act.actionType === 'ad') exists = announcementsDB.some(a => a.id === act.actionId);

                    let actionWidget = '';
                    if (!exists) {
                        actionWidget = `<span style="color:#ef4444; font-size:0.75rem; font-style:italic; margin-left:10px;">(Fue eliminado)</span>`;
                    } else {
                        actionWidget = `<button class="btn secondary" style="padding:1px 10px; font-size:0.75rem; border-radius:4px; margin-left:10px;" 
                                         onclick="window.goToActivityItem('${act.actionType}', '${act.actionId}')">Ir ➡</button>`;
                    }

                    activityHTML += `<div style="font-size:0.85rem; margin-bottom:6px; border-bottom:1px dotted #eee; padding-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="flex:1;"><span style="color:#94a3b8; margin-right:5px;">${new Date(act.time).toLocaleDateString()}</span> <strong>${act.type}:</strong> ${act.text}</div>
                        ${actionWidget}
                    </div>`;
                });
            }

            resultDiv.innerHTML = `
                <div style="background:var(--bg-screen); padding:15px; border-radius:12px; border:1px solid var(--border); text-align:center;">
                    <div style="font-size:3rem; margin-bottom:5px;">${u.avatar || '👤'}</div>
                    <h2 style="margin:0; color:var(--brand); text-transform:capitalize;">${cleanName}</h2>
                    <span style="background:${u.rol==='Profesor'?'#0ea5e9':'#22c55e'}; color:white; padding:2px 8px; border-radius:12px; font-size:0.75rem; text-transform:uppercase; font-weight:bold;">${u.rol}</span>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; text-align:left; margin-top:15px; font-size:0.85rem; background:white; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">
                        <div><strong>📍 Comunidad:</strong><br>${u.comunidad || 'N/A'}</div>
                        <div><strong>📅 Registro:</strong><br>${dateStr}</div>
                        <div style="grid-column: span 2;"><strong>🎓 Nivel/Curso:</strong><br>${u.rol === 'Alumno' ? u.curso : (u.nivelesImparte ? u.nivelesImparte.join(', ') : 'N/A')}</div>
                        <div style="grid-column: span 2; margin-top:5px; padding-top:5px; border-top:1px dashed #eee;">
                            <strong style="color:#d97706;">🏆 Logros:</strong><br>${badgesHTML}
                        </div>
                    </div>
                    
                    <div style="margin-top:15px; background:white; border-radius:8px; border:1px solid #e2e8f0; text-align:left; display: flex; flex-direction: column; height: 200px;">
                        <div style="padding:10px; background:#f1f5f9; border-bottom:1px solid #e2e8f0; font-weight:bold;">📊 Actividad Reciente:</div>
                        <div style="overflow-y: auto; padding:10px;">${activityHTML}</div>
                    </div>
                </div>
            `;
        };

        document.getElementById('btnSearchUserAction').onclick = performSearch;
        if(lastUserQuery) performSearch(); 

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn secondary';
        closeBtn.textContent = 'Volver al Dashboard';
        closeBtn.style.width = '100%';
        closeBtn.style.marginTop = '20px';
        closeBtn.onclick = () => {
            lastUserQuery = ""; 
            modal.classList.remove('active');
            showDashboard();
        };
        list.appendChild(closeBtn);
    };

    // --- FUNCIÓN DE NAVEGACIÓN INTELIGENTE (LIMPIEZA DE BOTONES) ---
    window.goToActivityItem = async function(type, id) {
        // CASO A: APUNTE
        if (type === 'note') {
            const note = findNoteById(id);
            if (note) {
                showProtectedNote(note); 
                document.getElementById('requestNoteModal').classList.remove('active');
                window.previousScreen = {
                    classList: {
                        add: function(c) { if(c==='active') window.showUserSearchModal(); },
                        remove: function() {}, contains: function() { return false; }
                    },
                    id: 'VIRTUAL_SEARCH'
                };
            } else {
                showToast("El apunte ya no existe.", "error");
                window.showUserSearchModal();
            }
        } 
        // CASO B: AVISO (Rastreo + Limpieza total de botones)
        else if (type === 'ad') {
            const adExists = announcementsDB.some(a => a.id === id);
            if(adExists) {
                // 1. Cargar tablón
                await window.openBulletinBoard();
                
                // 2. Rastreo de botones (Polling)
                let attempts = 0;
                const tracker = setInterval(() => {
                    attempts++;
                    const list = document.getElementById('studentRequestsList');
                    
                    // Buscamos TODOS los botones secundarios (los de cerrar/volver)
                    // Normalmente tienen la clase 'btn secondary'
                    const oldButtons = list.querySelectorAll('button.btn.secondary');

                    // Si encontramos botones, significa que la lista ya cargó
                    if (oldButtons.length > 0) {
                        
                        // PASO CLAVE: BORRAMOS TODOS LOS BOTONES VIEJOS
                        oldButtons.forEach(btn => btn.remove());

                        // PASO CLAVE: AÑADIMOS EL NUESTRO (SOLO UNO)
                        const newBtn = document.createElement('button');
                        newBtn.className = 'btn secondary';
                        newBtn.textContent = "⬅ Volver al Buscador";
                        newBtn.style.width = '100%';
                        newBtn.style.marginTop = '20px';
                        newBtn.style.background = '#e2e8f0'; 
                        newBtn.style.color = '#334155';
                        newBtn.style.border = '1px solid #cbd5e1';
                        
                        newBtn.onclick = () => {
                             clearInterval(tracker);
                             window.showUserSearchModal();
                        };
                        
                        list.appendChild(newBtn);
                        
                        // Misión cumplida, paramos
                        clearInterval(tracker);
                    }

                    if (attempts > 20) clearInterval(tracker); // Timeout de seguridad
                    
                }, 100);

            } else {
                showToast("El aviso fue eliminado.", "error");
                window.showUserSearchModal();
            }
        }
    };

    // 1. MODAL DE BÚSQUEDA ESTRUCTURADA
    function showStructuredSearchModal() {
        structuredSearchState = { step: 0, course: currentCourse || null, subject: null };
        document.getElementById('structuredSearchModal').classList.add('active');
        renderStructuredSearch();
    }

    function renderStructuredSearch() {
        const container = document.getElementById('searchFlowContainer');
        container.innerHTML = '';
        // Paso 0: Curso
        if (!structuredSearchState.course) {
            renderCourseSelection(container, (course) => {
                structuredSearchState.course = course;
                renderStructuredSearch();
            }, 'search');
            // ELIMINAR BOTÓN ATRÁS EN BÚSQUEDA
            const btnBackSearch = document.getElementById('searchGoBackBtn');
            if(btnBackSearch) btnBackSearch.classList.add('hidden');
            return;
        }

       // Paso 1: Asignatura
        if (!structuredSearchState.subject) {
            renderSubjectSelection(structuredSearchState.course, container, (subj) => {
                structuredSearchState.subject = subj;
                renderStructuredSearch();
            }, 'search');
            const btnBackSearch = document.getElementById('searchGoBackBtn');
            if(btnBackSearch) btnBackSearch.classList.add('hidden');
            return;
        }

       // Paso 2: Tema (Final)
        renderTopicSelection(structuredSearchState.course, structuredSearchState.subject, container, (topic) => {
            const course = structuredSearchState.course;
            const subject = structuredSearchState.subject;
            const key = `${subject}:${topic}`;
            const notes = notesDB[key] || [];

            document.getElementById('structuredSearchModal').classList.remove('active');

            goToSubjects(course);
            currentSubject = subject;
            currentTopic = topic;

            showTopics(course, subject, topic); 
            showTopicOptions(subject, topic);
            consultNotes(subject, topic);

            if (notes && notes.length === 1) {
                showProtectedNote(notes[0]);
            }
        }, 'search');
        
        // ASEGURAR QUE SIGA OCULTO EN EL ÚLTIMO PASO
        const btnBackSearch = document.getElementById('searchGoBackBtn');
        if(btnBackSearch) btnBackSearch.classList.add('hidden');
       
       
    }
    // 2. MODAL DE SOLICITUDES (ALUMNO) - ESTA ES LA QUE FALTABA
    function showRequestNoteModal() {
        requestNoteState = { step: 0, course: currentCourse || null, subject: null, topic: null };
        document.getElementById('requestNoteModal').classList.add('active');
        
        // Mostrar lista, ocultar asistente al inicio
        if(document.getElementById('studentRequestsList')) document.getElementById('studentRequestsList').classList.remove('hidden');
        if(document.getElementById('requestFlowContainer')) document.getElementById('requestFlowContainer').classList.add('hidden');
        if(newRequestBtn) newRequestBtn.classList.remove('hidden');
        if(requestGoBackBtn) requestGoBackBtn.classList.add('hidden');

        renderStudentRequests();
    }

    // Configurar botón de "Nueva Solicitud"
    if(newRequestBtn) {
        newRequestBtn.onclick = () => {
            document.getElementById('studentRequestsList').classList.add('hidden');
            newRequestBtn.classList.add('hidden');
            document.getElementById('requestFlowContainer').classList.remove('hidden');
            if(requestGoBackBtn) requestGoBackBtn.classList.remove('hidden');
            
            requestNoteState = { step: 0, course: currentCourse || null, subject: null, topic: null };
            renderRequestWizard();
        };
    }

    function renderRequestWizard() {
        const container = document.getElementById('requestFlowContainer');
        container.innerHTML = '';

        // Paso 0: Curso
        if (!requestNoteState.course) {
            renderCourseSelection(container, (c) => {
                requestNoteState.course = c;
                renderRequestWizard();
            }, 'request');
            return;
        }

        // Paso 1: Asignatura
        if (!requestNoteState.subject) {
            renderSubjectSelection(requestNoteState.course, container, (s) => {
                requestNoteState.subject = s;
                renderRequestWizard();
            }, 'request');
            return;
        }

        // Paso 2: Tema
        if (!requestNoteState.topic) {
            renderTopicSelection(requestNoteState.course, requestNoteState.subject, container, (t) => {
                requestNoteState.topic = t;
                renderRequestWizard();
            }, 'request');
            return;
        }

        // Paso 3: Texto y Enviar
        container.innerHTML = `
            <div class="selection-step-container">
                <p>Solicitud para: <strong>${requestNoteState.subject} > ${requestNoteState.topic}</strong></p>
                <textarea id="requestText" placeholder="Describe qué apuntes necesitas..." style="width:100%; height:100px; margin-top:10px;"></textarea>
                <button id="btnSubmitReq" class="btn" style="width:100%; margin-top:10px;">🚀 Enviar Solicitud</button>
            </div>
        `;
        
        document.getElementById('btnSubmitReq').onclick = async () => {
            const text = document.getElementById('requestText').value.trim();
            if(!text) return alert("Por favor describe tu solicitud.");
            
            const newReq = {
                id: Date.now().toString(),
                requester: userAlias,
                course: requestNoteState.course,
                subject: requestNoteState.subject,
                topic: requestNoteState.topic,
                text: text,
                timestamp: Date.now(),
                status: 'Pendiente',
                supporters: []
            };
            
            requestsDB.push(newReq);
            await saveData();
            
            alert("Solicitud enviada.");
            showRequestNoteModal(); // Volver al inicio
        };
    }
function renderStudentRequests() {
        const listDiv = document.getElementById('studentRequestsList');
        if(!listDiv) return;

        // 1. Cabecera limpia con botón de "Nueva"
        listDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:10px;">
                <h3 style="margin:0; color:var(--brand);">📋 Mis Solicitudes</h3>
                <button class="btn btn-sm" onclick="startNewRequestAssistant()" style="background:var(--brand);">➕ Nueva</button>
            </div>
            <div id="reqsContainer" style="display:flex; flex-direction:column; gap:10px;"></div>
        `;

        const container = document.getElementById('reqsContainer');
        const myReqs = requestsDB.filter(r => r.requester === userAlias); // Filtro correcto por solicitante

        if(myReqs.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--muted); padding:20px; font-style:italic;">No tienes solicitudes activas.</div>`;
            return;
        }

        // 2. Renderizar tarjetas con ESTADO VISUAL
        myReqs.slice().reverse().forEach(req => {
            let statusBadge = '';
            let actionBtn = '';

            // Lógica de Estados
            if(req.status === 'Pendiente') { // Ojo: en tu DB se guarda como 'Pendiente' con mayúscula
                statusBadge = `<span style="background:#f59e0b; color:white; padding:3px 8px; border-radius:12px; font-size:0.7rem; font-weight:bold;">⏳ PENDIENTE</span>`;
                actionBtn = `<button class="btn-icon danger" onclick="deleteRequest('${req.id}')" title="Cancelar Solicitud" style="padding:5px 10px;">🗑️</button>`;
            } else if(req.status === 'En Proceso') {
                statusBadge = `<span style="background:#3b82f6; color:white; padding:3px 8px; border-radius:12px; font-size:0.7rem; font-weight:bold;">⚙️ EN PROCESO</span>`;
                actionBtn = `<span style="font-size:0.8rem; color:var(--muted);">El profe está escribiendo...</span>`;
            } else if(req.status === 'Completada' || req.status === 'resolved') {
                statusBadge = `<span style="background:#10b981; color:white; padding:3px 8px; border-radius:12px; font-size:0.7rem; font-weight:bold;">✅ RESUELTA</span>`;
                // Usamos markAsSeenAndOpen o openLinkedNote según lo que tengas disponible
                const fnCall = (typeof markAsSeenAndOpen === 'function') ? `markAsSeenAndOpen('${req.id}', '${req.linkedNoteId}')` : `openLinkedNote('${req.linkedNoteId}')`;
                actionBtn = `<button class="btn btn-sm" onclick="${fnCall}" style="background:var(--brand); border:none; box-shadow:0 2px 5px rgba(0,0,0,0.1);">👁️ Ver Apunte</button>`;
            }

            const card = document.createElement('div');
            card.style.cssText = "background:white; padding:15px; border-radius:10px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.03);";
            
            card.innerHTML = `
                <div style="flex:1;">
                    <div style="font-weight:700; color:var(--ink); font-size:1rem;">${req.subject}</div>
                    <div style="font-size:0.85rem; color:var(--muted); margin-top:2px;">${req.topic}</div>
                    <div style="margin-top:8px;">${statusBadge}</div>
                </div>
                <div style="margin-left:10px;">
                    ${actionBtn}
                </div>
            `;
            container.appendChild(card);
        });
    }

    // --- NUEVA FUNCIÓN NECESARIA PARA EL BOTÓN "➕ Nueva" ---
    window.startNewRequestAssistant = function() {
        const listDiv = document.getElementById('studentRequestsList');
        const flowDiv = document.getElementById('requestFlowContainer');
        const backBtn = document.getElementById('requestGoBackBtn');
        const newBtn = document.getElementById('newRequestBtn'); // El botón global si existe

        if(listDiv) listDiv.classList.add('hidden');
        if(flowDiv) flowDiv.classList.remove('hidden');
        if(backBtn) backBtn.classList.remove('hidden');
        if(newBtn) newBtn.classList.add('hidden');

        // Reiniciamos estado
        requestNoteState = { step: 0, course: currentCourse || null, subject: null, topic: null };
        renderRequestWizard();
    };


    // Botones de cerrar/volver
    document.getElementById('closeSearchModal')?.addEventListener('click', () => {
        document.getElementById('structuredSearchModal').classList.remove('active');
    });
    document.getElementById('searchGoBackBtn')?.addEventListener('click', () => {
        showStructuredSearchModal();
    });
    document.getElementById('closeRequestModal')?.addEventListener('click', () => {
        document.getElementById('requestNoteModal').classList.remove('active');
        // FIX: Si no hay pantalla activa debajo (porque venimos de un apunte), volver al Dashboard
        if(!document.querySelector('.screen.active')) {
            showDashboard();
        }
    });
    
    document.getElementById('requestGoBackBtn')?.addEventListener('click', () => {
        showStudentRequestsPanel();
    });
// =========================================
    // BLOQUE 13: SISTEMA DE GAMIFICACIÓN
    // =========================================
// 1. Configuración de Medallas (NUEVO - REQUERIDO)
    const BADGES_CONFIG = {
        'init_3': { id: 'init_3', icon: '🐣', title: 'El Iniciado', desc: 'Has entrado 3 veces a la aplicación.' },
        'creator_1': { id: 'creator_1', icon: '✍️', title: 'Primer Autor', desc: 'Has creado tu primer apunte.' },
        'creator_5': { id: 'creator_5', icon: '📚', title: 'Bibliotecario', desc: 'Has creado 5 apuntes.' },
       'reader_5': { id: 'reader_5', icon: '🤓', title: 'El Curioso', desc: 'Has consultado 5 apuntes.', targetRole: 'Alumno' },
        'streak_7': { id: 'streak_7', icon: '🔥', title: 'En Llamas', desc: '¡Racha de estudio de 7 días!', targetRole: 'Alumno' },
        'peer_help': { id: 'peer_help', icon: '🤝', title: 'Súper Compañero', desc: 'Has ayudado a 10 compañeros.', targetRole: 'Alumno' },
        'teacher_apple': { id: 'teacher_apple', icon: '🍎', title: 'Maestro de Oro', desc: 'Has recibido 20 manzanas de tus alumnos.', targetRole: 'Profesor' },
        'noctambulo': { id: 'noctambulo', icon: '🦉', title: 'Noctámbulo', desc: 'Has trabajado de madrugada (22h-05h).' },
        'critic_5': { id: 'critic_5', icon: '🗳️', title: 'El Crítico', desc: 'Has votado en 5 apuntes distintos.', targetRole: 'Alumno' },
        'verifier_3': { id: 'verifier_3', icon: '✅', title: 'Sello de Calidad', desc: 'Has verificado 3 apuntes de alumnos.', targetRole: 'Profesor' },
        'solver_5': { id: 'solver_5', icon: '🦸‍♂️', title: 'El Resolutor', desc: 'Has resuelto 5 solicitudes de alumnos.', targetRole: 'Profesor' },
        'voice_3': { id: 'voice_3', icon: '📢', title: 'Voz del Campus', desc: 'Has publicado 3 avisos en el tablón.', targetRole: 'Profesor' }
    };
 // 2. Función Principal: Verificar Logros
    // Se llama así: checkBadges('login') o checkBadges('create')
    window.checkBadges = function(actionType) {
        if (!userAlias || !registeredUsers[userAlias]) return;

        const u = registeredUsers[userAlias];
        // Asegurar que el array existe
        if (!u.badges) u.badges = [];
let newBadgeId = null;

        if (actionType === 'login') {
            if (u.visits >= 3 && !u.badges.includes('init_3')) newBadgeId = 'init_3';
            if ((u.streak || 0) >= 7 && !u.badges.includes('streak_7')) newBadgeId = 'streak_7';
        }
        if (actionType === 'create') {
            if (u.created >= 1 && !u.badges.includes('creator_1')) newBadgeId = 'creator_1';
            if (u.created >= 5 && !u.badges.includes('creator_5')) newBadgeId = 'creator_5';
        }
        if (actionType === 'read') {
            if (u.consulted >= 5 && !u.badges.includes('reader_5')) newBadgeId = 'reader_5';
        }
        // Regla 4: Menciones (Manzanas)
        if (actionType === 'mention') {
            const mentions = u.mentionsReceived || 0;
            if (u.rol === 'Alumno' && mentions >= 10 && !u.badges.includes('peer_help')) newBadgeId = 'peer_help';
            if (u.rol === 'Profesor' && mentions >= 20 && !u.badges.includes('teacher_apple')) newBadgeId = 'teacher_apple';
        }
        // Regla Especial: Noctámbulo
        const hour = new Date().getHours();
        if ((hour >= 22 || hour <= 5) && !u.badges.includes('noctambulo')) {
            newBadgeId = 'noctambulo';
        }

       
// ---------------------------------------------------------------------------------------------------
        // MODIFICACIÓN: LÓGICA PARA LOS 4 NUEVOS LOGROS
        // INICIO BLOQUE MODIFICADO
        // ---------------------------------------------------------------------------------------------------
        
        // Regla: "El Crítico" (Alumno vota 5 veces)
        if (actionType === 'vote' && u.rol === 'Alumno' && !u.badges.includes('critic_5')) {
            let voteCount = 0;
            // Recorremos todos los apuntes para contar votos de este usuario
            Object.values(notesDB).flat().forEach(note => {
                if (note.ratings && note.ratings.some(r => r.alias === userAlias)) voteCount++;
            });
            if (voteCount >= 5) newBadgeId = 'critic_5';
        }

        // Regla: "Sello de Calidad" (Profesor verifica 3 apuntes)
        if (actionType === 'verify' && u.rol === 'Profesor' && !u.badges.includes('verifier_3')) {
            let verifyCount = 0;
            Object.values(notesDB).flat().forEach(note => {
                if (note.verifiedBy === userAlias) verifyCount++;
            });
            if (verifyCount >= 3) newBadgeId = 'verifier_3';
        }

        // Regla: "El Resolutor" (Profesor resuelve 5 solicitudes)
        if (actionType === 'solve' && u.rol === 'Profesor' && !u.badges.includes('solver_5')) {
            // Contamos solicitudes completadas asignadas a mí
            const solvedCount = requestsDB.filter(r => r.assignedTo === userAlias && r.status === 'Completada').length;
            if (solvedCount >= 5) newBadgeId = 'solver_5';
        }

        // Regla: "Voz del Campus" (Profesor publica 3 avisos)
        if (actionType === 'post' && u.rol === 'Profesor' && !u.badges.includes('voice_3')) {
            const postCount = announcementsDB.filter(ad => ad.author === userAlias).length;
            if (postCount >= 3) newBadgeId = 'voice_3';
        }

        if (newBadgeId) unlockBadge(newBadgeId);
      
    };
    // 3. Desbloquear y Celebrar
    function unlockBadge(badgeId) {
        const u = registeredUsers[userAlias];
        u.badges.push(badgeId);
        saveData(); // Guardar en DB inmediatamente

        // Mostrar Fiesta
        const badge = BADGES_CONFIG[badgeId];
        document.getElementById('badgeTitle').textContent = badge.title;
        document.getElementById('badgeDesc').textContent = badge.desc;
        // Icono gigante
        document.querySelector('#achievementModal div[style*="font-size: 5rem"]').textContent = badge.icon;
        
        achievementModal.classList.add('active');
        
        // Sonido de victoria (opcional)
        try {
            const audio = new AudioContext();
            const osc = audio.createOscillator();
            const gain = audio.createGain();
            osc.connect(gain);
            gain.connect(audio.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, audio.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, audio.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.5);
            osc.start();
            osc.stop(audio.currentTime + 0.5);
        } catch(e) {}
    }

    window.closeAchievementModal = function() {
        achievementModal.classList.remove('active');
    };
 

// --- LISTENER GLOBAL: CERRAR VISOR CON TECLA (INTELIGENTE) ---
    document.addEventListener('keydown', (e) => {
        // 1. REGLA DE ORO: Si el usuario está escribiendo, NO HACER NADA.
        // Verificamos si el foco está en un input o textarea
        const tag = document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        // 2. Si no está escribiendo, cualquier tecla cierra el visor
        const modal = document.getElementById('protectedModal');
        
        // Solo actuamos si el modal del apunte está visible
        if (modal.classList.contains('active')) {
           // Detener cualquier audio (Text-to-Speech) que esté sonando
            if (window.speechSynthesis) window.speechSynthesis.cancel();

            // 1. Ocultar el modal
            modal.classList.remove('active');
            // 2. RECUPERAR LA PANTALLA ANTERIOR
            if (window.previousScreen) {
                window.previousScreen.classList.add('active');
            } else {
                // Fallback de seguridad: Si por lo que sea no hay memoria, ir al Dashboard
                showDashboard();
            }
        }
    });
// --- FUNCIÓN DE MENCIONES (VERSIÓN COMPLETA Y CORREGIDA) ---
    window.giveMention = function(noteId, targetAlias, type) {
        
        // 1. Validar que el usuario que intenta dar la manzana existe y está logueado
        if (!userAlias || !registeredUsers[userAlias]) {
            alert("Error: Debes iniciar sesión para realizar esta acción.");
            return;
        }

        // 2. Buscar el apunte en la base de datos
        var note = findNoteById(noteId);
        if (!note) {
            alert("Error: No se ha encontrado el apunte especificado.");
            return;
        }
        
        // 3. Asegurar que el array de agradecimientos del apunte existe
        if (!note.thanks) {
            note.thanks = [];
        }

        // 4. VERIFICACIÓN CLAVE: ¿Ya has dado las gracias EN ESTE APUNTE?
        // Buscamos si tu alias ya está en la lista de este apunte concreto
        if (note.thanks.includes(userAlias)) {
            alert("¡Ya has enviado un agradecimiento por este apunte! No puedes repetir en el mismo.");
            return;
        }

        // 5. PROCESAR EL AGRADECIMIENTO
        // A) Guardamos tu firma en el apunte para que no puedas repetir
        note.thanks.push(userAlias);

        // B) Buscamos al usuario destinatario (Profesor o Alumno)
        var targetUser = registeredUsers[targetAlias];
        if (targetUser) {
            // Aseguramos que tenga el contador inicializado
            if (!targetUser.mentionsReceived) {
                targetUser.mentionsReceived = 0;
            }
            // Le sumamos 1 punto a su contador global (para medallas)
            targetUser.mentionsReceived++; 
        } else {
            console.warn("El usuario destino no existe en la base de datos.");
        }

        // 6. GUARDAR TODOS LOS CAMBIOS EN LA BASE DE DATOS
        saveData(); 

        // 7. MOSTRAR MENSAJE DE ÉXITO (Sin usar comillas especiales para evitar errores)
        var cleanName = targetAlias.split('-')[0]; // Quitamos la parte de '-profesor' o '-alumno' para que quede bonito
        
        if (type === 'teacher') {
            alert("¡Has enviado una 🍎 al profesor " + cleanName + "!");
        } else {
            alert("¡Has reconocido el compañerismo de " + cleanName + "! 🤝");
        }
        window.checkBadges('mention');
        // 8. RECARGAR EL VISOR DEL APUNTE
        // Esto es necesario para que se actualice el botón y no te deje pulsar de nuevo
        var updatedNote = findNoteById(noteId);
        if (updatedNote) {
            showProtectedNote(updatedNote);
        }
    };

   // --- NUEVA FUNCIÓN: VALIDACIÓN DOCENTE ---
    window.handleNoteValidation = async function(noteId, action) {
        const note = findNoteById(noteId);
        if (!note) return;

        if (!note.approvedCount) note.approvedCount = 0;
        if (!note.disapprovedCount) note.disapprovedCount = 0;
        if (!note.votedBy) note.votedBy = [];

        if (note.votedBy.includes(userAlias)) {
            return alert("Ya has evaluado este apunte.");
        }

        if (action === 'approve') {
            note.approvedCount++;
            alert("✅ Apunte aprobado.");
        } else {
            note.disapprovedCount++;
            alert("❌ Apunte marcado como no apto.");
        }

        note.votedBy.push(userAlias);
        await saveData();
        showProtectedNote(note); // Refrescar para ver cambios
    };

// --- NUEVA FUNCIÓN: BORRAR COMENTARIO ---
   window.executeProfessorDeletion = async (noteId, reason) => {
        const note = findNoteById(noteId);
        if (!note) return;

        // 1. Guardar metadatos de eliminación
        note.moderated = true;
        note.rejectionReason = reason;
        note.moderatorName = userAlias.split('-')[0];
        note.moderatorRole = userRol;

        // 2. BACKUP: Mover al perfil del autor (para que vea la causa)
        if (registeredUsers[note.author]) {
             if (!registeredUsers[note.author].moderatedNotes) registeredUsers[note.author].moderatedNotes = [];
             // Evitar duplicados
             if (!registeredUsers[note.author].moderatedNotes.some(n => n.id === note.id)) {
                 registeredUsers[note.author].moderatedNotes.push(note);
             }
        }

        // 3. ELIMINAR DE LA DB PÚBLICA (Desaparece de la App)
        const key = `${note.subject}:${note.topic}`;
        if (notesDB[key]) {
            notesDB[key] = notesDB[key].filter(n => n.id !== noteId);
        }

        // 4. GUARDAR Y LIMPIAR INTERFAZ
        await saveData();
        
        if(document.getElementById('protectedModal')) document.getElementById('protectedModal').classList.remove('active');
        if(document.getElementById('notesContainer')) document.getElementById('notesContainer').innerHTML = '';
        if(document.getElementById('optionsContainer')) document.getElementById('optionsContainer').innerHTML = '';

        // 5. REDIRECCIÓN Y ACTUALIZACIÓN INSTANTÁNEA
        showScreen(subjectsScreen);
        
        // ¡TRUCO!: Llamamos a showSubjects de nuevo para repintar los botones y sus contadores
        if (typeof currentCourse !== 'undefined' && currentCourse) {
            showSubjects(currentCourse); 
            
            // Si estábamos dentro de un tema, refrescamos también la lista de temas
            if (typeof currentSubject !== 'undefined' && currentSubject) {
                document.getElementById("topicsContainer").innerHTML = `<h3>Temas de: ${currentSubject}</h3>`;
                showTopics(currentCourse, currentSubject);
            }
        }
        
        showToast("Apunte eliminado. Contadores actualizados.", "success");
    };
        
 window.deleteComment = async function(noteId, commentId) {
        if(!confirm("¿Seguro que quieres borrar este comentario?")) return;

        const note = findNoteById(noteId);
        if (note && note.comments) {
            note.comments = note.comments.filter(c => c.id !== commentId);
            await saveData();
            showToast("Comentario eliminado", "success");
            showProtectedNote(note); 
        }
    };
    

// --- NUEVA FUNCIÓN: PUBLICAR COMENTARIO (VERSIÓN ESTRICTA) ---
    window.postComment = async function(noteId) {
        const textInput = document.getElementById('newCommentText');
        if (!textInput) return alert("Error interno. Recarga la página.");

        const text = textInput.value.trim();
        if (!text) return alert("Escribe algo antes de enviar.");

        // 1. LISTA NEGRA EXTENDIDA (Aquí añades todo lo que quieras prohibir)
        const badWords = [
            "tonto", "estupido", "mierda", "imbecil", "gilipollas", "puta", "joder",
            "cabron", "hostia", "coño", "maricon", "zorra", "capullo", "pene", "vagina",
            "follar", "idiota", "subnormal", "payaso", "mamon", "pendejo", "verga", "culo"
        ];
        
        // 2. PALABRAS DE ALTO RIESGO (Seguridad) -> Bloqueo Total
        const securityRisk = ["script", "onerror", "onload", "alert(", "eval(", "document.cookie"];
        if (securityRisk.some(w => text.toLowerCase().includes(w))) {
             return alert("⛔ ACCESO DENEGADO: Tu mensaje contiene código no permitido.");
        }

        // 3. PROCESO DE CENSURA
        let cleanText = text;
        let wasCensored = false;

        badWords.forEach(word => {
             // Regex que busca la palabra completa (evita censurar 'computadora' por 'puta')
             const regex = new RegExp(`\\b${word}\\b`, 'gi');
             if (regex.test(cleanText)) {
                 cleanText = cleanText.replace(regex, '🤬'); // Lo cambiamos por un emoji o ****
                 wasCensored = true;
             }
        });

       // 4. GUARDADO
        const note = findNoteById(noteId);
        if (note) {
            if (!note.comments) note.comments = [];
            
            // CORRECCIÓN: Guardamos solo el texto limpio (el autor ya sale en el diseño)
            
            note.comments.push({
                id: Date.now().toString(),
                author: userAlias || 'Anónimo',
                text: cleanText, 
                timestamp: Date.now()
            });

            await saveData();
            
            // Feedback al usuario
            if (wasCensored) {
                showToast("⚠️ Mensaje moderado por lenguaje", "warning");
            } else {
                showToast("Comentario enviado", "success");
            }
            
            showProtectedNote(note); 
            // textInput.value = ""; // (Opcional) Limpiar caja si quisieras, pero al refrescar note se limpia sola
        } else {
            alert("Error: Apunte no encontrado.");
        }
    };


// -----------------------------------------------------------------------
    // CORRECCIÓN: LISTENERS PARA BOTONES DEL PERFIL (Reset Visual Completo)
    // -----------------------------------------------------------------------

    // 1. Botón "Volver al Dashboard"
    document.getElementById('backToDashFromProfile')?.addEventListener('click', () => {
        showDashboard();
    });

    // 2. Botón "Cerrar Sesión" (CORREGIDO)
    document.getElementById('backToAuth')?.addEventListener('click', () => {
        // Limpiamos variables de sesión
        userAlias = "";
        currentCourse = "";
        userRol = "";
        userLevels = [];
        isTeacherInactive = false;
        
        // CORRECCIÓN: Usamos la función maestra que resetea campos Y visibilidad
        resetAuthForms(); 
        
        // Volvemos a la pantalla de inicio
        showAuth();
    });

    // 3. Botón "Salir de Appuntes"
    document.getElementById('exitApp')?.addEventListener('click', () => {
        if(confirm("¿Seguro que quieres cerrar sesión y salir?")) {
            // 🛑 Borrar el "recuerdo" del usuario
            localStorage.removeItem('appuntes_user');
            
            // Limpiar variables
            userAlias = "";
            userRol = "";

            // Recargar la página reinicia todo (incluido el formulario de registro)
            window.location.reload();
        }
    });
// --- NUEVA FUNCIÓN: LECTURA DE TEXTO (TEXT-TO-SPEECH) ---
    window.speakText = function(text) {
        // Si ya está hablando, lo callamos (toggle)
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            return;
        }
        
        // Limpiamos etiquetas HTML para leer solo el texto
        const cleanText = text.replace(/<[^>]*>/g, '');
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES'; // Español de España
        utterance.rate = 1; // Velocidad normal
        window.speechSynthesis.speak(utterance);
    };



    // =========================================
    // BLOQUE FLASHCARDS (PERSONALIZADO POR ALUMNO)
    // =========================================

    // 1. ABRIR MODAL (Carga datos personales)
    window.openFlashcardsModal = function(noteId) {
        if (userRol !== 'Alumno') return alert("Esta función es solo para alumnos.");

        const note = findNoteById(noteId);
        if (!note) return alert("Apunte no encontrado");

        // Guardamos referencia global
        currentNoteForFlashcards = note; 
        currentFlashcardIndex = 0; 
        isFlipped = false;

        // RECUPERAR MIS TARJETAS (Del perfil de usuario, NO del apunte)
        const u = registeredUsers[userAlias];
        if (!u.personalFlashcards) u.personalFlashcards = {}; // Inicializar si no existe
        // Si no hay tarjetas para este apunte, array vacío
        const myCards = u.personalFlashcards[noteId] || [];

        const modal = document.getElementById('flashcardsModal');
        modal.classList.add('active');
        
        document.getElementById('closeFlashcardsModal').onclick = () => {
            modal.classList.remove('active');
        };

        // Si no tengo tarjetas, voy directo a editar/crear. Si tengo, voy a jugar.
        if (myCards.length === 0) {
            renderFlashcardManager(noteId); 
        } else {
            renderFlashcardGame(noteId); 
        }
    };

    // 2. MODO JUEGO (Estudio)
   /* ===================================================================================================
   CORRECCIÓN: FUNCIÓN RENDER FLASHCARD GAME (LIMPIA)
   =================================================================================================== */
    window.renderFlashcardGame = function(noteId) {
        const u = registeredUsers[userAlias];
        const myCards = u.personalFlashcards[noteId] || [];
        const container = document.getElementById('flashcardContent');
        // Protección por si noteForFlashcards es null
        const noteName = currentNoteForFlashcards ? currentNoteForFlashcards.displayName : 'Apunte';

        document.getElementById('flashcardModalTitle').textContent = `🧠 Estudiando: ${noteName}`;

        // Controles superiores con acceso al nuevo modo Quiz
        let html = `
            <div style="display:flex; justify-content:flex-end; margin-bottom:10px; gap:5px;">
                <button class="btn" onclick="window.renderFlashcardQuiz('${noteId}')" style="font-size:0.8rem; background:var(--accent);">📝 Autoevaluación</button>
                <button class="btn secondary" onclick="window.renderFlashcardManager('${noteId}')" style="font-size:0.8rem;">⚙️ Gestionar</button>
            </div>
        `;

        if (myCards.length === 0) {
            html += `<div style="text-align:center; padding:30px;">
                <p>No tienes tarjetas para este apunte.</p>
                <button class="btn" onclick="window.renderFlashcardManager('${noteId}')">Crear mi primera tarjeta</button>
            </div>`;
            container.innerHTML = html;
            return;
        }

        // Navegación circular segura
        if (currentFlashcardIndex >= myCards.length) currentFlashcardIndex = 0;
        if (currentFlashcardIndex < 0) currentFlashcardIndex = myCards.length - 1;

        const card = myCards[currentFlashcardIndex];

        html += `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-weight:bold; color:var(--muted);">
                <span>Tarjeta ${currentFlashcardIndex + 1} / ${myCards.length}</span>
                <span style="font-size:0.8rem;">(Clic para girar)</span>
            </div>
            
            <div id="activeCard" class="card-face" onclick="flipCardPersonal(this, '${noteId}')">
                <div style="text-align:center;">
                    <div style="font-size:0.8rem; text-transform:uppercase; color:var(--brand); margin-bottom:10px;">PREGUNTA</div>
                    <div style="font-size:1.4rem;">${card.question}</div>
                </div>
            </div>

            <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="btn secondary" style="flex:1;" onclick="prevCardPersonal('${noteId}')">⬅️ Anterior</button>
                <button class="btn secondary" style="flex:1;" onclick="nextCardPersonal('${noteId}')">Siguiente ➡️</button>
            </div>
        `;
        
        container.innerHTML = html;
        isFlipped = false;
    };
/* ===================================================================================================
   FIN CÓDIGO CORREGIDO
   =================================================================================================== */
    /* ===================================================================================================
   NUEVA FUNCIONALIDAD: MODO AUTOEVALUACIÓN (QUIZ)
   =================================================================================================== */
    window.renderFlashcardQuiz = function(noteId) {
        const u = registeredUsers[userAlias];
        const myCards = u.personalFlashcards[noteId] || [];
        const container = document.getElementById('flashcardContent');
        
        if (myCards.length < 1) return alert("Necesitas al menos 1 tarjeta para el examen.");
        
        // Inicializar estado del quiz si es nuevo
        if (!window.quizState || window.quizState.noteId !== noteId) {
            window.quizState = { noteId: noteId, current: 0, score: 0, showingAnswer: false };
        }
        
        const state = window.quizState;
        const card = myCards[state.current];

        document.getElementById('flashcardModalTitle').textContent = `📝 Examen: ${currentNoteForFlashcards.displayName}`;

        // Renderizado de la tarjeta de examen
        let html = `
            <button class="btn secondary" onclick="window.quizState=null; window.renderFlashcardGame('${noteId}')" style="margin-bottom:15px;">⬅️ Cancelar Examen</button>
            <div style="background:var(--bg-panel); padding:20px; border-radius:8px; border:1px solid var(--border); text-align:center;">
                <div style="font-size:0.8rem; text-transform:uppercase; color:var(--muted); letter-spacing:1px; margin-bottom:10px;">
                    Pregunta ${state.current + 1} / ${myCards.length}
                </div>
                <h3 style="font-size:1.4rem; margin:10px 0 30px;">${card.question}</h3>
                
                <div id="quizAnswerArea" style="display:${state.showingAnswer ? 'block' : 'none'}; border-top:1px dashed var(--border); padding-top:20px;">
                    <p style="font-weight:bold; color:var(--brand);">Respuesta Correcta:</p>
                    <div style="font-size:1.2rem; margin-bottom:20px;">${card.answer}</div>
                    <div style="display:flex; gap:10px; justify-content:center;">
                        <button class="btn danger" onclick="window.handleQuizAnswer('${noteId}', false)">❌ Mal</button>
                        <button class="btn success" onclick="window.handleQuizAnswer('${noteId}', true)">✅ Bien</button>
                    </div>
                </div>
                
                <button id="btnReveal" class="btn" style="width:100%; display:${state.showingAnswer ? 'none' : 'block'};" onclick="window.revealQuizAnswer()">👁️ Ver Respuesta</button>
            </div>
        `;
        container.innerHTML = html;
    };

    window.revealQuizAnswer = function() {
        window.quizState.showingAnswer = true;
        document.getElementById('quizAnswerArea').style.display = 'block';
        document.getElementById('btnReveal').style.display = 'none';
    };

    window.handleQuizAnswer = function(noteId, isCorrect) {
        if (isCorrect) window.quizState.score++;
        window.quizState.current++;
        window.quizState.showingAnswer = false;
        
        const u = registeredUsers[userAlias];
        const total = u.personalFlashcards[noteId].length;

        // Fin del examen o siguiente pregunta
        if (window.quizState.current >= total) {
            showQuizResults(noteId, window.quizState.score, total);
            window.quizState = null;
        } else {
            renderFlashcardQuiz(noteId);
        }
    };

    window.showQuizResults = function(noteId, score, total) {
        const container = document.getElementById('flashcardContent');
        const pct = Math.round((score / total) * 100);
        let color = '#ef4444'; // Rojo por defecto
        let msg = "¡Sigue practicando!";
        
        if(pct >= 50) { color = '#f59e0b'; msg = "¡Aprobado!"; } // Naranja
        if(pct >= 80) { color = '#22c55e'; msg = "¡Excelente!"; } // Verde
        
        container.innerHTML = `
            <div style="text-align:center; padding:30px;">
                <div style="font-size:4rem;">📊</div>
                <h2 style="color:${color}; font-size:3rem; margin:10px 0;">${pct}%</h2>
                <p style="font-size:1.2rem; margin-bottom:10px;">Has acertado <strong>${score}</strong> de <strong>${total}</strong> tarjetas.</p>
                <p style="color:var(--muted); margin-bottom:30px;">"${msg}"</p>
                <button class="btn" onclick="window.renderFlashcardGame('${noteId}')">Volver a Estudiar</button>
                <button class="btn secondary" style="margin-top:10px;" onclick="window.renderFlashcardQuiz('${noteId}')">Repetir Examen</button>
            </div>
        `;
    };

/* ===================================================================================================
   FIN BLOQUE NUEVO
   =================================================================================================== */
    // 3. MODO GESTOR (Añadir/Borrar)
    window.renderFlashcardManager = function(noteId) {
        const u = registeredUsers[userAlias];
        const myCards = u.personalFlashcards[noteId] || [];
        const container = document.getElementById('flashcardContent');
        
        document.getElementById('flashcardModalTitle').textContent = `✏️ Editando Mis Tarjetas`;

        let html = `
            <button class="btn secondary" onclick="window.renderFlashcardGame('${noteId}')" style="margin-bottom:15px;">⬅️ Volver al Estudio</button>
            
            <div style="background:#f0f9ff; padding:15px; border-radius:8px; border:1px solid #bae6fd; margin-bottom:20px;">
                <h4 style="margin-top:0; color:#0369a1;">Nueva Tarjeta Personal</h4>
                <input type="text" id="fcQuestion" placeholder="Pregunta" style="width:100%; margin-bottom:10px;">
                <textarea id="fcAnswer" placeholder="Respuesta" style="width:100%; height:60px; margin-bottom:10px;"></textarea>
                <button class="btn" onclick="window.addPersonalFlashcard('${noteId}')" style="width:100%;">➕ Guardar</button>
            </div>

            <div style="max-height:250px; overflow-y:auto;">
        `;

        if (myCards.length === 0) {
            html += `<p style="color:#666; font-style:italic; text-align:center;">Lista vacía.</p>`;
        } else {
            myCards.forEach((fc, index) => {
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:10px; margin-bottom:5px; border:1px solid #e2e8f0; border-radius:6px;">
                        <div style="flex:1; margin-right:10px;">
                            <strong>Q:</strong> ${fc.question}<br>
                            <span style="color:#666; font-size:0.9rem;"><strong>A:</strong> ${fc.answer}</span>
                        </div>
                        <button class="btn danger" onclick="window.deletePersonalFlashcard('${noteId}', ${index})" style="padding:5px 10px;">🗑️</button>
                    </div>
                `;
            });
        }
        html += `</div>`;
        container.innerHTML = html;
    };

    // 4. FUNCIONES DE DATOS (CRUD Personal)
    window.addPersonalFlashcard = async function(noteId) {
        const q = document.getElementById('fcQuestion').value.trim();
        const a = document.getElementById('fcAnswer').value.trim();
        if (!q || !a) return alert("Rellena ambos campos.");

        const u = registeredUsers[userAlias];
        if (!u.personalFlashcards) u.personalFlashcards = {};
        if (!u.personalFlashcards[noteId]) u.personalFlashcards[noteId] = [];

        u.personalFlashcards[noteId].push({ question: q, answer: a });
        
        await saveData(); // Guardar cambios en usuario
        renderFlashcardManager(noteId); // Refrescar lista
    };

    window.deletePersonalFlashcard = async function(noteId, index) {
        if(!confirm("¿Borrar tarjeta?")) return;
        const u = registeredUsers[userAlias];
        if (u.personalFlashcards && u.personalFlashcards[noteId]) {
            u.personalFlashcards[noteId].splice(index, 1);
            await saveData();
            renderFlashcardManager(noteId);
        }
    };

    // 5. NAVEGACIÓN Y EFECTOS
    window.flipCardPersonal = function(element, noteId) {
        const u = registeredUsers[userAlias];
        const card = u.personalFlashcards[noteId][currentFlashcardIndex];
        
        isFlipped = !isFlipped;
        element.style.transform = "rotateY(90deg)";
        
        setTimeout(() => {
            if (isFlipped) {
                element.className = "card-face back";
                element.innerHTML = `<div style="text-align:center;"><div style="font-size:0.8rem; text-transform:uppercase; color:var(--accent); margin-bottom:10px;">RESPUESTA</div><div style="font-size:1.4rem;">${card.answer}</div></div>`;
            } else {
                element.className = "card-face";
                element.innerHTML = `<div style="text-align:center;"><div style="font-size:0.8rem; text-transform:uppercase; color:var(--brand); margin-bottom:10px;">PREGUNTA</div><div style="font-size:1.4rem;">${card.question}</div></div>`;
            }
            element.style.transform = "rotateY(0deg)";
        }, 200);
    };

    window.nextCardPersonal = function(noteId) {
        currentFlashcardIndex++;
        renderFlashcardGame(noteId);
    };
    window.prevCardPersonal = function(noteId) {
        currentFlashcardIndex--;
        renderFlashcardGame(noteId);
    };



// -----------------------------------------------------------------------
    // BLOQUE FUNCIONALIDAD 3: GESTOR DE MOCHILAS (SOLO MOCHILAS)
    // -----------------------------------------------------------------------
    window.openBackpackManager = function() {
        if (!userAlias || !registeredUsers[userAlias]) return alert("Debes iniciar sesión.");
        const modal = document.getElementById('requestNoteModal');
        modal.classList.add('active');
        document.getElementById('requestNoteTitle').textContent = "🎒 Mis Mochilas de Estudio";
        if(typeof newRequestBtn !== 'undefined' && newRequestBtn) newRequestBtn.classList.add('hidden');
        const list = document.getElementById('studentRequestsList');
        list.classList.remove('hidden');
        list.innerHTML = '';

       // Botón Crear
        const newPackBtn = document.createElement('button');
        newPackBtn.className = 'btn';
        newPackBtn.style.marginBottom = '15px';
        newPackBtn.style.width = '100%';
        newPackBtn.innerHTML = '➕ Crear Nueva Mochila';
        newPackBtn.disabled = false; // Forzamos activación explícita

        newPackBtn.addEventListener('click', async () => {
            const name = prompt("Nombre de la mochila:");
            if (name && name.trim() !== "") {
                const u = registeredUsers[userAlias];
                if (!u.backpacks) u.backpacks = [];
                u.backpacks.push({ id: Date.now().toString(), name: name.trim(), notes: [] });
                await saveData();
                window.openBackpackManager();
            }
        });
        

        list.appendChild(newPackBtn);

        // Listar
        const packs = registeredUsers[userAlias].backpacks || [];
        if (packs.length === 0) {
            // CAMBIO: Usamos createElement en lugar de innerHTML para no "matar" el botón anterior
            const emptyMsg = document.createElement('p');
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.color = '#666';
            emptyMsg.textContent = 'No tienes mochilas creadas.';
            list.appendChild(emptyMsg);
        } else {
            packs.forEach(pack => {
                const card = document.createElement('div');
                card.className = 'request-card';
                card.style.borderLeft = "4px solid #6366f1";
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>📁 ${pack.name}</strong>
                        <span style="font-size:0.8rem;">${pack.notes.length} apuntes</span>
                    </div>
                    <div style="margin-top:10px; display:flex; gap:5px;">
                        <button class="btn secondary" style="flex:1" onclick="window.viewBackpack('${pack.id}')">Ver</button>
                        <button class="btn danger" onclick="window.deleteBackpack('${pack.id}')">🗑️</button>
                    </div>
                `;
                list.appendChild(card);
            });
        }
        
        // Botón Cerrar
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn secondary';
        closeBtn.textContent = "Cerrar Gestor";
        closeBtn.style.width = '100%';
        closeBtn.style.marginTop = '20px';
        closeBtn.onclick = () => {
            document.getElementById('requestNoteModal').classList.remove('active');
            showDashboard();
        };
        list.appendChild(closeBtn);
    };

    window.viewBackpack = function(packId) {
        const u = registeredUsers[userAlias];
        const pack = u.backpacks.find(p => p.id == packId);
        if(!pack) return;
        const list = document.getElementById('studentRequestsList');
        list.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.className = 'btn secondary';
        backBtn.textContent = '⬅️ Volver';
        backBtn.style.marginBottom = '10px';
        backBtn.onclick = () => window.openBackpackManager();
        list.appendChild(backBtn);
        const title = document.createElement('h3');
        title.innerHTML = `📁 ${pack.name}`;
        list.appendChild(title);
        if(pack.notes.length === 0) {
            list.innerHTML += '<p>Mochila vacía.</p>';
        } else {
            pack.notes.forEach(noteId => {
                const note = findNoteById(noteId);
                if(note) {
                    const item = document.createElement('div');
                    item.className = 'note-item';
                    item.innerHTML = `<div><strong>${note.displayName}</strong></div><div style="display:flex; gap:5px;"><button class="btn" onclick="showProtectedNote(findNoteById('${note.id}')); window.previousScreen=document.getElementById('requestNoteModal'); document.getElementById('requestNoteModal').classList.remove('active');">Ver</button><button class="btn danger" onclick="window.removeFromBackpack('${pack.id}', '${note.id}')">×</button></div>`;
                    list.appendChild(item);
                }
            });
        }
    };

    window.deleteBackpack = function(packId) {
        if(confirm("¿Borrar mochila?")) {
            registeredUsers[userAlias].backpacks = registeredUsers[userAlias].backpacks.filter(p => p.id != packId);
            saveData();
            window.openBackpackManager();
        }
    };

    window.removeFromBackpack = function(packId, noteId) {
         const pack = registeredUsers[userAlias].backpacks.find(p => p.id == packId);
         if(pack) {
             pack.notes = pack.notes.filter(n => n !== noteId);
             saveData();
             window.viewBackpack(packId);
         }
    };

    window.promptAddToBackpack = function(noteId) {
        const u = registeredUsers[userAlias];
        if (!u.backpacks) u.backpacks = [];
        const packs = u.backpacks;
        const modal = document.getElementById('requestNoteModal');
        modal.classList.add('active');
        document.getElementById('requestNoteTitle').textContent = "📥 Guardar en Mochila";
        const list = document.getElementById('studentRequestsList');
        list.classList.remove('hidden');
        list.innerHTML = ''; 
        if(packs.length === 0) list.innerHTML += `<p>No tienes mochilas.</p>`;
        packs.forEach(pack => {
            const btn = document.createElement('button');
            btn.className = 'btn secondary';
            btn.style.width = '100%';
            btn.style.marginBottom = '5px';
            btn.style.textAlign = 'left';
            const isSaved = pack.notes.includes(noteId);
            btn.innerHTML = `${isSaved ? '✅' : '📁'} ${pack.name}`;
            btn.onclick = function() {
                if(!isSaved) {
                    pack.notes.push(noteId);
                    saveData();
                    alert("Guardado.");
                    modal.classList.remove('active');
                } else { alert("Ya está guardado."); }
            };
            list.appendChild(btn);
        });
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn';
        closeBtn.textContent = "Cancelar";
        closeBtn.style.marginTop = "10px";
        closeBtn.style.width = "100%";
        closeBtn.onclick = () => modal.classList.remove('active');
        list.appendChild(closeBtn);
    };
// -----------------------------------------------------------------------
    // BLOQUE FUNCIONALIDAD 4: TABLÓN DE ANUNCIOS + SUBIDA DE APUNTES (ARREGLADO)
    // -----------------------------------------------------------------------

    // A) GESTOR PARA PROFESORES (Adjuntar Apunte)
    window.openTeacherBulletinManager = function() {
        const modal = document.getElementById('requestNoteModal');
        modal.classList.add('active');
        document.getElementById('requestNoteTitle').textContent = "📢 Publicar en Tablón";
        
        if(typeof newRequestBtn !== 'undefined' && newRequestBtn) newRequestBtn.classList.add('hidden');
        const list = document.getElementById('studentRequestsList');
        list.classList.remove('hidden');
        list.innerHTML = '';

        // 1. OBTENER APUNTES DEL PROFESOR
        let myNotes = [];
        for(let key in notesDB) {
            notesDB[key].forEach(n => {
                if(n.author === userAlias) myNotes.push(n);
            });
        }
        myNotes.sort((a,b) => b.timestamp - a.timestamp);

        // Opciones del Select
        let notesOptions = '<option value="">-- (Opcional) Selecciona un apunte --</option>';
        if(myNotes.length === 0) {
            notesOptions = '<option value="">(No tienes apuntes creados)</option>';
        } else {
            myNotes.forEach(n => {
                notesOptions += `<option value="${n.id}">📄 ${n.displayName} (${n.subject})</option>`;
            });
        }

        // 2. FORMULARIO
        const formDiv = document.createElement('div');
        formDiv.style.background = '#f0f9ff';
        formDiv.style.padding = '15px';
        formDiv.style.borderRadius = '8px';
        formDiv.style.marginBottom = '20px';
        formDiv.style.border = '1px solid #bae6fd';

        const levels = Object.keys(curriculum); 
        let levelOptions = '<option value="">-- Selecciona Nivel --</option>';
        levels.forEach(lvl => levelOptions += `<option value="${lvl}">${lvl}</option>`);
        
        formDiv.innerHTML = `
            <div style="margin-bottom:15px;">
                <label style="font-weight:bold; font-size:0.9rem; color:#0369a1;">1. Curso Destino:</label>
                <select id="bulletinCourse" style="width:100%; margin-top:5px; padding:8px;">${levelOptions}</select>
            </div>
            <div style="margin-bottom:15px;">
                <label style="font-weight:bold; font-size:0.9rem; color:#0369a1;">2. Mensaje:</label>
                <textarea id="bulletinText" placeholder="Escribe tu aviso aquí..." style="width:100%; height:70px; margin-top:5px; padding:8px;"></textarea>
            </div>
            <div style="margin-bottom:15px;">
                <label style="font-weight:bold; font-size:0.9rem; color:#d97706;">3. Adjuntar Apunte (Opcional):</label>
                <select id="bulletinNoteId" style="width:100%; margin-top:5px; padding:8px; background:white;">${notesOptions}</select>
                <p style="font-size:0.8rem; color:#666; margin-top:5px;">Elige uno de tus apuntes para que los alumnos lo abran directamente.</p>
            </div>
            <button id="btnPostBulletin" class="btn" style="width:100%; margin-top:10px; background:#0284c7;">🌍 Publicar Aviso</button>
        `;
        list.appendChild(formDiv);

        // EVENTO PUBLICAR
        formDiv.querySelector('#btnPostBulletin').onclick = async () => {
            const course = document.getElementById('bulletinCourse').value;
            const text = document.getElementById('bulletinText').value.trim();
            const noteId = document.getElementById('bulletinNoteId').value;

            if(!course || !text) return alert("Elige un curso y escribe un mensaje.");

            const newAd = {
                id: Date.now().toString(),
                author: userAlias,
                targetCourse: course,
                text: text,
                attachedNoteId: noteId || null,
                timestamp: Date.now()
            };

            if (typeof announcementsDB === 'undefined') announcementsDB = [];
            announcementsDB.push(newAd);
            await saveData();
            checkBadges('post');
            alert("✅ Aviso publicado.");
            window.openTeacherBulletinManager(); 
        };

        // HISTORIAL
        if (typeof announcementsDB === 'undefined') announcementsDB = [];
        const myAds = announcementsDB.filter(ad => ad.author === userAlias);
        myAds.sort((a,b) => b.timestamp - a.timestamp); 

        if(myAds.length > 0) {
            list.innerHTML += '<h4 style="border-bottom:1px solid #eee; padding-bottom:5px; margin-top:20px;">📜 Mis Publicaciones</h4>';
        // ---------------------------------------------------------------------------------------------------
            // MODIFICACIÓN: LISTA DIRECTA SIN SCROLL (Se expande infinitamente)
            // INICIO BLOQUE MODIFICADO
            // ---------------------------------------------------------------------------------------------------
            myAds.forEach(ad => {
                const hasAttach = ad.attachedNoteId ? '📎' : '';
                const item = document.createElement('div');
                item.className = 'request-card'; 
                item.style.borderLeft = '4px solid #0284c7';
                
                // Lógica de botones
                let buttonsHTML = '<div style="margin-top:10px; display:flex; gap:5px;">';
                if (ad.attachedNoteId) {
                    buttonsHTML += `<button class="btn" style="flex:1; font-size:0.8rem; background:#6366f1; border:none; color:white;">📄 Ver Apunte</button>`;
                }
                buttonsHTML += `<button class="btn danger" style="flex:1; font-size:0.8rem;">🗑️ Borrar Aviso</button>`;
                buttonsHTML += '</div>';

                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <div>
                            <span style="background:#e0f2fe; color:#0284c7; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:0.8rem;">${ad.targetCourse}</span>
                            ${hasAttach}
                        </div>
                        <small style="color:#666">${new Date(ad.timestamp).toLocaleDateString()}</small>
                    </div>
                    <div style="margin-top:8px;">"${ad.text}"</div>
                    ${buttonsHTML}
                `;

                // Listeners (Misma lógica, solo aseguramos que no haya wrapper de scroll)
                const btns = item.querySelectorAll('button');
                if (ad.attachedNoteId) {
                    btns[0].onclick = () => {
                        const note = findNoteById(ad.attachedNoteId);
                        if (note) {
                            window.previousScreen = document.getElementById('requestNoteModal');
                            document.getElementById('requestNoteModal').classList.remove('active');
                            showProtectedNote(note);
                        } else { alert("⚠️ Apunte no encontrado."); }
                    };
                    btns[1].onclick = async () => {
                        if(confirm("¿Borrar este aviso?")) {
                            announcementsDB = announcementsDB.filter(x => x.id !== ad.id);
                            await saveData();
                            window.openTeacherBulletinManager();
                        }
                    };
                } else {
                    btns[0].onclick = async () => {
                        if(confirm("¿Borrar este aviso?")) {
                            announcementsDB = announcementsDB.filter(x => x.id !== ad.id);
                            await saveData();
                            window.openTeacherBulletinManager();
                        }
                    };
                }
                
                // Inserción directa en la lista principal (el modal hará scroll si es necesario)
                list.appendChild(item);
            });
            // ---------------------------------------------------------------------------------------------------
            // FIN BLOQUE MODIFICADO
            // ---------------------------------------------------------------------------------------------------
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn secondary';
        closeBtn.textContent = 'Cerrar Gestor';
        closeBtn.style.width = '100%';
        closeBtn.style.marginTop = '20px';
        closeBtn.onclick = () => {
            document.getElementById('requestNoteModal').classList.remove('active');
            showDashboard();
        };
        list.appendChild(closeBtn);
    };

    // B) VISOR PARA ALUMNOS (ARREGLADO: Botón interactivo)
    window.openBulletinBoard = async function() {
        const modal = document.getElementById('requestNoteModal');
        modal.classList.add('active');
        document.getElementById('requestNoteTitle').textContent = "📢 Tablón de Avisos";
        
        if(typeof newRequestBtn !== 'undefined' && newRequestBtn) newRequestBtn.classList.add('hidden');
        const list = document.getElementById('studentRequestsList');
        list.classList.remove('hidden');
        list.innerHTML = '';

        const myCourseFull = registeredUsers[userAlias].curso || ""; 
        
       // --- MARCAR COMO VISTOS Y GUARDAR EN DB ---
        const u = registeredUsers[userAlias];
        if (!u.seenAds) u.seenAds = [];
        
        let nuevosVistos = false;
        announcementsDB.forEach(ad => {
            // Si el anuncio es para mi curso y no lo he visto antes...
            if (myCourseFull.includes(ad.targetCourse) && !u.seenAds.includes(ad.id)) {
                u.seenAds.push(ad.id); // Lo añadimos a la lista de "leídos"
                nuevosVistos = true;
            }
        });

        // Solo si hay cambios reales, guardamos en la base de datos persistente
        if (nuevosVistos) {
            await saveData();
            console.log("Notificaciones actualizadas en la base de datos.");
        }
        if (typeof announcementsDB === 'undefined') announcementsDB = [];
        
        const relevantAds = announcementsDB.filter(ad => myCourseFull.includes(ad.targetCourse));
        relevantAds.sort((a,b) => b.timestamp - a.timestamp);

        list.innerHTML = `<p style="background:#f8fafc; padding:10px; border-radius:6px; color:#64748b; font-size:0.9rem; text-align:center;">Avisos para: <strong>${myCourseFull}</strong></p>`;

        if(relevantAds.length === 0) {
            list.innerHTML += `<div style="text-align:center; padding:40px; color:#666;">No hay novedades.</div>`;
        } else {


      // Creamos un contenedor simple con altura limitada y scroll automático
            const scrollContainer = document.createElement('div');
            // Calculamos altura para que quepan aprox. 4 tarjetas (unos 400px)
            scrollContainer.style.maxHeight = '400px'; 
            scrollContainer.style.overflowY = 'auto';  // <--- Esto activa la "barrita"
            scrollContainer.style.padding = '5px';
            scrollContainer.style.border = '1px solid var(--border)';
            scrollContainer.style.borderRadius = '6px';
            scrollContainer.style.marginBottom = '20px';
            scrollContainer.style.background = 'var(--bg-panel)'; // Fondo limpio

            relevantAds.forEach(ad => {
                const authorData = registeredUsers[ad.author];
                const authorName = ad.author.split('-')[0];
                const apples = authorData ? (authorData.mentionsReceived || 0) : 0;
                
                // CÁLCULOS DE TIEMPO
                const diff = Date.now() - ad.timestamp;
                const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hoursPassed = Math.floor(diff / (1000 * 60 * 60));
                const minsPassed = Math.floor(diff / (1000 * 60));
                
                let timeAgo = "Hace un momento";
                if (daysPassed > 0) timeAgo = `Hace ${daysPassed} día${daysPassed!==1?'s':''}`;
                else if (hoursPassed > 0) timeAgo = `Hace ${hoursPassed} hora${hoursPassed!==1?'s':''}`;
                else if (minsPassed > 0) timeAgo = `Hace ${minsPassed} min`;
   
                const daysLeft = Math.max(0, 30 - daysPassed);

                // 1. Crear la tarjeta
                const card = document.createElement('div');
                card.className = 'request-card';
                card.style.borderLeft = '4px solid #f59e0b';
                card.style.background = '#fffbeb';
                
               card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <strong style="color:#d97706; font-size:1.1rem;">${authorName}</strong>
                            <div style="font-size:0.8rem; color:#b45309;">🍎 ${apples} manzanas</div>
                        </div>
                        <div style="text-align:right;">
                            <small style="color:#555; display:block; font-weight:bold;">${timeAgo}</small>
                            <small style="color:#991b1b; font-size:0.7rem; background:#fee2e2; padding:2px 6px; border-radius:4px;">Caduca en ${daysLeft} días</small>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:1rem; color:#333;">${ad.text}</div>
                `;

                // 2. LÓGICA DEL ADJUNTO
                if (ad.attachedNoteId) {
                    const linkedNote = findNoteById(ad.attachedNoteId);
                    if (linkedNote) {
                        const attachDiv = document.createElement('div');
                        attachDiv.style.cssText = "margin-top:15px; background:white; padding:10px; border:1px dashed #cbd5e1; border-radius:6px; display:flex; align-items:center; justify-content:space-between;";
                        
                        attachDiv.innerHTML = `
                            <div>
                                <span style="font-size:1.2rem;">📄</span> 
                                <strong style="color:#334155;">${linkedNote.displayName}</strong>
                            </div>
                        `;
                        
                        const btn = document.createElement('button');
                        btn.className = 'btn';
                        btn.style.cssText = "font-size:0.8rem; background:#6366f1;";
                        btn.textContent = "Ver Apunte";
                        btn.onclick = function() {
                            showProtectedNote(linkedNote);
                            window.previousScreen = document.getElementById('requestNoteModal');
                            document.getElementById('requestNoteModal').classList.remove('active');
                        };
                        
                        attachDiv.appendChild(btn);
                        card.appendChild(attachDiv);
                    } else {
                        const errDiv = document.createElement('div');
                        errDiv.innerHTML = `<div style="margin-top:10px; color:#ef4444; font-size:0.8rem; font-style:italic;">(Apunte adjunto no encontrado)</div>`;
                        card.appendChild(errDiv);
                    }
                }
                
                // IMPORTANTE: Añadimos la tarjeta al scrollContainer, NO a la lista directa
                scrollContainer.appendChild(card);
            });
            
            // Finalmente añadimos el contenedor con scroll a la lista principal
            list.appendChild(scrollContainer);


        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn secondary';
        closeBtn.textContent = 'Volver al Dashboard';
        closeBtn.style.width = '100%';
        closeBtn.style.marginTop = '20px';
        closeBtn.onclick = () => {
            document.getElementById('requestNoteModal').classList.remove('active');
            showDashboard();
        };
        list.appendChild(closeBtn);
    };
/* ===================================================================================================
   NUEVA FUNCIONALIDAD: AGENDA DE EXÁMENES (SIN ALERTS - SOLO TOASTS)
   =================================================================================================== */
    window.openAgendaManager = function() {
        const u = registeredUsers[userAlias];
        if (!u.agenda) u.agenda = [];
        
        const modal = document.getElementById('requestNoteModal');
        modal.classList.add('active');
        
        // Título del modal
        const titleEl = document.getElementById('requestNoteTitle');
        if(titleEl) titleEl.textContent = "📅 Mi Agenda de Exámenes";
        
        // Limpieza de interfaz
        if(typeof newRequestBtn !== 'undefined' && newRequestBtn) newRequestBtn.classList.add('hidden');
        const reqFlow = document.getElementById('requestFlowContainer');
        if(reqFlow) reqFlow.classList.add('hidden');
        
        const list = document.getElementById('studentRequestsList');
        list.classList.remove('hidden');
        list.innerHTML = '';

        // 1. FORMULARIO DE AÑADIR (Diseño limpio)
        const addDiv = document.createElement('div');
        addDiv.style.background = '#f0fdf4';
        addDiv.style.padding = '15px';
        addDiv.style.borderRadius = '8px';
        addDiv.style.border = '1px solid #bbf7d0';
        addDiv.style.marginBottom = '20px';

        const courseSubjects = curriculum[u.curso] ? Object.keys(curriculum[u.curso]) : ['General'];
        let subjOptions = courseSubjects.map(s => `<option value="${s}">${s}</option>`).join('');
        
        addDiv.innerHTML = `
            <h4 style="margin-top:0; color:#15803d;">Nuevo Evento</h4>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <select id="agendaSubj" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">${subjOptions}</select>
                <input type="date" id="agendaDate" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <input type="text" id="agendaTopic" placeholder="Tema (Opcional)" style="width:100%; margin-top:10px; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <button class="btn" style="width:100%; margin-top:10px; background:#16a34a;" onclick="window.addExamToAgenda()">➕ Añadir a la Agenda</button>
        `;
        list.appendChild(addDiv);

        // 2. LISTA DE EVENTOS
        if (u.agenda.length === 0) {
            list.innerHTML += `<div style="text-align:center; padding:30px; color:#94a3b8;">
                <div style="font-size:3rem; margin-bottom:10px;">📅</div>
                <p>No tienes exámenes programados.</p>
            </div>`;
        } else {
            // Ordenar por fecha
            u.agenda.sort((a,b) => new Date(a.date) - new Date(b.date));
            
            u.agenda.forEach(ex => {
                const examDate = new Date(ex.date);
                const today = new Date();
                today.setHours(0,0,0,0);
                
                const diffTime = examDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                let badge = '';
                let borderColor = '#ccc';
                let bgColor = 'white';
                
                if (diffDays < 0) { badge = '🏁 Pasado'; borderColor = '#94a3b8'; bgColor = '#f8fafc'; }
                else if (diffDays === 0) { badge = '🚨 HOY'; borderColor = '#ef4444'; bgColor = '#fef2f2'; }
                else if (diffDays <= 3) { badge = `⚠️ ${diffDays} días`; borderColor = '#f97316'; bgColor = '#fff7ed'; }
                else { badge = `📅 ${diffDays} días`; borderColor = '#3b82f6'; }

                const item = document.createElement('div');
                item.className = 'request-card';
                item.style.borderLeft = `5px solid ${borderColor}`;
                item.style.background = bgColor;
                item.style.marginBottom = '10px';
                item.style.padding = '12px';
                
                // Usamos un botón inteligente para borrar (tryDeleteExam)
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:1.1rem; color:var(--ink);">${ex.subject}</strong>
                        <span style="background:${borderColor}; color:white; padding:2px 8px; border-radius:10px; font-size:0.75rem;">${badge}</span>
                    </div>
                    <div style="color:#555; margin-top:5px; font-size:0.95rem;">
                        📅 ${new Date(ex.date).toLocaleDateString()} 
                        ${ex.topic ? `<br><span style="color:#64748b; font-style:italic;">📖 ${ex.topic}</span>` : ''}
                    </div>
                    <div style="text-align:right; margin-top:8px;">
                        <button class="btn danger" style="padding:4px 12px; font-size:0.8rem;" 
                            onclick="window.tryDeleteExam(this, '${ex.id}')">🗑️ Borrar</button>
                    </div>
                `;
                list.appendChild(item);
            });
        }

        // Botón Volver
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn secondary';
        closeBtn.textContent = 'Volver al Dashboard';
        closeBtn.style.width = '100%';
        closeBtn.style.marginTop = '20px';
        closeBtn.onclick = () => {
            document.getElementById('requestNoteModal').classList.remove('active');
            showDashboard();
        };
        list.appendChild(closeBtn);
    };

    // Función de añadir (usa Toast en vez de Alert)
    window.addExamToAgenda = async function() {
        const subj = document.getElementById('agendaSubj').value;
        const date = document.getElementById('agendaDate').value;
        const topic = document.getElementById('agendaTopic').value.trim();

        if(!subj || !date) return showToast("Faltan datos: Asignatura y Fecha", "warning");
        
        const u = registeredUsers[userAlias];
        u.agenda.push({
            id: Date.now().toString(),
            subject: subj,
            date: date,
            topic: topic
        });
        
        await saveData();
        showToast("Evento añadido a la agenda", "success");
        window.openAgendaManager(); 
    };

    // Función de borrado "Inteligente" (Doble clic de seguridad, sin ventana emergente)
    window.tryDeleteExam = async function(btnElement, id) {
        // Si el botón ya está en modo confirmación...
        if (btnElement.dataset.confirm === "true") {
            // ...borramos de verdad
            const u = registeredUsers[userAlias];
            u.agenda = u.agenda.filter(x => x.id !== id);
            await saveData();
            showToast("Evento eliminado", "info");
            window.openAgendaManager();
        } else {
            // ...si es el primer clic, pedimos confirmación visual
            btnElement.dataset.confirm = "true";
            btnElement.textContent = "¿Seguro?";
            btnElement.style.background = "#000"; // Negro para llamar la atención
            showToast("Pulsa otra vez para confirmar borrado", "warning");
            
            // Si no pulsa en 3 segundos, vuelve al estado normal
            setTimeout(() => {
                btnElement.dataset.confirm = "false";
                btnElement.textContent = "🗑️ Borrar";
                btnElement.style.background = ""; // Vuelve al color original (danger)
            }, 3000);
        }
    };

// -----------------------------------------------------------------------
    // ARRANQUE FINAL (LIMPIO)
    // -----------------------------------------------------------------------

    // Esto fuerza la carga de datos al abrir la web
    if (typeof loadData === 'function') {
        loadData().then(() => {
            console.log("Sistema cargado.");
        }).catch(() => {
            console.error("Fallo en carga, mostrando login.");
            renderLogin();
        });
    } else {
        renderLogin();
    }

    // Listener para tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const m = document.querySelector('.modal.active');
            if(m) m.classList.remove('active');
        }
    });

}); 

// --- LÓGICA DE CÁMARA PARA MODAL 'RESPONDER SOLICITUD' ---
    const camInput = document.getElementById('editorCamera');
    if(camInput) {
        camInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                showToast("Procesando imagen...", "info");
                const reader = new FileReader();
                reader.onload = function(evt) {
                    // Guardamos la imagen en el campo oculto
                    document.getElementById('editorCameraBase64').value = evt.target.result;
                    // Mostramos preview
                    const prev = document.getElementById('editorCameraPreview');
                    prev.src = evt.target.result;
                    prev.style.display = 'block';
                    showToast("✅ Foto lista para enviar", "success");
                };
                reader.readAsDataURL(file);
            }
        });
    }
   