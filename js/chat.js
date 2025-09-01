// chat.js - Asistente virtual mejorado
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
        const { data } = JSON.parse(cachedData);
        negociosData = data;
        console.log(`✅ Chatbot usando ${negociosData.length} negocios desde caché`);
        return;
      }
      
      // Si no hay datos, intentar cargar desde JSON
      const response = await fetch('data/negocios.json');
      if (!response.ok) throw new Error('Error al cargar negocios.json');
      negociosData = await response.json();
      console.log(`✅ Chatbot usando ${negociosData.length} negocios desde JSON`);
    } catch (error) {
      console.error('Error al cargar los negocios:', error);
      addMessage('Lo siento, no pude cargar los datos de los negocios. Por favor, intenta de nuevo más tarde.', 'bot');
    }
  }

  // Respuestas predefinidas para preguntas frecuentes
  const faqResponses = {
    "hola": "¡Hola! Bienvenido. ¿En qué puedo ayudarte?",
    "buenos dias": "¡Buenos días! ¿Cómo puedo ayudarte hoy?",
    "buenas tardes": "¡Buenas tardes! ¿En qué necesitas ayuda?",
    "buenas noches": "¡Buenas noches! Estoy aquí para ayudarte.",
    "gracias": "¡De nada! Estoy aquí para ayudarte.",
    "adios": "¡Hasta luego! Que tengas un excelente día.",
    "chao": "¡Hasta pronto! Cualquier duda, aquí estoy.",
    "ayuda": "Puedo ayudarte con información sobre negocios, horarios, medios de pago, soporte y más. ¿Qué necesitas?",
    "negocios": "Aquí tienes algunos negocios cercanos:",
    "negocio": "Aquí tienes algunos negocios cercanos:",
    "comercios": "Aquí tienes algunos negocios cercanos:",
    "comercio": "Aquí tienes algunos negocios cercanos:",
    "abiertos": "Te muestro los negocios que están abiertos ahora:",
    "distancia": "La distancia a los negocios es:",
    "horarios": "Los horarios de los negocios son:",
    "horario": "Aquí tienes los horarios de los negocios:",
    "soporte": "Para soporte inmediato, te redirigiré a WhatsApp.",
    "whatsapp": "Para contactar con soporte, haz clic aquí: [Contactar por WhatsApp](https://wa.me/5491157194796)",
    "wsp": "Para contactar con soporte, haz clic aquí: [Contactar por WhatsApp](https://wa.me/5491157194796)",
    "mensaje": "Puedes enviarme un mensaje o usar el micrófono para hablar.",
    "micrófono": "Haz clic en el micrófono para hablar conmigo.",
    "voz": "Pueden hablarme usando el micrófono.",
    "pagos": "Aceptamos efectivo, tarjetas de crédito y débito, transferencias y billeteras digitales.",
    "pago": "Aceptamos efectivo, tarjetas de crédito y débito, transferencias y billeteras digitales.",
    "tarjeta": "Aceptamos todas las tarjetas de crédito y débito.",
    "efectivo": "Sí, aceptamos efectivo.",
    "digital": "Aceptamos billeteras digitales como Mercado Pago, etc.",
    "ubicación": "Nuestros negocios están ubicados en diferentes puntos de la ciudad. ¿Te interesa alguno en particular?",
    "direccion": "¿Te refieres a la dirección de algún negocio específico?",
    "telefono": "Puedes contactar a los negocios directamente por teléfono.",
    "contacto": "Puedes contactar a los negocios por teléfono o WhatsApp.",
    "información": "Estoy aquí para darte toda la información que necesitas.",
    "info": "¿Qué información necesitas? Puedo ayudarte con negocios, horarios, pagos, etc."
  };

  // Elementos del DOM
  const chatbotBtn = document.getElementById('chatbotBtn');
  const chatContainer = document.getElementById('chatContainer');
  const closeChat = document.getElementById('closeChat');
  const chatBody = document.getElementById('chatBody');
  const messageInput = document.getElementById('messageInput'); // CORREGIDO: Ahora usa "messageInput"
  const sendBtn = document.getElementById('sendBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const permissionModal = document.getElementById('permissionModal');
  const grantPermission = document.getElementById('grantPermission');
  const denyPermission = document.getElementById('denyPermission');

  // Estado del micrófono
  let isListening = false;
  let recognition = null;
  let micPermissionGranted = false;

  // Función para formatear enlaces en los mensajes
  function formatMessageLinks(message) {
    // Primero, procesar enlaces en formato Markdown: [texto](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let processedMessage = message.replace(markdownLinkRegex, (match, text, url) => {
      // Limpiar la URL eliminando espacios
      const cleanUrl = url.trim().replace(/\s+/g, '');
      return `<a href="${cleanUrl}" target="_blank" class="chat-link">${text}</a>`;
    });
    
    // Luego, procesar URLs simples que no estén en formato Markdown
    const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,;:!?])/g;
    processedMessage = processedMessage.replace(urlRegex, url => {
      // Limpiar la URL eliminando espacios
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
    
    // Usar la función mejorada para formatear enlaces
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
      // 👇 NUEVOS ICONOS 👇
      'Farmacia': '💊',
      'Cafetería': '☕',
      'Taller Mecánico': '🔧',
      'Librería': '📚',
      'Mates': '📚',
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
      const categoriaOpen = negocios.some(n => isBusinessOpen(n.hours));
      
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
    
    // Contar cuántos están abiertos
    const openCount = negociosData.filter(n => isBusinessOpen(n.hours)).length;
    const closedCount = negociosData.length - openCount;
    
    return `<p>Mostrando ${negociosData.length} comercios en total: ${openCount} abiertos, ${closedCount} cerrados.</p>`;
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
       // 👇 EJEMPLO DE NUEVO RUBRO - AÑADE MÁS AQUÍ 👇
      "farmacias": "Farmacia",
      "cafeterias": "Cafetería",
      "talleres": "Taller Mecánico",
      "librerias": "Librería",
      "mates": "Mates",
      "florerias": "Florería"
    };
    
    const displayName = categoryMap[categoria] || categoria;
    
    const negociosFiltrados = negociosData.filter(negocio => 
      negocio.category.includes(displayName)
    );
    
    if (negociosFiltrados.length === 0) {
      return `No encontré ${displayName.toLowerCase()} en nuestra base de datos. ¿Te interesa otra categoría de negocio?`;
    }
    
    // Crear encabezado de categoría
    const header = document.createElement('div');
    header.className = 'business-category-header';
    header.innerHTML = `
      <h5 style="margin: 16px 0 8px 0; color: #128C7E; font-size: 14px; font-weight: 600;">
        ${getBusinessCategoryIcon(displayName)} ${displayName} (${negociosFiltrados.length})
      </h5>
    `;
    chatBody.appendChild(header);
    
    // Crear tarjetas individuales
    let index = 0;
    negociosFiltrados.forEach(negocio => {
      const card = createBusinessCard(negocio, index++);
      chatBody.appendChild(card);
    });
    
    // Contar cuántos están abiertos
    const openCount = negociosFiltrados.filter(n => isBusinessOpen(n.hours)).length;
    const closedCount = negociosFiltrados.length - openCount;
    
    return `<p>Mostrando ${negociosFiltrados.length} ${displayName.toLowerCase()} en total: ${openCount} abiertos, ${closedCount} cerrados.</p>`;
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
// === COPIA Y PEGA ESTO EN TU chat.js ===
// Usar la función global de main.js (que ya funciona)
function isBusinessOpen(hoursString) {
  // Si main.js ya exportó la función, usarla
  if (typeof window.isBusinessOpen === 'function') {
    return window.isBusinessOpen(hoursString);
  }
  
  // Fallback: si no está disponible, usar lógica simple
  if (!hoursString) return true;
  return true; // Asumir abierto si no hay función
}

// Elimina completamente la función checkSingleTimeRange del chat.js
// porque ya está definida en main.js
// === FIN DE LA MODIFICACIÓN ===

  // Función para generar respuestas
  function generateResponse(query) {
    query = query.toLowerCase();

    const categorias = [
      { regex: /supermercado|mercado|almacén|tienda/, categoria: 'supermercado' },
      { regex: /farmacia|droguería/, categoria: 'farmacia' },
      { regex: /panadería|pan/, categoria: 'panaderia' },
      { regex: /ropa|prendas|vestimenta/, categoria: 'ropa' },
      { regex: /restaurante|comida|resto/, categoria: 'restaurante' },
      { regex: /verdulería|verdura|fruta/, categoria: 'verduleria' },
      { regex: /fiambrería|fiambre/, categoria: 'fiambreria' },
      { regex: /kiosco|kiosko/, categoria: 'kiosco' },
      { regex: /mascotas|pet shop|veterinaria/, categoria: 'mascotas' },
      { regex: /barbería|barberia|corte de pelo/, categoria: 'barberia' },
      { regex: /ferretería|ferreteria|herramientas/, categoria: 'ferreteria' },
      { regex: /servicios|plomero|electricista|cerrajero/, categoria: 'servicios' },
      { regex: /farmacia|farmacéutica/, categoria: 'farmacias' },
      { regex: /cafetería|café|cafetal/, categoria: 'cafeterias' },
      { regex: /taller|automotor|gomería/, categoria: 'talleres' },
      { regex: /librería|papelería/, categoria: 'librerias' },
      { regex: /mates|mates/, categoria: 'mates' },
      { regex: /florería|floristería|flores/, categoria: 'florerias' }
    ];

    for (const { regex, categoria } of categorias) {
      if (regex.test(query)) {
        return formatNegociosPorCategoria(categoria);
      }
    }

    for (const [key, response] of Object.entries(faqResponses)) {
      if (query.includes(key)) {
        if (key === 'negocios' || key === 'negocio' || key === 'comercios' || key === 'comercio' || key === 'abiertos') {
          return formatTodosNegociosResponse();
        } else if (key === 'soporte' || key === 'whatsapp' || key === 'wsp') {
          return "Para soporte inmediato, puedes contactarme por WhatsApp: [Contactar por WhatsApp](https://wa.me/5491157194796)";
        } else if (key === 'horarios' || key === 'horario') {
          return formatHorariosResponse();
        } else if (key === 'distancia') {
          return formatDistanciaResponse();
        } else if (key === 'pagos' || key === 'pago' || key === 'tarjeta' || key === 'efectivo' || key === 'digital') {
          return "Aceptamos efectivo, tarjetas de crédito y débito, transferencias bancarias y billeteras digitales como Mercado Pago.";
        } else {
          return response;
        }
      }
    }

    return "No entiendo tu pregunta. Puedo ayudarte con información sobre negocios, horarios, pagos, soporte, etc. ¿Puedes reformular tu pregunta?";
  }

  // Función para manejar el envío de mensajes
  function handleSendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    addMessage(text, 'user');
    messageInput.value = '';
    
    // Ajustar altura del textarea
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

  // Función para abrir WhatsApp
  function openWhatsApp() {
    // Número de WhatsApp SIN ESPACIOS
    const whatsappNumber = '5491157194796';
    
    // Formatear mensaje
    const message = `*Solicitud de Soporte*\n\n` +
                   `*Mensaje:* Hola, necesito ayuda con la aplicación.\n` +
                   `*Registrado desde:* Tu Barrio A Un Clic\n` +
                   `*Fecha:* ${new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`;
    
    // Codificar mensaje y crear URL SIN ESPACIOS
    const encodedMessage = encodeURIComponent(message);
    let whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Corregir la URL eliminando espacios
    whatsappUrl = whatsappUrl.replace(/\s+/g, '');
    
    console.log('URL de WhatsApp para soporte:', whatsappUrl);
    
    // Intentar abrir WhatsApp
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      window.open(whatsappUrl, isMobile ? '_self' : '_blank');
    } catch (error) {
      console.error('Error al abrir WhatsApp para soporte:', error);
      alert(`Error al abrir WhatsApp: ${error.message}. Por favor, intenta nuevamente.`);
    }
  }

  // Event Listeners
  if (chatbotBtn) {
    chatbotBtn.addEventListener('click', function() {
      chatContainer.classList.add('active');
      // Cargar negocios si no están cargados
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
      addMessage('Puedes usar la función de texto para interactuar con el chatbot.', 'bot');
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
    // Verificar si el chatbot ya está inicializado
    if (window.chatbotInitialized) {
      return;
    }
    
    // Verificar si el elemento messageInput existe
    if (!document.getElementById('messageInput')) {
      if (window.chatbotInitAttempts < 10) {
        window.chatbotInitAttempts++;
        setTimeout(initChatbot, 300);
        return;
      } else {
        console.error('❌ Se alcanzó el límite de reintentos para messageInput. El chatbot funcionará con limitaciones.');
        return;
      }
    }
    
    // Inicializar variables
    window.chatbotInitAttempts = 0;
    window.chatbotInitialized = true;
    
    // Cargar negocios
    cargarNegocios();
    
    // Configurar el botón de envío
    if (sendBtn) {
      sendBtn.addEventListener('click', handleSendMessage);
    }
    
    // Configurar el botón de micrófono
    if (voiceBtn) {
      voiceBtn.addEventListener('click', requestMicPermission);
    }
    
    // Configurar el input de mensaje
    if (messageInput) {
      messageInput.addEventListener('keydown', handleKeyPress);
      messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
    }
    
    // Configurar el botón de cierre
    if (closeChat) {
      closeChat.addEventListener('click', function() {
        chatContainer.classList.remove('active');
      });
    }
    
    // Mostrar mensaje de bienvenida
    setTimeout(showWelcomeMessage, 500);
  }

  // Inicializar el chatbot después de un breve retraso
  window.chatbotInitAttempts = 0;
  
  // ¡CORREGIDO! Exportar sendQuickReply globalmente
  window.sendQuickReply = sendQuickReply;
  
  // Inicializar el chatbot
  setTimeout(initChatbot, 500);
});