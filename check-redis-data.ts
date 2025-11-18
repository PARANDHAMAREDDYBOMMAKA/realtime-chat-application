/**
 * Check Redis Data
 *
 * Run this script to see what's currently stored in your Redis cache
 *
 * Usage: npx tsx check-redis-data.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { redisClient, cacheService } from './lib/redis';

async function checkRedisData() {
  console.log('\n🔍 Checking Redis Data...\n');
  console.log('='.repeat(60));

  try {
    // Test connection
    const isConnected = await redisClient.ping();

    if (!isConnected) {
      console.error('❌ Not connected to Redis!');
      return;
    }

    console.log('✅ Connected to Redis\n');

    // Get all keys
    const client = await redisClient.getClient();
    const allKeys = await client.keys('*');

    if (allKeys.length === 0) {
      console.log('📭 No data in Redis yet.');
      console.log('\n💡 To populate Redis cache:');
      console.log('   1. Make sure CacheProvider is added to your app');
      console.log('   2. Start your app: npm run dev');
      console.log('   3. Login and browse around');
      console.log('   4. Run this script again\n');
      return;
    }

    console.log(`📊 Found ${allKeys.length} keys in Redis:\n`);

    // Group keys by type
    const keysByType: Record<string, string[]> = {};

    for (const key of allKeys) {
      const type = key.split(':')[0];
      if (!keysByType[type]) {
        keysByType[type] = [];
      }
      keysByType[type].push(key);
    }

    // Display keys by type
    for (const [type, keys] of Object.entries(keysByType)) {
      console.log(`\n📁 ${type.toUpperCase()} (${keys.length} keys):`);
      console.log('─'.repeat(60));

      for (const key of keys) {
        const data = await cacheService.get(key);

        if (data) {
          let preview = '';

          if (Array.isArray(data)) {
            preview = `Array with ${data.length} items`;
          } else if (typeof data === 'object') {
            const objKeys = Object.keys(data);
            if (objKeys.includes('data') && objKeys.includes('contentType')) {
              // Image data
              preview = `Image (${data.contentType})`;
            } else {
              preview = `Object with ${objKeys.length} keys`;
            }
          } else {
            preview = String(data).slice(0, 50);
          }

          console.log(`   🔑 ${key}`);
          console.log(`      └─ ${preview}`);
        }
      }
    }

    // Show memory usage
    console.log('\n' + '='.repeat(60));
    console.log('\n💾 Cache Summary:\n');

    const summary: Record<string, number> = {};
    for (const [type, keys] of Object.entries(keysByType)) {
      summary[type] = keys.length;
    }

    for (const [type, count] of Object.entries(summary)) {
      console.log(`   ${type}: ${count} key(s)`);
    }

    console.log(`\n   Total: ${allKeys.length} key(s) in Redis`);

    // Sample data
    console.log('\n📝 Sample Data:\n');

    // Show conversations if exists
    const conversationsKey = allKeys.find(k => k.includes('conversations'));
    if (conversationsKey) {
      const conversations = await cacheService.get(conversationsKey);
      if (Array.isArray(conversations)) {
        console.log(`   Conversations: ${conversations.length} cached`);
      }
    }

    // Show messages if exists
    const messagesKey = allKeys.find(k => k.includes('messages'));
    if (messagesKey) {
      const messages = await cacheService.get(messagesKey);
      if (Array.isArray(messages)) {
        console.log(`   Messages: ${messages.length} cached`);
      }
    }

    // Show friends if exists
    const friendsKey = allKeys.find(k => k.includes('friends'));
    if (friendsKey) {
      const friends = await cacheService.get(friendsKey);
      if (Array.isArray(friends)) {
        console.log(`   Friends: ${friends.length} cached`);
      }
    }

    console.log('\n✅ Redis data check complete!\n');

  } catch (error) {
    console.error('\n❌ Error checking Redis:', error);
  } finally {
    await redisClient.disconnect();
  }
}

checkRedisData();
