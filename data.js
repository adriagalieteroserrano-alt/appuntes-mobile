    // ---------------------------------------------------------------------------------------------------
    // BLOQUE 0: CURRÍCULO COMPLETO Y DETALLADO
    // ---------------------------------------------------------------------------------------------------
    const curriculum = {
        "1º ESO": {
            "Lengua Castellana y Literatura": ["La comunicación", "Tipos de textos (Narrativo, descriptivo)", "Gramática (Sustantivo, Adjetivo)", "Ortografía", "Literatura (Géneros)"],
            "Matemáticas": ["Números Naturales", "Divisibilidad", "Números Enteros", "Fracciones y Decimales", "Proporcionalidad", "Álgebra básica", "Rectas y Ángulos", "Perímetros y Áreas"],
            "Biología y Geología": ["El Universo y la Tierra", "La Geosfera", "La Atmósfera e Hidrosfera", "La Célula", "Los Seres Vivos (Reinos)", "Invertebrados y Vertebrados"],
            "Geografía e Historia": ["La Tierra y su representación", "Relieve terrestre", "Climas y Paisajes", "Prehistoria", "Mesopotamia y Egipto", "Grecia y Roma"],
            "Inglés": ["Present Simple & Continuous", "Past Simple", "Comparative & Superlative", "Vocabulary: Daily Routine, Family, School", "Reading & Listening"],
            "Educación Física": ["Calentamiento general", "Cualidades físicas básicas", "Atletismo", "Deportes colectivos", "Expresión corporal"],
            "Educación Plástica y Visual": ["El lenguaje visual", "Elementos (Punto, línea, plano)", "El Color", "Geometría Plana básica", "Texturas"],
            "Música": ["Cualidades del sonido", "Lenguaje musical (Notas, Ritmo)", "La voz y los instrumentos", "Historia de la música básica"],
            "Tecnología y Digitalización": ["Proceso tecnológico", "Dibujo técnico básico", "Materiales (Madera)", "Hardware y Software básico", "Internet y seguridad"],
            "Valores Cívicos / Religión": ["Identidad personal", "Derechos Humanos", "Convivencia", "Relatos bíblicos"]
        },
        "2º ESO": {
            "Lengua Castellana y Literatura": ["Funciones del lenguaje", "Sintaxis (Sujeto y Predicado)", "Morfología verbal", "Literatura Medieval", "El Lazarillo"],
            "Matemáticas": ["Números Enteros y Fracciones", "Proporcionalidad y Porcentajes", "Expresiones Algebraicas", "Ecuaciones de 1º y 2º grado", "Sistemas de Ecuaciones", "Teorema de Pitágoras", "Cuerpos Geométricos", "Estadística"],
            "Física y Química": ["La actividad científica", "La Materia y sus estados", "Cambios químicos", "Movimiento y Fuerzas", "Energía", "Calor y Temperatura"],
            "Geografía e Historia": ["Edad Media (Visigodos, Al-Ándalus)", "Reinos Cristianos", "El Feudalismo", "Arte Románico y Gótico", "Población y Sociedad"],
            "Inglés": ["Past Continuous", "Present Perfect", "Future (Will/Going to)", "Modals (Must, Should, Can)", "Vocabulary: Travel, Health, Technology"],
            "Educación Física": ["Resistencia y Flexibilidad", "Deportes de adversario (Bádminton)", "Acrosport", "Primeros Auxilios"],
            "Música": ["La música en la cultura", "Géneros musicales", "Grabación y edición de sonido", "Historia: Edad Media y Renacimiento"],
            "Tecnología": ["Estructuras", "Mecanismos", "Electricidad básica", "Programación (Scratch/Bloques)"],
            "Cultura Clásica (Optativa)": ["Mitología griega y romana", "Vida cotidiana en Roma", "Etimología"],
            "Segunda Lengua (Francés/Alemán)": ["Presentación", "Rutinas", "Entorno cercano", "Gramática básica"]
        },
        "3º ESO": {
            "Lengua Castellana y Literatura": ["Oración Simple (Análisis)", "Literatura Renacentista", "Literatura Barroca (Cervantes, Lope)", "Textos argumentativos"],
            "Matemáticas": ["Números Reales", "Sucesiones y Progresiones", "Polinomios", "Ecuaciones y Sistemas", "Geometría del Plano y Espacio", "Funciones y Gráficas", "Estadística y Probabilidad"],
            "Biología y Geología": ["La organización del cuerpo humano", "Nutrición y Alimentación", "Aparatos (Digestivo, Respiratorio...)", "Relación y Reproducción", "Salud y Enfermedad", "El relieve terrestre"],
            "Física y Química": ["Estructura del átomo", "Tabla Periódica", "Enlace Químico", "Reacciones Químicas", "Electricidad y Circuitos"],
            "Geografía e Historia": ["Edad Moderna", "El Imperio Español", "Sector Primario, Secundario y Terciario", "Geografía política"],
            "Inglés": ["Conditionals", "Passive Voice", "Reported Speech (Basic)", "Vocabulary: Jobs, Environment, Crime"],
            "Tecnología": ["Electrónica", "Control y Robótica", "Tecnología y Sociedad", "Materiales (Plásticos, Pétreos)"],
            "Educación Plástica": ["Sistemas de Representación", "Perspectiva", "Diseño", "Imagen Digital"],
            "Iniciación a la Actividad Emprendedora": ["El emprendedor", "La empresa", "Finanzas básicas"]
        },
        "4º ESO": {
            "Lengua Castellana y Literatura": ["Oración Compuesta", "Literatura S. XVIII y XIX (Romanticismo, Realismo)", "Generación del 98 y 27", "Literatura actual"],
            "Matemáticas A/B": ["Logaritmos", "Trigonometría", "Vectores y Rectas", "Funciones (Límites, Continuidad)", "Estadística Bidimensional", "Combinatoria"],
            "Geografía e Historia": ["Siglo XVIII y XIX (Revoluciones)", "Guerras Mundiales", "Guerra Fría", "España contemporánea", "Arte Contemporáneo"],
            "Biología y Geología": ["La Célula y la Genética", "Leyes de Mendel", "ADN y Biotecnología", "Evolución", "Ecología y Medio Ambiente"],
            "Física y Química": ["Cinemática (MRU, MRUA)", "Dinámica (Leyes de Newton)", "Fuerzas (Gravitatoria, Eléctrica)", "Química del Carbono"],
            "Economía y Emprendimiento": ["El mercado", "Dinero y finanzas", "Contabilidad básica", "Impuestos", "Tipos de empresas"],
            "Digitalización": ["Edición multimedia", "Publicación web", "Seguridad informática", "Redes"],
            "Latín": ["Declinaciones", "Conjugaciones", "Traducción básica", "Legado romano"],
            "Música / Artes Escénicas": ["Historia de la música moderna", "Interpretación", "El teatro y la danza"]
        },
        "1º Bachillerato Ciencias y Tecnología": {
            "Matemáticas I": ["Números Reales y Complejos", "Álgebra (Ecuaciones, Sistemas)", "Trigonometría", "Geometría Analítica", "Funciones y Límites", "Derivadas"],
            "Física y Química": ["Cinemática", "Dinámica", "Trabajo y Energía", "Termodinámica", "Leyes Ponderales", "Gases", "Enlace Químico", "Química Orgánica básica"],
            "Biología, Geología y CC. Ambientales": ["La Tierra en el Universo", "Geosfera (Minerales y Rocas)", "Biología Celular", "Histología", "Biodiversidad"],
            "Dibujo Técnico I": ["Geometría Plana", "Sistemas de Representación", "Normalización (Cotas, Vistas)"],
            "Tecnología e Ingeniería I": ["Proyectos", "Materiales", "Sistemas mecánicos", "Sistemas eléctricos y electrónicos", "Sistemas automáticos"],
            "Lengua Castellana y Literatura I": ["El texto", "Morfología y Sintaxis", "Literatura Medieval hasta el Barroco"],
            "Filosofía": ["El saber filosófico", "El ser humano (Antropología)", "El conocimiento (Epistemología)", "Acción y ética"],
            "Inglés I": ["Advanced Grammar", "Writing (Essays, Articles)", "Speaking", "Reading Comprehension"]
        },
        "2º Bachillerato Ciencias y Tecnología": {
            "Matemáticas II": ["Matrices y Determinantes", "Sistemas de Ecuaciones Lineales", "Vectores en el Espacio", "Geometría (Rectas y Planos)", "Análisis (Límites, Derivadas, Integrales)", "Probabilidad"],
            "Física": ["Campo Gravitatorio", "Campo Eléctrico y Magnético", "Movimiento Ondulatorio", "Óptica Geométrica y Física", "Física Moderna (Relatividad, Cuántica, Nuclear)"],
            "Química": ["Estructura Atómica", "Enlace Químico", "Cinética Química", "Equilibrio Químico", "Ácidos y Bases", "Redox", "Química Orgánica (Reacciones y Polímeros)"],
            "Biología": ["Base molecular de la vida (Biomoléculas)", "Estructura celular", "Metabolismo (Catabolismo, Anabolismo)", "Genética Molecular", "Microbiología e Inmunología"],
            "Dibujo Técnico II": ["Geometría Plana avanzada", "Sistema Diédrico", "Sistema Axonométrico", "Normalización Industrial"],
            "Tecnología e Ingeniería II": ["Materiales", "Sistemas automáticos", "Control digital", "Neumática e Hidráulica"],
            "Historia de España": ["Raíces históricas", "Crisis del Antiguo Régimen", "Construcción del Estado Liberal", "Restauración", "II República y Guerra Civil", "Dictadura y Transición"],
            "Historia de la Filosofía": ["Antigua (Platón, Aristóteles)", "Medieval (Agustín, Tomás)", "Moderna (Descartes, Hume, Kant)", "Contemporánea (Marx, Nietzsche, Ortega)"],
            "Lengua Castellana y Literatura II": ["Análisis de Texto", "Sintaxis compuesta", "Literatura S. XVIII a la actualidad"]
        },
        "1º Bachillerato Humanidades y Ciencias Sociales": {
            "Matemáticas CCSS I": ["Aritmética y Álgebra financiera", "Funciones y Gráficas", "Estadística Descriptiva", "Probabilidad"],
            "Economía": ["Actividad económica", "Mercado y Precios", "Macroeconomía (PIB, IPC)", "Dinero y Bancos", "Comercio Internacional"],
            "Historia del Mundo Contemporáneo": ["Crisis del Antiguo Régimen", "Revolución Industrial", "Movimiento Obrero", "Imperialismo", "Guerras Mundiales", "Guerra Fría", "Mundo Actual"],
            "Latín I": ["Gramática (Declinaciones, Verbos)", "Sintaxis oracional", "Historia de Roma", "Textos"],
            "Griego I": ["Alfabeto y Lectura", "Morfología nominal y verbal", "Cultura griega", "Etimología"],
            "Literatura Universal": ["Literatura antigua y medieval", "Renacimiento y Clasicismo", "Ilustración y Romanticismo", "Realismo y Simbolismo", "Vanguardias"]
        },
        "2º Bachillerato Humanidades y Ciencias Sociales": {
            "Matemáticas CCSS II": ["Matrices", "Programación Lineal", "Límites y Continuidad", "Derivadas y Optimización", "Probabilidad", "Inferencia Estadística"],
            "Empresa y Diseño de Modelos de Negocio": ["La empresa y el entorno", "Desarrollo de la empresa", "Función productiva", "Marketing", "Financiación e Inversión", "Contabilidad"],
            "Geografía": ["Relieve de España", "Clima y Agua", "Vegetación", "Población y Ciudad", "Sectores productivos", "España en Europa"],
            "Historia del Arte": ["Arte Clásico (Grecia y Roma)", "Arte Medieval (Paleocristiano, Románico, Gótico)", "Renacimiento y Barroco", "Siglo XIX y Vanguardias"],
            "Latín II": ["Sintaxis compleja", "Literatura latina", "Autores (César, Cicerón, Virgilio)", "Evolución al romance"],
            "Griego II": ["Sintaxis compleja", "Literatura griega", "Autores (Homero, Platón, Sófocles)"]
        },
        "1º Bachillerato Artes": {
            "Dibujo Artístico I": ["Elementos de configuración", "La forma", "El claroscuro", "El color", "Técnicas secas y húmedas"],
            "Cultura Audiovisual": ["Imagen fija y en movimiento", "Lenguaje audiovisual", "Historia del cine", "Guion y realización"],
            "Volumen": ["Concepto de espacio y volumen", "Materiales y técnicas", "El relieve y el bulto redondo", "Procesos de realización"],
            "Proyectos Artísticos": ["Metodología de proyectos", "Fases de creación", "Presentación de obra"]
        },
        "2º Bachillerato Artes": {
            "Dibujo Artístico II": ["Análisis de formas", "Figura humana", "Espacio y perspectiva", "Técnicas mixtas", "Ilustración"],
            "Fundamentos Artísticos": ["El arte como lenguaje", "Arte y sociedad", "Evolución de los estilos artísticos", "El arte en la actualidad"],
            "Diseño": ["Historia del diseño", "Metodología del diseño", "Diseño gráfico", "Diseño de producto", "Diseño de interiores"],
            "Técnicas de Expresión Gráfico-Plástica": ["Técnicas de dibujo", "Técnicas pictóricas", "Técnicas de grabado y estampación"]
        },
        "1º Bachillerato General": {
            "Matemáticas Generales": ["Resolución de problemas", "Análisis de datos", "Conexiones matemáticas", "Matemáticas en la vida cotidiana"],
            "Economía, Emprendimiento y Actividad Empresarial": ["Economía personal", "Emprendimiento social", "Proyectos empresariales"],
            "Ciencias Generales": ["Método científico", "Materia y energía", "La vida y la salud", "Medio ambiente"]
        },
        "2º Bachillerato General": {
            "Ciencias Generales": ["Física y Química aplicadas", "Biología y Geología aplicadas", "Tecnología y sociedad"],
            "Movimientos Culturales y Artísticos": ["Historia de la cultura", "Arte y sociedad contemporánea", "Manifestaciones culturales actuales"]
        },
        "IB Year 1": {
            "Mathematics: Analysis and Approaches (AA)": ["Number and Algebra", "Functions", "Geometry and Trigonometry", "Statistics and Probability", "Calculus"],
            "Physics": ["Measurements and Uncertainties", "Mechanics", "Thermal Physics", "Waves", "Electricity and Magnetism", "Circular Motion and Gravitation"],
            "Chemistry": ["Stoichiometric relationships", "Atomic structure", "Periodicity", "Chemical bonding and structure", "Energetics/Thermochemistry"],
            "Biology": ["Cell Biology", "Molecular Biology", "Genetics", "Ecology", "Evolution and Biodiversity", "Human Physiology"],
            "Theory of Knowledge (TOK)": ["Knowledge and the Knower", "Knowledge and Technology", "Knowledge and Language", "Areas of Knowledge (History, Human Sciences, Natural Sciences, Arts, Math)"],
            "Creativity, Activity, Service (CAS)": ["Portfolio Development", "Project Planning", "Reflection"]
        },
        "IB Year 2": {
            "Mathematics: Analysis and Approaches (AA)": ["Advanced Calculus", "Vectors (HL)", "Complex Numbers (HL)", "Proof", "Exploration (Internal Assessment)"],
            "Physics": ["Atomic, Nuclear and Particle Physics", "Energy Production", "Wave Phenomena (HL)", "Fields (HL)", "Electromagnetic Induction (HL)", "Quantum Physics (HL)"],
            "Chemistry": ["Chemical Kinetics", "Equilibrium", "Acids and Bases", "Redox Processes", "Organic Chemistry", "Measurement and Data Processing"],
            "Biology": ["Nucleic Acids (HL)", "Metabolism, Cell Respiration and Photosynthesis (HL)", "Plant Biology (HL)", "Genetics and Evolution (HL)", "Animal Physiology (HL)"],
            "Theory of Knowledge (TOK)": ["The Essay", "The Exhibition"],
            "Extended Essay (EE)": ["Research Question", "Methodology", "Writing and Analysis", "Viva Voce"]
        }
    };
    // V17: Definición de lenguas cooficiales como ASIGNATURAS
    const coOfficialLanguageSubjects = {
        "Cataluña": "Llengua Catalana",
        "Comunidad Valenciana": "Llengua Valenciana",
        "Galicia": "Lingua Galega",
        "País Vasco": "Euskal Hizkuntza",
        "Islas Baleares": "Llengua Catalana (Balear)",
    };
    // Temas genéricos para la asignatura de Lengua Cooficial (se aplica a todos los cursos)
    const coOfficialLanguageTopics = ["Gramática y morfosintaxis", "Literatura regional", "Comentario de texto", "Variedades dialectales"];
    // ---------------------------------------------------------------------------------------------------
    // FIN DEL BLOQUE 0
    // ---------------------------------------------------------------------------------------------------