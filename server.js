const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage
const connections = new Map();

// Generate unique connection ID
function generateId() {
  return Math.random().toString(36).substr(2, 8);
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

app.get('/join', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'join.html'));
});

app.get('/connection/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'connection.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API Routes
app.post('/api/connections', (req, res) => {
  try {
    const { title, referrer, notes } = req.body;
    const id = generateId();
    
    const connection = {
      id,
      title,
      referrer,
      vendor: { name: '', email: '', payPal: '' },
      host: { name: '', email: '', payPal: '' },
      notes: notes || '',
      messages: [],
      createdAt: new Date().toISOString()
    };
    
    connections.set(id, connection);
    res.json({ success: true, connection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/connections/:id', (req, res) => {
  const connection = connections.get(req.params.id);
  if (connection) {
    res.json({ success: true, connection });
  } else {
    res.status(404).json({ success: false, message: 'Connection not found' });
  }
});

app.put('/api/connections/:id/join', (req, res) => {
  try {
    const { role, participant } = req.body;
    const connection = connections.get(req.params.id);
    
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }
    
    if (role === 'vendor' || role === 'host') {
      connection[role] = participant;
      connections.set(req.params.id, connection);
      res.json({ success: true, connection });
    } else {
      res.status(400).json({ success: false, message: 'Invalid role' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/connections/:id/notes', (req, res) => {
  const { notes } = req.body;
  const connection = connections.get(req.params.id);
  
  if (connection) {
    connection.notes = notes;
    connections.set(req.params.id, connection);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Connection not found' });
  }
});

// Simple chat API
app.post('/api/connections/:id/messages', (req, res) => {
  const { message } = req.body;
  const connection = connections.get(req.params.id);
  
  if (connection) {
    const fullMessage = {
      ...message,
      timestamp: new Date().toISOString()
    };
    
    connection.messages.push(fullMessage);
    connections.set(req.params.id, connection);
    
    res.json({ success: true, message: fullMessage });
  } else {
    res.status(404).json({ success: false, message: 'Connection not found' });
  }
});

app.get('/api/connections/:id/messages', (req, res) => {
  const connection = connections.get(req.params.id);
  
  if (connection) {
    res.json({ success: true, messages: connection.messages || [] });
  } else {
    res.status(404).json({ success: false, message: 'Connection not found' });
  }
});

app.post('/api/payments/initiate', (req, res) => {
  const { connectionId, amount, description } = req.body;
  const paymentId = generateId();
  
  const payment = {
    id: paymentId,
    connectionId,
    amount: parseFloat(amount),
    description,
    status: 'pending',
    paymentUrl: `${req.get('origin')}/payment/${paymentId}`,
    createdAt: new Date().toISOString()
  };
  
  res.json({ success: true, payment });
});

// Admin API
app.get('/api/admin/stats', (req, res) => {
  const totalConnections = connections.size;
  const activeConnections = Array.from(connections.values())
    .filter(c => c.vendor.name && c.host.name).length;
  
  res.json({
    totalConnections,
    activeConnections,
    totalPayments: 0,
    totalRevenue: 0
  });
});

app.get('/api/admin/connections', (req, res) => {
  const allConnections = Array.from(connections.values());
  res.json(allConnections);
});

module.exports = app;
