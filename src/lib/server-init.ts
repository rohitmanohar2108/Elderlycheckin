import { startScheduler } from './scheduler';
import { initializeDatabase } from './init-db';

let isInitialized = false;

export async function initializeServer() {
  if (isInitialized) {
    return;
  }

  try {
    console.log('Initializing server...');
    
    // Initialize database schema
    await initializeDatabase();
    
    // Start the scheduler
    startScheduler();
    
    isInitialized = true;
    console.log('Server initialized successfully');
  } catch (error) {
    console.error('Server initialization error:', error);
    throw error;
  }
}
