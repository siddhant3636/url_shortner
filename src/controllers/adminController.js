import userModel from "../models/userModel.js";
import urlModel from "../models/urlModel.js";

const getAdminDashboard = async (req, res) => {
    try {
        // 1. Get Global Counts
        const userCount = await userModel.countDocuments();
        const urlCount = await urlModel.countDocuments({ isDeleted: false });

        // 2. Calculate Total Network Clicks (Using MongoDB Aggregation)
        const clickData = await urlModel.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, totalClicks: { $sum: "$clicks" } } }
        ]);
        const totalClicks = clickData.length > 0 ? clickData[0].totalClicks : 0;

        // 3. Get the 10 most recent links for the moderation table
        const recentUrls = await urlModel.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('createdBy', 'username');

        // 4. Render the page with the data
        res.render("admin", {
            stats: { users: userCount, urls: urlCount, clicks: totalClicks },
            recentUrls: recentUrls,
            user: req.session.user // Pass the logged-in admin's info
        });

    } catch (err) {
        console.error("Admin Dashboard Error:", err);
        res.status(500).send("Server Error loading God Mode.");
    }
};

const deleteUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent the admin from accidentally deleting themselves!
        if (userId === req.session.user.id) {
            return res.status(400).json({ message: "Self-termination is blocked in God Mode." });
        }

        const user = await userModel.findByIdAndUpdate(userId, { isDeleted: true });

        if (!user) {
            return res.status(404).json({ message: "User node not found." });
        }

        
        await urlModel.updateMany({ createdBy: userId }, { isDeleted: true });

        res.json({ message: "User and all associated links deactivated." });
    } catch (err) {
        res.status(500).json({ message: "Server error during termination." });
    }
};

export { getAdminDashboard, deleteUserByAdmin};