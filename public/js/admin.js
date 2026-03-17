// ==========================================
// 1. MATRIX TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = "success") {
    // Remove existing toast if one is already on screen
    const existingToast = document.getElementById('matrix-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.id = 'matrix-toast';
    toast.innerText = message;
    
    // Hacker Terminal Styling
    toast.style.position = "fixed";
    toast.style.bottom = "30px";
    toast.style.right = "30px";
    toast.style.padding = "16px 24px";
    toast.style.fontFamily = "'Courier New', Courier, monospace";
    toast.style.fontSize = "15px";
    toast.style.fontWeight = "bold";
    toast.style.letterSpacing = "1px";
    toast.style.zIndex = "9999";
    toast.style.borderRadius = "2px";
    toast.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.textTransform = "uppercase";

    if (type === "success") {
        toast.style.backgroundColor = "rgba(0, 20, 0, 0.95)";
        toast.style.color = "#00ff00"; // Neon Green
        toast.style.border = "1px solid #00ff00";
        toast.style.boxShadow = "0 0 15px rgba(0, 255, 0, 0.3)";
    } else {
        toast.style.backgroundColor = "rgba(20, 0, 0, 0.95)";
        toast.style.color = "#ff0000"; // Neon Red
        toast.style.border = "1px solid #ff0000";
        toast.style.boxShadow = "0 0 15px rgba(255, 0, 0, 0.3)";
    }

    document.body.appendChild(toast);

    // Trigger Animate In
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    // Animate Out & Remove after 3.5 seconds
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)"; // Slides off to the right
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==========================================
// 2. USERNAME COLOR GENERATOR
// ==========================================
window.getUsernameColor = (username) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 65%)`; 
};

// ==========================================
// 3. KILL LINK (NO REFRESH ROW DELETION)
// ==========================================
window.deleteAdminLink = async function(urlId) {
    const confirmed = confirm("CRITICAL: Execute admin override? This link will be permanently terminated.");
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/url/${urlId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            showToast("Link terminated successfully.", "success");
            
            // Instantly find and melt the row away
            const row = document.getElementById(`row-${urlId}`);
            if (row) {
                row.style.transition = "all 0.5s ease";
                row.style.opacity = '0';
                row.style.transform = "translateX(-50px) scale(0.95)";
                row.style.backgroundColor = "rgba(255,0,0,0.2)"; // Flashes red before dying
                setTimeout(() => row.remove(), 500);
            }
        } else {
            showToast("System Error: Could not terminate link.", "error");
        }
    } catch (error) {
        console.error("Delete error:", error);
        showToast("Server connection lost.", "error");
    }
};

// ==========================================
// 4. TERMINATE USER (UI UPDATE + METRICS REFRESH)
// ==========================================
window.terminateUser = async function(userId, username) {
    // Passing username from your HTML to make the warning scarier
    const targetName = username ? `@${username}` : 'this user';
    const confirmed = confirm(`⚠️ DIRECTIVE: Permanently eradicate ${targetName} and wipe all their links from the network?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/admin/user/${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showToast("User node completely wiped.", "success");
            
            // Why we reload here: Deleting a user changes your top metrics (Total Users, Active URLs, Traffic).
            // A quick delayed reload ensures the stats at the top of your dashboard stay perfectly accurate!
            setTimeout(() => {
                window.location.reload();
            }, 1800);
        } else {
            showToast(data.message || "Termination failed.", "error");
        }
    } catch (err) {
        console.error("User Delete Error:", err);
        showToast("Connection lost during override.", "error");
    }
};