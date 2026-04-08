const express = require('express');
const app = express();
const PORT = 3000;

app.get('/api/services', (req, res) => {
    res.json([
        {"id": "1", "name": "Test Service 1", "price": 300},
        {"id": "2", "name": "Test Service 2", "price": 400}
    ]);
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Server</title>
        </head>
        <body>
            <h1>Test Server Running</h1>
            <p>Services: <span id="services-count">Loading...</span></p>
            <script>
                fetch('/api/services')
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('services-count').textContent = data.length;
                    })
                    .catch(err => {
                        document.getElementById('services-count').textContent = 'Error';
                    });
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('Test server running on port 3000');
});