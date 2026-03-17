const getUsernameColor = (username) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    // We want neon/bright colors for the Matrix theme
    // This converts the hash to an HSL color (Saturation 70%, Lightness 60%)
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 65%)`; 
};
// Reusing your delete function for the Admin 'Kill' button
        window.deleteUserLink = async function(urlId) {
            const confirmed = confirm("WARNING: Admin override. Permanently delete this link?");
            if (!confirmed) return;

            try {
                const response = await fetch(`/api/url/${urlId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    const row = document.getElementById(`row-${urlId}`);
                    if (row) {
                        row.style.opacity = '0';
                        setTimeout(() => row.remove(), 300);
                    }
                } else {
                    alert("System Error: Could not terminate link.");
                }
            } catch (error) {
                console.error("Delete error:", error);
                alert("Server connection lost.");
            }
        };
window.terminateUser = async function(userId) {
    const confirmed = confirm("⚠️ CRITICAL ACTION: Permanently deactivating this user will hide their profile and all their links. Proceed?");
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/admin/user/${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showToast("User node deactivated. Network updated.", "success");
            // Refresh after a short delay to update the table and counts
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showToast(data.message || "Termination failed.", "error");
        }
    } catch (err) {
        showToast("Connection lost during override.", "error");
    }
};