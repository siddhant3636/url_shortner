// --- SIDEBAR TOGGLE LOGIC ---
const profileBtn = document.getElementById('profileBtn');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('profileSidebar');
const overlay = document.getElementById('sidebarOverlay');

if (profileBtn) {
    // Open Sidebar
    profileBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    // Close Sidebar (via X button)
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Close Sidebar (via clicking outside)
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}

// --- MODAL TOGGLES ---
window.openModal = function(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 🚀 1. THE TOAST NOTIFICATION GENERATOR
window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `cyber-toast ${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOutUp 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// 🚀 2. REAL-TIME USERNAME CHECKER
const editUsernameInput = document.getElementById('editUsername');
const editSubmitBtn = document.querySelector('#editProfileForm .btn-submit');
let typingTimer;

if (editUsernameInput) {
    editUsernameInput.addEventListener('input', (e) => {
        clearTimeout(typingTimer);
        const val = e.target.value.trim();
        
        if (!val) return;

        // Wait 500ms after user stops typing to hit the database
        typingTimer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/auth/check-username?username=${val}`);
                const data = await res.json();
                
                if (!data.available) {
                    showToast("Username already registered to another node.", "warning");
                    editUsernameInput.style.borderColor = "#ffeb3b";
                    editUsernameInput.style.boxShadow = "0 0 10px rgba(255, 235, 59, 0.3)";
                    editSubmitBtn.disabled = true; // Prevent saving!
                    editSubmitBtn.style.opacity = "0.5";
                } else {
                    editUsernameInput.style.borderColor = "#00ff41";
                    editUsernameInput.style.boxShadow = "none";
                    editSubmitBtn.disabled = false;
                    editSubmitBtn.style.opacity = "1";
                }
            } catch (err) {
                console.error("Check failed");
            }
        }, 500);
    });
}

// 🚀 3. SUBMIT EDIT PROFILE (NO RELOAD NEEDED)
document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('editUsername').value.trim();

    try {
        const response = await fetch('/api/auth/update-profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newUsername })
        });
        
        const data = await response.json();
        if (response.ok) {
            showToast("Profile data synchronized successfully.", "success");
            
            // Instantly update the UI instead of reloading!
            const displayUsername = document.getElementById('displayUsername');
            if(displayUsername) displayUsername.innerText = newUsername;
            
            closeModal('editProfileModal');
        } else {
            showToast(data.message || "Update sequence failed.", "error");
        }
    } catch (err) {
        showToast("Server connection lost.", "error");
    }
});

// 🚀 4. SUBMIT CHANGE PASSWORD
document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        if (response.ok) {
            showToast("Security credentials updated.", "success");
            closeModal('changePasswordModal');
            document.getElementById('changePasswordForm').reset();
        } else {
            // Replaces the boring browser alert with a cool red error!
            showToast("Access Denied: " + (data.message || "Invalid credentials."), "error");
        }
    } catch (err) {
        showToast("Server connection lost.", "error");
    }
});
// --- SUBMIT DELETE ACCOUNT ---
const deleteBtn = document.getElementById('deleteAccountBtn');

if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
        // Keep the confirm alert here because it stops the user and requires a hard "OK"
        const confirmed = confirm("⚠️ WARNING: This will permanently delete your account and hide your shortened URLs from the public. Proceed?");

        if (confirmed) {
            try {
                const response = await fetch('/api/auth/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    // Use a toast instead of an alert!
                    showToast("Account deleted. Initiating redirect...", "success");
                    
                    // Wait 1.5 seconds so they can read the toast before redirecting
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                    
                } else {
                    const data = await response.json();
                    showToast(data.message || "Error deleting account.", "error");
                }
            } catch (err) {
                console.error("Delete request failed:", err);
                showToast("Server error during deletion.", "error");
            }
        }
    });
}