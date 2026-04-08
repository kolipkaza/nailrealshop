const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data');
const servicesFile = path.join(dbPath, 'services.json');

let report = '=== Database Debug ===\n';
report += '__dirname: ' + __dirname + '\n';
report += 'dbPath: ' + dbPath + '\n';
report += 'servicesFile: ' + servicesFile + '\n\n';

// Check if folder exists
if (fs.existsSync(dbPath)) {
  report += '✅ data folder exists\n';
  report += 'Files: ' + fs.readdirSync(dbPath).join(', ') + '\n\n';
} else {
  report += '❌ data folder NOT FOUND\n\n';
}

// Check if file exists
if (fs.existsSync(servicesFile)) {
  report += '✅ services.json exists\n';
  const data = JSON.parse(fs.readFileSync(servicesFile, 'utf8'));
  report += 'Services count: ' + data.length + '\n';
  if (data.length > 0) {
    report += 'First service: ' + JSON.stringify(data[0]) + '\n';
  }
} else {
  report += '❌ services.json NOT FOUND\n';
}

fs.writeFileSync('/tmp/db_debug.txt', report);
console.log(report);
