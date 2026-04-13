const fs = require('fs');
const lines = fs.readFileSync('careq.html', 'utf8').split('\n');

const css = lines.slice(10, 1187).join('\n');
fs.writeFileSync('styles.css', css);

const js = lines.slice(1687, 1802).join('\n');
fs.writeFileSync('app.js', js);

let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CareQ - Hospital Queue & Bed Management</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
` + lines.slice(1189, 1686).join('\n') + `
    <script src="app.js"></script>
</body>
</html>`;
fs.writeFileSync('index.html', html);

if(fs.existsSync('staff.html')) fs.unlinkSync('staff.html');
if(fs.existsSync('index_body.txt')) fs.unlinkSync('index_body.txt');

console.log('Extraction complete');
