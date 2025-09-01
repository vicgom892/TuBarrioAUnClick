document.addEventListener("DOMContentLoaded",function(){const n="businesses_cache_v4";let l=null;window.businesses=[];var e;window.userAccuracyCircle=window.userMarker=window.map=null;let o=window.mapInitialized=!1,a=!1,t=null,s,c=null;function i(){l?(l.prompt(),l.userChoice.then(e=>{var o;"accepted"===e.outcome?(console.log("✅ El usuario aceptó instalar la app"),e=document.getElementById("botonInstalar"),o=document.getElementById("botonInstalarMobile"),e&&(e.style.display="none"),o&&(o.style.display="none"),l=null):console.log("❌ El usuario rechazó la instalación")})):console.warn("❌ No hay evento deferredPrompt. La PWA no se puede instalar ahora.")}function d(o){if(!o)return!0;try{var e=o.trim().toLowerCase();if(e.includes("24 horas")||e.includes("24h"))return!0;if(e.includes("cerrado")||e.includes("cerrada"))return!1;if(o.includes(",")){for(const a of o.split(","))if(r(a.trim()))return!0;return!1}return r(o)}catch(e){return console.error("Error en isBusinessOpen:",e,"Horario:",o),!0}}function r(o){var a=new Date,t=a.toLocaleString("en-US",{timeZone:"America/Argentina/Buenos_Aires",weekday:"short"}).toLowerCase().slice(0,3),a=a.getHours()+a.getMinutes()/60,n={mon:1,tue:2,wed:3,thu:4,fri:5,sat:6,sun:0,lun:1,mar:2,mie:3,jue:4,vie:5,sab:6,dom:0},s=o.toLowerCase().match(/(mon|tue|wed|thu|fri|sat|sun|lun|mar|mie|jue|vie|sab|dom)-(mon|tue|wed|thu|fri|sat|sun|lun|mar|mie|jue|vie|sab|dom)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);if(s){var[,s,i,r,l]=s,s=n[s],i=n[i],[r,c]=r.split(":").map(Number),[l,d]=l.split(":").map(Number);if(isNaN(r)||isNaN(c)||isNaN(l)||isNaN(d))return console.warn("Horario inválido: "+o),!1;r=r+c/60,c=l+d/60,l=n[t];let e;return e=s<=i?s<=l&&l<=i:s<=l||l<=i,c<r?e&&(r<=a||a<=c):e&&r<=a&&a<=c}var e,m,u,p,d=o.toLowerCase().match(/^(mon|tue|wed|thu|fri|sat|sun|lun|mar|mie|jue|vie|sab|dom)\b/);return d?(s=d[0],l=o.replace(s,"").trim(),n[s]===n[t]&&!(!(i=l.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/))||([r,c]=[i[1],i[2]],[u,e]=r.split(":").map(Number),[m,p]=c.split(":").map(Number),isNaN(u))||isNaN(e)||isNaN(m)||isNaN(p))&&((d=m+p/60)<(s=u+e/60)?s<=a||a<=d:s<=a&&a<=d)):(n=o.toLowerCase().match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/))?([t,l]=[n[1],n[2]],[i,r]=t.split(":").map(Number),[c,m]=l.split(":").map(Number),!(isNaN(i)||isNaN(r)||isNaN(c)||isNaN(m))&&((p=c+m/60)<(u=i+r/60)?u<=a||a<=p:u<=a&&a<=p)):(console.warn("Formato no reconocido: "+o),!0)}function m(e){return e.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w\s]/gi,"")}function u(){try{var e=localStorage.getItem(n);if(e)try{var o=JSON.parse(e);if(!o.data||!Array.isArray(o.data))return console.warn("Caché corrupto detectado. Limpiando..."),void localStorage.removeItem(n)}catch(e){return console.warn("Caché JSON inválido. Limpiando..."),void localStorage.removeItem(n)}if(e){var{data:a,timestamp:t}=JSON.parse(e);if(a&&Array.isArray(a)&&Date.now()-t<864e5)return console.log(`✅ Negocios cargados desde caché (${a.length} negocios)`),v(window.businesses=a),1}}catch(e){console.error("Error al cargar desde caché:",e)}}window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),l=e,console.log("✅ Evento beforeinstallprompt capturado. PWA listo para instalarse.");var e=document.getElementById("botonInstalar"),o=document.getElementById("botonInstalarMobile");e&&(e.style.display="inline-block",e.textContent="Instalar App",e.disabled=!1),o&&(o.style.display="inline-block",o.textContent="Instalar App",o.disabled=!1)}),document.getElementById("btnSoyConsumidor")?.addEventListener("click",()=>{var e=bootstrap.Modal.getInstance(document.getElementById("modalSeleccion")),e=(e&&e.hide(),"¡Bienvenido! Explora los comercios de Castelar.");if(!document.getElementById("toastConsumidor")){const o=document.createElement("div");o.id="toastConsumidor",o.className=`
    fixed top-6 left-1/2 transform -translate-x-1/2
    bg-gradient-to-r from-blue-500 to-blue-700 text-white
    px-6 py-3 rounded-full shadow-lg
    text-sm font-medium z-50
    opacity-0 translate-y-[-20px]
    transition-all duration-300
    flex items-center gap-2
    max-w-xs
  `,o.innerHTML=`
    <i class="fas fa-user-check"></i>
    <span>${e}</span>
  `,document.body.appendChild(o),setTimeout(()=>{o.classList.remove("opacity-0","translate-y-[-20px]"),o.classList.add("opacity-100","translate-y-0")},100),setTimeout(()=>{o.classList.remove("opacity-100","translate-y-0"),o.classList.add("opacity-0","translate-y-[-20px]"),setTimeout(()=>{o.parentNode&&o.parentNode.removeChild(o)},300)},3e3)}setTimeout(()=>{var e=document.getElementById("btnNotificacion");e&&e.click()},500)}),document.addEventListener("DOMContentLoaded",()=>{var e=document.getElementById("botonInstalar"),o=document.getElementById("botonInstalarMobile");e&&e.addEventListener("click",i),o&&o.addEventListener("click",i),window.matchMedia("(display-mode: standalone)").matches||(e&&(e.style.display="none"),o&&(o.style.display="none"))});const p={panaderias:"panaderias.json",pastas:"pastas.json",verdulerias:"verdulerias.json",fiambrerias:"fiambrerias.json",kioscos:"kioscos.json",mascotas:"mascotas.json",barberias:"barberias.json",ferreterias:"ferreterias.json",ropa:"tiendas.json",veterinarias:"veterinarias.json",carnicerias:"carnicerias.json",profesiones:"profesiones.json",farmacias:"farmacias.json",cafeterias:"cafeterias.json",talleres:"talleres.json",librerias:"librerias.json",mates:"mates.json",florerias:"florerias.json"};let g=0;const w=Object.keys(p).length;async function f(o){var e="data/"+p[o];let a=null,t=0;for(;!a&&t<20;)(a=document.querySelector(`#${o} .row`))||(await new Promise(e=>setTimeout(e,100)),t++);if(a)try{var n=await fetch(e);if(!n.ok)throw new Error("HTTP "+n.status);var s=await n.json();document.createDocumentFragment();const i=s.map(e=>{return window.businesses.push({name:e.nombre,category:o,hours:e.horarioData||e.horario,address:e.direccion||"",image:e.imagen,url:e.pagina,latitude:e.latitud||e.latitude||e.lat||null,longitude:e.longitud||e.longitude||e.lng||null,telefono:e.telefono,whatsapp:e.whatsapp}),`
      <div class="col-6 col-md-3">
        <div class="card card-small h-100 shadow-sm" data-aos="fade-up">
          <img 
            src="${(e=e).imagen}" 
            alt="${e.nombre}" 
            loading="lazy" 
            class="card-img-top clickable-image"
            data-bs-toggle="modal"
            data-bs-target="#businessModal"
            data-business='${JSON.stringify(e).replace(/'/g,"&#x27;")}'
          />
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${e.nombre}</h5>
            <p class="card-text">
              <i class="fas fa-clock text-muted me-1"></i>
              <strong>Horario:</strong><br>
              ${e.horario}
            </p>
            <p class="card-text">
              <i class="fas fa-phone text-muted me-1"></i>
              <strong>Tel:</strong> ${e.telefono}
            </p>
            <a href="https://wa.me/${e.whatsapp}?text=Hola%20desde%20BarrioClik" 
               target="_blank" rel="noopener" 
               class="btn btn-whatsapp mb-1" 
               data-hours="${e.horarioData}">
              <i class="fab fa-whatsapp me-1"></i> Contactar por WhatsApp
            </a>
            <a href="${e.pagina}" class="btn btn-gradient mt-auto">
              <i class="${e.icono||"fas fa-store"} me-1"></i> Ir A La Web
            </a>
          </div>
        </div>
      </div>
    `}).join("");requestAnimationFrame(()=>{a.innerHTML=i,0===a.children.length&&(console.warn(`⚠️ Renderizado fallido en ${o}. Forzando reflow...`),a.style.display="none",a.offsetHeight,a.style.display="",a.innerHTML=i),a.offsetHeight,g++,b()})}catch(e){console.error(`Error cargando ${o}:`,e),a.innerHTML='<div class="col-12"><p class="text-center text-danger">Error al cargar negocios.</p></div>',g++,b()}else console.error(`❌ No se encontró el contenedor para ${o} después de 2000ms`),g++,b()}function b(){if(g===w){console.log("✅ Todos los negocios cargados: "+window.businesses.length);var e=window.businesses;try{var o={businesses:e,timestamp:Date.now()};localStorage.setItem(n,JSON.stringify(o))}catch(e){console.warn("No se pudo guardar en caché:",e)}h(),y(),M()}}function h(){if(0===window.businesses.length)return u()&&0<window.businesses.length?(console.log("✅ Negocios cargados desde caché"),h(),y(),void M()):void 0;v(window.businesses),window.searchBusinesses=function(){var e,o=document.getElementById("searchInput"),a=document.getElementById("searchModalBody");o&&a&&(e=new bootstrap.Modal(document.getElementById("searchModal")),0<(o=function(e){if(!c)return console.warn("Índice de búsqueda no inicializado"),window.businesses||[];const o=m(e),a=new Set;2<o.length&&Object.keys(c.byName).forEach(e=>{e.includes(o)&&c.byName[e].forEach(e=>a.add(e))});return 0!==a.size||0!==o.length?Array.from(a):window.businesses||[]}(m(o.value)).filter(e=>d(e.hours))).length?a.innerHTML=o.map(e=>`
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">${e.name}</h5>
              <p class="card-text">Categoría: ${e.category}</p>
              <p class="card-text">Horario: ${e.hours}</p>
              <a href="${e.url||"#"}" target="_blank" class="btn btn-primary">Visitar</a>
            </div>
          </div>
        `).join(""):a.innerHTML="<p>No se encontraron negocios abiertos ahora.</p>",e.show())};var e=document.querySelector('button[onclick="searchBusinesses()"]');e&&e.addEventListener("click",window.searchBusinesses);const a=document.getElementById("carouselContainer"),t=(a&&(a.innerHTML="",[...window.businesses.slice(0,8),...window.businesses.slice(0,8)].forEach(e=>{var o=document.createElement("div");o.className="carousel-card",o.innerHTML=`<a href="${e.url||"#"}"><img src="${e.image}" alt="${e.name}"><p>${e.name}</p></a>`,a.appendChild(o)})),window.scrollCarousel=function(e){const o=document.querySelector(".carousel-container");if(o){e=o.scrollLeft+e;o.scrollTo({left:e,behavior:"smooth"});const a=o.scrollWidth/2;e>=a?setTimeout(()=>o.scrollTo({left:0,behavior:"auto"}),500):e<=0&&setTimeout(()=>o.scrollTo({left:a,behavior:"auto"}),500)}},document.getElementById("offerContainer"));function o(){document.querySelectorAll(".btn-whatsapp[data-hours]").forEach(e=>{var o=d(e.getAttribute("data-hours"));e.classList.toggle("disabled",!o),e.style.pointerEvents=o?"auto":"none",e.style.opacity=o?"1":"0.5",e.innerHTML='<i class="fab fa-whatsapp me-1"></i> '+(o?"Contactar por WhatsApp":"Negocio Cerrado")})}t&&fetch("data/promociones.json").then(e=>e.json()).then(e=>{t.innerHTML="",e.forEach(e=>{var o=document.createElement("div");o.className="offer-card",o.innerHTML=`
              <div class="offer-image">
                <img src="${e.logo}" alt="${e.name}">
                ${e.discount?`<span class="offer-discount">${e.discount}</span>`:""}
              </div>
              <div class="offer-info">
                <h3>${e.name}</h3>
                <div class="price">
                  ${e.originalPrice?`<span class="original-price">${e.originalPrice}</span>`:""}
                  <span class="discounted-price">${e.discountedPrice}</span>
                </div>
                <a href="${e.url.trim()}" class="menu-link" target="_blank">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9 20.897a.89.89 0 0 1-.902-.895.9.9 0 0 1 .262-.635l7.37-7.37-7.37-7.36A.9.9 0 0 1 9 3.104c.24 0 .47.094.64.263l8 8a.9.9 0 0 1 0 1.27l-8 8a.89.89 0 0 1-.64.26Z"/>
                  </svg>
                  Ver oferta
                </a>
              </div>
            `,t.appendChild(o)}),t.offsetHeight}).catch(e=>{console.error("Error cargando promociones:",e),t.innerHTML='<p class="text-center text-danger">Error al cargar promociones.</p>'}),window.scrollOffers=function(e){var o=document.querySelector(".offer-container");o&&(o.scrollLeft+=e)},o(),setInterval(o,6e4);const n=document.querySelectorAll('[id^="botonInstalar"]');window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),l=e,n.forEach(e=>e.style.display="inline-block")}),n.forEach(e=>{e.addEventListener("click",async()=>{l&&(l.prompt(),await l.userChoice,l=null)})});e=document.getElementById("mobileMenuToggle");const s=document.getElementById("mobileMenuModal");var i=document.getElementById("mobileMenuClose");e&&s&&e.addEventListener("click",()=>{new bootstrap.Modal(s).show()}),i&&s&&i.addEventListener("click",()=>{var e=bootstrap.Modal.getInstance(s);e&&e.hide()});const r=document.getElementById("backToTop");r&&(window.addEventListener("scroll",()=>{r.classList.toggle("d-none",window.scrollY<=300)},{passive:!0}),r.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"})})),"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").then(o=>{console.log("SW registrado con éxito:",o),o.onupdatefound=()=>{const e=o.installing;e.onstatechange=()=>{"installed"===e.state&&navigator.serviceWorker.controller&&(console.log("✅ Nueva versión disponible. Actualizando..."),window.location.reload())}}}).catch(e=>{console.error("SW registration failed:",e)}),"undefined"!=typeof AOS&&AOS.refresh()}function v(e){const a={byCategory:{},byName:{},byLocation:[],totalItems:e.length};e.forEach(e=>{var o=e.category||"Otros",o=(a.byCategory[o]||(a.byCategory[o]=[]),a.byCategory[o].push(e),m(e.name));a.byName[o]||(a.byName[o]=[]),a.byName[o].push(e),e.latitude&&e.longitude&&a.byLocation.push({business:e,lat:e.latitude,lng:e.longitude})}),c=a,console.log(`✅ Índice de búsqueda creado con ${a.totalItems} elementos`)}function y(){E()?I():(console.log("Leaflet no está disponible. Programando verificación..."),setTimeout(T,300))}function E(){return"undefined"!=typeof L&&L&&L.map&&L.marker}function T(){void 0===window.leafletCheckAttempts&&(window.leafletCheckAttempts=0,window.MAX_LEAFLET_CHECK_ATTEMPTS=10),window.leafletCheckAttempts++,E()?(console.log("✅ Leaflet se ha cargado correctamente después de",window.leafletCheckAttempts,"intentos"),I()):window.leafletCheckAttempts<window.MAX_LEAFLET_CHECK_ATTEMPTS?(console.log(`⏳ Esperando a que Leaflet se cargue... (intento ${window.leafletCheckAttempts}/${window.MAX_LEAFLET_CHECK_ATTEMPTS})`),setTimeout(T,300)):console.error("❌ Error crítico: Leaflet no se cargó después de",window.MAX_LEAFLET_CHECK_ATTEMPTS,"intentos")}function I(){o?console.log("La configuración del mapa ya se completó"):document.getElementById("map")?document.getElementById("businessList")?(t=document.getElementById("businessListContainer")||document.querySelector(".business-list-container"),0===window.businesses.length?(console.log("Negocios no cargados aún. Esperando..."),setTimeout(I,500)):(s=function(t,n,s){let i;return function(...e){const o=this;var a=s&&!i;clearTimeout(i),i=setTimeout(()=>{i=null,s||t.apply(o,e)},n),a&&t.apply(o,e)}}(function(){window.businesses&&window.map&&a&&C(window.businesses)},500,!0),N(),o=!0)):(console.log("No se encontró el contenedor de lista de negocios. Esperando..."),setTimeout(I,300)):(console.log("No se encontró el contenedor del mapa. Esperando..."),setTimeout(I,300))}function N(){if(window.mapInitialized)console.log("El mapa ya ha sido inicializado, omitiendo inicialización");else{const o=document.getElementById("map");if(o)if(E())try{window.map&&window.map.remove&&window.map.remove(),window.map=L.map("map",{center:[-34.652,-58.643],zoom:13,scrollWheelZoom:!1,touchZoom:!0,dragging:!0,zoomControl:!0,trackResize:!0,fadeAnimation:!0,markerZoomAnimation:!0,bounceAtZoomLimits:!1,inertia:!0,inertiaDeceleration:3e3,inertiaMaxSpeed:1500,zoomSnap:.25,zoomDelta:.25,preferCanvas:!0}),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',detectRetina:!0,updateWhenIdle:!0,updateWhenZooming:!1,keepBuffer:5,maxNativeZoom:18,loadingClass:"loading",unloadInvisibleTiles:!0,reuseTiles:!0}).addTo(window.map),window.map.on("click",function(){var e;window.map.scrollWheelZoom.enabled()||(window.map.scrollWheelZoom.enable(),(e=document.getElementById("mapZoomHint"))&&e.parentNode&&e.parentNode.removeChild(e))});var e=document.createElement("div");e.id="mapZoomHint",e.className="map-zoom-hint",e.innerHTML=`
        <div class="hint-content">
          <i class="fas fa-mouse-pointer me-2"></i>
          <span>Haz clic en el mapa para activar el zoom con la rueda</span>
        </div>
      `,o.appendChild(e),window.map.on("zoomstart",function(){o.classList.add("map-loading"),clearTimeout(window.mapZoomTimeout)}),window.map.on("zoomend",function(){window.mapZoomTimeout=setTimeout(()=>{o.classList.remove("map-loading"),window.businesses&&a&&s()},150)}),window.map.on("movestart",function(){o.classList.add("map-loading")}),window.map.on("moveend",function(){setTimeout(()=>{o.classList.remove("map-loading"),window.businesses&&a&&s()},75)}),window.mapInitialized=!0,a=!0,setTimeout(()=>{window.map.invalidateSize(),console.log("Tamaño del mapa actualizado"),k()},100),console.log("✅ Mapa inicializado correctamente")}catch(e){console.error("Error al inicializar el mapa:",e),setTimeout(N,500)}else console.error("Leaflet no está disponible al intentar inicializar el mapa"),setTimeout(T,300);else console.error("No se encontró el contenedor del mapa"),setTimeout(N,500)}}function k(){if(E())if(window.map&&"function"==typeof window.map.addLayer)if(0===window.businesses.length)console.log("No hay negocios disponibles para mostrar en el mapa");else try{window.businessMarkers&&window.map.removeLayer(window.businessMarkers),window.businessMarkers=L.featureGroup();const o=[];window.businesses.forEach(e=>{e.latitude&&e.longitude&&d(e.hours)&&(e=function(e){e=L.marker([e.latitude,e.longitude],{icon:L.divIcon({className:"custom-marker",html:`<div class="marker-dot ${d(e.hours)?"open":"closed"}"></div>`,iconSize:[12,12],iconAnchor:[6,6]}),businessData:e});return e.on("popupopen",function(){var e=this.businessData,e=`
        <div class="custom-popup">
          <h6 class="mb-1">${e.name}</h6>
          <p class="text-muted mb-1" style="font-size: 0.85rem;">${e.category||"Sin categoría"}</p>
          <div class="d-flex gap-2 mt-2">
            <a href="${e.url||"#"}" target="_blank" class="btn btn-sm btn-primary" style="font-size: 0.8rem;">Ver más</a>
            <a href="https://wa.me/${e.whatsapp}" target="_blank" class="btn btn-sm btn-success" style="font-size: 0.8rem;">Chat</a>
          </div>
        </div>
      `;this.setPopupContent(e)}),e}(e),o.push(e))}),console.log(`✅ ${o.length} pines agregados al mapa`);var e=L.markerClusterGroup({maxClusterRadius:80,iconCreateFunction:function(e){return L.divIcon({html:`<div class="cluster-icon">${e.getChildCount()}</div>`,className:"marker-cluster",iconSize:[40,40]})}}).addLayers(o);window.businessMarkers.addLayer(e),window.businessMarkers.addTo(window.map)}catch(e){console.error("Error al agregar marcadores al mapa:",e)}else console.warn("El mapa no está inicializado correctamente. Programando reintento..."),setTimeout(N,300);else console.warn("Leaflet no está disponible. Programando reintento..."),setTimeout(T,300)}function M(){const n=document.getElementById("locateMe");n?n.addEventListener("click",()=>{console.log("Botón 'Mostrar mi ubicación' clicado"),window.map&&"function"==typeof window.map.addLayer?(n.innerHTML,n.disabled=!0,n.innerHTML=`
        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        Obteniendo ubicación...
      `,navigator.geolocation?navigator.geolocation.getCurrentPosition(e=>{var{latitude:e,longitude:o,accuracy:a}=e.coords,t=Math.round(a);console.log(`📍 Ubicación obtenida: ${e}, ${o} (precisión: ${t}m)`),window.userMarker&&window.map.removeLayer(window.userMarker),window.userAccuracyCircle&&window.map.removeLayer(window.userAccuracyCircle),window.userMarker=L.marker([e,o],{icon:L.divIcon({className:"user-location-marker",html:'<div class="user-location-ring"></div><div class="user-location-dot"></div>',iconSize:[40,40],iconAnchor:[20,20]})}).addTo(window.map),window.userAccuracyCircle=L.circle([e,o],{radius:a,color:"#3b82f6",fillColor:"#3b82f6",fillOpacity:.15,weight:1}).addTo(window.map),window.map.setView([e,o],14),C(window.businesses),n.innerHTML=`
              <i class="fas fa-location-dot me-1"></i>
              Mi ubicación (${t}m)
            `,n.disabled=!1},e=>{console.error("Error de geolocalización:",e);let o="No se pudo obtener tu ubicación: ";switch(e.code){case e.PERMISSION_DENIED:o+="permiso denegado.";break;case e.POSITION_UNAVAILABLE:o+="ubicación no disponible.";break;case e.TIMEOUT:o+="tiempo de espera agotado.";break;default:o+="error desconocido."}alert(o),n.innerHTML=`
              <i class="fas fa-location-dot me-1"></i>
              Mostrar mi ubicación
            `,n.disabled=!1},{enableHighAccuracy:!0,timeout:1e4,maximumAge:0}):(alert("Tu navegador no soporta geolocalización."),n.disabled=!1)):alert("El mapa aún no está listo. Por favor, espera unos segundos e intenta nuevamente.")}):(console.log("Botón 'Mostrar mi ubicación' no encontrado. Esperando..."),setTimeout(M,300))}function C(e){var o=document.getElementById("businessList"),a=document.getElementById("businessListContainer")||document.querySelector(".business-list-container");if(o)if(window.userMarker)try{const n=window.userMarker.getLatLng();var t=e.filter(e=>e.latitude&&e.longitude).map(e=>{var o=window.map.distance(n,L.latLng(e.latitude,e.longitude))/1e3;return{...e,distance:o}}).filter(e=>d(e.hours)&&e.distance<=10).sort((e,o)=>e.distance-o.distance);console.log(`✅ ${t.length} negocios abiertos encontrados dentro de 10 km`),0<t.length?o.innerHTML=t.map(e=>`
          <div class="col-12 col-md-6 col-lg-4 mb-2">
            <div class="border rounded p-3 bg-white shadow-sm">
              <h6 class="mb-1">${e.name}</h6>
              <p class="text-muted mb-1" style="font-size: 0.85rem;">${e.category||"Sin categoría"}</p>
              <p class="text-muted mb-2" style="font-size: 0.85rem;">${e.address||"Dirección no disponible"}</p>
              <p class="mb-2" style="font-size: 0.85rem;">
                <span class="badge bg-success">Abierto</span>
                <span class="ms-2">${e.distance.toFixed(2)} km</span>
              </p>
              <div class="d-flex gap-2">
                <a href="https://maps.google.com/?daddr=${e.latitude},${e.longitude}" 
                   target="_blank" 
                   class="btn btn-sm btn-outline-primary flex-grow-1">
                  <i class="fas fa-directions me-1"></i>Ruta
                </a>
                <a href="https://wa.me/${e.whatsapp}" 
                   target="_blank" 
                   class="btn btn-sm btn-outline-success flex-grow-1">
                  <i class="fab fa-whatsapp me-1"></i>Chat
                </a>
              </div>
            </div>
          </div>
        `).join(""):o.innerHTML=`
          <div class="col-12">
            <p class="text-center text-muted py-3">No hay comercios abiertos cerca de ti.</p>
          </div>
        `,a?a.style.display="block":console.warn("⚠️ No se encontró el contenedor de la lista de negocios")}catch(e){console.error("Error al actualizar la lista de negocios:",e),o.innerHTML=`
        <div class="col-12">
          <p class="text-center text-danger">Error al cargar los comercios.</p>
        </div>
      `,a&&(a.style.display="block")}else o.innerHTML=`
        <div class="text-center text-muted py-3">
          <p>Por favor, haz clic en "Mostrar mi ubicación" para ver los comercios cercanos.</p>
        </div>
      `,a&&(a.style.display="block");else console.error("❌ No se encontró el elemento #businessList")}function A(){if(window.map&&window.mapInitialized){window.map.invalidateSize();const o=document.getElementById("map");if(o&&null===o.offsetParent){console.log("El mapa está en un contenedor oculto. Monitoreando visibilidad...");const a=new MutationObserver(e=>{null!==o.offsetParent&&(a.disconnect(),console.log("El contenedor del mapa ahora es visible. Actualizando tamaño..."),setTimeout(()=>{window.map.invalidateSize(),k()},300))});a.observe(o.parentElement,{attributes:!0,childList:!0,subtree:!0})}}}document.addEventListener("click",function(e){var e=e.target.closest(".clickable-image");e&&(e=JSON.parse(e.dataset.business),document.getElementById("businessModal"),document.getElementById("modalImage").src=e.imagen,document.getElementById("modalImage").alt=e.nombre,document.getElementById("modalName").textContent=e.nombre,document.getElementById("modalAddress").textContent=e.direccion||"No disponible",document.getElementById("modalHours").textContent=e.horario,document.getElementById("modalPhone").textContent=e.telefono,document.getElementById("modalWhatsapp").href=`https://wa.me/${e.whatsapp}?text=Hola%20desde%20BarrioClik`,document.getElementById("modalWebsite").href=e.pagina,document.getElementById("modalMap").href=`https://maps.google.com/?daddr=${e.latitud},`+e.longitud,document.getElementById("businessModalLabel").textContent=e.nombre)}),document.getElementById("businessModal")?.addEventListener("hidden.bs.modal",function(){var e=document.getElementById("modalImage");e&&(e.src="")}),u()&&0<window.businesses.length?(console.log("✅ Negocios cargados desde caché"),h(),y(),M()):Object.keys(p).forEach(e=>{f(e)}),window.addEventListener("resize",()=>{setTimeout(A,100)}),document.addEventListener("shown.bs.tab",A),document.addEventListener("shown.bs.modal",A),(e=document.getElementById("searchModal"))&&(e.setAttribute("aria-hidden","false"),e.addEventListener("show.bs.modal",function(){this.setAttribute("aria-hidden","false")}),e.addEventListener("hidden.bs.modal",function(){this.setAttribute("aria-hidden","true")}),"block"!==e.style.display&&!e.classList.contains("show")||e.setAttribute("aria-hidden","false")),document.querySelectorAll(".modal").forEach(e=>{"block"!==e.style.display&&!e.classList.contains("show")||e.setAttribute("aria-hidden","false")}),window.setupLocationButton=M,window.updateBusinessList=C,window.isBusinessOpen=d});