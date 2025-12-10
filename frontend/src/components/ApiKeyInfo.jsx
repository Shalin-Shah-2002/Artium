import './ApiKeyInfo.css';

function ApiKeyInfo() {
  return (
    <div className="api-key-info">
      <h4>🔑 How to Get Your Gemini API Key</h4>
      <ol>
        <li>Visit <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">ai.google.dev</a></li>
        <li>Sign in with your Google account</li>
        <li>Click on "Get API key" in the top navigation</li>
        <li>Create a new API key or use an existing one</li>
        <li>Copy the API key and paste it above</li>
      </ol>
      <div className="info-note">
        <strong>Note:</strong> Your API key is only used for generating articles and is never stored on our servers. 
        You can optionally save it in your browser's local storage for convenience.
      </div>
    </div>
  );
}

export default ApiKeyInfo;
