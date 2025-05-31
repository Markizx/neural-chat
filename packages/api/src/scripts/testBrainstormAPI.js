require('dotenv').config();
const mongoose = require('mongoose');
const BrainstormSession = require('../models/brainstorm.model');

async function testBrainstormAPI() {
  try {
    console.log('🔗 Connecting to MongoDB:', process.env.MONGODB_URI ? 'URI found' : 'URI missing');
    
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Находим последнюю brainstorm сессию
    const session = await BrainstormSession.findOne().sort({ createdAt: -1 });
    
    if (!session) {
      console.log('❌ No brainstorm sessions found');
      return;
    }

    console.log('🔍 Latest brainstorm session:');
    console.log('ID:', session._id);
    console.log('Topic:', session.topic);
    console.log('Status:', session.status);
    console.log('Current Turn:', session.currentTurn);
    console.log('Max Turns:', session.settings?.maxTurns);
    console.log('Messages count:', session.messages?.length || 0);
    
    console.log('\n📝 Messages:');
    if (session.messages && session.messages.length > 0) {
      session.messages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.speaker}]: ${msg.content.substring(0, 100)}...`);
      });
    } else {
      console.log('No messages found');
    }

    console.log('\n🔧 Full session structure:');
    console.log(JSON.stringify(session.toJSON(), null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testBrainstormAPI(); 