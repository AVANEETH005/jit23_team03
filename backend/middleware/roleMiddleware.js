const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized, no user context' });
    }

    const { role } = req.user;
    if (allowedRoles.includes(role)) {
      next();
    } else {
      res.status(403).json({ message: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}` });
    }
  };
};

module.exports = roleMiddleware;
