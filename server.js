const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (replace with database in production)
const connections = new Map();
const payments = new Map();

// Email configuration (replace with your SMTP settings)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

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
app.post('/api/connections', async (req, res) => {
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
    
    // Send email notification (optional)
    if (referrer.email) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER || 'noreply@capitalize.com',
          to: referrer.email,
          subject: 'Connection Created - CAPITALIZE',
          html: `
            <h2>Connection Created Successfully!</h2>
            <p>Your connection "${title}" has been created.</p>
            <p><strong>Connection Code:</strong> ${id}</p>
            <p>Share this code with your vendor and host to get started.</p>
            <p><a href="${req.get('origin')}/connection/${id}">View Connection</a></p>
          `
        });
      } catch (emailError) {
        console.log('Email sending failed:', emailError.message);
      }
    }
    
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

app.put('/api/connections/:id/join', async (req, res) => {
  try {
    const { role, participant } = req.body;
    const connection = connections.get(req.params.id);
    
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }
    
    if (role === 'vendor' || role === 'host') {
      connection[role] = participant;
      connections.set(req.params.id, connection);
      
      // Send welcome email
      if (participant.email) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER || 'noreply@capitalize.com',
            to: participant.email,
            subject: `Welcome to ${connection.title} - CAPITALIZE`,
            html: `
              <h2>Welcome to the connection!</h2>
              <p>You've successfully joined "${connection.title}" as ${role}.</p>
              <p><a href="${req.get('origin')}/connection/${req.params.id}">Access Your Connection</a></p>
            `
          });
        } catch (emailError) {
          console.log('Email sending failed:', emailError.message);
        }
      }
      
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
  
  payments.set(paymentId, payment);
  
  res.json({ success: true, payment });
});

// Admin API
app.get('/api/admin/stats', (req, res) => {
  const totalConnections = connections.size;
  const activeConnections = Array.from(connections.values())
    .filter(c => c.vendor.name && c.host.name).length;
  const totalPayments = payments.size;
  const totalRevenue = Array.from(payments.values())
    .reduce((sum, p) => sum + (p.amount * 0.05), 0); // 5% platform fee
  
  res.json({
    totalConnections,
    activeConnections,
    totalPayments,
    totalRevenue
  });
});

app.get('/api/admin/connections', (req, res) => {
  const allConnections = Array.from(connections.values());
  res.json(allConnections);
});

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-connection', (connectionId) => {
    socket.join(connectionId);
  });
  
  socket.on('send-message', ({ connectionId, message }) => {
    const connection = connections.get(connectionId);
    if (connection) {
      const fullMessage = {
        ...message,
        timestamp: new Date().toISOString()
      };
      
      connection.messages.push(fullMessage);
      connections.set(connectionId, connection);
      
      io.to(connectionId).emit('new-message', fullMessage);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
