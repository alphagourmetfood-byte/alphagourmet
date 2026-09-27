const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const APP_SECRET = 'alpha_gourmet_jwt_secret_key_2026';
const ADMIN_PASS = 'admin123';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./alphagourmet.db', (err) => {
  if (!err) console.log('Banco de dados SQLite pronto.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT UNIQUE, senha TEXT, telefone TEXT, endereco TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS pedidos (id INTEGER PRIMARY KEY AUTOINCREMENT, numero_pedido INTEGER UNIQUE, cliente_nome TEXT, cliente_telefone TEXT, endereco TEXT, itens_json TEXT, valor_total REAL, forma_pagamento TEXT, status_pedido TEXT DEFAULT 'Pendente', criado_em DATETIME DEFAULT CURRENT_TIMESTAMP)`);
});

function gerarNumeroPedido() {
  return new Promise((resolve) => {
    db.get('SELECT MAX(numero_pedido) as maxNum FROM pedidos', (err, row) => {
      resolve((row && row.maxNum) ? row.maxNum + 1 : 1001);
    });
  });
}

app.post('/api/pedidos', async (req, res) => {
  const { cliente_nome, cliente_telefone, endereco, itens, valor_total, forma_pagamento } = req.body;
  const numPedido = await gerarNumeroPedido();
  
  db.run(`INSERT INTO pedidos (numero_pedido, cliente_nome, cliente_telefone, endereco, itens_json, valor_total, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [numPedido, cliente_nome, cliente_telefone, endereco, JSON.stringify(itens), valor_total, forma_pagamento],
    function(err) {
      if (err) return res.status(500).json({ error: 'Erro ao gravar pedido' });
      const novoPedido = { id: this.lastID, numero_pedido: numPedido, cliente_nome, cliente_telefone, endereco, itens, valor_total, forma_pagamento, status_pedido: 'Pendente' };
      io.emit('novo_pedido', novoPedido);
      res.json({ success: true, pedido: novoPedido });
    }
  );
});

app.get('/api/admin/pedidos', (req, res) => {
  db.all(`SELECT * FROM pedidos ORDER BY numero_pedido DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar pedidos' });
    res.json(rows.map(r => ({ ...r, itens: JSON.parse(r.itens_json) })));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));