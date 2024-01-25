const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();

const port = 8000;
const cors = require("cors");
const corsOptions = {
    origin: "*", // or specify the specific origin of your React Native app
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    debug: true, // Enable debug logs
  }; 

app.use(cors(corsOptions));
app.use((req, res, next) => {
    console.log("Request received:", req.method, req.url);
    next();
  });


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwt = require("jsonwebtoken");
const Instructor = require("./models/instructorSchema");
const Course = require("./models/courseSchema");

mongoose
  .connect("db-url", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB", error);
  });

app.listen(port, () => {
  console.log("Server is running on port 8000");
});

const generateSecretKey = () => {
    const secretKey = crypto.randomBytes(32).toString("hex");
  
    return secretKey;
  };
  
  const secretKey = generateSecretKey();

//endpoint to login
app.post("/login", async (req, res) => {
    console.log("test");
    try {
        console.log("Received login request:", req.body);
      const { email, password } = req.body;
  
      //check if the user exists already
      const user = await Instructor.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      //check in password is correct
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalide password" });
      }
  
      const token = jwt.sign({ userId: user._id }, secretKey);
  
      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: "login failed" });
    }
  });



  // Endpoint to get user courses
app.get("/user/courses", (req, res) => {
    const token = req.headers.authorization.split(" ")[1]; // Assuming the token is in the 'Authorization' header
  
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
  
      const userId = decoded.userId;
  
      try {
        const user = await Instructor.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
  
        const userCourses = await Course.find({ academician: userId });
        res.status(200).json({ courses: userCourses });
      } catch (error) {
        console.error("Error fetching user courses:", error.message);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  });