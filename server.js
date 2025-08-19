const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Simple in-memory storage
const connections = new Map();

// Generate simple ID
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

// API - Create connection
app.post('/api/connections', (req, res) => {
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
});

// API - Get connection
app.get('/api/connections/:id', (req, res) => {
  const connection = connections.get(req.params.id);
  if (connection) {
    res.json({ success: true, connection });
  } else {
    res.json({ success: false, message: 'Connection not found' });
  }
});

// API - Join connection
app.put('/api/connections/:id/join', (req, res) => {
  const { role, participant } = req.body;
  const connection = connections.get(req.params.id);
  
  if (!connection) {
    return res.json({ success: false, message: 'Connection not found' });
  }
  
  if (role === 'vendor' || role === 'host') {
    connection[role] = participant;
    connections.set(req.params.id, connection);
    res.json({ success: true, connection });
  } else {
    res.json({ success: false, message: 'Invalid role' });
  }
});

// API - Save notes
app.put('/api/connections/:id/notes', (req, res) => {
  const { notes } = req.body;
  const connection = connections.get(req.params.id);
  
  if (connection) {
    connection.notes = notes;
    connections.set(req.params.id, connection);
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Connection not found' });
  }
});

// API - Chat messages
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
    res.json({ success: false, message: 'Connection not found' });
  }
});

app.get('/api/connections/:id/messages', (req, res) => {
  const connection = connections.get(req.params.id);
  
  if (connection) {
    res.json({ success: true, messages: connection.messages || [] });
  } else {
    res.json({ success: false, message: 'Connection not found' });
  }
});

// API - Payment initiation
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

// API - Admin stats
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
