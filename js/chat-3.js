document.addEventListener('DOMContentLoaded', function() {
  // Array para almacenar los datos de negocios
  let negociosData = [];

  // Función para normalizar strings (ignorar tildes, mayúsculas y espacios)
  function normalizeString(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Función para cargar los negocios desde el archivo JSON
  async function cargarNegocios() {
    try {
      if (window.businesses && window.businesses.length > 0) {
        negociosData = window.businesses;
        console.log(`✅ Chatbot usando ${negociosData.length} negocios desde window.businesses`);
      } else {
        const CACHE_KEY = 'businesses_cache_v4';
        const cachedData = localStorage.getItem(CACHE_KEY);
        
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          negociosData = data;
          console.log(`✅ Chatbot usando ${negociosData.length} negocios desde caché`);
        } else {
          const response = await fetch('data/negocios.json');
          if (!response.ok) throw new Error('Error al cargar negocios.json');
          negociosData = await response.json();
          console.log(`✅ Chatbot usando ${negociosData.length} negocios desde JSON`);
        }
      }
      console.log('Negocios cargados:', negociosData);
    } catch (error) {
      console.error('Error al cargar los negocios:', error);
      addMessage('Lo siento, no pude cargar los comercios. Escribe "ayuda" para saber qué puedo hacer por ti.', 'bot');
    }
  }

  // Respuestas predefinidas para preguntas frecuentes
  const faqResponses = {
    "hola|saludo|buen dia|buenos dias|buena tarde|buenas tardes|buena noche|buenas noches": [
      "¡Hola! Soy tu asistente. ¿En qué puedo ayudarte hoy? Escribe algo como 'negocios', 'horarios' o 'ayuda'.",
      "¡Buen día! Estoy aquí para ayudarte. ¿Qué quieres saber? Prueba con 'comercios' o 'pagos'.",
      "¡Hola! Me alegra verte. Escribe lo que necesitas, como 'ubicación' o 'soporte'."
    ],
    "gracias|muchas gracias|gracia": [
      "¡De nada! ¿En qué más te ayudo? Escribe 'negocios' para ver comercios cercanos.",
      "¡No hay de qué! Si necesitas algo más, prueba con 'horarios' o 'contacto'."
    ],
    "adios|chao|hasta luego|bye": [
      "¡Hasta pronto! Si necesitas ayuda, vuelve y escribe 'ayuda'.",
      "¡Chau! Estoy aquí cuando quieras. Escribe 'negocios' si vuelves."
    ],
    "ayuda|necesito ayuda|asistencia|que puedo hacer": [
      "¡Claro que sí! Puedo ayudarte a encontrar comercios, horarios, ubicaciones o formas de pago. Escribe algo como 'negocios', 'horarios', 'ubicación' o 'soporte'.",
      "Estoy aquí para ayudarte. ¿Quieres saber sobre comercios, horarios o cómo contactar a alguien? Escribe 'ayuda' otra vez si no sabes qué preguntar."
    ],
    "negocios|negocio|comercios|comercio|tiendas|tienda|negocito|comerciante": [
      "Te muestro los comercios cercanos. Mira las tarjetas a continuación. Escribe el nombre de un comercio para más detalles o 'ayuda' para otras opciones."
    ],
    "abiertos|abierto ahora|que esta abierto|abren": [
      "Aquí tienes los comercios que están abiertos ahora. Escribe 'negocios' para ver todos o 'ayuda' para más opciones."
    ],
    "distancia|cerca|lejos|ubicacion cerca|donde queda|dónde está": [
      "Te muestro la ubicación de los comercios. Mira las tarjetas. Escribe el nombre de un comercio para más detalles o 'ayuda' para otras opciones."
    ],
    "horarios|horario|cuando abre|cuando cierra|horas": [
      "Aquí tienes los horarios de los comercios. Mira las tarjetas. Escribe el nombre de un comercio para más detalles o 'ayuda' para otras opciones."
    ],
    "soporte|ayuda tecnica|problema|contacto|contactar": [
      "Si necesitas ayuda, puedes escribirle a nuestro equipo por WhatsApp. Haz clic aquí: [Contactar por WhatsApp](https://wa.me/5491157194796). O escribe 'ayuda' para otras opciones."
    ],
    "whatsapp|wsp|wa": [
      "Para contactar con soporte, haz clic aquí: [Contactar por WhatsApp](https://wa.me/5491157194796). Si no puedes, escribe 'ayuda' para más opciones."
    ],
    "pagos|pago|como pagar|pagar": [
      "Puedes pagar con efectivo, tarjeta de crédito, débito o billeteras digitales como Mercado Pago. ¿Quieres saber más? Escribe 'tarjeta' o 'digital'."
    ],
    "tarjeta|credito|debito": [
      "Aceptamos tarjetas de crédito y débito. Todo es seguro. Escribe 'pagos' para ver todas las formas de pago o 'ayuda' para más opciones."
    ],
    "efectivo|dinero": [
      "Sí, puedes pagar con efectivo. Si puedes, lleva el monto exacto. Escribe 'pagos' para otras opciones o 'ayuda' para más ayuda."
    ],
    "digital|mercado pago|app": [
      "Aceptamos pagos con billeteras digitales como Mercado Pago. Es muy fácil. Escribe 'pagos' para ver todas las formas de pago o 'ayuda' para más opciones."
    ],
    "ubicación|ubicacion|donde esta|direccion|mapa|dónde está": [
      "Te muestro dónde están los comercios. Mira las tarjetas. Escribe el nombre de un comercio para más detalles o 'ayuda' para otras opciones."
    ],
    "telefono|llamar|numero": [
      "Puedes contactar a los comercios por teléfono. Escribe el nombre de un comercio para ver su número o 'ayuda' para más opciones."
    ],
    "contacto|contactar": [
      "Puedes contactar a los comercios por teléfono o WhatsApp. Escribe 'soporte' para contactar a nuestro equipo o 'negocios' para ver los comercios."
    ],
    "información|informacion|info|detalles|detalle": [
      "Puedo darte información sobre comercios, horarios, pagos o ubicaciones. Escribe algo como 'negocios', 'horarios' o 'ayuda' para empezar."
    ]
  };

  // Elementos del DOM
  const chatbotBtn = document.getElementById('chatbotBtn');
  const chatContainer = document.getElementById('chatContainer');
  const closeChat = document.getElementById('closeChat');
  const chatBody = document.getElementById('chatBody');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');

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
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <small>Asistente Virtual</small>
      `;
      messageDiv.appendChild(aiDiv);
    }
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    chatBody.appendChild(messageDiv);
    
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
    console.log('Creando tarjeta para:', negocio);
    const isOpen = isBusinessOpen(negocio.hours);
    const statusClass = isOpen ? 'status-open' : 'status-closed';
    const statusText = isOpen ? 'Abierto ahora' : 'Cerrado';
    const statusIcon = isOpen ? '🟢' : '🔴';
    
    const card = document.createElement('div');
    card.className = 'business-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const categoryIcon = getBusinessCategoryIcon(negocio.category);
    
    card.innerHTML = `
      <div class="business-name">
        ${categoryIcon} ${negocio.name}
      </div>
      <div class="business-category">${negocio.category}</div>
      <div class="business-info">
        <i class="fas fa-clock"></i> ${negocio.hours}
      </div>
      <div class="business-info">
        <i class="fas fa-map-marker-alt"></i> Ubicación en el mapa
      </div>
      <div class="business-status ${statusClass}">
        ${statusIcon} ${statusText}
      </div>
      <a href="${negocio.url}" target="_blank" class="business-link">
        <i class="fas fa-external-link-alt"></i> Ver detalles
      </a>
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
      'Mates': '📚',
      'Florería': '🌹'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (normalizeString(category).includes(normalizeString(key))) {
        return icon;
      }
    }
    
    return '🏪';
  }

  // Función para formatear la respuesta de todos los negocios
  function formatTodosNegociosResponse() {
    console.log('Iniciando formatTodosNegociosResponse, negociosData:', negociosData);
    if (!negociosData || negociosData.length === 0) {
      console.warn('No hay datos de negocios para mostrar');
      return 'No hay comercios disponibles ahora. Escribe "ayuda" para saber qué puedo hacer por ti.';
    }

    const categorias = {};
    negociosData.forEach(negocio => {
      if (!categorias[negocio.category]) {
        categorias[negocio.category] = [];
      }
      categorias[negocio.category].push(negocio);
    });
    
    let index = 0;
    for (const [categoria, negocios] of Object.entries(categorias)) {
      console.log(`Procesando categoría: ${categoria}, con ${negocios.length} negocios`);
      if (negocios.length > 0) {
        const header = document.createElement('div');
        header.className = 'business-category-header';
        header.innerHTML = `
          <h5 style="margin: 16px 0 8px 0; color: #128C7E; font-size: 14px; font-weight: 600;">
            ${getBusinessCategoryIcon(categoria)} ${categoria} (${negocios.length})
          </h5>
        `;
        chatBody.appendChild(header);
        console.log('Encabezado de categoría añadido:', categoria);
        
        negocios.forEach(negocio => {
          const card = createBusinessCard(negocio, index++);
          chatBody.appendChild(card);
          console.log('Tarjeta añadida al DOM:', negocio.name, card);
        });
      }
    }
    
    const openCount = negociosData.filter(n => isBusinessOpen(n.hours)).length;
    const closedCount = negociosData.length - openCount;
    
    return `Mostrando ${negociosData.length} comercios en total: ${openCount} abiertos y ${closedCount} cerrados. Escribe el nombre de un comercio para más detalles o "ayuda" para otras opciones.`;
  }

  // Función para formatear negocios por categoría
  function formatNegociosPorCategoria(categoria) {
    const categoryMap = {
      "panaderia|panadero|panes": "Panadería",
      "pastas|fideos": "Fábrica de Pastas",
      "verduleria|verduras|frutas": "Verdulería",
      "fiambreria|fiambres": "Fiambrería",
      "kiosco|kiosko|quiosco": "Kiosco",
      "mascotas|pet shop|veterinaria": "Mascotas",
      "barberia|barbero|corte": "Barbería",
      "ferreteria|herramientas": "Ferretería",
      "ropa|prendas|vestimenta": "Ropa",
      "servicios|plomero|electricista|cerrajero": "Servicios",
      "farmacias|farmacia|drogueria": "Farmacia",
      "cafeterias|cafe|cafetal": "Cafetería",
      "talleres|taller|gomeria|automotor": "Taller Mecánico",
      "librerias|libreria|papeleria": "Librería",
      "mates|yerba": "Mates",
      "florerias|floreria|flores": "Florería",
      "supermercado|mercado|almacen|tienda": "Supermercado",
      "restaurante|comida|resto": "Restaurante"
    };
    
    const displayName = Object.keys(categoryMap).find(key => 
      new RegExp(key, 'i').test(normalizeString(categoria))
    ) ? categoryMap[Object.keys(categoryMap).find(key => new RegExp(key, 'i').test(normalizeString(categoria)))] : categoria;
    
    const negociosFiltrados = negociosData.filter(negocio => 
      normalizeString(negocio.category).includes(normalizeString(displayName))
    );
    
    if (negociosFiltrados.length === 0) {
      return `No encontré ${displayName.toLowerCase()} en nuestra lista. Prueba con otra categoría, como 'panadería' o 'farmacia'. Escribe 'ayuda' para más opciones.`;
    }
    
    const header = document.createElement('div');
    header.className = 'business-category-header';
    header.innerHTML = `
      <h5 style="margin: 16px 0 8px 0; color: #128C7E; font-size: 14px; font-weight: 600;">
        ${getBusinessCategoryIcon(displayName)} ${displayName} (${negociosFiltrados.length})
      </h5>
    `;
    chatBody.appendChild(header);
    console.log('Encabezado de categoría añadido:', displayName);
    
    let index = 0;
    negociosFiltrados.forEach(negocio => {
      const card = createBusinessCard(negocio, index++);
      chatBody.appendChild(card);
      console.log('Tarjeta añadida al DOM:', negocio.name, card);
    });
    
    const openCount = negociosFiltrados.filter(n => isBusinessOpen(n.hours)).length;
    const closedCount = negociosFiltrados.length - openCount;
    
    return `Mostrando ${negociosFiltrados.length} ${displayName.toLowerCase()}: ${openCount} abiertos y ${closedCount} cerrados. Escribe el nombre de un comercio para más detalles o 'ayuda' para otras opciones.`;
  }

  // Función para formatear la respuesta de horarios
  function formatHorariosResponse() {
    console.log('Iniciando formatHorariosResponse, negociosData:', negociosData);
    if (!negociosData || negociosData.length === 0) {
      console.warn('No hay datos de negocios para mostrar');
      return 'No hay horarios disponibles ahora. Escribe "ayuda" para saber qué puedo hacer por ti.';
    }

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
          ${getBusinessCategoryIcon(categoria)} ${categoria} (${negocios.length})
        </h5>
      `;
      chatBody.appendChild(header);
      console.log('Encabezado de categoría añadido:', categoria);
      
      negocios.forEach(negocio => {
        const card = createBusinessCard(negocio, index++);
        chatBody.appendChild(card);
        console.log('Tarjeta añadida al DOM:', negocio.name, card);
      });
    }
    
    return "Aquí tienes los horarios de los comercios. Escribe el nombre de un comercio para más detalles o 'ayuda' para otras opciones.";
  }

  // Función para formatear la respuesta de distancia
  function formatDistanciaResponse() {
    console.log('Iniciando formatDistanciaResponse, negociosData:', negociosData);
    if (!negociosData || negociosData.length === 0) {
      console.warn('No hay datos de negocios para mostrar');
      return 'No hay ubicaciones disponibles ahora. Escribe "ayuda" para saber qué puedo hacer por ti.';
    }

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
          ${getBusinessCategoryIcon(categoria)} ${categoria} (${negocios.length})
        </h5>
      `;
      chatBody.appendChild(header);
      console.log('Encabezado de categoría añadido:', categoria);
      
      negocios.forEach(negocio => {
        const card = createBusinessCard(negocio, index++);
        chatBody.appendChild(card);
        console.log('Tarjeta añadida al DOM:', negocio.name, card);
      });
    }
    
    return "Aquí tienes las ubicaciones de los comercios. Escribe el nombre de un comercio para más detalles o 'ayuda' para otras opciones.";
  }

  // Función para verificar si un negocio está abierto
  function isBusinessOpen(hoursString) {
    if (typeof window.isBusinessOpen === 'function') {
      return window.isBusinessOpen(hoursString);
    }
    return true; // Asumir abierto si no disponible
  }

  // Función para generar respuestas
  function generateResponse(query) {
    query = normalizeString(query);

    // Buscar coincidencias exactas o parciales en faqResponses
    for (const [keys, responses] of Object.entries(faqResponses)) {
      const keyRegex = new RegExp(`\\b(${keys})\\b`, 'i');
      if (keyRegex.test(query)) {
        const response = Array.isArray(responses) ? responses[Math.floor(Math.random() * responses.length)] : responses;
        if (keys.includes('negocios') || keys.includes('comercios') || keys.includes('abiertos')) {
          return formatTodosNegociosResponse();
        } else if (keys.includes('horarios') || keys.includes('horario')) {
          return formatHorariosResponse();
        } else if (keys.includes('distancia') || keys.includes('ubicacion')) {
          return formatDistanciaResponse();
        } else {
          return response;
        }
      }
    }

    // Buscar categorías
    const categorias = [
      { regex: /supermercado|mercado|almac[eé]n|tienda|super|negocito/i, categoria: 'supermercado' },
      { regex: /farmacia|droguer[ií]a|medicamentos/i, categoria: 'farmacia' },
      { regex: /panader[ií]a|pan|panadero|panes/i, categoria: 'panaderia' },
      { regex: /ropa|prendas|vestimenta|indumentaria/i, categoria: 'ropa' },
      { regex: /restaurante|comida|resto|restoran/i, categoria: 'restaurante' },
      { regex: /verduler[ií]a|verdura|fruta|verduras|frutas/i, categoria: 'verduleria' },
      { regex: /fiambrer[ií]a|fiambre|quesos/i, categoria: 'fiambreria' },
      { regex: /kiosco|kiosko|quiosco|kiosquito/i, categoria: 'kiosco' },
      { regex: /mascotas|pet shop|veterinaria|animales/i, categoria: 'mascotas' },
      { regex: /barber[ií]a|barbero|corte de pelo|corte/i, categoria: 'barberia' },
      { regex: /ferreter[ií]a|herramientas|ferretero/i, categoria: 'ferreteria' },
      { regex: /servicios|plomero|electricista|cerrajero|reparaciones/i, categoria: 'servicios' },
      { regex: /farmacia|farmac[eé]utica|medicinas/i, categoria: 'farmacias' },
      { regex: /cafeter[ií]a|caf[eé]|cafetal|cafecito/i, categoria: 'cafeterias' },
      { regex: /taller|automotor|gomer[ií]a|mec[aá]nico/i, categoria: 'talleres' },
      { regex: /librer[ií]a|papeler[ií]a|libros/i, categoria: 'librerias' },
      { regex: /mates|yerba|matecito/i, categoria: 'mates' },
      { regex: /florer[ií]a|florister[ií]a|flores/i, categoria: 'florerias' }
    ];

    for (const { regex, categoria } of categorias) {
      if (regex.test(query)) {
        return formatNegociosPorCategoria(categoria);
      }
    }

    // Respuesta por defecto
    return "Lo siento, no entendí tu pregunta. Escribe algo como 'negocios', 'horarios', 'ubicación' o 'ayuda' para que te ayude.";
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
    }, 1500);
  }

  // Función para enviar una respuesta rápida
  function sendQuickReply(text) {
    messageInput.value = text;
    handleSendMessage();
  }

  // Función para manejar pulsaciones de teclas
  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  // Función para abrir WhatsApp (exportada globalmente)
  window.openWhatsApp = function() {
    const whatsappNumber = '5491157194796';
    const message = `*Solicitud de Soporte*\n\n*Mensaje:* Hola, necesito ayuda.\n*Desde:* Tu Barrio A Un Clic\n*Fecha:* ${new Date().toLocaleDateString('es-AR')}`;
    const encodedMessage = encodeURIComponent(message);
    let whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    whatsappUrl = whatsappUrl.replace(/\s+/g, '');
    
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      window.open(whatsappUrl, isMobile ? '_self' : '_blank');
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      addMessage('No pude abrir WhatsApp. Escribe "soporte" para intentarlo de nuevo o "ayuda" para otras opciones.', 'bot');
    }
  };

  // Función para probar tarjetas con datos ficticios
  window.testBusinessCards = function() {
    console.log('Probando tarjetas con datos ficticios');
    const testData = [
      { name: 'Panadería Test', category: 'Panadería', hours: '08:00-20:00', url: 'https://example.com' },
      { name: 'Farmacia Test', category: 'Farmacia', hours: '09:00-21:00', url: 'https://example.com' }
    ];
    negociosData = testData;
    const response = formatTodosNegociosResponse();
    addMessage(response, 'bot');
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

  if (messageInput) {
    messageInput.addEventListener('keydown', handleKeyPress);
    messageInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
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
      { text: '💳 Pagos', action: 'pagos' },
      { text: '📞 Soporte', action: 'soporte' },
      { text: '📞 Contacto', action: 'contacto' }
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
    addMessage("¡Hola! Soy tu asistente virtual. Puedo ayudarte a encontrar comercios, horarios, ubicaciones o formas de pago. Escribe algo como 'negocios', 'horarios', 'ubicación' o 'ayuda' para empezar.", 'bot');
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
        console.error('Límite de reintentos para messageInput.');
        return;
      }
    }
    
    window.chatbotInitAttempts = 0;
    window.chatbotInitialized = true;
    
    cargarNegocios();
    
    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (messageInput) {
      messageInput.addEventListener('keydown', handleKeyPress);
      messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
    }
    if (closeChat) closeChat.addEventListener('click', () => chatContainer.classList.remove('active'));
    
    setTimeout(showWelcomeMessage, 500);
  }

  window.chatbotInitAttempts = 0;
  window.sendQuickReply = sendQuickReply;
  setTimeout(initChatbot, 500);
});