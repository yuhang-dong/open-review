import React from 'react';
import { ReviewPanel } from './components';
import { getVSCodeAPIWrapper } from './api';

const App: React.FC = () => {
  // Use our API wrapper instead of raw VS Code API
  const vscodeWrapper = getVSCodeAPIWrapper();

  return (
    <div className="app">
      <ReviewPanel vscode={vscodeWrapper} />
    </div>
  );
};

export default App;