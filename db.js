const fs = require('fs').promises;
const path = require('path');

const DB_DIR = process.env.DB_PATH || path.join(__dirname, 'data');

// Initialize database directory
async function initDB() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (err) {
    // Directory exists
  }
}

// Load data from JSON file
async function load(table) {
  try {
    const filePath = path.join(DB_DIR, `${table}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Save data to JSON file
async function save(table, data) {
  const filePath = path.join(DB_DIR, `${table}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Get single record by ID
async function getById(table, id) {
  const data = await load(table);
  return data.find(item => item.id === id);
}

// Add new record
async function add(table, record) {
  const data = await load(table);
  record.id = Date.now().toString();
  record.createdAt = new Date().toISOString();
  data.push(record);
  await save(table, data);
  return record;
}

// Update record
async function update(table, id, updates) {
  const data = await load(table);
  const index = data.findIndex(item => item.id === id);
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
  await save(table, data);
  return data[index];
}

// Delete record
async function remove(table, id) {
  const data = await load(table);
  const filtered = data.filter(item => item.id !== id);
  await save(table, filtered);
  return filtered.length < data.length;
}

module.exports = { initDB, load, save, getById, add, update, remove };
