import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ msg: "No token provided" });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    if (!token) {
        return res.status(401).json({ msg: "Malformed authorization header" });
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch {
        return res.status(403).json({ msg: "Invalid token" });
    }
}
