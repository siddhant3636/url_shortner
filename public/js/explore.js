document.querySelectorAll('.short-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            
            // 🚀 Pull the full URL from our hidden data attribute!
            const urlToCopy = e.target.getAttribute('data-fullurl');
            
            navigator.clipboard.writeText(urlToCopy).then(() => {
                const originalText = e.target.innerText;
                e.target.innerText = "Copied! ✓";
                e.target.style.color = "#00ff41"; 
                
                setTimeout(() => {
                    e.target.innerText = originalText;
                    e.target.style.color = "#149CEA"; 
                }, 2000);
            });
        });
    });