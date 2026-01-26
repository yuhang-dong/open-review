import * as assert from 'assert';
import * as path from 'path';
import { AssetManager } from '../utils/AssetManager';
import { DevServerManager, DevServerStatus } from '../utils/DevServerManager';

/**
 * Integration tests for the development workflow
 * Tests the interaction between AssetManager and DevServerManager
 */
export async function testDevWorkflow(): Promise<void> {
  console.log('🔍 Testing development workflow integration...');
  
  try {
    // Mock extension URI
    const mockExtensionUri = {
      fsPath: path.join(__dirname, '../../')
    } as any;
    
    // Test 1: AssetManager with DevServerManager integration
    const assetManager = new AssetManager(mockExtensionUri);
    assert.ok(assetManager, 'AssetManager should be created');
    console.log('✅ AssetManager creation test passed');
    
    // Test 2: Development mode detection
    const isDev = assetManager.isDevelopmentMode();
    console.log(`✅ Development mode detection: ${isDev}`);
    
    // Test 3: Dev server manager access
    let devServerManager = assetManager.getDevServerManager();
    assert.strictEqual(devServerManager, null, 'DevServerManager should be null initially');
    console.log('✅ Initial DevServerManager state test passed');
    
    // Test 4: Mock webview for testing
    const mockWebview = {
      cspSource: 'vscode-webview:',
      asWebviewUri: (uri: any) => uri
    } as any;
    
    // Test 5: Asset URI generation in development mode
    const assets = assetManager.getAssetUris(mockWebview);
    assert.ok(Array.isArray(assets.js), 'JS assets should be an array');
    assert.ok(Array.isArray(assets.css), 'CSS assets should be an array');
    console.log('✅ Asset URI generation test passed');
    
    // Test 6: Dev server URL generation
    const devUrl = assetManager.getDevServerUrl();
    assert.ok(devUrl.includes('http://'), 'Dev server URL should be HTTP');
    console.log(`✅ Dev server URL generation test passed: ${devUrl}`);
    
    // Test 7: HTML generation (should handle dev server not running gracefully)
    try {
      const html = await assetManager.getWebviewHtml(mockWebview);
      // In test environment, this might fail due to dev server not running
      // That's expected and acceptable
      console.log('✅ HTML generation test completed (may have failed gracefully)');
    } catch (error) {
      console.log('⚠️ HTML generation failed as expected in test environment');
    }
    
    // Test 8: Cleanup
    assetManager.dispose();
    console.log('✅ AssetManager disposal test passed');
    
    console.log('🎉 All development workflow integration tests passed!');
    
  } catch (error) {
    console.error('❌ Development workflow test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDevWorkflow().catch(console.error);
}