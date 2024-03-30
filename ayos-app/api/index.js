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
  try {
    console.log("Received login request:", req.body);
    const { email, password } = req.body;
    //check if the user exists already
    const user = await Instructor.findOne({ email });
    console.log("user", user);
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
    console.error("Login failed:", error.message);
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

// Add a new endpoint to get attendance list for a specific week
app.get("/attendanceList", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

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

      const { courseId, courseWeek } = req.query;
      console.log("course week", courseWeek);
      const attendanceList = await Attendance.find({
        academianId: userId,
        courseId: courseId,
        date: courseWeek,
      });

      res.status(200).json({ attendanceList });
    } catch (error) {
      console.error("Error fetching attendance list:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  });
});

// Endpoint to get course ID by course code
app.get("/courseId", async (req, res) => {
  try {
    const { courseCode } = req.query;

    const course = await Course.findOne({ code: courseCode });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ courseId: course._id });
  } catch (error) {
    console.error("Error fetching course ID:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to get student information by student IDs
app.get("/studentsInfo", async (req, res) => {
  try {
    const { studentIds } = req.query;
    console.log("Received studentIds:", studentIds); // Add this line for logging
    const studentIdsArray = studentIds.split(",").filter(Boolean); // Filter out empty strings
    console.log("xxxStudent IDs:", studentIdsArray);

    if (
      !studentIdsArray ||
      !Array.isArray(studentIdsArray) ||
      studentIdsArray.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or missing studentIds parameter" });
    }

    const studentsInfo = await Student.find({ _id: { $in: studentIdsArray } });
    console.log("bu sefer bu ne: ", studentsInfo);

    if (!studentsInfo || studentsInfo.length === 0) {
      return res.status(404).json({ message: "Students not found" });
    }

    const formattedStudentInfo = studentsInfo.map((student) => ({
      studentId: student.studentId,
      name: student.name,
      surname: student.surname,
      email: student.email,
    }));

    res.status(200).json({ studentsInfo: formattedStudentInfo });
  } catch (error) {
    console.error("Error fetching students information:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to add or update a course
app.post("/user/addCourse", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

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

      const { name, code, week, startDate } = req.body;

      let existingCourse = await Course.findOne({ code });

      if (existingCourse) {
        existingCourse.name = name;
        existingCourse.week = week;
        existingCourse.startDate = startDate;
        if (!existingCourse.academician.includes(userId)) {
          existingCourse.academician.push(userId);
        }

        await existingCourse.save();

        res.status(200).json({ course: existingCourse });
      } else {
        const newCourse = new Course({
          name,
          code,
          academician: userId,
          week,
          startDate,
        });

        await newCourse.save();

        res.status(201).json({ course: newCourse });
      }
    } catch (error) {
      console.error("Error adding or updating course:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  });
});

// Endpoint to delete a course
app.delete("/user/deleteCourse/:courseId", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, secretKey, async (err, decoded) => {
    console.log(decoded);
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = decoded.userId;
    const courseId = req.params.courseId;

    try {
      const user = await Instructor.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (!course.academician.includes(userId)) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      const academicianObjectId = new mongoose.Types.ObjectId(userId);
      course.academician = course.academician.filter(
        (academicianId) => !academicianId.equals(academicianObjectId)
      );
      await course.save();

      res.status(200).json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  });
});


// Endpoint to get student information by student ID
app.get("/studentInfo/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;

    

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId format" });
    }

const student = await Student.findById(studentId);
    const studentInfo = {
      studentId: student.studentId,
      name: student.name,
      surname: student.surname,
      email: student.email,
    };

    res.status(200).json({ studentInfo });
  } catch (error) {
    console.error("Error fetching student information:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Endpoint to get student's courses and attendance status
app.get("/studentCourses/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId format" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const attendanceList = await Attendance.find({ studentId });

    const courses = await Promise.all(
      attendanceList.map(async (attendance) => {
        const course = await Course.findById(attendance.courseId);
        return {
          courseId: course._id,
          courseName: course.name,
          attendance: attendance.attendance,
          date: attendance.date,
        };
      })
    );

    res.status(200).json({ studentCourses: courses });
  } catch (error) {
    console.error("Error fetching student courses:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to upload CSV file
app.post("/uploadCsv", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const userId = decoded.userId;

      // Check if user is authorized to upload CSV
      const user = await Instructor.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Process the uploaded CSV file
      const csvData = req.body.csvData;
      console.log("CSV data received:", csvData);

      // Parse the CSV data
      const parsedCsv = csvData.split("\n").map(row => row.split(","));

      // Iterate over each row in the CSV data
      for (const row of parsedCsv) {
        const [name, surname, email, studentId] = row;

        // Check if student with the same studentId already exists in the database
        let existingStudent = await Student.findOne({ studentId });

        // If student does not exist, create a new student record
        if (!existingStudent) {
          existingStudent = new Student({
            name,
            surname,
            email,
            studentId
          });

          await existingStudent.save();
        }
      }

      // Return a success message
      res.status(200).json({ message: "CSV file uploaded and processed successfully" });
    });
  } catch (error) {
    console.error("Error uploading and processing CSV:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});