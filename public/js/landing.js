// 1. MATRIX BACKGROUND LOGIC
const container = document.getElementById('matrixContainer');
if (container) { // Added a safety check just in case
    for (let p = 0; p < 5; p++) {
      const pattern = document.createElement('div');
      pattern.className = 'matrix-pattern';
      for (let c = 0; c < 40; c++) {
        const col = document.createElement('div');
        col.className = 'matrix-column';
        pattern.appendChild(col);
      }
      container.appendChild(pattern);
    }
}

// 2. URL SHORTENING LOGIC (Optimized & Alert-Free)
const filterIcon = document.getElementById('filter-icon');
const urlInput = document.getElementById('urlInput');

// Extracted into a function so both the Button and the 'Enter' key can use it
async function handleUrlSubmit(e) {
    if (e) e.preventDefault(); 
    
    const originalUrl = urlInput.value.trim();

    if (!originalUrl) {
      return showToast("Please enter a valid URL first.", "warning"); // 🚀 Replaced alert
    }

    try {
      // Note: Ensure this matches your actual backend route! (e.g., /api/url or /api/url/shorten)
      const response = await fetch('/api/url', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl })
      });

      const data = await response.json();

      if (response.ok) {
        const currentDomain = window.location.host;
        const fullWorkingUrl = `${window.location.protocol}//${currentDomain}/api/url/${data.shortCode}`;
        const cleanDisplayUrl = `/${data.shortCode}`;

        const wrapper = document.getElementById('resultWrapper');
        wrapper.innerHTML = `
          <div class="new-link-result" id="resultBox">
            <h3>🎉 URL Shortened Successfully!</h3>
            <div class="result-box-inner">
              <a href="${fullWorkingUrl}" target="_blank" id="shortUrlText" data-fullurl="${fullWorkingUrl}">
                ${cleanDisplayUrl}
              </a>
              <button onclick="copyShortUrl()" class="copy-btn" id="copyBtn">Copy</button>
            </div>
          </div>
        `;
        
        urlInput.value = ''; 
        showToast("Link successfully generated.", "success"); // 🚀 Added success toast
        
      } else {
        showToast(data.message || "Failed to shorten link.", "error"); // 🚀 Replaced alert
      }

    } catch (err) {
      console.error("Error creating URL:", err);
      showToast("Network connection lost. Please try again.", "error"); // 🚀 Replaced alert
    }
}

// Trigger via Button Click
if (filterIcon) {
    filterIcon.addEventListener('click', handleUrlSubmit);
}

// Trigger via 'Enter' Key
if (urlInput) {
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUrlSubmit(e);
    });
}

// 3. COPY SHORT URL LOGIC
window.copyShortUrl = function() { 
  const urlToCopy = document.getElementById("shortUrlText").getAttribute("data-fullurl");
  
  navigator.clipboard.writeText(urlToCopy).then(() => {
    const btn = document.getElementById("copyBtn");
    btn.innerText = "Copied!";
    btn.style.background = "white";
    btn.style.color = "black"; 
    
    setTimeout(() => {
      btn.innerText = "Copy";
      btn.style.background = "#00ff41"; 
      btn.style.color = "white";
    }, 2000);
  });
}

// 4. DASHBOARD COPY LOGIC
window.copyDashboardUrl = function(btn) {
    const card = btn.closest('.url-card');
    const link = card.querySelector('.dashboard-link-item');
    const urlToCopy = link.getAttribute('data-fullurl');

    navigator.clipboard.writeText(urlToCopy).then(() => {
        const originalText = btn.innerText;
        btn.innerText = "Copied!";
        btn.style.color = "#00ff41";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.color = ""; 
        }, 2000);
    });
}

// 5. DELETE URL LOGIC (Cleaned up old redundant code)
let urlToDeleteId = null;

window.triggerDeleteWarning = function(urlId) {
    urlToDeleteId = urlId;
    openModal('deleteUrlWarningModal'); 
};

const confirmUrlDeleteBtn = document.getElementById('confirmUrlDeleteBtn');
if (confirmUrlDeleteBtn) {
    confirmUrlDeleteBtn.addEventListener('click', async () => {
        if (!urlToDeleteId) return;
        
        const originalText = confirmUrlDeleteBtn.innerText;
        confirmUrlDeleteBtn.innerText = "PURGING..."; 
        
        try {
            const response = await fetch(`/api/url/${urlToDeleteId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                closeModal('deleteUrlWarningModal'); 
                
                const card = document.getElementById(`card-${urlToDeleteId}`);
                if (card) {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => card.remove(), 300);
                }
                
                showToast("Link permanently terminated.", "success"); // 🚀 Already perfectly using Toast
            } else {
                const data = await response.json();
                showToast(data.message || "Failed to terminate link.", "error"); // 🚀 Replaced alert
                confirmUrlDeleteBtn.innerText = originalText;
            }
        } catch (err) {
            console.error("Delete Error:", err);
            showToast("Lost connection to the network.", "error"); // 🚀 Replaced alert
            confirmUrlDeleteBtn.innerText = originalText;
        }
    });
}