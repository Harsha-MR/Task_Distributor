// import jwt from "jsonwebtoken";
// import Admin from "../models/Admin.js";

// const protect = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       // Check if user is an Admin
//       const admin = await Admin.findById(decoded.id);
//       if (!admin) return res.status(403).json({ message: "Access denied" });

//       req.user = admin;
//       next();
//     } catch (error) {
//       res.status(401).json({ message: "Invalid token" });
//     }
//   } else {
//     res.status(401).json({ message: "No token, authorization denied" });
//   }
// };

// export default protect;

import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token, access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) return res.status(403).json({ message: "Access denied" });

    req.user = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default protect;
