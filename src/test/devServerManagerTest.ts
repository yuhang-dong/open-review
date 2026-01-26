import * as assert from 'assert';
import * as path from 'path';
import { DevServerManager, DevServerStatus } from '../utils/DevServerManager';

/**
 * Basic unit tests for DevServerManager
 * These tests verify the core functionality without actually starting servers
 */
export function testDevServerManager(): void {
  console.log('🔍 Testing DevServerManager...');
  
  try {
    // Mock extension URI
    const mockExtensionUri = {
      fsPath: path.join(__dirname, '../../')
    } as any;
    
    // Test 1: DevServerManager creation
    const manager = new DevServerManager(mockExtensionUri);
    assert.ok(manager, 'DevServerManager should be created');
    console.log('✅ DevServerManager creation test passed');
    
    // Test 2: Initial status should be STOPPED
    assert.strictEqual(manager.status, DevServerStatus.STOPPED, 'Initial status should be STOPPED');
    console.log('✅ Initial status test passed');
    
    // Test 3: Server URL generation
    const serverUrl = manager.getServerUrl();
    assert.ok(serverUrl.includes('http://'), 'Server URL should be HTTP');
    assert.ok(serverUrl.includes('localhost'), 'Server URL should include localhost');
    console.log(`✅ Server URL generation test passed: ${serverUrl}`);
    
    // Test 4: HMR URL generation
    const hmrUrl = manager.getHmrUrl();
    assert.ok(hmrUrl.includes('ws://'), 'HMR URL should be WebSocket');
    assert.ok(hmrUrl.includes('localhost'), 'HMR URL should include localhost');
    console.log(`✅ HMR URL generation test passed: ${hmrUrl}`);
    
    // Test 5: Config access
    const config = manager.config;
    assert.ok(config.port > 0, 'Config should have valid port');
    assert.ok(config.host, 'Config should have host');
    console.log('✅ Config access test passed');
    
    // Test 6: Cleanup
    manager.dispose();
    console.log('✅ Disposal test passed');
    
    console.log('🎉 All DevServerManager tests passed!');
    
  } catch (error) {
    console.error('❌ DevServerManager test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDevServerManager();
}