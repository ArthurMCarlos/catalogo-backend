const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CONFIGURAÇÃO DE PASTAS =====
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const produtosDir = path.join(uploadsDir, 'produtos');
const genericasDir = path.join(uploadsDir, 'genericas');

[uploadsDir, produtosDir, genericasDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Pasta criada: ${dir}`);
  }
});

// ===== CONFIGURAÇÃO DO MULTER =====
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPG, PNG, WEBP, GIF)'));
    }
  }
});

// ===== MIDDLEWARES =====
app.use(cors({
  origin: '*', // Em produção, especifique o domínio correto
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(uploadsDir));

// ===== LOG DE REQUISIÇÕES =====
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== CONEXÃO MONGODB =====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Erro ao conectar MongoDB:", err));

// ===== MODELO DO PRODUTO =====
const Produto = mongoose.model('Produto', {
  nome: String,
  descricao: String,
  preco: String,
  imagem: String,
  categoria: String,
  link: [String]
});

// ===== ROTA DE TESTE =====
app.get('/', (req, res) => {
  res.json({ 
    message: 'API do Catálogo funcionando!', 
    version: '1.0.0',
    endpoints: {
      produtos: '/api/produtos',
      upload: '/api/upload',
      genericas: '/api/genericas/:categoria'
    }
  });
});

// ===== ROTA DE UPLOAD (IMPORTANTE!) =====
app.post('/api/upload', upload.single('imagem'), async (req, res) => {
  try {
    console.log('📤 Recebendo upload...');
    
    if (!req.file) {
      console.log('❌ Nenhum arquivo recebido');
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    console.log('📷 Arquivo recebido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const filename = `produto-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const filepath = path.join(produtosDir, filename);

    // Processar imagem com Sharp
    await sharp(req.file.buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    const imageUrl = `/uploads/produtos/${filename}`;
    
    console.log('✅ Upload concluído:', imageUrl);
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      message: 'Imagem enviada com sucesso'
    });
  } catch (err) {
    console.error('❌ Erro no upload:', err);
    res.status(500).json({ erro: 'Erro ao processar imagem: ' + err.message });
  }
});

// ===== ROTAS DE PRODUTOS =====

// GET: Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ _id: -1 });
    console.log(`✅ ${produtos.length} produtos retornados`);
    res.json(produtos);
  } catch (err) {
    console.error('❌ Erro ao listar produtos:', err);
    res.status(500).json({ erro: err.message });
  }
});

// GET: Obter produto por ID
app.get('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (err) {
    console.error('❌ Erro ao buscar produto:', err);
    res.status(500).json({ erro: err.message });
  }
});

// POST: Criar novo produto
app.post('/api/produtos', async (req, res) => {
  try {
    console.log('📝 Criando produto:', req.body);
    const novo = new Produto(req.body);
    await novo.save();
    console.log('✅ Produto criado:', novo._id);
    res.json(novo);
  } catch (err) {
    console.error('❌ Erro ao criar produto:', err);
    res.status(500).json({ erro: err.message });
  }
});

// PUT: Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    console.log('✏️ Atualizando produto:', req.params.id);
    const atualizado = await Produto.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!atualizado) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    console.log('✅ Produto atualizado');
    res.json(atualizado);
  } catch (err) {
    console.error('❌ Erro ao atualizar produto:', err);
    res.status(500).json({ erro: err.message });
  }
});

// DELETE: Remover produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    console.log('🗑️ Removendo produto:', req.params.id);
    const produto = await Produto.findByIdAndDelete(req.params.id);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    
    // Remover imagem se for local
    if (produto.imagem && produto.imagem.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, 'public', produto.imagem);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('🗑️ Imagem removida:', imagePath);
      }
    }
    
    console.log('✅ Produto removido');
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Erro ao remover produto:', err);
    res.status(500).json({ erro: err.message });
  }
});

// ===== ROTA DE IMAGENS GENÉRICAS =====
app.get('/api/genericas/:categoria', (req, res) => {
  const categoria = req.params.categoria;
  const iconesGenericos = {
    'roupas': '/uploads/genericas/roupas.svg',
    'tenis': '/uploads/genericas/tenis.svg',
    'acessorios': '/uploads/genericas/acessorios.svg',
    'maquiagem': '/uploads/genericas/maquiagem.svg',
    'esmalte': '/uploads/genericas/esmalte.svg',
    'farmacia': '/uploads/genericas/farmacia.svg',
    'tecnologia': '/uploads/genericas/tecnologia.svg',
    'dia': '/uploads/genericas/dia.svg'
  };
  
  res.json({ 
    categoria: categoria,
    imagem: iconesGenericos[categoria] || '/uploads/genericas/default.svg'
  });
});

// ===== TRATAMENTO DE ERROS DO MULTER =====
app.use((err, req, res, next) => {
  console.error('❌ Erro global:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ erro: 'Arquivo muito grande. Máximo 5MB.' });
    }
    return res.status(400).json({ erro: err.message });
  } else if (err) {
    return res.status(400).json({ erro: err.message });
  }
  next();
});

// ===== ROTA 404 =====
app.use((req, res) => {
  console.log('❌ Rota não encontrada:', req.path);
  res.status(404).json({ 
    erro: 'Rota não encontrada',
    path: req.path,
    method: req.method,
    availableRoutes: [
      'GET /',
      'GET /api/produtos',
      'GET /api/produtos/:id',
      'POST /api/produtos',
      'PUT /api/produtos/:id',
      'DELETE /api/produtos/:id',
      'POST /api/upload',
      'GET /api/genericas/:categoria'
    ]
  });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGO_URI ? 'Conectado' : 'Aguardando...'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Rotas disponíveis:');
  console.log('   GET  / (teste)');
  console.log('   GET  /api/produtos');
  console.log('   POST /api/produtos');
  console.log('   PUT  /api/produtos/:id');
  console.log('   DELETE /api/produtos/:id');
  console.log('   POST /api/upload 📤');
  console.log('   GET  /api/genericas/:categoria');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
