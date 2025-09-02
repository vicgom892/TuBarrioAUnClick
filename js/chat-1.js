// chat.js - Asistente virtual con voz, trato de "vos" y mejoras para adultos
document.addEventListener('DOMContentLoaded', function() {
  // Array para almacenar los datos de negocios
  let negociosData = [];

  // Función para cargar los negocios desde el archivo JSON
  async function cargarNegocios() {
    try {
      // Usar los negocios ya cargados en main.js
      if (window.businesses && window.businesses.length > 0) {
        negociosData = window.businesses;
        console.log(`✅ Chatbot usando ${negociosData.length} negocios`);
        return;
      }
      
      // Intentar cargar desde caché
      const CACHE_KEY = 'businesses_cache_v4';
      const cachedData = localStorage.getItem(CACHE_KEY);
      
      if (cachedData) {
        const { businesses } = JSON.parse(cachedData);
        negociosData = businesses;
        console.log(`✅ Chatbot usando ${negociosData.length} negocios desde caché`);
        return;
      }
      
      // Si no hay datos, intentar cargar desde JSON
      const response = await fetch('data/negocios.json');
      if (!response.ok) throw new Error('Error al cargar negocios.json');
      const data = await response.json();
      negociosData = Object.values(data).flat();
      console.log(`✅ Chatbot usando ${negociosData.length} negocios desde JSON`);
    } catch (error) {
      console.error('Error al cargar los negocios:', error);
      addMessage('Lo siento, no pude cargar los datos de los negocios. Por favor, intenta de nuevo más tarde.', 'bot');
    }
  }

  // Función para normalizar texto (sin acentos, en minúsculas)
  function normalizeText(text) {
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, '');
  }

  // Respuestas predefinidas con trato de "vos"
  const faqResponses = {
    "hola": "¡Hola! ¿Cómo estás? ¿En qué te puedo ayudar?",
    "buenos dias": "¡Buenos días! ¿Cómo andás?",
    "buenas tardes": "¡Buenas tardes! ¿En qué necesitás ayuda?",
    "buenas noches": "¡Buenas noches! Estoy acá si me necesitás.",
    "gracias": "¡De nada! Cualquier cosa, acá estoy.",
    "adios": "¡Chau! Que tengas un buen día.",
    "chao": "¡Hasta luego! Cualquier duda, avisame.",
    "ayuda": "Podés preguntarme por negocios, horarios, pagos o pedir ayuda. ¿Qué necesitás?",
    "negocios": "Te muestro los negocios que están abiertos ahora:",
    "negocio": "Acá tenés algunos comercios cerca:",
    "comercios": "Te muestro los comercios disponibles:",
    "comercio": "Acá tenés algunos comercios:",
    "abiertos": "Estos son los que están abiertos ahora:",
    "distancia": "La distancia a los negocios es:",
    "horarios": "Los horarios de los negocios son:",
    "horario": "¿Te interesa el horario de algún negocio en particular?",
    "soporte": "Para soporte inmediato, podés contactarme por WhatsApp.",
    "whatsapp": "Para contactar con soporte, hacé clic aquí: [Contactar por WhatsApp](https://wa.me/5491157194796)",
    "wsp": "Para contactar con soporte, hacé clic aquí: [Contactar por WhatsApp](https://wa.me/5491157194796)",
    "mensaje": "Podés escribirme o usar el micrófono para hablar.",
    "micrófono": "Podés hablarme usando el micrófono.",
    "voz": "Sí, podés hablarme. Hacé clic en el micrófono.",
    "pagos": "Aceptan efectivo, tarjetas de crédito y débito, transferencias y billeteras digitales.",
    "pago": "Aceptan efectivo, tarjetas y Mercado Pago.",
    "tarjeta": "Sí, aceptan todas las tarjetas.",
    "efectivo": "Sí, aceptan efectivo.",
    "digital": "Aceptan billeteras digitales como Mercado Pago.",
    "ubicación": "Los negocios están en diferentes puntos. ¿Te interesa alguno en particular?",
    "direccion": "¿Querés la dirección de algún negocio específico?",
    "telefono": "Podés contactar a los negocios por teléfono o WhatsApp.",
    "contacto": "Podés contactarlos por teléfono o WhatsApp.",
    "información": "Estoy para ayudarte con cualquier cosa.",
    "info": "¿Qué necesitás? Podés preguntar por negocios, horarios, pagos, etc."
  };

  // Elementos del DOM
  const chatbotBtn = document.getElementById('chatbotBtn');
  const chatContainer = document.getElementById('chatContainer');
  const closeChat = document.getElementById('closeChat');
  const chatBody = document.getElementById('chatBody');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const permissionModal = document.getElementById('permissionModal');
  const grantPermission = document.getElementById('grantPermission');
  const denyPermission = document.getElementById('denyPermission');

  // Estado del micrófono
  let isListening = false;
  let recognition = null;
  let micPermissionGranted = false;

  // Variables para control de voz
  let voiceEnabled = true;

  // Función para formatear enlaces en los mensajes
  function formatMessageLinks(message) {
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let processedMessage = message.replace(markdownLinkRegex, (match, text, url) => {
      const cleanUrl = url.trim().replace(/\s+/g, '');
      return `<a href="${cleanUrl}" target="_blank" class="chat-link">${text}</a>`;
    });
    
    const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,;:!?])/g;
    processedMessage = processedMessage.replace(urlRegex, url => {
      const cleanUrl = url.trim().replace(/\s+/g, '');
      return `<a href="${cleanUrl}" target="_blank" class="chat-link">${url}</a>`;
    });
    
    return processedMessage;
  }

  // Función para obtener la hora actual
  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  // Función para agregar un mensaje al chat
  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${sender} message-animation`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatMessageLinks(text);
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();
    
    if (sender === 'bot') {
      const aiDiv = document.createElement('div');
      aiDiv.className = 'ai-indicator';
      aiDiv.innerHTML = `
        <span class="ai-dot"></span>
        <span class="ai-dot"></span>
        <span class="ai-dot"></span>
        <small>AI Assistant</small>
      `;
      messageDiv.appendChild(aiDiv);
    }
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    chatBody.appendChild(messageDiv);
    
    // Eliminar sugerencias rápidas después del primer mensaje del usuario
    if (sender === 'user') {
      const quickReplies = document.querySelector('.quick-replies');
      if (quickReplies) {
        quickReplies.remove();
      }
    }
    
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Función para mostrar el indicador de escritura
  function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'typing-dot';
      dotsDiv.appendChild(dot);
    }
    
    typingDiv.appendChild(dotsDiv);
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Función para ocultar el indicador de escritura
  function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Función para crear una tarjeta de negocio
  function createBusinessCard(negocio, index) {
    const isOpen = isBusinessOpen(negocio.horarioData);
    const statusClass = isOpen ? 'status-open' : 'status-closed';
    const statusText = isOpen ? 'Abierto ahora' : 'Cerrado';
    const statusIcon = isOpen ? '🟢' : '🔴';
    
    const card = document.createElement('div');
    card.className = 'business-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const categoryIcon = getBusinessCategoryIcon(negocio.rubro);
    
    card.innerHTML = `
      <div class="business-name">
        ${categoryIcon} ${negocio.nombre}
      </div>
      <div class="business-category">${negocio.rubro}</div>
      <div class="business-info">
        <i class="fas fa-clock"></i> ${negocio.horario}
      </div>
      <div class="business-info">
        <i class="fas fa-map-marker-alt"></i> ${negocio.direccion}
      </div>
      <div class="business-status ${statusClass}">
        ${statusIcon} ${statusText}
      </div>
      <a href="${negocio.pagina}" target="_blank" class="business-link">
        <i class="fas fa-external-link-alt"></i> Ver detalles
      </a>
      <div class="business-actions">
        <a href="https://wa.me/${negocio.whatsapp}" target="_blank" class="btn btn-sm btn-success">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <a href="tel:${negocio.telefono.replace(/\s/g, '')}" class="btn btn-sm btn-outline-primary">
          <i class="fas fa-phone"></i> Llamar
        </a>
      </div>
    `;
    
    return card;
  }

  // Función para obtener el ícono de categoría de negocio
  function getBusinessCategoryIcon(category) {
    const icons = {
      'Panadería': '🍞',
      'Fábrica de Pastas': '🍝',
      'Verdulería': '🥦',
      'Fiambrería': '🧀',
      'Kiosco': '🏪',
      'Mascotas': '🐾',
      'Barbería': '✂️',
      'Ferretería': '🔧',
      'Ropa': '👕',
      'Servicios': '🛠️',
      'Farmacia': '💊',
      'Cafetería': '☕',
      'Taller Mecánico': '🔧',
      'Librería': '📚',
      'Mates': '🧉',
      'Florería': '🌹'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (category.includes(key)) {
        return icon;
      }
    }
    
    return '🏪';
  }

  // Función para formatear la respuesta de todos los negocios
  function formatTodosNegociosResponse() {
    const categorias = {};
    negociosData.forEach(negocio => {
      if (!categorias[negocio.rubro]) {
        categorias[negocio.rubro] = [];
      }
      categorias[negocio.rubro].push(negocio);
    });
    
    let index = 0;
    for (const [categoria, negocios] of Object.entries(categorias)) {
      const categoriaOpen = negocios.some(n => isBusinessOpen(n.horarioData));
      
      if (negocios.length > 0) {
        const header = document.createElement('div');
        header.className = 'business-category-header';
        header.innerHTML = `
          <h5 style="margin: 16px 0 8px 0; color: #128C7E; font-size: 14px; font-weight: 600;">
            ${getBusinessCategoryIcon(categoria)} ${categoria} (${negocios.length})
          </h5>
        `;
        chatBody.appendChild(header);
        
        negocios.forEach(negocio => {
          const card = createBusinessCard(negocio, index++);
          chatBody.appendChild(card);
        });
      }
    }
    
    const openCount = negociosData.filter(n => isBusinessOpen(n.horarioData)).length;
    const closedCount = negociosData.length - openCount;
    
    return `<p>Mostrando ${negociosData.length} comercios: ${openCount} abiertos, ${closedCount} cerrados.</p>`;
  }

  // Función para formatear negocios por categoría
  function formatNegociosPorCategoria(categoria) {
    const categoryMap = {
      "panaderia": "Panadería",
      "pastas": "Fábrica de Pastas",
      "verduleria": "Verdulería",
      "fiambreria": "Fiambrería",
      "kiosco": "Kiosco",
      "mascotas": "Mascotas",
      "barberia": "Barbería",
      "ferreteria": "Ferretería",
      "ropa": "Ropa",
      "servicios": "Servicios",
      "farmacias": "Farmacia",
      "cafeterias": "Cafetería",
      "talleres": "Taller Mecánico",
      "librerias": "Librería",
      "mates": "Mates",
      "florerias": "Florería"
    };
    
    const displayName = categoryMap[categoria] || categoria;
    
    const negociosFiltrados = negociosData.filter(negocio => 
      negocio.rubro.includes(displayName)
    );
    
    if (negociosFiltrados.length === 0) {
      return `No encontré ${displayName.toLowerCase()} en nuestra base de datos. ¿Te interesa otra categoría?`;
    }
    
    const header = document.createElement('div');
    header.className = 'business-category-header';
    header.innerHTML = `
      <h5 style="margin: 16px 0 8px 0; color: #128C7E; font-size: 14px; font-weight: 600;">
        ${getBusinessCategoryIcon(displayName)} ${displayName} (${negociosFiltrados.length})
      </h5>
    `;
    chatBody.appendChild(header);
    
    let index = 0;
    negociosFiltrados.forEach(negocio => {
      const card = createBusinessCard(negocio, index++);
      chatBody.appendChild(card);
    });
    
    const openCount = negociosFiltrados.filter(n => isBusinessOpen(n.horarioData)).length;
    const closedCount = negociosFiltrados.length - openCount;
    
    return `<p>Mostrando ${negociosFiltrados.length} ${displayName.toLowerCase()}: ${openCount} abiertos, ${closedCount} cerrados.</p>`;
  }

    // Función para formatear la respuesta de horarios
  function formatHorariosResponse() {
    // Ordenar por categoría
    const categorias = {};
    negociosData.forEach(negocio => {
      if (!categorias[negocio.category]) {
        categorias[negocio.category] = [];
      }
      categorias[negocio.category].push(negocio);
    });
    
    let index = 0;
    for (const [categoria, negocios] of Object.entries(categorias)) {
      const header = document.createElement('div');
      header.className = 'business-category-header';
      header.innerHTML = `
        <h5 style="margin: 16px 0 8px 0; color: #128C7E; font-size: 14px; font-weight: 600;">
          ${getBusinessCategoryIcon(categoria)} ${categoria}
        </h5>
      `;
      chatBody.appendChild(header);
      
      negocios.forEach(negocio => {
        const card = createBusinessCard(negocio, index++);
        chatBody.appendChild(card);
      });
    }
    
    return "<p>¿Te interesa saber el horario de algún comercio en particular?</p>";
  }

  // Función para formatear la respuesta de distancia
  function formatDistanciaResponse() {
    // Ordenar por categoría
    const categorias = {};
    negociosData.forEach(negocio => {
      if (!categorias[negocio.category]) {
        categorias[negocio.category] = [];
      }
      categorias[negocio.category].push(negocio);
    });
    
    let index = 0;
    for (const [categoria, negocios] of Object.entries(categorias)) {
      const header = document.createElement('div');
      header.className = 'business-category-header';
      header.innerHTML = `
        <h5 style="margin: 16px 0 8px 0; color: #128C7E; font-size: 14px; font-weight: 600;">
          ${getBusinessCategoryIcon(categoria)} ${categoria}
        </h5>
      `;
      chatBody.appendChild(header);
      
      negocios.forEach(negocio => {
        const card = createBusinessCard(negocio, index++);
        chatBody.appendChild(card);
      });
    }
    
    return "<p>¿Te interesa la dirección de algún comercio en particular?</p>";
  }

  // Función para verificar si un negocio está abierto
  function isBusinessOpen(hoursString) {
    if (!hoursString) return true;
    try {
      const now = new Date();
      const options = { timeZone: "America/Argentina/Buenos_Aires" };
      const currentDay = now.toLocaleString("en-US", { ...options, weekday: "short" }).toLowerCase().slice(0, 3);
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTime = currentHours + currentMinutes / 60;

      const dayMap = {
        'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0,
        'lun': 1, 'mar': 2, 'mie': 3, 'jue': 4, 'vie': 5, 'sab': 6, 'dom': 0
      };

      const match = hoursString.toLowerCase().match(/(mon|tue|wed|thu|fri|sat|sun|lun|mar|mie|jue|vie|sab|dom)-(mon|tue|wed|thu|fri|sat|sun|lun|mar|mie|jue|vie|sab|dom)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (match) {
        const [, startDayStr, endDayStr, startStr, endStr] = match;
        const startDay = dayMap[startDayStr];
        const endDay = dayMap[endDayStr];
        const [startHour, startMinute] = startStr.split(":").map(Number);
        const [endHour, endMinute] = endStr.split(":").map(Number);
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
          console.warn(`Horario inválido: ${hoursString}`);
          return true;
        }
        const start = startHour + startMinute / 60;
        const end = endHour + endMinute / 60;
        const isOvernight = end < start;
        const currentDayNum = dayMap[currentDay];
        let isDayInRange;
        if (startDay <= endDay) {
          isDayInRange = currentDayNum >= startDay && currentDayNum <= endDay;
        } else {
          isDayInRange = currentDayNum >= startDay || currentDayNum <= endDay;
        }
        if (isOvernight) {
          return isDayInRange && (currentTime >= start || currentTime <= end);
        } else {
          return isDayInRange && currentTime >= start && currentTime <= end;
        }
      }
      
      if (hoursString.includes(',')) {
        const timeRanges = hoursString.split(',');
        for (const range of timeRanges) {
          if (isBusinessOpen(range.trim())) return true;
        }
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error en isBusinessOpen:", error, "Horario:", hoursString);
      return true;
    }
  }

  // Función para generar respuestas
  function generateResponse(query) {
    query = normalizeText(query);

    const categorias = [
      { regex: /panaderias?|pan/, categoria: 'Panadería', nombre: 'panaderías' },
      { regex: /pastas?|fábrica de pastas/, categoria: 'Fábrica de Pastas', nombre: 'fábricas de pastas' },
      { regex: /verdulerias?|verduras?|frutas?/, categoria: 'Verdulería', nombre: 'verdulerías' },
      { regex: /fiambrerias?|fiambres?/, categoria: 'Fiambrería', nombre: 'fiambrerías' },
      { regex: /kiosco|kioskos?/, categoria: 'Kiosco', nombre: 'kioscos' },
      { regex: /mascotas?|pet shop|veterinaria/, categoria: 'Mascotas', nombre: 'pet shops' },
      { regex: /barberias?|corte de pelo/, categoria: 'Barbería', nombre: 'barberías' },
      { regex: /ferreterias?|herramientas?/, categoria: 'Ferretería', nombre: 'ferreterías' },
      { regex: /ropa|tienda|moda/, categoria: 'Ropa', nombre: 'tiendas' },
      { regex: /profesion|profesional|abogado|médico|dentista/, categoria: 'Profesiones', nombre: 'profesionales' },
      { regex: /taller|gomería|mecánico/, categoria: 'Taller Mecánico', nombre: 'talleres' },
      { regex: /farmacia|droguería/, categoria: 'Farmacia', nombre: 'farmacias' },
      { regex: /cafeterias?|café/, categoria: 'Cafetería', nombre: 'cafeterías' },
      { regex: /librerias?|libro/, categoria: 'Librería', nombre: 'librerías' },
      { regex: /mates?|yerba/, categoria: 'Mates', nombre: 'lugares de mate' },
      { regex: /florerias?|flores?/, categoria: 'Florería', nombre: 'florerías' }
    ];

    const estaAbierto = query.includes('abierto') || query.includes('abierta') || query.includes('abren') || query.includes('horario');

    for (const { regex, categoria, nombre } of categorias) {
      if (regex.test(query)) {
        const negociosFiltrados = negociosData.filter(n => n.rubro === categoria);
        
        if (negociosFiltrados.length === 0) {
          return `No tengo registradas ${nombre} en este momento. ¿Te interesa otra categoría?`;
        }

        const negocios = estaAbierto 
          ? negociosFiltrados.filter(n => isBusinessOpen(n.horarioData))
          : negociosFiltrados;

        const cantidad = negocios.length;
        const estado = estaAbierto ? 'abiertas' : 'cercanas';

        const header = document.createElement('div');
        header.className = 'business-category-header';
        header.innerHTML = `
          <h5 style="margin: 16px 0 8px 0; color: #128C7E; font-size: 14px; font-weight: 600;">
            ${getBusinessCategoryIcon(categoria)} ${categoria} (${cantidad})
          </h5>
        `;
        chatBody.appendChild(header);

        negocios.forEach((negocio, i) => {
          const card = createBusinessCard(negocio, i);
          chatBody.appendChild(card);
        });

        return `<p>Mostrando ${cantidad} ${nombre} ${estado}. Podés hacer clic en cualquiera para ver más.</p>`;
      }
    }

    // Respuestas generales
  if (query.includes('hola') || query.includes('buenas')) {
    return "¡Hola! 👋 Soy tu asistente con inteligencia artificial. ¿En qué puedo ayudarte?";
  }
  if (query.includes('gracias')) {
    return "¡De nada! Estoy para ayudarte.";
  }
  if (query.includes('adios') || query.includes('chau')) {
    return "¡Hasta luego! Que tengas un buen día.";
  }
  if (query.includes('soporte') || query.includes('ayuda') || query.includes('problema')) {
    return "Para soporte inmediato, podés contactarme por WhatsApp: [Contactar por WhatsApp](https://wa.me/5491157194796)";
  }
  if (query.includes('horario') || query.includes('abren') || query.includes('cierran')) {
    return "¿Te interesa el horario de alguna categoría de negocio en particular?";
  }
  if (query.includes('pago') || query.includes('tarjeta') || query.includes('efectivo')) {
    return "La mayoría de los comercios aceptan efectivo, tarjetas y Mercado Pago.";
  }
  if (query.includes('ubicacion') || query.includes('direccion')) {
    return "¿Te interesa la ubicación de algún negocio en particular?";
  }

    return "No entendí tu consulta. Podés preguntarme por negocios, horarios, pagos o pedir ayuda.";
  }

  // Función para que el chatbot hable
  function speakText(text) {
    if (!voiceEnabled) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(voice => 
      voice.lang.includes('es') || voice.name.includes('Spanish')
    );

    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }

  // Función para manejar el envío de mensajes
  function handleSendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    addMessage(text, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    showTypingIndicator();
    
    setTimeout(() => {
      hideTypingIndicator();
      const response = generateResponse(text);
      addMessage(response, 'bot');

      // Extraer texto limpio para hablar
      const textToSpeak = response
        .replace(/<[^>]*>/g, '')
        .replace(/\*[^*]*\*/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .trim();

      if (textToSpeak) {
        speakText(textToSpeak);
      }
    }, 1500);
  }

  // Función para enviar una respuesta rápida
  window.sendQuickReply = function(text) {
    messageInput.value = text;
    handleSendMessage();
  };

  // Función para manejar pulsaciones de teclas
   window.handleKeyPress = function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  // Función para solicitar permiso de micrófono
  function requestMicPermission() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addMessage('Lo siento, tu navegador no soporta el reconocimiento de voz. Usa Chrome o Edge para esta función.', 'bot');
      return;
    }
    
    if (micPermissionGranted) {
      startListening();
      return;
    }
    
    permissionModal.classList.add('active');
  }

  // Función para comenzar a escuchar
  function startListening() {
    if (isListening) {
      stopListening();
      return;
    }
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';
      
      recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        stopListening();
        handleSendMessage();
      };
      
      recognition.onerror = function(event) {
        console.error('Error en el reconocimiento de voz:', event.error);
        if (event.error === 'not-allowed') {
          addMessage('Permiso de micrófono denegado. Por favor, habilita el micrófono en la configuración de tu navegador.', 'bot');
        }
        stopListening();
      };
      
      recognition.onend = function() {
        stopListening();
      };
      
      recognition.start();
      isListening = true;
      voiceBtn.classList.add('listening');
      voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
    } catch (error) {
      console.error('Error al iniciar el reconocimiento de voz:', error);
      addMessage('Error al iniciar el micrófono. Por favor, verifica los permisos.', 'bot');
    }
  }

  // Función para detener la escucha
  function stopListening() {
    if (recognition && isListening) {
      recognition.stop();
    }
    isListening = false;
    voiceBtn.classList.remove('listening');
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
  }

  // Función para abrir WhatsApp (accesible globalmente)
  window.openWhatsApp = function() {
    const whatsappNumber = '5491157194796';
    const message = `*Solicitud de Soporte*\n\n` +
                   `*Mensaje:* Hola, necesito ayuda con la aplicación.\n` +
                   `*Registrado desde:* Tu Barrio A Un Clic\n` +
                   `*Fecha:* ${new Date().toLocaleDateString('es-AR')}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    console.log('Abriendo WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
  };

  // Event Listeners
  if (chatbotBtn) {
    chatbotBtn.addEventListener('click', function() {
      chatContainer.classList.add('active');
      if (negociosData.length === 0) {
        cargarNegocios();
      }
    });
  }

  if (closeChat) {
    closeChat.addEventListener('click', function() {
      chatContainer.classList.remove('active');
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendMessage);
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', requestMicPermission);
  }

  if (messageInput) {
    messageInput.addEventListener('keydown', handleKeyPress);
    messageInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  }

  if (grantPermission) {
    grantPermission.addEventListener('click', function() {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
          micPermissionGranted = true;
          permissionModal.classList.remove('active');
          startListening();
        })
        .catch(function(err) {
          console.error('Error al acceder al micrófono:', err);
          permissionModal.classList.remove('active');
          addMessage('No se pudo acceder al micrófono. Por favor, verifica los permisos en tu navegador.', 'bot');
        });
    });
  }

  if (denyPermission) {
    denyPermission.addEventListener('click', function() {
      permissionModal.classList.remove('active');
      addMessage('Podés usar la función de texto para interactuar con el chatbot.', 'bot');
    });
  }

  if (permissionModal) {
    permissionModal.addEventListener('click', function(e) {
      if (e.target === permissionModal) {
        permissionModal.classList.remove('active');
      }
    });
  }

  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
      if (!chatContainer.contains(e.target) && e.target !== chatbotBtn && !chatbotBtn.contains(e.target) && chatContainer.classList.contains('active')) {
        chatContainer.classList.remove('active');
      }
    }
  });

  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
      chatContainer.style.bottom = '80px';
      chatContainer.style.right = '15px';
      chatContainer.style.left = '15px';
    } else {
      chatContainer.style.bottom = '100px';
      chatContainer.style.right = '30px';
      chatContainer.style.left = 'auto';
    }
  });

  // Función para mostrar sugerencias rápidas
  function showQuickReplies() {
    const quickReplies = document.createElement('div');
    quickReplies.className = 'quick-replies';
    
    const categories = [
      { text: '🏪 Negocios', action: 'negocios' },
      { text: '🕒 Horarios', action: 'horarios' },
      { text: '📍 Ubicación', action: 'ubicación' },
      { text: '💬 Soporte', action: 'soporte' }
    ];
    
    categories.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply';
      btn.innerHTML = category.text;
      btn.onclick = () => sendQuickReply(category.action);
      quickReplies.appendChild(btn);
    });
    
    chatBody.appendChild(quickReplies);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Función para mostrar mensaje de bienvenida
  function showWelcomeMessage() {
    addMessage("¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?", 'bot');
    setTimeout(showQuickReplies, 1000);
  }

  // Inicializar el chatbot
  function initChatbot() {
    if (window.chatbotInitialized) return;
    
    if (!document.getElementById('messageInput')) {
      if (window.chatbotInitAttempts < 10) {
        window.chatbotInitAttempts++;
        setTimeout(initChatbot, 300);
        return;
      } else {
        console.error('❌ Se alcanzó el límite de reintentos para messageInput.');
        return;
      }
    }
    
    window.chatbotInitAttempts = 0;
    window.chatbotInitialized = true;
    
    cargarNegocios();
    
    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (voiceBtn) voiceBtn.addEventListener('click', requestMicPermission);
    if (messageInput) {
      messageInput.addEventListener('keydown', handleKeyPress);
      messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
    }
    if (closeChat) {
      closeChat.addEventListener('click', function() {
        chatContainer.classList.remove('active');
      });
    }
    
    setTimeout(showWelcomeMessage, 500);
  }

  // Inicializar voces para síntesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function() {
      console.log('Voces cargadas para síntesis de voz');
    };
  }

  window.chatbotInitAttempts = 0;
  setTimeout(initChatbot, 500);
});