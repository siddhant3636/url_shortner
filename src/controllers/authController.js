import userModel from "../models/userModel.js";
import urlModel from "../models/urlModel.js";

const loginPage = async (req, res) => {
    res.render("login");
};

const loginUser = async (req, res) => {
    // 1. Extract the new adminAttempt flag
    const { email, password, adminAttempt } = req.body;

    if(!email || !password) {
        return res.status(400).json({message: "Missing email or pass"});
    }
   
    const user = await userModel.findOne({ email }).select("+password");   
   
    if(!user) {
        return res.status(401).json({message: "Email not registered"});
    }
    
    const isMatch = await user.comparePass(password);
    if(!isMatch) { 
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. THE ADMIN GATEKEEPER
    // If they used the God Mode portal, but aren't an admin, kick them out!
    if (adminAttempt && user.role !== 'admin') {
        return res.status(403).json({ message: "Restricted System: Admin privileges required." });
    }

    // 3. Save role to session
    req.session.user = {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role || 'user'
    };

    // 4. Smart Redirect
    if (req.session.user.role === 'admin') {
        return res.redirect("/api/admin/dashboard");
    } else {
        return res.redirect("/");
    }
};

const signupPage = async (req, res) => {
    res.render("signup");
};

const signupUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Required fields missing" });
        }
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
        const user = await userModel.create({ username, email, password });
        
        req.session.user = {
            id: user._id,
            email: user.email,
            username: user.username,
            role:user.role || 'user'

        };
        return res.redirect("/");

       
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

const logoutUser = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid");
        res.redirect("/"); 
    });
};



const updateUser = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await userModel.findById(userId);
        
        if (!user) return res.status(404).json({ message: "User not found" });

        const allowedUpdates = ["username", "email", "job"]; 
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        await user.save();
        if (req.body.username) req.session.user.username = user.username;

        res.status(200).json({ message: "Profile updated", user });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;
        
        const user = await userModel.findById(userId).select("+password");
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await user.comparePass(currentPassword);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Password change error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.session.user.id; 
        const user = await userModel.findByIdAndUpdate(userId, {
            isDeleted: true,
            deletedAt: new Date(),
        }, { new: true });

        if (!user) return res.status(404).json({ message: "User not found" });

        await urlModel.updateMany(
            { createdBy: userId },
            { isDeleted: true, deletedAt: new Date() }
        );

        req.session.destroy();
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: "Server error during deletion" });
    }
};


const checkUsername = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: "Username required" });
        
        const existingUser = await userModel.findOne({ username });
        
        if (existingUser) {
            // If the user checking is logged in, and it's THEIR OWN username, it's fine!
            if (req.session?.user && existingUser._id.toString() === req.session.user.id) {
                 return res.json({ available: true });
            }
            return res.json({ available: false });
        }
        
        res.json({ available: true });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};



export { loginPage, loginUser, signupPage, signupUser, logoutUser, updateUser, changePassword, deleteUser, checkUsername };