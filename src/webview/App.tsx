import React from 'react';
import { ReviewPanel } from './components';
import { VSCodeAPI } from './types';

// Declare VS Code API
declare const acquireVsCodeApi: () => VSCodeAPI;

const App: React.FC = () => {
  const vscode = acquireVsCodeApi();

  return (
    <div className="app">
      <ReviewPanel vscode={vscode} />
    </div>
  );
};

export default App;