const mongoose = require('mongoose');
const BrainstormSession = require('../models/brainstorm.model');
require('dotenv').config();

async function testBrainstormSessions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neuralchat');
    console.log('✅ Connected to MongoDB');

    // Find all brainstorm sessions
    const sessions = await BrainstormSession.find({});
    console.log('📊 Total sessions in database:', sessions.length);

    if (sessions.length > 0) {
      console.log('\n🔍 Testing session data:');
      
      for (const session of sessions) {
        console.log(`\n📝 Session ${session._id}:`);
        console.log('  Topic:', session.topic);
        console.log('  Status:', session.status);
        console.log('  Messages array exists:', !!session.messages);
        console.log('  Messages length:', session.messages?.length || 0);
        console.log('  Settings:', session.settings);
        
        try {
          console.log('  Current turn (virtual):', session.currentTurn);
        } catch (error) {
          console.log('  ❌ Error getting currentTurn:', error.message);
        }
        
        try {
          console.log('  Is finished (virtual):', session.isFinished);
        } catch (error) {
          console.log('  ❌ Error getting isFinished:', error.message);
        }
      }
    } else {
      console.log('📭 No brainstorm sessions found in database');
      
      // Create a test session
      console.log('\n🔧 Creating test session...');
      const testSession = new BrainstormSession({
        chatId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        topic: 'Test Brainstorm Session',
        description: 'This is a test session',
        participants: {
          claude: { model: 'claude-3.7-sonnet' },
          grok: { model: 'grok-2' }
        },
        messages: [],
        status: 'active',
        settings: {
          turnDuration: 60,
          maxTurns: 10,
          moderationLevel: 'medium',
          format: 'brainstorm'
        },
        totalTokens: 0
      });
      
      await testSession.save();
      console.log('✅ Test session created:', testSession._id);
      
      // Test virtual fields
      console.log('  Current turn:', testSession.currentTurn);
      console.log('  Is finished:', testSession.isFinished);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testBrainstormSessions(); 