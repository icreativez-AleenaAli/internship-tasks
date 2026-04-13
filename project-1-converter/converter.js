(function() {
  // DOM Elements
  const htmlInput = document.getElementById('htmlInput');
  const convertBtn = document.getElementById('convertBtn');
  const jsxOutputElement = document.getElementById('jsxOutput');
  const copyBtn = document.getElementById('copyBtn');
  const clearHtmlBtn = document.getElementById('clearHtmlBtn');
  const clearOutputBtn = document.getElementById('clearOutputBtn');
  const exampleBtn = document.getElementById('exampleBtn');
  const statusMsgSpan = document.getElementById('statusMsg');

  function setStatus(message, isError = false) {
    statusMsgSpan.textContent = message;
    statusMsgSpan.style.color = isError ? '#dc2626' : '#059669';
    setTimeout(() => {
      if (statusMsgSpan.textContent === message) {
        statusMsgSpan.style.color = '#059669';
        statusMsgSpan.textContent = 'Ready • Auto-className & camelCase events';
      }
    }, 2000);
  }

  function highlightCode() {
    if (window.hljs) {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }

  function convertHtmlToJsx(html) {
    if (!html || html.trim() === '') {
      return '// No HTML provided\n// Enter some HTML markup to convert to JSX';
    }

    let jsx = html;

    // Remove HTML comments
    jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');

    // Convert class to className
    jsx = jsx.replace(/class=/g, 'className=');

    // Convert for to htmlFor
    jsx = jsx.replace(/for=/g, 'htmlFor=');

    // Convert inline styles
    jsx = jsx.replace(/style="([^"]*)"/g, function(match, styleStr) {
      const styles = {};
      styleStr.split(';').forEach(rule => {
        const [prop, val] = rule.split(':').map(s => s.trim());
        if (prop && val) {
          let camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          if (camelProp === 'float') camelProp = 'cssFloat';
          styles[camelProp] = val.replace(/;$/, '');
        }
      });
      const styleObj = Object.entries(styles).map(([k, v]) => `${k}: '${v}'`).join(', ');
      return `style={{ ${styleObj} }}`;
    });

    // Convert event handlers
    const events = {
      'onclick': 'onClick',
      'ondblclick': 'onDoubleClick',
      'onchange': 'onChange',
      'oninput': 'onInput',
      'onsubmit': 'onSubmit',
      'onkeydown': 'onKeyDown',
      'onkeyup': 'onKeyUp',
      'onkeypress': 'onKeyPress',
      'onfocus': 'onFocus',
      'onblur': 'onBlur',
      'onmouseover': 'onMouseOver',
      'onmouseout': 'onMouseOut',
      'onmouseenter': 'onMouseEnter',
      'onmouseleave': 'onMouseLeave',
      'onmousedown': 'onMouseDown',
      'onmouseup': 'onMouseUp',
      'onload': 'onLoad',
      'onerror': 'onError'
    };

    Object.keys(events).forEach(htmlEvent => {
      const jsxEvent = events[htmlEvent];
      const regex = new RegExp(htmlEvent + '=', 'gi');
      jsx = jsx.replace(regex, jsxEvent + '=');
    });

    // Self-closing tags
    const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
    voidElements.forEach(tag => {
      const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
      jsx = jsx.replace(regex, `<${tag}$1 />`);
    });

    // Boolean attributes
    const booleanAttrs = ['disabled', 'checked', 'readOnly', 'required', 'multiple', 'selected'];
    booleanAttrs.forEach(attr => {
      const regex = new RegExp(`${attr}=["']${attr}["']`, 'gi');
      jsx = jsx.replace(regex, `${attr}={true}`);
      
      const regexStandalone = new RegExp(`<([^>]*?)\\b${attr}\\b(?!\\s*=)([^>]*?)>`, 'gi');
      jsx = jsx.replace(regexStandalone, (match, before, after) => {
        if (match.includes(`${attr}={true}`)) return match;
        return `<${before}${after} ${attr}={true}>`.replace(/\s{2,}/g, ' ');
      });
    });

    return jsx;
  }

  function updateOutput(jsxString) {
    jsxOutputElement.textContent = jsxString;
    highlightCode();
  }

  function performConversion() {
    const rawHtml = htmlInput.value;
    if (!rawHtml.trim()) {
      updateOutput('// No HTML to convert\n// Paste or write HTML in the left editor');
      setStatus('⚠️ Empty input — provide HTML code', false);
      return;
    }
    
    try {
      const jsxResult = convertHtmlToJsx(rawHtml);
      updateOutput(jsxResult);
      setStatus('✓ Conversion successful! JSX ready', false);
    } catch (err) {
      console.error(err);
      updateOutput(`// Conversion error:\n// ${err.message}`);
      setStatus('✖ Conversion error — invalid HTML', true);
    }
  }

  async function copyToClipboard() {
    const jsxCode = jsxOutputElement.textContent;
    if (!jsxCode || jsxCode.includes('No HTML')) {
      setStatus('Nothing to copy — generate JSX first', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(jsxCode);
      setStatus('📋 JSX copied to clipboard!', false);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = jsxCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setStatus('Copied using fallback method', false);
    }
  }

  function loadExample() {
    const exampleHtml = `<div class="card" style="background: #f9f9f9; padding: 20px; border-radius: 12px;">
  <h2 class="title">Hello React Dev!</h2>
  <label for="username">Username:</label>
  <input type="text" id="username" name="username" placeholder="Enter name" disabled />
  <button onclick="handleClick()" class="btn-primary" style="background-color: #4f46e5; color: white;">Click Me</button>
  <img src="https://via.placeholder.com/150" alt="placeholder" />
  <br />
  <span>Checkbox: <input type="checkbox" checked disabled /></span>
</div>`;
    htmlInput.value = exampleHtml;
    setStatus('Example HTML loaded', false);
    performConversion();
  }

  function clearHtml() {
    htmlInput.value = '';
    setStatus('HTML cleared', false);
  }

  function clearOutput() {
    updateOutput('// Output cleared\n// Convert HTML to see JSX again');
    setStatus('Output cleared', false);
  }

  // Event listeners
  convertBtn.addEventListener('click', performConversion);
  copyBtn.addEventListener('click', copyToClipboard);
  clearHtmlBtn.addEventListener('click', clearHtml);
  clearOutputBtn.addEventListener('click', clearOutput);
  exampleBtn.addEventListener('click', loadExample);
  
  // Ctrl+Enter shortcut
  htmlInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      performConversion();
    }
  });
  
  // Initial highlight
  setTimeout(highlightCode, 100);
})();
