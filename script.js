      // Countdown script
      const launchDate = new Date(2025, 10, 29, 17, 0, 0).getTime();
      const countdownEl = document.getElementById("countdown");
      const modal = document.getElementById("modal-aviso");
      const btnFechar = document.getElementById("btn-fechar");

      function formatTime(seconds) {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${d}d ${h.toString().padStart(2, "0")}h ${m
          .toString()
          .padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
      }

      function showModal() {
        modal.classList.add("show");
        btnFechar.focus();
      }
      function hideModal() {
        modal.classList.remove("show");
      }
      btnFechar.addEventListener("click", hideModal);

      function updateCountdown() {
        const now = Date.now();
        const diffSeconds = Math.floor((launchDate - now) / 1000);

        if (diffSeconds > 0) {
          countdownEl.textContent = `Lançamento em: ${formatTime(diffSeconds)}`;
        } else {
          countdownEl.textContent =
            "🎉 O site já foi lançado! Obrigado pela paciência.";
          showModal();
          clearInterval(interval);
        }
      }

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      // --- Galeria e modal imagem ampliada com zoom, pan, swipe e pinch-to-zoom ---
      const imageModal = document.getElementById("image-modal");
      const imageModalImg = imageModal.querySelector("img");
      const closeImageBtn = document.getElementById("close-image");
      const prevBtn = document.getElementById("prev-btn");
      const nextBtn = document.getElementById("next-btn");

      const images = Array.from(
        document.querySelectorAll(".spoiler-images img")
      );
      let currentIndex = 0;

      // Zoom & Pan state
      let isZoomed = false;
      let panX = 0;
      let panY = 0;
      let startX = 0;
      let startY = 0;
      let isDragging = false;

      // Pinch to zoom vars
      let initialDistance = 0;
      let pinchZoomScale = 1;
      let baseScale = 1;

      // Abre modal imagem
      function openImage(index) {
        currentIndex = index;
        const img = images[currentIndex];
        imageModalImg.src = img.src;
        imageModalImg.alt = img.alt || "Imagem ampliada";
        imageModal.classList.add("show");
        isZoomed = false;
        pinchZoomScale = 1;
        baseScale = 1;
        panX = 0;
        panY = 0;
        imageModal.classList.remove("zoomed");
        imageModalImg.style.transform = "scale(1) translate(0,0)";
        closeImageBtn.focus();
      }
      function closeImage() {
        imageModal.classList.remove("show");
        imageModalImg.src = "";
        isZoomed = false;
        pinchZoomScale = 1;
        panX = 0;
        panY = 0;
        imageModal.classList.remove("zoomed");
        imageModalImg.style.transform = "";
      }

      function prevImage() {
        if (currentIndex > 0) {
          openImage(currentIndex - 1);
        } else {
          openImage(images.length - 1);
        }
      }
      function nextImage() {
        if (currentIndex < images.length - 1) {
          openImage(currentIndex + 1);
        } else {
          openImage(0);
        }
      }

      // Eventos clique nas imagens pequenas
      images.forEach((img, i) => {
        img.addEventListener("click", () => openImage(i));
      });

      closeImageBtn.addEventListener("click", closeImage);

      // Fecha modal ao clicar fora da imagem
      imageModal.addEventListener("click", (e) => {
        if (e.target === imageModal) closeImage();
      });

      // Fecha modal com ESC
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && imageModal.classList.contains("show")) {
          closeImage();
        }
      });

      // Zoom toggle com duplo clique/tap
      let lastTap = 0;
      imageModalImg.addEventListener("dblclick", toggleZoom);
      imageModalImg.addEventListener("touchend", (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
          toggleZoom();
          e.preventDefault();
        }
        lastTap = currentTime;
      });

      function toggleZoom() {
        if (!isZoomed) {
          isZoomed = true;
          pinchZoomScale = 2;
          baseScale = 2;
          panX = 0;
          panY = 0;
          imageModal.classList.add("zoomed");
          imageModalImg.style.transform = `scale(${pinchZoomScale}) translate(0,0)`;
        } else {
          isZoomed = false;
          pinchZoomScale = 1;
          baseScale = 1;
          panX = 0;
          panY = 0;
          imageModal.classList.remove("zoomed");
          imageModalImg.style.transform = "scale(1) translate(0,0)";
        }
      }

      // Pan / drag da imagem quando zoomed (mouse)
      imageModalImg.addEventListener("mousedown", (e) => {
        if (!isZoomed) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        imageModalImg.style.cursor = "grabbing";
      });
      window.addEventListener("mouseup", () => {
        isDragging = false;
        imageModalImg.style.cursor = isZoomed ? "move" : "grab";
      });
      window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        constrainPan();
        updateTransform();
      });

      // Pan / drag toque (touch)
      imageModalImg.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches.length === 1 && isZoomed) {
            startX = e.touches[0].clientX - panX;
            startY = e.touches[0].clientY - panY;
            isDragging = true;
          }
        },
        { passive: false }
      );

      imageModalImg.addEventListener(
        "touchmove",
        (e) => {
          if (e.touches.length === 1 && isDragging && isZoomed) {
            e.preventDefault();
            panX = e.touches[0].clientX - startX;
            panY = e.touches[0].clientY - startY;
            constrainPan();
            updateTransform();
          }
        },
        { passive: false }
      );

      imageModalImg.addEventListener("touchend", (e) => {
        if (e.touches.length < 1) {
          isDragging = false;
        }
      });

      // Pinch to zoom
      imageModalImg.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches.length === 2) {
            e.preventDefault();
            initialDistance = getDistance(e.touches[0], e.touches[1]);
            baseScale = pinchZoomScale;
            isDragging = false;
          }
        },
        { passive: false }
      );

      imageModalImg.addEventListener(
        "touchmove",
        (e) => {
          if (e.touches.length === 2) {
            e.preventDefault();
            const newDistance = getDistance(e.touches[0], e.touches[1]);
            let scaleChange = newDistance / initialDistance;
            pinchZoomScale = Math.min(Math.max(baseScale * scaleChange, 1), 4);

            imageModalImg.style.transform = `scale(${pinchZoomScale}) translate(${panX}px, ${panY}px)`;
            isZoomed = pinchZoomScale > 1;
            if (isZoomed) imageModal.classList.add("zoomed");
            else {
              imageModal.classList.remove("zoomed");
              panX = 0;
              panY = 0;
            }
          }
        },
        { passive: false }
      );

      imageModalImg.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) {
          if (pinchZoomScale <= 1) {
            pinchZoomScale = 1;
            isZoomed = false;
            imageModal.classList.remove("zoomed");
            imageModalImg.style.transform = "scale(1) translate(0,0)";
            panX = 0;
            panY = 0;
          }
        }
      });

      // Função auxiliar distância entre dois toques
      function getDistance(touch1, touch2) {
        return Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }

      // Constrain pan para não sair da imagem (limites)
      function constrainPan() {
        if (!isZoomed) {
          panX = 0;
          panY = 0;
          return;
        }
        const imgRect = imageModalImg.getBoundingClientRect();
        const modalRect = imageModal.getBoundingClientRect();

        const maxPanX = (imgRect.width * (pinchZoomScale - 1)) / 2;
        const maxPanY = (imgRect.height * (pinchZoomScale - 1)) / 2;

        if (panX > maxPanX) panX = maxPanX;
        if (panX < -maxPanX) panX = -maxPanX;
        if (panY > maxPanY) panY = maxPanY;
        if (panY < -maxPanY) panY = -maxPanY;
      }

      // Atualiza transformação da imagem (scale + translate)
      function updateTransform() {
        imageModalImg.style.transform = `scale(${pinchZoomScale}) translate(${panX}px, ${panY}px)`;
      }

      // Swipe para trocar imagens
      let touchStartX = 0;
      let touchEndX = 0;
      const minSwipeDistance = 50;

      imageModalImg.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
        }
      });
      imageModalImg.addEventListener("touchmove", (e) => {
        if (e.touches.length === 1) {
          touchEndX = e.touches[0].clientX;
        }
      });
      imageModalImg.addEventListener("touchend", (e) => {
        if (isZoomed) return;
        if (!touchStartX || !touchEndX) return;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > minSwipeDistance) {
          if (diff > 0) {
            nextImage();
          } else {
            prevImage();
          }
        }
        touchStartX = 0;
        touchEndX = 0;
      });

      //////////////////////////////////////////////
      //sistema de bloqueio de botão nova site
// === CONFIGURAÇÃO ===
const dataInauguracao = new Date("2025-11-29T17:00:00");
const botao = document.getElementById("goto-site");

// Verifica se já pode liberar
function verificarBloqueio() {
  const agora = new Date();

  if (agora >= dataInauguracao) {
    botao.disabled = false;
    botao.title = "Acesse o novo site!";
    botao.classList.add("liberado"); // ativa o brilho pulsante
  } else {
    botao.disabled = true;
    botao.title = "O novo site será liberado no dia da inauguração!";
    botao.classList.remove("liberado");
  }
}

// Executa ao carregar
verificarBloqueio();
// Atualiza a cada minuto
setInterval(verificarBloqueio, 60000);

// Ação ao clicar
botao.addEventListener("click", () => {
  if (!botao.disabled) {
    window.open("https://seudominio.com", "_blank"); // coloque o link real aqui
  }
});

