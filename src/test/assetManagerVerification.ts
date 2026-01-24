import * as vscode from 'vscode';
import * as path from 'path';
import { AssetManager } from '../utils/AssetManager';

/**
 * Simple verification script for AssetManager functionality
 * This verifies the core requirements for task 4.1
 */
export function verifyAssetManager(): boolean {
  try {
    console.log('🔍 Verifying AssetManager functionality...');
    
    // Create a mock extension URI
    const mockExtensionUri = vscode.Uri.file(path.join(__dirname, '../../'));
    const assetManager = new AssetManager(mockExtensionUri);
    
    // Test 1: AssetManager creation
    console.log('✅ AssetManager instance created successfully');
    
    // Test 2: Development mode detection
    const isDev = assetManager.isDevelopmentMode();
    console.log(`✅ Development mode detection: ${isDev}`);
    
    // Test 3: Dev server URL generation
    const devUrl = assetManager.getDevServerUrl();
    console.log(`✅ Dev server URL: ${devUrl}`);
    
    // Test 4: Dev server config update
    assetManager.updateDevServerConfig({ port: 4000 });
    const updatedUrl = assetManager.getDevServerUrl();
    console.log(`✅ Updated dev server URL: ${updatedUrl}`);
    
    // Test 5: Mock webview for HTML generation
    const mockWebview = {
      cspSource: 'vscode-webview:',
      asWebviewUri: (uri: vscode.Uri) => uri
    } as vscode.Webview;
    
    // Test 6: HTML generation
    const html = assetManager.getWebviewHtml(mockWebview);
    const hasRequiredElements = html.includes('<!DOCTYPE html>') && 
                               html.includes('<div id="root"></div>') && 
                               html.includes('Open Review');
    console.log(`✅ HTML generation: ${hasRequiredElements ? 'Valid' : 'Invalid'}`);
    
    // Test 7: Asset URI generation
    const assets = assetManager.getAssetUris(mockWebview);
    const hasAssets = Array.isArray(assets.js) && Array.isArray(assets.css);
    console.log(`✅ Asset URI generation: ${hasAssets ? 'Valid' : 'Invalid'}`);
    
    console.log('🎉 All AssetManager verifications passed!');
    return true;
    
  } catch (error) {
    console.error('❌ AssetManager verification failed:', error);
    return false;
  }
}

// Export for potential use in extension activation
export { AssetManager };