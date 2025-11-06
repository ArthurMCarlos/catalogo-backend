let produtos = [];
const API_URL = "https://catalogo-backend-97xq.onrender.com/api/produtos";

// Elementos DOM
const catalog = document.getElementById("catalog");
const categoryButtons = document.querySelectorAll("#categoryButtons button");
const mainPage = document.getElementById("mainPage");
const detailsPage = document.getElementById("detailsPage");
const detailsContent = document.getElementById("detailsContent");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const productForm = document.getElementById("productForm");
const linksContainer = document.getElementById("linksContainer");
const emptyState = document.getElementById("emptyState");
const searchSuggestions = document.getElementById("searchSuggestions");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");

let categoriaAtual = "todos";
let paginaAtual = 1;
const itensPorPagina = 20;
let isLoading = false;

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===== MODAL DE ZOOM DE IMAGEM =====
function openImageModal(imageSrc) {
  if (!imageSrc || imageSrc === '') return;
  modalImage.src = imageSrc;
  imageModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  imageModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  modalImage.src = '';
}

// Adicionar listener para ESC fechar modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !imageModal.classList.contains('hidden')) {
    closeImageModal();
  }
});

// ===== SKELETON LOADING =====
function showSkeletonLoading() {
  catalog.innerHTML = `
    <div class="skeleton-item">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
    </div>
    <div class="skeleton-item">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
    </div>
    <div class="skeleton-item">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
    </div>
  `;
  catalog.style.display = 'grid';
  emptyState.classList.add('hidden');
}

function hideSkeletonLoading() {
  const skeletons = document.querySelectorAll('.skeleton-item');
  skeletons.forEach(skeleton => skeleton.remove());
}

// ===== FETCH PRODUTOS COM LOADING =====
async function fetchProdutos(showLoading = true) {
  if (isLoading) return;
  isLoading = true;
  
  try {
    if (showLoading) {
      showSkeletonLoading();
    }
    const res = await fetch(API_URL);
    produtos = await res.json();
    
    console.log("✓ Produtos carregados:", produtos.length);
    
    updateCategoryCounts();
    renderCatalog();
  } catch (err) {
    console.error("✗ Erro ao buscar produtos:", err);
    showToast("Erro ao carregar produtos. Tente novamente.", "error");
    hideSkeletonLoading();
  } finally {
    isLoading = false;
  }
}

// ===== ATUALIZAR CONTADORES DE CATEGORIA =====
function updateCategoryCounts() {
  const counts = { todos: produtos.length };
  
  produtos.forEach(p => {
    if (p.categoria) {
      counts[p.categoria] = (counts[p.categoria] || 0) + 1;
    }
  });
  
  console.log("✓ Contadores atualizados:", counts);
  
  document.querySelectorAll('.category-count').forEach(counter => {
    const category = counter.getAttribute('data-count-category');
    counter.textContent = counts[category] || 0;
  });
}

// ===== SALVAR PRODUTO =====
async function salvarProdutos(produto) {
  try {
    console.log("✓ Salvando produto no banco:", produto);
    console.log("✓ URL da imagem sendo enviada:", produto.imagem);
    
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produto)
    });
    
    if (res.ok) {
      const savedProduct = await res.json();
      console.log("✓ Produto salvo com sucesso:", savedProduct);
      showToast("Produto adicionado com sucesso!", "success");
      return true;
    } else {
      const error = await res.text();
      console.error("✗ Erro do servidor:", error);
      throw new Error("Erro ao salvar produto");
    }
  } catch (err) {
    console.error("✗ Erro ao salvar produto:", err);
    showToast("Erro ao adicionar produto. Tente novamente.", "error");
    return false;
  }
}

// ===== RENDERIZAR CATÁLOGO =====
function renderCatalog() {
  hideSkeletonLoading();
  catalog.innerHTML = "";
  pagination.innerHTML = "";

  const termo = searchInput.value.toLowerCase().trim();
  
  // Filtrar produtos
  const filtrados = produtos.filter(p => {
    // Verificar categoria
    const matchCategoria = categoriaAtual === "todos" || (p.categoria && p.categoria === categoriaAtual);
    
    // Verificar busca
    const matchBusca = termo === "" || (p.nome && p.nome.toLowerCase().includes(termo));
    
    return matchCategoria && matchBusca;
  });
  
  console.log(`✓ Renderizando: Categoria="${categoriaAtual}" | Busca="${termo}" | Encontrados=${filtrados.length}/${produtos.length}`);

  // Mostrar estado vazio se não houver produtos
  if (filtrados.length === 0) {
    catalog.style.display = 'none';
    emptyState.classList.remove('hidden');
    pagination.style.display = 'none';
    return;
  } else {
    catalog.style.display = 'grid';
    emptyState.classList.add('hidden');
    pagination.style.display = 'flex';
  }

  const totalPaginas = Math.ceil(filtrados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;

  filtrados.slice(inicio, fim).forEach((p) => {
    const item = document.createElement("div");
    item.classList.add("item");
    
    const linksHtml = p.link && p.link.length > 0 
      ? p.link.map((l, i) => `<a href="${l}" target="_blank" onclick="event.stopPropagation()">Link ${i + 1}</a>`).join("")
      : '<span style="color: var(--text-muted); font-size: 0.8rem;">Sem links disponíveis</span>';
    
    item.innerHTML = `
      <img src="${p.imagem}" alt="${p.nome}" onclick="event.stopPropagation(); openImageModal('${p.imagem}')">
      <div class="item-info">
        <h3>${p.nome}</h3>
        <p>${p.descricao || 'Sem descrição'}</p>
        <button class="edit-btn" onclick="event.stopPropagation(); editarProduto('${p._id}')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="remove-btn" onclick="event.stopPropagation(); removerProduto('${p._id}')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
        <span class="price">${p.preco || 'Preço não informado'}</span>
        <div class="links-preview">
          ${linksHtml}
        </div>
      </div>
    `;

    item.onclick = (e) => {
      if (!e.target.closest('.remove-btn') && !e.target.closest('.edit-btn')) {
        abrirDetalhes(p);
      }
    };
    catalog.appendChild(item);
  });

  // Renderizar paginação
  if (totalPaginas > 1) {
    // Botão anterior
    if (paginaAtual > 1) {
      const prevBtn = document.createElement("button");
      prevBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      `;
      prevBtn.onclick = () => {
        paginaAtual--;
        renderCatalog();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      pagination.appendChild(prevBtn);
    }

    // Números de página
    for (let i = 1; i <= totalPaginas; i++) {
      if (
        i === 1 || 
        i === totalPaginas || 
        (i >= paginaAtual - 1 && i <= paginaAtual + 1)
      ) {
        const btn = document.createElement("button");
        btn.innerText = i;
        if (i === paginaAtual) btn.classList.add("active");
        btn.onclick = () => {
          paginaAtual = i;
          renderCatalog();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        pagination.appendChild(btn);
      } else if (
        (i === paginaAtual - 2 && i > 1) ||
        (i === paginaAtual + 2 && i < totalPaginas)
      ) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "...";
        ellipsis.style.padding = "0.75rem 0.5rem";
        ellipsis.style.color = "var(--text-muted)";
        pagination.appendChild(ellipsis);
      }
    }

    // Botão próximo
    if (paginaAtual < totalPaginas) {
      const nextBtn = document.createElement("button");
      nextBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      `;
      nextBtn.onclick = () => {
        paginaAtual++;
        renderCatalog();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      pagination.appendChild(nextBtn);
    }
  }
}

// ===== REMOVER PRODUTO =====
async function removerProduto(id) {
  if (!confirm("Tem certeza que deseja remover este produto?")) return;
  
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Produto removido com sucesso!", "success");
      await fetchProdutos(false);
    } else {
      throw new Error("Erro ao remover produto");
    }
  } catch (err) {
    console.error("Erro ao remover produto:", err);
    showToast("Erro ao remover produto. Tente novamente.", "error");
  }
}

// ===== EDITAR PRODUTO (PLACEHOLDER) =====
function editarProduto(id) {
  showToast("Funcionalidade de edição em desenvolvimento", "warning");
}

// ===== FORMULÁRIO DE PRODUTO =====
productForm.onsubmit = async (e) => {
  e.preventDefault();
  
  const imagemValue = document.getElementById("imagem").value.trim();
  
  const novo = {
    nome: document.getElementById("nome").value.trim(),
    descricao: document.getElementById("descricao").value.trim(),
    preco: document.getElementById("preco").value.trim(),
    imagem: imagemValue,
    categoria: document.getElementById("categoria").value,
    link: Array.from(document.querySelectorAll(".link-input"))
      .map(input => input.value.trim())
      .filter(val => val !== "")
  };
  
  console.log("✓ Enviando produto:", novo);
  console.log("✓ Imagem selecionada:", imagemValue);
  
  if (!novo.nome || !novo.categoria) {
    showToast("Preencha todos os campos obrigatórios", "warning");
    return;
  }
  
  if (!novo.imagem) {
    showToast("Selecione uma imagem para o produto", "warning");
    return;
  }
  
  const success = await salvarProdutos(novo);
  if (success) {
    productForm.reset();
    // Limpar campo hidden de imagem
    document.getElementById("imagem").value = '';
    // Limpar preview e upload zone
    removePreview();
    // Limpar URL
    document.getElementById("imagemUrl").value = '';
    // Remover seleção de ícones genéricos
    document.querySelectorAll('.generic-icon').forEach(i => i.classList.remove('selected'));
    
    linksContainer.innerHTML = '';
    adicionarCampoLink();
    productForm.classList.add('hidden');
    document.getElementById("toggleFormBtn").querySelector('span').textContent = "Adicionar Produto";
    await fetchProdutos(false);
  }
};

// ===== AUTOCOMPLETE NA BUSCA =====
let searchTimeout;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  paginaAtual = 1;
  
  const termo = searchInput.value.toLowerCase().trim();
  
  console.log(`✓ Busca digitada: "${termo}"`);
  
  // Renderizar imediatamente
  renderCatalog();
  
  // Autocomplete
  if (termo.length < 2) {
    searchSuggestions.classList.remove('active');
    searchSuggestions.innerHTML = '';
    return;
  }
  
  searchTimeout = setTimeout(() => {
    const sugestoes = produtos
      .filter(p => p.nome && p.nome.toLowerCase().includes(termo))
      .slice(0, 5);
    
    console.log(`✓ Sugestões encontradas: ${sugestoes.length}`);
    
    if (sugestoes.length > 0) {
      searchSuggestions.innerHTML = sugestoes.map(p => {
        const nomeHighlight = p.nome.replace(
          new RegExp(termo, 'gi'),
          match => `<span class="suggestion-highlight">${match}</span>`
        );
        return `
          <div class="suggestion-item" onclick="selecionarSugestao('${p.nome.replace(/'/g, "\\'")}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span>${nomeHighlight}</span>
          </div>
        `;
      }).join('');
      searchSuggestions.classList.add('active');
    } else {
      searchSuggestions.classList.remove('active');
    }
  }, 300);
});

function selecionarSugestao(nome) {
  searchInput.value = nome;
  searchSuggestions.classList.remove('active');
  paginaAtual = 1;
  renderCatalog();
}

// Fechar sugestões ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrapper')) {
    searchSuggestions.classList.remove('active');
  }
});

// ===== DETALHES DO PRODUTO =====
function abrirDetalhes(produto) {
  mainPage.style.display = "none";
  detailsPage.style.display = "block";
  
  const linksHtml = produto.link && produto.link.length > 0
    ? produto.link.map((l, i) => `
        <a href="${l}" target="_blank">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Comprar - Link ${i + 1}
        </a>
      `).join("")
    : '<p style="color: var(--text-muted);">Nenhum link de compra disponível</p>';
  
  detailsContent.innerHTML = `
    <img src="${produto.imagem}" alt="${produto.nome}" onclick="openImageModal('${produto.imagem}')">
    <div class="details-info">
      <h2>${produto.nome}</h2>
      <p>${produto.descricao || 'Sem descrição disponível'}</p>
      <span class="price">${produto.preco || 'Preço não informado'}</span>
      <div class="links-compra">
        ${linksHtml}
      </div>
    </div>
  `;
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function voltarCatalogo() {
  detailsPage.style.display = "none";
  mainPage.style.display = "block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== TEMA CLARO/ESCURO =====
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("modoEscuro", isDark ? "sim" : "nao");
  
  showToast(
    isDark ? "Modo escuro ativado" : "Modo claro ativado",
    "success"
  );
}

// ===== GERENCIAR LINKS =====
function adicionarCampoLink(valor = "") {
  const grupo = document.createElement("div");
  grupo.className = "link-group";
  grupo.innerHTML = `
    <input type="text" name="links[]" class="link-input" placeholder="https://exemplo.com/produto" value="${valor}" />
    <button type="button" class="remove-link-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  grupo.querySelector(".remove-link-btn").onclick = () => {
    if (linksContainer.children.length > 1) {
      grupo.remove();
    } else {
      showToast("Mantenha pelo menos um campo de link", "warning");
    }
  };
  linksContainer.appendChild(grupo);
}

document.getElementById("addLinkBtn").addEventListener("click", () => {
  adicionarCampoLink();
});

// ===== TOGGLE FORMULÁRIO =====
document.getElementById("toggleFormBtn").addEventListener("click", () => {
  productForm.classList.toggle("hidden");
  const btnSpan = document.getElementById("toggleFormBtn").querySelector('span');
  btnSpan.textContent = productForm.classList.contains("hidden")
    ? "Adicionar Produto"
    : "Fechar Formulário";
});

// ===== FILTROS DE CATEGORIA =====
categoryButtons.forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Garantir que pegamos o botão, não elementos internos
    const button = e.currentTarget;
    const categoria = button.dataset.category;
    
    console.log(`✓ Clique em categoria: "${categoria}"`);
    
    // Atualizar estado visual
    categoryButtons.forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    
    // Atualizar filtro
    categoriaAtual = categoria;
    paginaAtual = 1;
    
    // Renderizar
    renderCatalog();
  });
});

// ===== INICIALIZAÇÃO =====
window.onload = () => {
  console.log("✓ Sistema iniciando...");
  
  // Carregar tema salvo
  const savedTheme = localStorage.getItem("modoEscuro");
  if (savedTheme === "sim") {
    document.body.classList.add("dark-mode");
  }
  
  // Adicionar campo de link inicial
  adicionarCampoLink();
  
  // Garantir que o formulário está escondido
  productForm.classList.add('hidden');
  
  // Carregar produtos
  fetchProdutos(true).then(() => {
    // Mensagem de boas-vindas após carregar
    setTimeout(() => {
      showToast("Bem-vindo ao Nossas Coisinhas!", "success");
    }, 500);
  });
};

// ===== ATUALIZAÇÃO AUTOMÁTICA =====
setInterval(() => {
  if (!isLoading && mainPage.style.display !== "none") {
    console.log("✓ Atualização automática...");
    fetchProdutos(false);
  }
}, 30000);


// ===== SISTEMA DE UPLOAD DE IMAGENS =====

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const imagemHidden = document.getElementById('imagem');
const imagemUrl = document.getElementById('imagemUrl');

// Opções de imagem (Upload, URL, Genérico)
const optionBtns = document.querySelectorAll('.option-btn');
const uploadArea = document.getElementById('uploadArea');
const urlArea = document.getElementById('urlArea');
const genericArea = document.getElementById('genericArea');

optionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const option = btn.dataset.option;
    
    // Remover active de todos
    optionBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Mostrar área correspondente
    uploadArea.classList.remove('active');
    urlArea.classList.remove('active');
    genericArea.classList.remove('active');
    
    if (option === 'upload') {
      uploadArea.classList.add('active');
    } else if (option === 'url') {
      urlArea.classList.add('active');
    } else if (option === 'generic') {
      genericArea.classList.add('active');
      loadGenericIcons();
    }
  });
});

// Upload por clique
uploadZone.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    uploadImage(file);
  }
});

// Drag & Drop
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    uploadImage(file);
  } else {
    showToast('Por favor, envie apenas imagens', 'error');
  }
});

// Função de upload
async function uploadImage(file) {
  // Validar tamanho
  if (file.size > 5 * 1024 * 1024) {
    showToast('Imagem muito grande. Máximo 5MB.', 'error');
    return;
  }
  
  const formData = new FormData();
  formData.append('imagem', file);
  
  // Mostrar progress
  uploadZone.style.display = 'none';
  uploadProgress.classList.remove('hidden');
  const progressFill = uploadProgress.querySelector('.progress-fill');
  
  // Simular progresso
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 10;
    progressFill.style.width = progress + '%';
    if (progress >= 90) {
      clearInterval(progressInterval);
    }
  }, 100);
  
  try {
    const response = await fetch(`${API_URL.replace('/produtos', '')}/upload`, {
      method: 'POST',
      body: formData
    });
    
    clearInterval(progressInterval);
    progressFill.style.width = '100%';
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.erro || 'Erro ao enviar imagem');
    }
    
    const data = await response.json();
    
    // Mostrar preview
    setTimeout(() => {
      uploadProgress.classList.add('hidden');
      imagePreview.classList.remove('hidden');
      previewImg.src = data.imageUrl;
      imagemHidden.value = data.imageUrl;
      showToast('Imagem enviada com sucesso!', 'success');
    }, 500);
    
  } catch (error) {
    console.error('Erro no upload:', error);
    showToast(error.message, 'error');
    uploadProgress.classList.add('hidden');
    uploadZone.style.display = 'flex';
    progressFill.style.width = '0%';
  }
}

// Remover preview
function removePreview() {
  imagePreview.classList.add('hidden');
  uploadZone.style.display = 'flex';
  previewImg.src = '';
  imagemHidden.value = '';
  fileInput.value = '';
}

// URL de imagem
imagemUrl.addEventListener('input', () => {
  imagemHidden.value = imagemUrl.value;
});

// Carregar ícones genéricos
async function loadGenericIcons() {
  const genericGrid = document.getElementById('genericGrid');
  
  if (genericGrid.children.length > 0) return; // Já carregado
  
  const categorias = ['roupas', 'tenis', 'acessorios', 'maquiagem', 'esmalte', 'farmacia', 'tecnologia', 'dia'];
  
  categorias.forEach(cat => {
    const icon = document.createElement('div');
    icon.className = 'generic-icon';
    icon.dataset.url = `/uploads/genericas/${cat}.svg`;
    icon.innerHTML = `<img src="/uploads/genericas/${cat}.svg" alt="${cat}"><span>${cat}</span>`;
    icon.addEventListener('click', () => {
      // Remover seleção anterior
      document.querySelectorAll('.generic-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      imagemHidden.value = icon.dataset.url;
      console.log(`✓ Ícone genérico selecionado: ${cat}`);
      console.log(`✓ URL definida: ${icon.dataset.url}`);
      console.log(`✓ Valor no campo hidden: ${imagemHidden.value}`);
    });
    genericGrid.appendChild(icon);
  });
}

// ===== SISTEMA DE EDIÇÃO DE PRODUTOS =====

let produtoEditando = null;

async function editarProduto(id) {
  try {
    // Buscar produto
    const produto = produtos.find(p => p._id === id);
    if (!produto) {
      showToast('Produto não encontrado', 'error');
      return;
    }
    
    produtoEditando = produto;
    
    // Preencher formulário de edição
    const editForm = document.getElementById('editForm');
    editForm.innerHTML = `
      <div>
        <label>Nome:</label>
        <input type="text" id="editNome" value="${produto.nome || ''}" required />
      </div>
      
      <div>
        <label>Descrição:</label>
        <textarea id="editDescricao">${produto.descricao || ''}</textarea>
      </div>
      
      <div>
        <label>Preço:</label>
        <input type="text" id="editPreco" value="${produto.preco || ''}" required />
      </div>
      
      <div>
        <label>Categoria:</label>
        <select id="editCategoria" required>
          <option value="">Selecione...</option>
          <option value="roupas" ${produto.categoria === 'roupas' ? 'selected' : ''}>Roupas</option>
          <option value="tenis" ${produto.categoria === 'tenis' ? 'selected' : ''}>Tenis</option>
          <option value="acessorios" ${produto.categoria === 'acessorios' ? 'selected' : ''}>Acessórios</option>
          <option value="maquiagem" ${produto.categoria === 'maquiagem' ? 'selected' : ''}>Maquiagem</option>
          <option value="esmalte" ${produto.categoria === 'esmalte' ? 'selected' : ''}>Esmalte</option>
          <option value="farmacia" ${produto.categoria === 'farmacia' ? 'selected' : ''}>Farmacia</option>
          <option value="tecnologia" ${produto.categoria === 'tecnologia' ? 'selected' : ''}>Tecnologia</option>
          <option value="dia" ${produto.categoria === 'dia' ? 'selected' : ''}>Do dia</option>
        </select>
      </div>
      
      <div>
        <label>Imagem (URL):</label>
        <input type="url" id="editImagem" value="${produto.imagem || ''}" placeholder="https://exemplo.com/imagem.jpg" />
        ${produto.imagem ? `<div style="margin-top: 1rem;"><img src="${produto.imagem}" style="max-width: 200px; border-radius: 8px;" /></div>` : ''}
      </div>
      
      <div>
        <label>Links de Compra:</label>
        <div id="editLinksContainer">
          ${(produto.link || []).map((l, i) => `
            <div class="link-group" style="margin-bottom: 0.75rem;">
              <input type="text" class="edit-link-input" value="${l}" placeholder="https://exemplo.com/produto" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px;" />
            </div>
          `).join('')}
        </div>
        <button type="button" onclick="adicionarLinkEdicao()" style="margin-top: 0.5rem; background: var(--success-color); padding: 0.5rem 1rem; border-radius: 8px; color: white; border: none; cursor: pointer;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 0.25rem;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Adicionar Link
        </button>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn-cancel" onclick="closeEditModal()">Cancelar</button>
        <button type="button" class="btn-save" onclick="salvarEdicao()">Salvar Alterações</button>
      </div>
    `;
    
    // Mostrar modal
    document.getElementById('editModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
  } catch (error) {
    console.error('Erro ao editar:', error);
    showToast('Erro ao carregar produto para edição', 'error');
  }
}

function adicionarLinkEdicao() {
  const container = document.getElementById('editLinksContainer');
  const linkGroup = document.createElement('div');
  linkGroup.className = 'link-group';
  linkGroup.style.marginBottom = '0.75rem';
  linkGroup.innerHTML = `
    <input type="text" class="edit-link-input" placeholder="https://exemplo.com/produto" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px;" />
  `;
  container.appendChild(linkGroup);
}

function closeEditModal() {
  document.getElementById('editModal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  produtoEditando = null;
}

async function salvarEdicao() {
  if (!produtoEditando) return;
  
  const nome = document.getElementById('editNome').value.trim();
  const descricao = document.getElementById('editDescricao').value.trim();
  const preco = document.getElementById('editPreco').value.trim();
  const categoria = document.getElementById('editCategoria').value;
  const imagem = document.getElementById('editImagem').value.trim();
  const links = Array.from(document.querySelectorAll('.edit-link-input'))
    .map(input => input.value.trim())
    .filter(val => val !== '');
  
  if (!nome || !categoria) {
    showToast('Preencha os campos obrigatórios', 'warning');
    return;
  }
  
  const produtoAtualizado = {
    nome,
    descricao,
    preco,
    imagem: imagem || produtoEditando.imagem,
    categoria,
    link: links
  };
  
  try {
    const response = await fetch(`${API_URL}/${produtoEditando._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produtoAtualizado)
    });
    
    if (!response.ok) {
      throw new Error('Erro ao atualizar produto');
    }
    
    showToast('Produto atualizado com sucesso!', 'success');
    closeEditModal();
    await fetchProdutos(false);
    
  } catch (error) {
    console.error('Erro ao salvar:', error);
    showToast('Erro ao salvar alterações', 'error');
  }
}

// Fechar modal ao clicar ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!document.getElementById('editModal').classList.contains('hidden')) {
      closeEditModal();
    }
  }
});

console.log('✓ Sistema de upload e edição carregado');


// ===== SISTEMA DE GERENCIAMENTO DE CATEGORIAS =====

let categorias = [];
let categoriaEditando = null;

// Carregar categorias do backend
async function carregarCategorias() {
  try {
    const response = await fetch(`${API_URL.replace('/produtos', '')}/categorias`);
    categorias = await response.json();
    console.log('Categorias carregadas:', categorias);
    return categorias;
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    showToast('Erro ao carregar categorias', 'error');
    return [];
  }
}

// Abrir modal de gerenciamento
async function abrirGerenciamentoCategorias() {
  await carregarCategorias();
  renderizarCategorias();
  document.getElementById('categoriesModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Fechar modal de gerenciamento
function fecharGerenciamentoCategorias() {
  document.getElementById('categoriesModal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  
  // Atualizar filtros de categoria se necessário
  atualizarFiltrosCategorias();
}

// Renderizar grid de categorias
function renderizarCategorias() {
  const grid = document.getElementById('categoriesGrid');
  
  if (categorias.length === 0) {
    grid.innerHTML = `
      <div class="empty-categories" style="grid-column: 1 / -1;">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <h3>Nenhuma categoria criada</h3>
        <p>Comece criando sua primeira categoria</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = categorias.map(cat => `
    <div class="category-card" draggable="true" data-id="${cat._id}" ondragstart="handleDragStart(event)" ondragover="handleDragOver(event)" ondrop="handleDrop(event)" ondragend="handleDragEnd(event)">
      <div class="category-card-header">
        <div class="category-icon-preview" style="background: ${cat.cor || '#6366f1'};">
          <img src="${cat.icone || '/uploads/genericas/default.svg'}" alt="${cat.nome}">
        </div>
        <div class="category-info">
          <h3>${cat.nome}</h3>
          <p>${cat.descricao || 'Sem descrição'}</p>
          <span class="category-badge">${cat.produtosCount || 0} produtos</span>
        </div>
      </div>
      <div class="category-actions">
        <button class="btn-edit" onclick="editarCategoria('${cat._id}')" title="Editar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-delete" onclick="deletarCategoria('${cat._id}')" title="Deletar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Drag & Drop
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedElement !== e.currentTarget) {
    const grid = document.getElementById('categoriesGrid');
    const allCards = Array.from(grid.querySelectorAll('.category-card'));
    const draggedIndex = allCards.indexOf(draggedElement);
    const targetIndex = allCards.indexOf(e.currentTarget);
    
    if (draggedIndex < targetIndex) {
      e.currentTarget.parentNode.insertBefore(draggedElement, e.currentTarget.nextSibling);
    } else {
      e.currentTarget.parentNode.insertBefore(draggedElement, e.currentTarget);
    }
    
    // Atualizar ordem no backend
    salvarOrdemCategorias();
  }
  
  return false;
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  draggedElement = null;
}

// Salvar ordem das categorias
async function salvarOrdemCategorias() {
  const cards = Array.from(document.querySelectorAll('.category-card'));
  const ordem = cards.map((card, index) => ({
    id: card.dataset.id,
    ordem: index
  }));
  
  try {
    const response = await fetch(`${API_URL.replace('/produtos', '')}/categorias/reorder/batch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categorias: ordem })
    });
    
    if (response.ok) {
      console.log('Ordem atualizada com sucesso');
      await carregarCategorias();
    }
  } catch (error) {
    console.error('Erro ao atualizar ordem:', error);
    showToast('Erro ao atualizar ordem das categorias', 'error');
  }
}

// Abrir form de categoria
function abrirFormCategoria() {
  categoriaEditando = null;
  document.getElementById('categoryFormTitle').textContent = 'Nova Categoria';
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryIcone').value = '/uploads/genericas/default.svg';
  document.getElementById('categoryCor').value = '#6366f1';
  
  // Resetar preview
  atualizarPreviewCategoria();
  
  // Carregar ícones
  carregarIcones();
  
  document.getElementById('categoryFormModal').classList.remove('hidden');
}

// Fechar form de categoria
function fecharFormCategoria() {
  document.getElementById('categoryFormModal').classList.add('hidden');
  categoriaEditando = null;
}

// Carregar ícones disponíveis
function carregarIcones() {
  const iconsSelector = document.getElementById('iconsSelector');
  
  const iconesDisponiveis = [
    { url: '/uploads/genericas/roupas.svg', nome: 'roupas' },
    { url: '/uploads/genericas/tenis.svg', nome: 'tenis' },
    { url: '/uploads/genericas/acessorios.svg', nome: 'acessorios' },
    { url: '/uploads/genericas/maquiagem.svg', nome: 'maquiagem' },
    { url: '/uploads/genericas/esmalte.svg', nome: 'esmalte' },
    { url: '/uploads/genericas/farmacia.svg', nome: 'farmacia' },
    { url: '/uploads/genericas/tecnologia.svg', nome: 'tecnologia' },
    { url: '/uploads/genericas/dia.svg', nome: 'dia' },
    { url: '/uploads/genericas/default.svg', nome: 'padrao' }
  ];
  
  iconsSelector.innerHTML = iconesDisponiveis.map(icon => `
    <div class="icon-option" data-url="${icon.url}" onclick="selecionarIcone('${icon.url}')">
      <img src="${icon.url}" alt="${icon.nome}">
      <span>${icon.nome}</span>
    </div>
  `).join('');
  
  // Selecionar o primeiro ícone por padrão
  iconsSelector.querySelector('.icon-option').classList.add('selected');
}

// Selecionar ícone
function selecionarIcone(url) {
  document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  document.getElementById('categoryIcone').value = url;
  atualizarPreviewCategoria();
}

// Atualizar preview em tempo real
document.addEventListener('DOMContentLoaded', () => {
  const nomeInput = document.getElementById('categoryNome');
  const descricaoInput = document.getElementById('categoryDescricao');
  const corInput = document.getElementById('categoryCor');
  
  if (nomeInput) {
    nomeInput.addEventListener('input', atualizarPreviewCategoria);
  }
  if (descricaoInput) {
    descricaoInput.addEventListener('input', atualizarPreviewCategoria);
  }
  if (corInput) {
    corInput.addEventListener('input', () => {
      const cor = corInput.value;
      document.getElementById('colorPreview').style.background = cor;
      document.getElementById('colorPreview').textContent = cor.toUpperCase();
      atualizarPreviewCategoria();
    });
  }
});

function atualizarPreviewCategoria() {
  const nome = document.getElementById('categoryNome')?.value || 'nova categoria';
  const descricao = document.getElementById('categoryDescricao')?.value || 'Descrição da categoria...';
  const cor = document.getElementById('categoryCor')?.value || '#6366f1';
  const icone = document.getElementById('categoryIcone')?.value || '/uploads/genericas/default.svg';
  
  document.getElementById('previewNome').textContent = nome.toLowerCase();
  document.getElementById('previewDescricao').textContent = descricao;
  document.getElementById('previewIcon').style.background = cor;
  document.getElementById('previewIcon').querySelector('img').src = icone;
}

// Salvar categoria (criar ou editar)
async function salvarCategoria() {
  const nome = document.getElementById('categoryNome').value.trim();
  const descricao = document.getElementById('categoryDescricao').value.trim();
  const cor = document.getElementById('categoryCor').value;
  const icone = document.getElementById('categoryIcone').value;
  const id = document.getElementById('categoryId').value;
  
  if (!nome) {
    showToast('Nome da categoria é obrigatório', 'warning');
    return;
  }
  
  const categoria = {
    nome: nome.toLowerCase(),
    descricao,
    cor,
    icone
  };
  
  try {
    const url = id 
      ? `${API_URL.replace('/produtos', '')}/categorias/${id}`
      : `${API_URL.replace('/produtos', '')}/categorias`;
    
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoria)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.erro || 'Erro ao salvar categoria');
    }
    
    showToast(
      id ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!',
      'success'
    );
    
    fecharFormCategoria();
    await carregarCategorias();
    renderizarCategorias();
    
    // Atualizar select de categorias no form de produto
    atualizarSelectCategorias();
    
  } catch (error) {
    console.error('Erro ao salvar categoria:', error);
    showToast(error.message, 'error');
  }
}

// Editar categoria
async function editarCategoria(id) {
  const categoria = categorias.find(c => c._id === id);
  if (!categoria) {
    showToast('Categoria não encontrada', 'error');
    return;
  }
  
  categoriaEditando = categoria;
  
  document.getElementById('categoryFormTitle').textContent = 'Editar Categoria';
  document.getElementById('categoryId').value = categoria._id;
  document.getElementById('categoryNome').value = categoria.nome;
  document.getElementById('categoryDescricao').value = categoria.descricao || '';
  document.getElementById('categoryCor').value = categoria.cor || '#6366f1';
  document.getElementById('categoryIcone').value = categoria.icone || '/uploads/genericas/default.svg';
  
  // Atualizar cor preview
  document.getElementById('colorPreview').style.background = categoria.cor || '#6366f1';
  document.getElementById('colorPreview').textContent = (categoria.cor || '#6366f1').toUpperCase();
  
  // Carregar ícones e selecionar o correto
  carregarIcones();
  setTimeout(() => {
    const iconOption = document.querySelector(`.icon-option[data-url="${categoria.icone}"]`);
    if (iconOption) {
      document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
      iconOption.classList.add('selected');
    }
  }, 100);
  
  atualizarPreviewCategoria();
  
  document.getElementById('categoryFormModal').classList.remove('hidden');
}

// Deletar categoria
async function deletarCategoria(id) {
  const categoria = categorias.find(c => c._id === id);
  if (!categoria) return;
  
  const produtosCount = categoria.produtosCount || 0;
  
  let confirmMsg = `Deseja realmente deletar a categoria "${categoria.nome}"?`;
  if (produtosCount > 0) {
    confirmMsg += `\n\nExistem ${produtosCount} produto(s) nesta categoria.`;
    confirmMsg += '\nEles serão movidos para a categoria "outros".';
  }
  
  if (!confirm(confirmMsg)) return;
  
  try {
    const response = await fetch(`${API_URL.replace('/produtos', '')}/categorias/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.erro || 'Erro ao deletar categoria');
    }
    
    const result = await response.json();
    
    showToast(
      produtosCount > 0
        ? `Categoria deletada e ${result.produtosMovidos} produto(s) movido(s)`
        : 'Categoria deletada com sucesso!',
      'success'
    );
    
    await carregarCategorias();
    renderizarCategorias();
    atualizarSelectCategorias();
    
    // Recarregar produtos se necessário
    if (produtosCount > 0) {
      await fetchProdutos(false);
    }
    
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    showToast(error.message, 'error');
  }
}

// Atualizar select de categorias no form de produto
function atualizarSelectCategorias() {
  const selectProduto = document.getElementById('categoria');
  const selectEdit = document.getElementById('editCategoria');
  
  if (selectProduto) {
    const opcaoAtual = selectProduto.value;
    selectProduto.innerHTML = '<option value="">Categoria</option>' +
      categorias.map(cat => `<option value="${cat.nome}">${cat.nome.charAt(0).toUpperCase() + cat.nome.slice(1)}</option>`).join('');
    selectProduto.value = opcaoAtual;
  }
  
  if (selectEdit) {
    const opcaoAtualEdit = selectEdit.value;
    selectEdit.innerHTML = '<option value="">Selecione...</option>' +
      categorias.map(cat => `<option value="${cat.nome}">${cat.nome.charAt(0).toUpperCase() + cat.nome.slice(1)}</option>`).join('');
    selectEdit.value = opcaoAtualEdit;
  }
}

// Atualizar filtros de categoria
async function atualizarFiltrosCategorias() {
  await carregarCategorias();
  
  const categoryButtons = document.getElementById('categoryButtons');
  if (!categoryButtons) return;
  
  // Manter botão "Todos"
  const todosCount = produtos.length;
  
  categoryButtons.innerHTML = `
    <button data-category="todos" class="active">
      <span>Todos</span>
      <span class="category-count" data-count-category="todos">${todosCount}</span>
    </button>
  ` + categorias.map(cat => {
    const count = produtos.filter(p => p.categoria === cat.nome).length;
    return `
      <button data-category="${cat.nome}">
        <span>${cat.nome.charAt(0).toUpperCase() + cat.nome.slice(1)}</span>
        <span class="category-count" data-count-category="${cat.nome}">${count}</span>
      </button>
    `;
  }).join('');
  
  // Reativar listeners
  document.querySelectorAll('#categoryButtons button').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const button = e.currentTarget;
      const categoria = button.dataset.category;
      
      console.log(`Clique em categoria: "${categoria}"`);
      
      document.querySelectorAll('#categoryButtons button').forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      
      categoriaAtual = categoria;
      paginaAtual = 1;
      
      renderCatalog();
    });
  });
}

// Inicializar sistema de categorias ao carregar a página
window.addEventListener('load', async () => {
  await carregarCategorias();
  atualizarSelectCategorias();
  atualizarFiltrosCategorias();
});

console.log('Sistema de gerenciamento de categorias carregado');


// ===== FUNCIONALIDADES AVANÇADAS: EXPORT/IMPORT =====

// Exportar categorias para JSON
function exportarCategorias() {
  if (categorias.length === 0) {
    showToast('Nenhuma categoria para exportar', 'warning');
    return;
  }
  
  // Preparar dados para export (remover _id, campos internos)
  const dadosExport = categorias.map(cat => ({
    nome: cat.nome,
    descricao: cat.descricao || '',
    icone: cat.icone || '/uploads/genericas/default.svg',
    cor: cat.cor || '#6366f1',
    ordem: cat.ordem || 0
  }));
  
  // Criar blob JSON
  const dataStr = JSON.stringify(dadosExport, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  // Criar link de download
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `categorias-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast(`${categorias.length} categorias exportadas com sucesso!`, 'success');
  console.log('✓ Categorias exportadas:', dadosExport);
}

// Importar categorias de JSON
async function importarCategorias() {
  // Criar input file invisível
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Ler arquivo
      const text = await file.text();
      const categoriasImportadas = JSON.parse(text);
      
      // Validar estrutura
      if (!Array.isArray(categoriasImportadas)) {
        throw new Error('Arquivo inválido: deve conter um array de categorias');
      }
      
      // Validar cada categoria
      for (const cat of categoriasImportadas) {
        if (!cat.nome) {
          throw new Error('Categoria inválida: campo "nome" é obrigatório');
        }
      }
      
      // Confirmar import
      const confirmMsg = `Deseja importar ${categoriasImportadas.length} categoria(s)?\n\n` +
        `Categorias existentes com mesmo nome serão ignoradas.\n` +
        `Novas categorias serão adicionadas ao final.`;
      
      if (!confirm(confirmMsg)) return;
      
      // Importar cada categoria
      let criadas = 0;
      let erros = 0;
      let duplicadas = 0;
      
      for (const cat of categoriasImportadas) {
        try {
          // Verificar se já existe
          const existe = categorias.find(c => c.nome.toLowerCase() === cat.nome.toLowerCase());
          if (existe) {
            duplicadas++;
            continue;
          }
          
          // Criar categoria
          const response = await fetch(`${API_URL.replace('/produtos', '')}/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
          });
          
          if (response.ok) {
            criadas++;
          } else {
            erros++;
          }
        } catch (error) {
          console.error('Erro ao importar categoria:', cat.nome, error);
          erros++;
        }
      }
      
      // Recarregar categorias
      await carregarCategorias();
      renderizarCategorias();
      atualizarSelectCategorias();
      atualizarFiltrosCategorias();
      
      // Feedback
      let mensagem = `Import concluído!\n\n`;
      if (criadas > 0) mensagem += `✓ ${criadas} categoria(s) criada(s)\n`;
      if (duplicadas > 0) mensagem += `⚠ ${duplicadas} categoria(s) já existente(s)\n`;
      if (erros > 0) mensagem += `✗ ${erros} erro(s)`;
      
      showToast(mensagem.replace(/\n/g, ' '), criadas > 0 ? 'success' : 'warning');
      console.log('✓ Import concluído:', { criadas, duplicadas, erros });
      
    } catch (error) {
      console.error('Erro ao importar categorias:', error);
      showToast(`Erro ao importar: ${error.message}`, 'error');
    }
  };
  
  // Trigger file selector
  input.click();
}

// Backup automático (opcional - pode ser chamado periodicamente)
function backupAutomaticoCategorias() {
  if (categorias.length > 0) {
    const backup = {
      data: new Date().toISOString(),
      total: categorias.length,
      categorias: categorias.map(cat => ({
        nome: cat.nome,
        descricao: cat.descricao,
        icone: cat.icone,
        cor: cat.cor,
        ordem: cat.ordem,
        produtosCount: cat.produtosCount || 0
      }))
    };
    
    // Salvar no localStorage
    localStorage.setItem('categorias_backup', JSON.stringify(backup));
    console.log('✓ Backup automático salvo:', backup.total, 'categorias');
  }
}

// Restaurar backup do localStorage
async function restaurarBackupLocal() {
  const backup = localStorage.getItem('categorias_backup');
  
  if (!backup) {
    showToast('Nenhum backup local encontrado', 'warning');
    return;
  }
  
  try {
    const dados = JSON.parse(backup);
    
    const confirmMsg = `Backup encontrado de ${new Date(dados.data).toLocaleString()}\n\n` +
      `Total: ${dados.total} categoria(s)\n\n` +
      `Deseja restaurar?`;
    
    if (!confirm(confirmMsg)) return;
    
    // Criar um blob e triggerar import
    const dataStr = JSON.stringify(dados.categorias, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const file = new File([blob], 'backup-local.json', { type: 'application/json' });
    
    // Simular import
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.files = dataTransfer.files;
    
    // Trigger import
    const event = new Event('change', { bubbles: true });
    input.onchange = async (e) => {
      const text = await e.target.files[0].text();
      const categoriasImportadas = JSON.parse(text);
      
      let criadas = 0;
      for (const cat of categoriasImportadas) {
        try {
          const response = await fetch(`${API_URL.replace('/produtos', '')}/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
          });
          if (response.ok) criadas++;
        } catch (error) {
          console.error('Erro ao restaurar:', cat.nome);
        }
      }
      
      await carregarCategorias();
      renderizarCategorias();
      showToast(`Backup restaurado: ${criadas} categoria(s) criada(s)`, 'success');
    };
    
    input.dispatchEvent(event);
    
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    showToast('Erro ao restaurar backup local', 'error');
  }
}

// Backup automático a cada 5 minutos
setInterval(() => {
  if (categorias.length > 0) {
    backupAutomaticoCategorias();
  }
}, 5 * 60 * 1000);

// Backup ao sair da página
window.addEventListener('beforeunload', () => {
  backupAutomaticoCategorias();
});

console.log('✓ Sistema de export/import carregado');
