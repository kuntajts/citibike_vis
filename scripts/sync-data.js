const fs = require('fs');
const path = require('path');

const dataSourceDir = path.resolve(__dirname, '../data_source');
const publicDataDir = path.resolve(__dirname, '../public/data');

function syncData() {
  console.log('Syncing data for build/dev...');

  // 1. Ensure public/data exists and is empty
  if (fs.existsSync(publicDataDir)) {
    fs.readdirSync(publicDataDir).forEach((file) => {
      fs.unlinkSync(path.join(publicDataDir, file));
    });
  } else {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }

  // 2. Calculate target dates (day before, today, and 3 days after)
  const today = new Date();
  const dates = [];
  for (let i = -1; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${mm}-${dd}`);
  }

  // 3. Copy files from data_source to public/data
  console.log(`Target range: ${dates[0]} to ${dates[dates.length - 1]}`);
  let count = 0;
  dates.forEach((dateStr) => {
    const fileName = `${dateStr}.json`;
    const src = path.join(dataSourceDir, fileName);
    const dest = path.join(publicDataDir, fileName);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  Synced: ${fileName}`);
      count++;
    } else {
      console.warn(`  Warning: ${fileName} not found in data_source`);
    }
  });

  console.log(`Successfully synced ${count} data files.`);
}

syncData();
