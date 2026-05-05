import { getDB, initializeDefaults } from './core/storage.js';
import { App } from './app/App.js';

async function main() {
  try {
    // Initialize database and default data
    await initializeDefaults();
    
    // Verify database connection
    await getDB();
    
    // Initialize and mount the application
    const app = new App();
    await app.init();
    
    // Remove loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.remove(), 300);
    }
    
  } catch (error) {
    console.error('Failed to initialize Theatro:', error);
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="loading-logo" style="color: #ef4444;">Failed to Start</div>
        <p style="color: #a1a1aa; text-align: center; max-width: 300px;">
          ${error instanceof Error ? error.message : 'Unknown error'}
        </p>
      `;
    }
  }
}

main();
