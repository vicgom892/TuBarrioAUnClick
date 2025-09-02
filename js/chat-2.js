// chat.js - Asistente virtual mejorado con voz, robustez y correcciones
document.addEventListener('DOMContentLoaded', function () {
  // Array para almacenar los datos de negocios
  let negociosData = [];

  // Función para cargar los negocios desde el archivo JSON o window.businesses
  async function cargarNegocios() {
    try {
      // Usar los negocios ya cargados en main.js
      if (window.businesses && Array.isArray(window.businesses) && window.businesses.length > 0) {
        negociosData = window.businesses;
        console.log(`✅ Chatbot usando ${negociosData.length} negocios de window.businesses`);
        return;
      }

      // Intentar cargar desde caché
      const CACHE_KEY = 'businesses_cache_v4';
      const cachedData = localStorage.getItem(CACHE_KEY);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed && Array.isArray(parsed.businesses)) {
          negociosData = parsed.businesses;
          console.log(`✅ Chatbot usando ${negociosData.length} negocios desde caché`);
          return;
        }
      }

      // Si no hay datos, mostrar advertencia
      addMessage('No se encontraron negocios disponibles.', 'bot');
    } catch (error) {
      console.error('Error al cargar los negocios:', error);
      addMessage('No pude cargar los datos de los negocios. Por favor, intenta más tarde.', 'bot');
    }
  }

  // Normalizar texto para búsquedas
  function normalizeText(text) {
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, '');
  }

  // Respuestas predefinidas para preguntas frecuentes (con trato de "vos")
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
    "ubicación": "Nuestros negocios están ubicados en diferentes puntos de la ciudad. ¿Te interesa alguno en particular?",
    "direccion": "¿Te refieres a la dirección de algún negocio específico?",
    "telefono": "Podés contactar a los negocios directamente por teléfono.",
    "contacto": "Podés contactar a los negocios por teléfono o WhatsApp.",
    "información": "Estoy aquí para darte toda la información que necesitas.",
    "info": "¿Qué información necesitas? Puedo ayudarte con negocios, horarios, pagos, etc."
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

  // Estado de voz
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

  // Función para verificar si un negocio está abierto
  function isBusinessOpen(hoursString) {
    if (typeof window.isBusinessOpen === 'function') {
      return window.isBusinessOpen(hoursString);
    }
    return true;
  }

  // Función para generar respuestas más robustas
  function generateResponse(query) {
    query = normalizeText(query);

    // Detectar intención de buscar por categoría
    const categoriaKeywords = {
      panaderia: /panaderias?|pan/,
      pastas: /pastas?|fábrica de pastas/,
      verduleria: /verdulerias?|verduras?|frutas?/,
      fiambreria: /fiambrerias?|fiambres?/,
      kiosco: /kiosco|kioskos?/,
      mascotas: /mascotas?|pet shop|veterinaria/,
      barberia: /barberias?|corte de pelo/,
      ferreteria: /ferreterias?|herramientas?/,
      ropa: /ropa|tienda|moda/,
      servicios: /profesion|profesional|abogado|médico|dentista/,
      taller: /taller|gomería|mecánico/,
      farmacia: /farmacia|droguería/,
      cafetería: /cafeterias?|café/,
      librería: /librerias?|libro/,
      mates: /mates?|yerba/,
      florería: /florerias?|flores?/
    };

    // Detectar si pregunta por "abiertos"
    const estaAbierto = query.includes('abierto') || query.includes('abierta') || query.includes('abren') || query.includes('horario');

    for (const [categoria, regex] of Object.entries(categoriaKeywords)) {
      if (regex.test(query)) {
        const categoriaDisplay = {
          panaderia: 'Panadería',
          pastas: 'Fábrica de Pastas',
          verduleria: 'Verdulería',
          fiambreria: 'Fiambrería',
          kiosco: 'Kiosco',
          mascotas: 'Mascotas',
          barberia: 'Barbería',
          ferreteria: 'Ferretería',
          ropa: 'Ropa',
          servicios: 'Profesiones',
          taller: 'Taller Mecánico',
          farmacia: 'Farmacia',
          cafetería: 'Cafetería',
          librería: 'Librería',
          mates: 'Mates',
          florería: 'Florería'
        }[categoria];

        const nombre = {
          panaderia: 'panaderías',
          pastas: 'fábricas de pastas',
          verduleria: 'verdulerías',
          fiambreria: 'fiambrerías',
          kiosco: 'kioscos',
          mascotas: 'pet shops',
          barberia: 'barberías',
          ferreteria: 'ferreterías',
          ropa: 'tiendas',
          servicios: 'profesionales',
          taller: 'talleres',
          farmacia: 'farmacias',
          cafetería: 'cafeterías',
          librería: 'librerías',
          mates: 'lugares de mate',
          florería: 'florerías'
        }[categoria];

        const negociosFiltrados = negociosData.filter(n => n.rubro === categoriaDisplay);
        if (negociosFiltrados.length === 0) {
          return `No tengo registradas ${nombre} en este momento. ¿Te interesa otra categoría?`;
        }

        const negocios = estaAbierto 
          ? negociosFiltrados.filter(n => isBusinessOpen(n.horarioData))
          : negociosFiltrados;

        const header = document.createElement('div');
        header.className = 'business-category-header';
        header.innerHTML = `
          <h5 style="margin: 16px 0 8px 0; color: #128C7E; font-size: 14px; font-weight: 600;">
            ${getBusinessCategoryIcon(categoriaDisplay)} ${categoriaDisplay} (${negocios.length})
          </h5>
        `;
        chatBody.appendChild(header);

        negocios.forEach((negocio, i) => {
          const card = createBusinessCard(negocio, i);
          chatBody.appendChild(card);
        });

        const openCount = negocios.filter(n => isBusinessOpen(n.horarioData)).length;
        const closedCount = negocios.length - openCount;
        return `<p>Mostrando ${negocios.length} ${nombre}: ${openCount} abiertos, ${closedCount} cerrados.</p>`;
      }
    }

    // Respuestas generales
    for (const [key, response] of Object.entries(faqResponses)) {
      if (query.includes(key)) {
        if (key === 'soporte' || key === 'whatsapp' || key === 'wsp') {
          return "Para soporte inmediato, podés contactarme por WhatsApp: [Contactar por WhatsApp](https://wa.me/5491157194796)";
        }
        return response;
      }
    }

    return "No entendí tu consulta. Podés preguntarme por negocios, horarios, pagos o pedir ayuda.";
  }

  // Función para que el chatbot hable (voz en español)
  function speakText(text) {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Buscar voz en español
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => 
      v.lang.includes('es') || 
      v.name.toLowerCase().includes('spanish') ||
      v.name.toLowerCase().includes('españa') ||
      v.name.toLowerCase().includes('latino')
    );

    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.rate = 0.9;  // Velocidad normal
    utterance.pitch = 1;   // Tono natural
    utterance.volume = 1;  // Volumen máximo

    window.speechSynthesis.speak(utterance);
  }

  // Función para manejar el envío de mensajes
  window.handleKeyPress = function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

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
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim();

      if (textToSpeak) {
        speakText(textToSpeak);
      }
    }, 1500);
  }

  // Función para enviar una respuesta rápida
  window.sendQuickReply = function (text) {
    messageInput.value = text;
    handleSendMessage();
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

      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        stopListening();
        handleSendMessage();
      };

      recognition.onerror = function (event) {
        console.error('Error en el reconocimiento de voz:', event.error);
        if (event.error === 'not-allowed') {
          addMessage('Permiso de micrófono denegado. Por favor, habilita el micrófono en la configuración de tu navegador.', 'bot');
        }
        stopListening();
      };

      recognition.onend = function () {
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

  // Función para abrir WhatsApp (CORREGIDA - sin espacios)
  window.openWhatsApp = function () {
    const whatsappNumber = '5491157194796';
    const message = `Hola, necesito ayuda con la aplicación. Enviado desde Tu Barrio A Un Clic`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    console.log('Abriendo WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
  };

  // Event Listeners
  if (chatbotBtn) {
    chatbotBtn.addEventListener('click', function () {
      chatContainer.classList.add('active');
      if (negociosData.length === 0) {
        cargarNegocios();
      }
    });
  }

  if (closeChat) {
    closeChat.addEventListener('click', function () {
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
    messageInput.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  }

  if (grantPermission) {
    grantPermission.addEventListener('click', function () {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
          micPermissionGranted = true;
          permissionModal.classList.remove('active');
          startListening();
        })
        .catch(function (err) {
          console.error('Error al acceder al micrófono:', err);
          permissionModal.classList.remove('active');
          addMessage('No se pudo acceder al micrófono. Por favor, verifica los permisos en tu navegador.', 'bot');
        });
    });
  }

  if (denyPermission) {
    denyPermission.addEventListener('click', function () {
      permissionModal.classList.remove('active');
      addMessage('Podés usar la función de texto para interactuar con el chatbot.', 'bot');
    });
  }

  if (permissionModal) {
    permissionModal.addEventListener('click', function (e) {
      if (e.target === permissionModal) {
        permissionModal.classList.remove('active');
      }
    });
  }

  document.addEventListener('click', function (e) {
    if (window.innerWidth <= 768) {
      if (!chatContainer.contains(e.target) && e.target !== chatbotBtn && !chatbotBtn.contains(e.target) && chatContainer.classList.contains('active')) {
        chatContainer.classList.remove('active');
      }
    }
  });

  window.addEventListener('resize', function () {
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
    if (window.chatbotInitialized) {
      return;
    }

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

    window.chatbotInitAttempts = 0;
    window.chatbotInitialized = true;

    cargarNegocios();

    if (sendBtn) {
      sendBtn.addEventListener('click', handleSendMessage);
    }

    if (voiceBtn) {
      voiceBtn.addEventListener('click', requestMicPermission);
    }

    if (messageInput) {
      messageInput.addEventListener('keydown', handleKeyPress);
      messageInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
    }

    if (closeChat) {
      closeChat.addEventListener('click', function () {
        chatContainer.classList.remove('active');
      });
    }

    setTimeout(showWelcomeMessage, 500);
  }

  // Inicializar voces para síntesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function () {
      console.log('Voces cargadas para síntesis de voz');
    };
  }

  window.chatbotInitAttempts = 0;
  setTimeout(initChatbot, 500);
});