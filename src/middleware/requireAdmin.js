const requireAdmin = (req, res, next) => {
    // 1. Check if they are logged in at all
    if (!req.session || !req.session.user) {
        return res.status(401).redirect("/admin/login");
    }

    // 2. Check if their session role is admin
    if (req.session.user.role !== 'admin') {
        // Kick them back to the normal landing page if they try to be sneaky
        return res.status(403).redirect("/"); 
    }

    // 3. They are worthy. Let them pass.
    next();
};

export default requireAdmin;