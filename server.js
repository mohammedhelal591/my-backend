const express = require("express");
const cors = require("cors"); // Import the cors package
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
// Use the cors middleware
app.use(cors());

// Your routes and other code will go here

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const uri =
  "mongodb+srv://admin:yT0GLc05LNI1ohDi@userdb.udxsivq.mongodb.net/?retryWrites=true&w=majority";

const mongoose = require("mongoose");
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const bcrypt = require("bcrypt");
const User = require("./models/User");

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      username: email,
    });
    await newUser.save();
    // If registration is successful
    // res.status(201).json({ success: true, message: "success" });
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

const jwt = require("jsonwebtoken");

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, "your-secret-key", {
      expiresIn: "1h",
    });
    return res.status(200).json({ token, success: true, message: "success" });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

function authenticateToken(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, "your-secret-key", (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.user = user;
    next();
  });
}

app.get("/protected", authenticateToken, (req, res) => {
  // This route is protected and can only be accessed with a valid token
  res.json({ message: "Protected route accessed successfully" });
});

const crypto = require("crypto");

// Generate a random secret key
const secretKey = crypto.randomBytes(32).toString("hex");
console.log("Secret Key:", secretKey);

const allowedOrigins = ["http://localhost:5000"];
app.use(
  cors({
    origin: allowedOrigins,
  })
);
