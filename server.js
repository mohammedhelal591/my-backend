const express = require("express");
const cors = require("cors"); // Import the cors package
const app = express();
const PORT = process.env.PORT || 9000;
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
const http = require('http');

const uri =
  "mongodb+srv://admin:yT0GLc05LNI1ohDi@userdb.udxsivq.mongodb.net/?retryWrites=true&w=majority";

const mongoose = require("mongoose");
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to DB')
}).catch(err=> {
  console.log('Couldn\'t connect to DB');
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Generate a random secret key
const secretKey = crypto.randomBytes(32).toString("hex");

const allowedOrigins = ["https://mohammedhelal591.github.io/my-movies-app/"];

// Middleware
app.use(express.json());
// Use the cors middleware
app.use(
  cors({
    origin: '*',
  })
);

app.get("/", (req, res) => {
  return res.json({ message: "working...!" });
});

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

    const token = jwt.sign({ userId: user._id }, secretKey, {
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

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.user = user;
    next();
  });
}

app.get("/protected", authenticateToken, (req, res) => {
  // This route is protected and can only be accessed with a valid token
  res.json({ message: "Protected route accessed successfully" });
});


// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

var server = http.createServer(app)
server.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + app.get('port'))
})

module.exports = app;
