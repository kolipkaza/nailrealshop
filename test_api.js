const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

const DB_DIR = path.join(__dirname, 'data');

// Test loading services
async function testServices() {
    console.log('\n=== Testing GET /api/services ===\n');
    
    try {
        const filePath = path.join(DB_DIR, 'services.json');
        const data = await require('fs').promises.readFile(filePath, 'utf8');
        const services = JSON.parse(data);
        
        console.log('✅ Successfully loaded services.json');
        console.log(`📊 Total services: ${services.length}\n`);
        
        services.forEach(s => {
            console.log(`ID: ${s.id}`);
            console.log(`Name: ${s.name}`);
            console.log(`Price: ${s.price}`);
            console.log(`Category: ${s.category}`);
            console.log('---');
        });
        
        console.log('\n=== Test Passed ===\n');
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

// Start simple server to test
app.get('/api/test/services', async (req, res) => {
    try {
        const filePath = path.join(DB_DIR, 'services.json');
        const data = await require('fs').promises.readFile(filePath, 'utf8');
        const services = JSON.parse(data);
        res.json({ 
            success: true, 
            count: services.length,
            services: services 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.listen(3001, () => {
    console.log('🧪 Test Server running on http://localhost:3001');
    console.log('📝 Testing GET /api/test/services...\n');
    
    testServices();
});