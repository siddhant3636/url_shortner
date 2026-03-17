import userModel from "../models/userModel.js";

// Get all users (Admin view)
const allUsers = async (req, res) => {
    try {
        const users = await userModel.find({});
        return res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

// Get single user by ID (Admin view)
const singleUser = async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

export { allUsers, singleUser };