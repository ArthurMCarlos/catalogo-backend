const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB conectado"))
  .catch(err => console.error(err));

const Produto = mongoose.model('Produto', {
  nome: String,
  descricao: String,
  preco: String,
  imagem: String,
  categoria: String,
  link: [String]
});

app.get('/api/produtos', async (req, res) => {
  const produtos = await Produto.find();
  res.json(produtos);
});

app.post('/api/produtos', async (req, res) => {
  const novo = new Produto(req.body);
  await novo.save();
  res.json(novo);
});

app.delete('/api/produtos/:id', async (req, res) => {
  await Produto.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));