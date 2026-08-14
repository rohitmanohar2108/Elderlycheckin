import { initializeDatabase } from '../src/lib/init-db';
import { startScheduler } from '../src/lib/scheduler';

async function main() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Starting scheduler...');
    startScheduler();
    
    console.log('Initialization complete. Server is ready.');
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

main();
