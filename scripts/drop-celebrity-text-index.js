const mongoose = require('mongoose');

try { require('dotenv').config({ path: '.env' }); } catch (_) {}

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!uri) {
  console.error('No MONGODB_URI / DATABASE_URL found in .env');
  process.exit(1);
}

mongoose.connect(uri).then(async () => {
  const col = mongoose.connection.db.collection('celebrities');
  try {
    // Find and drop any text index (there should be only one)
    const indexes = await col.indexes();
    const textIdx = indexes.find((idx) => idx.weights);
    if (!textIdx) {
      console.log('No text index found on celebrities collection — nothing to drop');
    } else {
      await col.dropIndex(textIdx.name);
      console.log(`✓ Dropped text index "${textIdx.name}" from celebrities`);
    }
  } catch (e) {
    if (e.code === 27) console.log('Index did not exist — nothing to drop');
    else console.error('Error:', e.message);
  }
  await mongoose.disconnect();
  console.log('Done — restart the dev server so Mongoose recreates the index.');
});
