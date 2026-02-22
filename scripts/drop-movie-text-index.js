const mongoose = require('mongoose');

// Try dotenv; if not available read the env var directly
try { require('dotenv').config({ path: '.env' }); } catch (_) {}

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!uri) {
  console.error('No MONGODB_URI / DATABASE_URL found in .env');
  process.exit(1);
}

mongoose.connect(uri).then(async () => {
  const col = mongoose.connection.db.collection('movies');
  try {
    await col.dropIndex('movie_text_search');
    console.log('✓ Dropped old movie_text_search index');
  } catch (e) {
    if (e.code === 27) console.log('Index did not exist — nothing to drop');
    else console.error('Error:', e.message);
  }
  await mongoose.disconnect();
  console.log('Done — restart the dev server to recreate the index.');
});
