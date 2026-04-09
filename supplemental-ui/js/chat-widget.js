// Floating Chat Widget for Antora Documentation
(function() {
  const BACKEND_URL = 'http://localhost:8080/api/chat';
  
  // Create widget styles (will be injected into the page)
  const createStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      #chat-widget-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #01696f 0%, #04898f 100%);
        border: none;
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(1, 105, 111, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transition: all 0.3s ease;
        font-family: Inter, system-ui, sans-serif;
      }
      
      #chat-widget-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(1, 105, 111, 0.4);
      }
      
      #chat-widget-button:active {
        transform: scale(0.95);
      }
      
      #chat-widget-panel {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 360px;
        max-height: 600px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        z-index: 998;
        border: 1px solid rgba(40, 37, 29, 0.12);
        overflow: hidden;
      }
      
      #chat-widget-panel.open {
        display: flex;
        animation: slideUp 0.3s ease;
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .chat-widget-header {
        padding: 16px;
        border-bottom: 1px solid rgba(40, 37, 29, 0.12);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f7f6f2;
      }
      
      .chat-widget-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #28251d;
      }
      
      .chat-widget-close {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 20px;
        color: #6f6b62;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .chat-widget-close:hover {
        color: #28251d;
      }
      
      #chat-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column-reverse;
        gap: 12px;
      }
      
      .chat-widget-message {
        padding: 12px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.5;
      }
      
      .chat-widget-message.user {
        background: rgba(1, 105, 111, 0.1);
        margin-left: 20px;
        text-align: right;
      }
      
      .chat-widget-message.assistant {
        background: #f3f0ec;
        margin-right: 20px;
      }
      
      .chat-widget-message strong {
        display: block;
        margin-bottom: 4px;
        font-weight: 600;
        color: #28251d;
      }
      
      .chat-widget-message.assistant .sources {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(40, 37, 29, 0.12);
        font-size: 12px;
      }
      
      .chat-widget-message.assistant .sources strong {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
      }
      
      .chat-widget-message.assistant .sources a {
        display: block;
        color: #01696f;
        text-decoration: none;
        margin-top: 4px;
      }
      
      .chat-widget-message.assistant .sources a:hover {
        text-decoration: underline;
      }
      
      #chat-widget-status {
        padding: 0 16px;
        font-size: 12px;
        color: #6f6b62;
        height: 16px;
        overflow: hidden;
      }
      
      #chat-widget-form {
        padding: 16px;
        border-top: 1px solid rgba(40, 37, 29, 0.12);
        display: flex;
        gap: 8px;
      }
      
      #chat-widget-form input {
        flex: 1;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid rgba(40, 37, 29, 0.12);
        font-size: 13px;
        font-family: inherit;
        background: #ffffff;
        color: #28251d;
      }
      
      #chat-widget-form input::placeholder {
        color: #6f6b62;
      }
      
      #chat-widget-form input:focus {
        outline: none;
        border-color: #01696f;
        box-shadow: 0 0 0 2px rgba(1, 105, 111, 0.1);
      }
      
      #chat-widget-form button {
        padding: 10px 12px;
        border-radius: 8px;
        border: none;
        background: #01696f;
        color: white;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: background 0.2s ease;
      }
      
      #chat-widget-form button:hover {
        background: #04898f;
      }
      
      #chat-widget-form button:active {
        background: #01545a;
      }
      
      #chat-widget-form button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        #chat-widget-panel {
          background: #1c1b19;
          border-color: rgba(255, 255, 255, 0.12);
          color: #d8d5cf;
        }
        
        .chat-widget-header {
          background: #23211f;
          border-bottom-color: rgba(255, 255, 255, 0.12);
          color: #d8d5cf;
        }
        
        .chat-widget-header h3 {
          color: #d8d5cf;
        }
        
        .chat-widget-close {
          color: #9b958a;
        }
        
        .chat-widget-close:hover {
          color: #d8d5cf;
        }
        
        .chat-widget-message.user {
          background: rgba(79, 152, 163, 0.2);
        }
        
        .chat-widget-message.assistant {
          background: #23211f;
        }
        
        .chat-widget-message strong {
          color: #d8d5cf;
        }
        
        .chat-widget-message.assistant .sources {
          border-top-color: rgba(255, 255, 255, 0.12);
        }
        
        #chat-widget-form input {
          background: #23211f;
          color: #d8d5cf;
          border-color: rgba(255, 255, 255, 0.12);
        }
        
        #chat-widget-form input::placeholder {
          color: #9b958a;
        }
        
        #chat-widget-form input:focus {
          border-color: #4f98a3;
          box-shadow: 0 0 0 2px rgba(79, 152, 163, 0.1);
        }
      }
      
      /* Mobile responsiveness */
      @media (max-width: 480px) {
        #chat-widget-button {
          width: 56px;
          height: 56px;
          bottom: 16px;
          right: 16px;
          font-size: 22px;
        }
        
        #chat-widget-panel {
          width: calc(100% - 32px);
          max-width: 100%;
          bottom: 80px;
          right: 16px;
          left: 16px;
          max-height: 400px;
        }
      }
    `;
    document.head.appendChild(style);
  };
  
  // Create widget HTML
  const createWidget = () => {
    const container = document.createElement('div');
    
    // Button
    const button = document.createElement('button');
    button.id = 'chat-widget-button';
    button.title = 'Chat with documentation';
    button.innerHTML = '💬';
    
    // Panel
    const panel = document.createElement('div');
    panel.id = 'chat-widget-panel';
    
    panel.innerHTML = `
      <div class="chat-widget-header">
        <h3>Documentation Chat</h3>
        <button class="chat-widget-close" aria-label="Close chat">✕</button>
      </div>
      <div id="chat-widget-messages"></div>
      <div id="chat-widget-status"></div>
      <form id="chat-widget-form">
        <input id="chat-widget-input" type="text" placeholder="Ask about the docs..." />
        <button type="submit" aria-label="Send message">Send</button>
      </form>
    `;
    
    container.appendChild(button);
    container.appendChild(panel);
    document.body.appendChild(container);
    
    return { button, panel };
  };
  
  // Get current page context
  const getPageContext = () => {
    // Try to get the current page title/path from the Antora document
    const docTitle = document.querySelector('h1.page-title')?.textContent || 'current page';
    const pathname = window.location.pathname;
    
    return {
      title: docTitle,
      path: pathname,
      url: window.location.href
    };
  };
  
  // Add message to chat
  const addMessage = (messages, role, text, sources = null) => {
    const div = document.createElement('div');
    div.className = `chat-widget-message ${role}`;
    
    let html = `<strong>${role === 'user' ? 'You' : 'Assistant'}</strong>${text}`;
    
    if (sources && sources.length > 0) {
      const sourceList = sources
        .map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title}</a>`)
        .join('');
      html += `<div class="sources"><strong>Sources:</strong>${sourceList}</div>`;
    }
    
    div.innerHTML = html;
    messages.prepend(div);
  };
  
  // Initialize the widget
  const init = () => {
    createStyles();
    const { button, panel } = createWidget();
    
    const messages = document.getElementById('chat-widget-messages');
    const status = document.getElementById('chat-widget-status');
    const form = document.getElementById('chat-widget-form');
    const input = document.getElementById('chat-widget-input');
    const closeBtn = panel.querySelector('.chat-widget-close');
    
    let isOpen = false;
    
    // Toggle panel
    button.addEventListener('click', () => {
      isOpen = !isOpen;
      panel.classList.toggle('open');
      if (isOpen) {
        input.focus();
      }
    });
    
    closeBtn.addEventListener('click', () => {
      isOpen = false;
      panel.classList.remove('open');
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        isOpen = false;
        panel.classList.remove('open');
      }
    });
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const question = input.value.trim();
      if (!question) return;
      
      // Add user message
      addMessage(messages, 'user', question);
      input.value = '';
      
      status.textContent = 'Thinking…';
      
      try {
        const pageContext = getPageContext();
        const enhancedQuestion = `${question}\n\n(Asked while viewing: ${pageContext.title})`;
        
        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: enhancedQuestion })
        });
        
        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        addMessage(messages, 'assistant', data.answer || 'No answer available.', data.sources);
        status.textContent = '';
      } catch (error) {
        console.error('Chat error:', error);
        status.textContent = 'Error: Backend not available. Is it running on port 8080?';
      }
    });
  };
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
