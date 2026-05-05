const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store payments (temporary - resets on restart)
let payments = [];

// TEST ENDPOINT - Check if backend is working
app.get('/', (req, res) => {
    res.json({ 
        message: "✅ Payment backend is running!", 
        status: "active",
        time: new Date().toISOString()
    });
});

// Submit payment (customer clicks "I have paid")
app.post('/api/submit-payment', (req, res) => {
    const { orderId, amount, utr, email } = req.body;
    
    console.log("📥 Payment received:", { orderId, amount, utr, email });
    
    // Save payment
    const payment = {
        orderId,
        amount,
        utr,
        email,
        status: 'pending',
        time: new Date().toISOString()
    };
    payments.push(payment);
    
    // Send response
    res.json({ 
        success: true, 
        message: "Payment submitted! We'll verify soon.",
        orderId: orderId
    });
});

// Check payment status
app.get('/api/status/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const payment = payments.find(p => p.orderId === orderId);
    
    if (payment) {
        res.json({ success: true, status: payment.status });
    } else {
        res.json({ success: true, status: 'not_found' });
    }
});

// Admin: View all payments (visit /admin in browser)
app.get('/admin', (req, res) => {
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin - Payment List</title>
            <meta name="viewport" content="width=device-width">
            <style>
                body { font-family: Arial; padding: 20px; max-width: 800px; margin: auto; }
                .payment { background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 8px; }
                .pending { border-left: 4px solid orange; }
                .verified { border-left: 4px solid green; background: #e8f5e9; }
                button { background: #4CAF50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>💰 Payment Admin Panel</h1>
            <h3>Pending Payments: ${payments.filter(p => p.status === 'pending').length}</h3>
            <div id="payments">
    `;
    
    payments.forEach((p, index) => {
        html += `
            <div class="payment ${p.status}">
                <strong>Order ID:</strong> ${p.orderId}<br>
                <strong>Amount:</strong> ₹${p.amount}<br>
                <strong>UTR:</strong> ${p.utr}<br>
                <strong>Email:</strong> ${p.email || 'Not provided'}<br>
                <strong>Status:</strong> ${p.status}<br>
                <strong>Time:</strong> ${p.time}<br>
                ${p.status === 'pending' ? `<button onclick="verify('${p.orderId}')">✅ Mark as Verified</button>` : '✅ Verified'}
                <hr>
            </div>
        `;
    });
    
    html += `
            </div>
            <script>
                async function verify(orderId) {
                    await fetch('/api/verify/' + orderId, { method: 'POST' });
                    alert('Payment verified!');
                    location.reload();
                }
            </script>
        </body>
        </html>
    `;
    
    res.send(html);
});

// Verify payment (admin only - no auth for simplicity)
app.post('/api/verify/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const payment = payments.find(p => p.orderId === orderId);
    
    if (payment) {
        payment.status = 'verified';
        console.log(`✅ Verified: ${orderId}`);
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Admin panel: http://localhost:${PORT}/admin`);
});
