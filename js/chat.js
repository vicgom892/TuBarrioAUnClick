// chat.js - Asistente Virtual para "Tu Barrio A Un Clik"
document.addEventListener('DOMContentLoaded', function() {
  // Datos de comercios y ofertas
  let negociosData = [];
  let ofertasData = [];

  // Control de voz
  let voiceEnabled = true; // Por defecto, el audio está activado

  // Función para normalizar texto (sin tildes, mayúsculas, espacios extra)
  function normalizeString(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  // === CARGA DE NEGOCIOS ===
  async function cargarNegocios() {
    try {
      if (window.businesses && Array.isArray(window.businesses) && window.businesses.length > 0) {
        negociosData = window.businesses;
        console.log(`✅ Chatbot usando ${negociosData.length} negocios desde window.businesses`);
        return;
      }

      const CACHE_KEY = 'businesses_cache_v5';
      const cachedData = localStorage.getItem(CACHE_KEY);

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          negociosData = Array.isArray(parsed) ? parsed : parsed.data;
          console.log(`✅ Chatbot usando ${negociosData.length} negocios desde caché`);
          return;
        } catch (e) {
          console.warn('Caché dañado, cargando desde JSON...');
          localStorage.removeItem(CACHE_KEY);
        }
      }

      const response = await fetch('data/negocios.json');
      if (!response.ok) throw new Error('Error al cargar negocios.json');
      negociosData = await response.json();

      localStorage.setItem(CACHE_KEY, JSON.stringify({
         negociosData,
        timestamp: Date.now()
      }));

      console.log(`✅ Chatbot usando ${negociosData.length} negocios desde JSON`);
    } catch (error) {
      console.error('Error al cargar los negocios:', error);
      addMessage('No pude cargar los comercios. Escribe "ayuda" para saber qué puedo hacer.', 'bot');
    }
  }

  // === CARGA DE OFERTAS ===
  async function cargarOfertas() {
    try {
      const CACHE_KEY = 'ofertas_cache_v2';
      const cachedData = localStorage.getItem(CACHE_KEY);

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          ofertasData = Array.isArray(parsed) ? parsed : parsed.data;
          console.log(`✅ Ofertas cargadas desde caché: ${ofertasData.length}`);
          return;
        } catch (e) {
          console.warn('Caché de ofertas dañado, recargando...');
          localStorage.removeItem(CACHE_KEY);
        }
      }

      const response = await fetch('datos/seccion-ofertas.json');
      if (!response.ok) throw new Error('Error al cargar seccion-ofertas.json');
      const rawData = await response.json();

      ofertasData = rawData.map(oferta => ({
        id: oferta.id || Date.now() + Math.random(),
        nombre: oferta.title,
        categoria: oferta.rubro,
        descuento: "Ver detalle",
        detalle: oferta.description,
        imagen: oferta.image,
        web: (oferta.web_url || '').trim().replace(/\s+/g, '') || null,
        instagram: (oferta.instagram_url || '').trim().replace(/\s+/g, '') || null,
        ofertaLimitada: true,
        fechaInicio: oferta.start_date,
        fechaFin: oferta.end_date
      }));

      localStorage.setItem(CACHE_KEY, JSON.stringify({
         ofertasData,
        timestamp: Date.now()
      }));

      console.log(`✅ Ofertas transformadas: ${ofertasData.length}`);
    } catch (error) {
      console.error('Error al cargar ofertas:', error);
      addMessage('No pude cargar las ofertas. Intenta más tarde.', 'bot');
    }
  }

  // === ELEMENTOS DEL DOM ===
  const chatbotBtn = document.getElementById('chatbotBtn');
  const chatContainer = document.getElementById('chatContainer');
  const closeChat = document.getElementById('closeChat');
  const chatBody = document.getElementById('chatBody');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const micBtn = document.getElementById('micBtn'); // Botón de micrófono
  const voiceToggleBtn = document.getElementById('voiceToggleBtn'); // Botón de audio ON/OFF

  // === FORMATO DE MENSAJES ===
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

  // === HORA ACTUAL ===
  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // === AGREGAR MENSAJE AL CHAT ===
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

      // Habla la respuesta después de mostrarla
      setTimeout(() => {
        speakText(text);
      }, 1000);
    }
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    chatBody.appendChild(messageDiv);
    
    if (sender === 'user') {
      const quickReplies = document.querySelector('.quick-replies');
      if (quickReplies) quickReplies.remove();
    }
    
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // === INDICADOR DE ESCRITURA ===
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

  function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }

  // === ÍCONOS DE CATEGORÍA ===
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
      'Mates': '🧋',
      'Florería': '🌹',
      'Carnicería': '🥩'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (normalizeString(category).includes(normalizeString(key))) {
        return icon;
      }
    }
    
    return '🏪';
  }

  // === ¿ESTÁ ABIERTO? ===
  function isBusinessOpen(hoursString) {
    if (typeof window.isBusinessOpen === 'function') return window.isBusinessOpen(hoursString);
    return true;
  }

  // === TARJETAS DE NEGOCIOS ===
  function createBusinessCard(negocio, index) {
    const isOpen = isBusinessOpen(negocio.hours);
    const statusClass = isOpen ? 'status-open' : 'status-closed';
    const statusText = isOpen ? 'Abierto ahora' : 'Cerrado';
    const statusIcon = isOpen ? '🟢' : '🔴';
    const categoryIcon = getBusinessCategoryIcon(negocio.category);

    // URLs
    const mapUrl = `https://www.google.com/maps?q=${negocio.latitude},${negocio.longitude}`;
    const webUrl = negocio.url || '#';
    const whatsappUrl = negocio.whatsapp ? `https://wa.me/${negocio.whatsapp}` : null;
    const phoneUrl = negocio.telefono ? `tel:+${negocio.telefono}` : null;

    // Horarios formateados
    const hoursFormatted = negocio.hours
      .replace(/Mon/g, 'Lunes')
      .replace(/Tue/g, 'Martes')
      .replace(/Wed/g, 'Miércoles')
      .replace(/Thu/g, 'Jueves')
      .replace(/Fri/g, 'Viernes')
      .replace(/Sat/g, 'Sábado')
      .replace(/Sun/g, 'Domingo');

    const card = document.createElement('div');
    card.className = 'business-card';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-bottom: 1px solid #e2e8f0; border-radius: 12px 12px 0 0;">
        <div style="font-size: 1.8rem;">${categoryIcon}</div>
        <div>
          <div style="font-weight: 600; color: #1a202c; font-size: 1.1rem;">${negocio.name}</div>
          <div style="font-size: 0.85rem; color: #ff6a3c; font-weight: 600; text-transform: uppercase; background: #fff4eb; padding: 2px 8px; border-radius: 20px; display: inline-block;">
            ${negocio.category}
          </div>
        </div>
      </div>

      <div style="padding: 12px;">
        <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0; font-size: 0.9rem; color: #4a5568;">
          <i class="fas fa-clock" style="color: #ff6a3c;"></i>
          <span>${hoursFormatted}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0; font-size: 0.9rem; color: #4a5568;">
          <i class="fas fa-map-marker-alt" style="color: #ff6a3c;"></i>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${negocio.address}</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; margin: 12px 0;">
          <a href="${webUrl}" target="_blank" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 0.85rem; background: #4285F4; color: white; border: 1px solid #3367D6; transition: all 0.2s;">
            <i class="fas fa-globe"></i>
            <span>Sitio Web</span>
          </a>

          <a href="${mapUrl}" target="_blank" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 0.85rem; background: #EB6420; color: white; border: 1px solid #CC581A; transition: all 0.2s;">
            <i class="fas fa-map-marker-alt"></i>
            <span>Google Maps</span>
          </a>

          ${whatsappUrl ? `
          <a href="${whatsappUrl}" target="_blank" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 0.85rem; background: #25D366; color: white; border: 1px solid #1DAD5C; transition: all 0.2s;">
            <i class="fab fa-whatsapp"></i>
            <span>WhatsApp</span>
          </a>` : ''}

          ${phoneUrl ? `
          <a href="${phoneUrl}" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 0.85rem; background: #008CBA; color: white; border: 1px solid #007095; transition: all 0.2s;">
            <i class="fas fa-phone-alt"></i>
            <span>Llamar</span>
          </a>` : ''}
        </div>

        <div style="text-align: center; font-size: 0.85rem; color: ${isOpen ? '#10B981' : '#EF4444'}; font-weight: 600; margin-top: 6px;">
          ${statusIcon} ${statusText}
        </div>
      </div>
    `;

    return card;
  }

  // === MOSTRAR TODOS LOS NEGOCIOS ===
  function formatTodosNegociosResponse() {
    if (!negociosData || negociosData.length === 0) {
      return 'No hay comercios disponibles ahora. Escribe "ayuda" para saber qué puedo hacer.';
    }

    const categorias = {};
    negociosData.forEach(n => {
      if (!categorias[n.category]) categorias[n.category] = [];
      categorias[n.category].push(n);
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

      negocios.forEach(negocio => {
        const card = createBusinessCard(negocio, index++);
        chatBody.appendChild(card);
      });
    }

    const openCount = negociosData.filter(n => isBusinessOpen(n.hours)).length;
    return `Mostrando ${negociosData.length} comercios: ${openCount} abiertos. Cada tarjeta incluye contacto directo.`;
  }

  // === RESPUESTAS A HORARIOS ===
  function formatHorariosResponse() {
    if (!negociosData || negociosData.length === 0) {
      return 'No pude cargar los horarios. Intenta más tarde.';
    }

    addMessage('Te muestro los horarios de todos los comercios:', 'bot');

    const categorias = {};
    negociosData.forEach(n => {
      if (!categorias[n.category]) categorias[n.category] = [];
      categorias[n.category].push(n);
    });

    for (const [categoria, negocios] of Object.entries(categorias)) {
      const header = document.createElement('div');
      header.className = 'business-category-header';
      header.innerHTML = `
        <h5 style="margin: 16px 0 8px 0; color: #ff6a3c; font-size: 14px; font-weight: 600;">
          🕒 ${categoria} (${negocios.length})
        </h5>
      `;
      chatBody.appendChild(header);

      negocios.forEach(negocio => {
        const hoursFormatted = negocio.hours
          .replace(/Mon/g, 'Lunes')
          .replace(/Tue/g, 'Martes')
          .replace(/Wed/g, 'Miércoles')
          .replace(/Thu/g, 'Jueves')
          .replace(/Fri/g, 'Viernes')
          .replace(/Sat/g, 'Sábado')
          .replace(/Sun/g, 'Domingo');

        const item = document.createElement('div');
        item.className = 'business-item';
        item.innerHTML = `
          <div style="padding: 10px; background: #f8f9fa; margin: 4px 0; border-radius: 8px;">
            <strong>${negocio.name}</strong><br>
            <small style="color: #666;">${hoursFormatted}</small>
          </div>
        `;
        chatBody.appendChild(item);
      });
    }

    return `Mostrando horarios de ${negociosData.length} comercios. ¿Buscás uno en particular?`;
  }

  // === RESPUESTAS A UBICACIONES ===
  function formatUbicacionesResponse() {
    if (!negociosData || negociosData.length === 0) {
      return 'No pude cargar las ubicaciones. Intenta más tarde.';
    }

    addMessage('Aquí tenés todos los comercios con sus ubicaciones:', 'bot');

    const categorias = {};
    negociosData.forEach(n => {
      if (!categorias[n.category]) categorias[n.category] = [];
      categorias[n.category].push(n);
    });

    for (const [categoria, negocios] of Object.entries(categorias)) {
      const header = document.createElement('div');
      header.className = 'business-category-header';
      header.innerHTML = `
        <h5 style="margin: 16px 0 8px 0; color: #4285F4; font-size: 14px; font-weight: 600;">
          📍 ${categoria} (${negocios.length})
        </h5>
      `;
      chatBody.appendChild(header);

      negocios.forEach(negocio => {
        const mapUrl = `https://www.google.com/maps?q=${negocio.latitude},${negocio.longitude}`;

        const item = document.createElement('div');
        item.className = 'business-item';
        item.innerHTML = `
          <div style="padding: 10px; background: #f8f9fa; margin: 4px 0; border-radius: 8px;">
            <strong>${negocio.name}</strong><br>
            <small style="color: #666;">${negocio.address}</small><br>
            <a href="${mapUrl}" target="_blank" style="color: #128C7E; text-decoration: underline; font-size: 0.9rem;">Ver en Google Maps</a>
          </div>
        `;
        chatBody.appendChild(item);
      });
    }

    return `Mostrando ubicaciones de ${negociosData.length} comercios. ¿Necesitás ayuda con alguno?`;
  }

  // === RESPUESTAS A OFERTAS ===
  function formatOfertasResponse() {
    if (!ofertasData || ofertasData.length === 0) {
      return 'No hay ofertas disponibles ahora. Escribe "negocios" para ver comercios o "ayuda" para más opciones.';
    }

    const header = document.createElement('div');
    header.className = 'business-category-header';
    header.innerHTML = `
      <h5 style="margin: 16px 0 8px 0; color: #ff6a3c; font-size: 14px; font-weight: 600;">
        🎁 Ofertas Activas (${ofertasData.length})
      </h5>
    `;
    chatBody.appendChild(header);

    ofertasData.forEach((oferta, index) => {
      const card = createOfferCard(oferta, index);
      chatBody.appendChild(card);
    });

    setTimeout(startOfferCountdowns, 100);
    return `Mostrando ${ofertasData.length} oferta(s) activa(s). ¿Buscás algo en particular?`;
  }

  // === TARJETAS DE OFERTAS ===
  function createOfferCard(oferta, index) {
    const isOpen = oferta.ofertaLimitada;
    const statusText = isOpen ? 'Válida hasta' : 'Promoción permanente';
    const statusIcon = isOpen ? '🔥' : '💡';

    let countdownHTML = '';
    if (isOpen) {
      countdownHTML = `<div class="countdown" data-end="${oferta.fechaFin}">Cargando...</div>`;
    }

    const card = document.createElement('div');
    card.className = 'business-card offer-card';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <div class="business-name">
        🎁 ${oferta.nombre}
      </div>
      <div class="business-category">${oferta.categoria}</div>
      <div class="business-info">${oferta.detalle}</div>
      <div class="btns-offer">
        ${oferta.web ? `<a href="${oferta.web}" target="_blank" class="btn-offer btn-web"><i class="fas fa-globe"></i> Web</a>` : ''}
        ${oferta.instagram ? `<a href="${oferta.instagram}" target="_blank" class="btn-offer btn-ig"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
      </div>
      <div class="countdown-container">
        ${statusIcon} <small>${statusText}</small><br>
        ${countdownHTML}
      </div>
    `;

    return card;
  }

  // === CONTADOR DE OFERTAS ===
  function startOfferCountdowns() {
    document.querySelectorAll('.countdown').forEach(el => {
      const endDate = new Date(el.getAttribute('data-end')).getTime();
      const update = () => {
        const now = new Date().getTime();
        const diff = endDate - now;
        if (diff <= 0) {
          el.innerHTML = '<span style="color: #dc2626; font-weight:700">Oferta finalizada</span>';
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const timeStr = days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
        el.innerHTML = `<span style="color:#e65100">${timeStr}</span>`;
      };
      update();
      setInterval(update, 1000);
    });
  }

  // === GENERAR RESPUESTA INTELIGENTE ===
  function generateResponse(query) {
    query = normalizeString(query);

    // Buscar comercio por nombre
    const negocioMatch = negociosData.find(n => 
      normalizeString(n.name).includes(normalizeString(query))
    );

    if (negocioMatch) {
      addMessage(`Mostrando información de *${negocioMatch.name}*`, 'user');
      const card = createBusinessCard(negocioMatch, 0);
      chatBody.appendChild(card);
      return "Aquí tenés toda la información del comercio. ¿Necesitás algo más?";
    }

    const tieneOferta = /oferta|promoción|descuento|2x1|50%|gratis|ofert/i.test(query);
    const tieneNegocio = /negocio|comercio|tienda|local|barrio|castelar/i.test(query);
    const tieneHorario = /hora|horario|abre|cierra|abierto|cerrado|funciona/i.test(query);
    const tieneUbicacion = /ubicaci[oó]n|direcci[oó]n|d[oó]nde|lugar|mapa|ubicad[o]*|posici[oó]n|geolocalizaci[oó]n|coordenadas/i.test(query);
    const tienePago = /pago|dinero|efectivo|tarjeta|mercadopago|digital|billetera/i.test(query);
    const saludo = /hola|buen[oa]|saludos|che/i.test(query);
    const despedida = /chau|adios|gracias|grac|dale|genial|perfecto/i.test(query);

    if (saludo) {
      return "¡Hola! 👋 Soy el asistente de *Tu Barrio A Un Clik*. ¿En qué puedo ayudarte? Podés preguntarme por *comercios*, *ofertas*, *horarios* o *ubicaciones*.";
    }

    if (despedida) {
      return "¡Gracias por escribir! Si necesitás ayuda después, volvé a abrir el chat. ¡Que tengas un buen día! 🌞";
    }

    if (tieneOferta) {
      return formatOfertasResponse();
    }

    if (tieneNegocio && tieneHorario) {
      return formatHorariosResponse();
    }

    if (tieneNegocio && tieneUbicacion) {
      return formatUbicacionesResponse();
    }

    if (tieneNegocio) {
      return formatTodosNegociosResponse();
    }

    if (tieneHorario) {
      return formatHorariosResponse();
    }

    if (tieneUbicacion) {
      return formatUbicacionesResponse();
    }

    if (tienePago) {
      return "La mayoría de los comercios aceptan efectivo, tarjeta (débito y crédito) y billeteras digitales como Mercado Pago. ¿Querés saber si un local en particular acepta algo específico?";
    }

    return "No entendí del todo, pero estoy para ayudarte 😊\n\nProbá con:\n\n- *¿Qué ofertas hay hoy?*\n- *¿Qué panaderías hay cerca?*\n- *¿A qué hora cierra la farmacia?*\n- *Mostrar kioscos*";
  }

  // === ENVÍO DE MENSAJES ===
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

  function sendQuickReply(text) {
    messageInput.value = text;
    handleSendMessage();
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  // === ABRIR WHATSAPP ===
  window.openWhatsApp = function() {
    const whatsappNumber = '5491157194796';
    const message = `*Solicitud de Soporte*\n\n*Mensaje:* Hola, necesito ayuda.\n*Desde:* Tu Barrio A Un Clik\n*Fecha:* ${new Date().toLocaleDateString('es-AR')}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      window.open(whatsappUrl, isMobile ? '_self' : '_blank');
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      addMessage('No pude abrir WhatsApp. Escribe "soporte" para intentarlo de nuevo.', 'bot');
    }
  };

  // === MODAL DE CONFIRMACIÓN ===
  const confirmModal = document.getElementById('confirmModal');
  const confirmSendBtn = document.getElementById('confirmSendBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  if (confirmSendBtn) {
    confirmSendBtn.addEventListener('click', function() {
      const nombre = document.getElementById('nombreInput').value.trim();
      const tipo = document.getElementById('tipoMensaje').value;
      const mensaje = document.getElementById('mensajeInput').value.trim();

      if (!nombre || !mensaje) {
        addMessage("Por favor, completa todos los campos.", "bot");
        return;
      }

      const textoWhatsApp = `*Mensaje desde Tu Barrio A Un Clik*\n\n*Nombre:* ${nombre}\n*Tipo:* ${tipo}\n*Mensaje:* ${mensaje}`;
      const url = `https://wa.me/5491157194796?text=${encodeURIComponent(textoWhatsApp)}`;

      window.open(url, '_blank');
      confirmModal.style.display = 'none';
      addMessage("✅ ¡Tu mensaje fue enviado! Pronto nos pondremos en contacto.", "bot");
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      confirmModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      confirmModal.style.display = 'none';
    }
  });

  // === CONTROL DE VOZ (ON/OFF) ===
  if (voiceToggleBtn) {
    function updateVoiceButton() {
      voiceToggleBtn.innerHTML = voiceEnabled 
        ? '<i class="fas fa-volume-up"></i>' 
        : '<i class="fas fa-volume-mute"></i>';
      voiceToggleBtn.classList.toggle('muted', !voiceEnabled);
    }

    voiceToggleBtn.addEventListener('click', () => {
      voiceEnabled = !voiceEnabled;
      updateVoiceButton();
      
      if (voiceEnabled) {
        addMessage('✅ Voz activada. Escucharás las respuestas.', 'bot');
      } else {
        addMessage('🔇 Voz desactivada. Puedes volver a activarla con el botón.', 'bot');
      }
    });

    updateVoiceButton(); // Inicializar estado visual
  }

  // === RECONOCIMIENTO DE VOZ (MICRÓFONO) ===
  let recognition;
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      messageInput.value = transcript;
      handleSendMessage();
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        addMessage('Permiso de micrófono denegado. Activalo en la configuración del navegador.', 'bot');
      } else {
        console.error('Error en reconocimiento de voz:', event.error);
      }
    };

    recognition.onend = () => {
      micBtn?.classList.remove('recording');
    };

    micBtn?.addEventListener('click', () => {
      if (micBtn.classList.contains('recording')) {
        recognition.stop();
        micBtn.classList.remove('recording');
      } else {
        recognition.start();
        micBtn.classList.add('recording');
        addMessage('Escuchando...', 'bot');
      }
    });
  } else {
    console.warn('Tu navegador no soporta reconocimiento de voz.');
    if (micBtn) micBtn.remove();
    if (voiceToggleBtn) voiceToggleBtn.remove();
  }

  // === SÍNTESIS DE VOZ (EL CHATBOT HABLA) ===
  function speakText(text) {
    if (!window.speechSynthesis || !voiceEnabled) return;
    window.speechSynthesis.cancel();

    // Limpieza profunda del texto para que suene natural
    let cleanText = text
      .replace(/<[^>]*>/g, '')                    // Quitar etiquetas HTML
      .replace(/\*[^*]*\*/g, '')                  // Quitar negritas Markdown
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Quitar emojis complejos
      .replace(/[.,;:!?()"\[\]{}'’“”‘’]/g, '')    // Quitar signos de puntuación
      .replace(/[-–—_]/g, ' ')                    // Reemplazar guiones por espacios
      .replace(/\s+/g, ' ')                       // Reducir múltiples espacios
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-AR';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang === 'es-AR' && (v.name.includes('Google') || v.name.includes('Sara'))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  // === MENSAJE DE BIENVENIDA ===
  function showWelcomeMessage() {
    addMessage("¡Hola! Soy tu asistente virtual. Puedo ayudarte a encontrar comercios, horarios, ubicaciones o formas de pago. Escribe algo como 'negocios', 'horarios', 'ubicación' o 'ayuda' para empezar.", 'bot');
  }

  // === INICIALIZACIÓN ===
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
    cargarOfertas();

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

  // === EVENT LISTENERS ===
  if (chatbotBtn) {
    chatbotBtn.addEventListener('click', () => {
      chatContainer.classList.add('active');
      if (negociosData.length === 0) cargarNegocios();
      if (ofertasData.length === 0) cargarOfertas();
    });
  }

  window.chatbotInitAttempts = 0;
  window.sendQuickReply = sendQuickReply;
  setTimeout(initChatbot, 500);
});