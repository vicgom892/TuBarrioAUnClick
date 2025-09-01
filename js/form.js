
  // Código mejorado para el modal de confirmación
  document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modalConfirmacion');
    const closeModal = document.getElementById('modalConfirmacionClose');
    const btnEnviar = document.getElementById('btnEnviar');
    const modalConfirmacionSend = document.getElementById('modalConfirmacionSend');
    
    // Variables globales para almacenar los datos del formulario
    let formData = {
      nombre: '',
      tipo: '',
      mensaje: ''
    };
    
    // Función para abrir el modal
    function openModal() {
      modal.classList.remove('opacity-0', 'pointer-events-none');
      modal.classList.add('opacity-100', 'pointer-events-auto');
      setTimeout(() => {
        modal.querySelector('.max-w-md').classList.remove('scale-95');
        modal.querySelector('.max-w-md').classList.add('scale-100');
      }, 50);
    }
    
    // Función para cerrar el modal
    function closeModalFn() {
      modal.querySelector('.max-w-md').classList.remove('scale-100');
      modal.querySelector('.max-w-md').classList.add('scale-95');
      setTimeout(() => {
        modal.classList.remove('opacity-100', 'pointer-events-auto');
        modal.classList.add('opacity-0', 'pointer-events-none');
      }, 200);
    }
    
    // Manejar selección de tipo de mensaje
    document.querySelectorAll('.btn-tipo').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.btn-tipo').forEach(b => b.classList.remove('active', 'border-purple-500', 'bg-purple-50'));
        this.classList.add('active', 'border-purple-500', 'bg-purple-50');
      });
    });
    
    // Manejar validación del formulario
    function validateForm() {
      let isValid = true;
      
      // Limpiar errores previos
      document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
      });
      
      // Validar nombre
      const nombre = document.getElementById('nombre').value.trim();
      if (!nombre) {
        document.getElementById('nombreError').classList.remove('hidden');
        isValid = false;
      }
      
      // Validar tipo de mensaje
      const tipo = document.querySelector('.btn-tipo.active');
      if (!tipo) {
        document.getElementById('tipoError').classList.remove('hidden');
        isValid = false;
      }
      
      // Validar mensaje
      const mensaje = document.getElementById('mensaje').value.trim();
      if (!mensaje) {
        document.getElementById('mensajeError').classList.remove('hidden');
        isValid = false;
      }
      
      return isValid;
    }
    
    // Manejar envío del formulario
    function handleSubmit(e) {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      // Obtener valores del formulario
      formData.nombre = document.getElementById('nombre').value.trim();
      formData.tipo = document.querySelector('.btn-tipo.active').dataset.value;
      formData.mensaje = document.getElementById('mensaje').value.trim();
      
      // Actualizar contenido del modal
      document.getElementById('confirmNombre').textContent = formData.nombre;
      document.getElementById('confirmTipo').textContent = 
        formData.tipo.charAt(0).toUpperCase() + formData.tipo.slice(1);
      document.getElementById('confirmMensaje').textContent = formData.mensaje;
      
      // Abrir modal
      openModal();
    }
    
    // Manejar envío a WhatsApp
    function sendToWhatsApp() {
      try {
        // Número de WhatsApp (ajusta este número según tu necesidad)
        const whatsappNumber = '5491157194796';
        
        // Crear mensaje formateado
        const message = `*Mensaje desde Tu Barrio A Un Clik*\n\n` +
                       `*Nombre:* ${encodeURIComponent(formData.nombre)}\n` +
                       `*Tipo:* ${encodeURIComponent(formData.tipo.charAt(0).toUpperCase() + formData.tipo.slice(1))}\n` +
                       `*Mensaje:* ${encodeURIComponent(formData.mensaje)}`;
        
        // Crear URL de WhatsApp
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
        
        console.log('Intentando abrir WhatsApp con URL:', whatsappUrl);
        
        // Intentar abrir WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Cerrar modal
        closeModalFn();
        
        // Mostrar mensaje de éxito (opcional)
        setTimeout(() => {
          alert('¡Mensaje enviado! Gracias por contactarnos.');
        }, 300);
      } catch (error) {
        console.error('Error al enviar mensaje a WhatsApp:', error);
        alert('Hubo un error al intentar enviar tu mensaje. Por favor, intenta nuevamente.');
      }
    }
    
    // Eventos
    if (closeModal) {
      closeModal.addEventListener('click', closeModalFn);
    }
    
    // Cerrar al hacer clic fuera del contenido
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModalFn();
      }
    });
    
    // Manejar envío del formulario
    if (btnEnviar) {
      btnEnviar.addEventListener('click', handleSubmit);
    }
    
    // Manejar envío a WhatsApp
    if (modalConfirmacionSend) {
      modalConfirmacionSend.addEventListener('click', sendToWhatsApp);
    }
    
    // Manejar botón "Editar"
    const modalConfirmacionBack = document.getElementById('modalConfirmacionBack');
    if (modalConfirmacionBack) {
      modalConfirmacionBack.addEventListener('click', closeModalFn);
    }
    
    // Manejar envío con Enter en el textarea (opcional)
    const mensajeInput = document.getElementById('mensaje');
    if (mensajeInput) {
      mensajeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          handleSubmit(e);
        }
      });
    }
  });
