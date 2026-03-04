import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from './config';
import './App.css';

function App() {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toolParams, setToolParams] = useState({});

  // 获取可用工具列表
  const listTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(config.mcp.url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      }, {
        headers: config.mcp.headers
      });
      
      if (response.data.result && response.data.result.tools) {
        setTools(response.data.result.tools);
      } else {
        setError('No tools found in response');
      }
    } catch (err) {
      setError(`Failed to fetch tools: ${err.message}`);
      console.error('Tools list error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 调用特定工具
  const callTool = async (toolName, parameters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(config.mcp.url, {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: parameters
        }
      }, {
        headers: config.mcp.headers
      });
      
      setResult(response.data);
    } catch (err) {
      setError(`Tool call failed: ${err.message}`);
      console.error('Tool call error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初始化时获取工具列表
  useEffect(() => {
    listTools();
  }, []);

  // 处理参数输入变化
  const handleParamChange = (paramName, value) => {
    setToolParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  // 渲染工具参数输入表单
  const renderToolForm = (tool) => {
    if (!tool.inputSchema) return null;
    
    const schema = tool.inputSchema;
    const properties = schema.properties || {};
    
    return Object.keys(properties).map(key => (
      <div key={key} className="param-input">
        <label>{properties[key].title || key}:</label>
        <input
          type="text"
          placeholder={properties[key].description || `Enter ${key}`}
          onChange={(e) => handleParamChange(key, e.target.value)}
        />
      </div>
    ));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stitch MCP Client</h1>
        <p>Google Stitch Model Context Protocol Implementation</p>
      </header>

      <div className="container">
        {/* 工具列表部分 */}
        <section className="tools-section">
          <h2>Available MCP Tools</h2>
          <button onClick={listTools} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Tools'}
          </button>
          
          {error && <div className="error">{error}</div>}
          
          <div className="tools-grid">
            {tools.map(tool => (
              <div key={tool.name} className="tool-card">
                <h3>{tool.name}</h3>
                <p className="tool-description">{tool.description || 'No description available'}</p>
                
                {/* 参数输入 */}
                {renderToolForm(tool)}
                
                <button 
                  onClick={() => callTool(tool.name, toolParams)}
                  disabled={loading}
                  className="call-button"
                >
                  Call Tool
                </button>
              </div>
            ))}
          </div>
          
          {tools.length === 0 && !loading && !error && (
            <p>No tools available. The MCP server may require different endpoints.</p>
          )}
        </section>

        {/* 结果显示部分 */}
        <section className="results-section">
          <h2>Results</h2>
          {loading && <div className="loading">Processing MCP request...</div>}
          
          {result && (
            <div className="result-container">
              <h3>Response:</h3>
              <pre className="result-json">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </section>

        {/* 原始MCP配置信息 */}
        <section className="config-section">
          <h2>MCP Configuration</h2>
          <div className="config-info">
            <p><strong>Endpoint:</strong> {config.mcp.url}</p>
            <p><strong>API Key:</strong> {config.mcp.headers['X-Goog-Api-Key'].substring(0, 10)}...</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;