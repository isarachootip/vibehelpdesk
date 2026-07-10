const fs = require('fs');
try {
  const buffer = fs.readFileSync('public/rich_menu_thai.png');
  const width = buffer.readInt32BE(16);
  const height = buffer.readInt32BE(20);
  console.log("DIMENSIONS:", width, "x", height);
} catch (e) {
  console.error(e);
}
