const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const app = express();
const { ObjectId } = require('mongoose').Types;
const nodemailer = require('nodemailer');


const port = 8000;
const cors = require("cors");
const corsOptions = {
  origin: "*", 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  debug: true, 
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
const Student = require("./models/studentSchema");
const Attendance = require("./models/attendanceSchema");
const Participant = require("./models/participantSchema");
const Signature = require("./models/signatureSchema");

mongoose
  .connect(
    "api-url",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
    // deleteAllStudents();
    // deleteAllCourses();
    // deleteAllPart();
    // deleteAllInstructors();
    // deleteAllAttendances();
    // deleteAllSigns();

  })
  .catch((error) => {
    console.log("Error connecting to MongoDB", error);
  });

app.listen(port, () => {
  console.log("Server is running on port 8000");
});

const deleteAllSigns = async () => {
  try {
    await Signature.deleteMany({});
    console.log("All signatures deleted successfully");
  } catch (error) {
    console.error("Error deleting courses", error);
  }
};

const deleteAllCourses = async () => {
  try {
    await Course.deleteMany({});
    console.log("All courses deleted successfully");
  } catch (error) {
    console.error("Error deleting courses", error);
  }
};

const deleteAllPart = async () => {
  try {
    await Participant.deleteMany({});
    console.log("All part deleted successfully");
  } catch (error) {
    console.error("Error part courses", error);
  }
};

const deleteAllInstructors = async () => {
  try {
    await Instructor.deleteMany({});
    console.log("All instructors deleted successfully");
  } catch (error) {
    console.error("Error deleting instructors", error);
  }
};


const deleteAllStudents = async () => {
  try {
    await Student.deleteMany({});
    console.log("All students deleted successfully");
  } catch (error) {
    console.error("Error deleting students", error);
  }
};

const deleteAllAttendances = async () => {
  try {
    await Attendance.deleteMany({});
    console.log("All attendances deleted successfully");
  } catch (error) {
    console.error("Error deleting attendances", error);
  }
};




const generateSecretKey = () => {
  const secretKey = crypto.randomBytes(32).toString("hex");

  return secretKey;
};

const secretKey = generateSecretKey();

app.post("/register", async (req, res) => {
  try {
    console.log("Received register request:", req.body);
    const { name, surname, email, password } = req.body;

    const existingUser = await Instructor.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const newUser = new Instructor({
      name,
      surname,
      email,
      password, 
    });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, secretKey);
    res.status(201).json({ token });
  } catch (error) {
    console.error("Registration failed:", error.message);
    res.status(500).json({ message: "Registration failed" });
  }
});


app.post("/login", async (req, res) => {
  try {
    console.log("Received login request:", req.body);
    const { email, password } = req.body;
    const user = await Instructor.findOne({ email });
    console.log("user", user);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

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


app.get("/user/courses", (req, res) => {
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

      const userCourses = await Course.find({ academician: userId });
      res.status(200).json({ courses: userCourses });
    } catch (error) {
      console.error("Error fetching user courses:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  });
});


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


app.get("/studentsInfo", async (req, res) => {
  try {
    const { studentIds } = req.query;
    console.log("Received studentIds:", studentIds); 
    const studentIdsArray = studentIds.split(",").filter(Boolean); 
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

      const { name, code, week, limit, startDate } = req.body;

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
          limit,
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


app.post("/uploadCsv", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const userId = decoded.userId;

      const user = await Instructor.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const csvData = req.body.csvData;
      const courseCode = req.body.courseCode;
      console.log("CSV data received:", csvData);
      console.log("Course code recieved", courseCode);

      const parsedCsv = csvData.split("\n").map(row => row.split(","));

      for (const row of parsedCsv) {
        const [name, surname, email, studentId] = row.map(value => value.trim()); 

        let existingStudent = await Student.findOne({ studentId });

        if (!existingStudent) {
          existingStudent = new Student({
            name,
            surname,
            email,
            studentId
          });

          await existingStudent.save();
          console.log("Added student:", existingStudent._id);

         
        }
         const participant = await Participant.findOneAndUpdate(
          { courseCode, academianId: userId },
          { $addToSet: { students: studentId } }, 
          { upsert: true, new: true }
        );

        console.log("Participant updated:", participant);
      }

      res.status(200).json({ message: "CSV file uploaded and processed successfully" });
    });
  } catch (error) {
    console.error("Error uploading and processing CSV:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/course/studentNumbers", async (req, res) => {
  try {
    console.log("Received studentnumbers request:", req.body);

    const token = req.headers.authorization.split(" ")[1];

    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const academianId = decoded.userId; 

      const { courseCode } = req.query;

      if (!academianId || !courseCode) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      const participant = await Participant.findOne({ academianId, courseCode });

      if (!participant) {
        return res.status(200).json({ studentNumbers: [] });
      }

      const studentNumbers = participant.students;

      res.status(200).json({ studentNumbers });
    });
  } catch (error) {
    console.error("Error fetching student numbers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/course/weeklyAttendance", async (req, res) => {
  try {
    const { courseCode } = req.query;

    const course = await Course.findOne({ code: courseCode });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const weeklyAttendance = await Attendance.aggregate([
      { $match: { courseId: course._id } },
      {
        $group: {
          _id: { date: "$date", studentId: "$studentId" },
          attended: { $max: "$attendance" }, 
        },
      },
      {
        $group: {
          _id: "$_id.date",
          attendanceData: {
            $push: {
              studentId: "$_id.studentId",
              attended: "$attended",
            },
          },
          totalTrue: {
            $sum: { $cond: { if: "$attended", then: 1, else: 0 } }, 
          },
          totalFalse: {
            $sum: { $cond: { if: { $not: "$attended" }, then: 1, else: 0 } }, 
          },
        },
      },
    ]);

    for (const attendanceRecord of weeklyAttendance) {
      const studentsInfo = await Promise.all(
        attendanceRecord.attendanceData.map(async (record) => {
          const student = await Student.findOne({ _id: record.studentId });
          return {
            studentId: student.studentId,
            attended: record.attended,
          };
        })
      );
      attendanceRecord.attendanceData = studentsInfo;
    }

    res.status(200).json({ weeklyAttendance });
  } catch (error) {
    console.error("Error fetching weekly attendance:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/enrolledStudentsWithAttendance", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const userId = decoded.userId; 

      const userCourses = await Course.find({ academician: userId });

      const enrolledStudentsPromises = userCourses.map(async (course) => {
        const attendanceList = await Attendance.find({ courseId: course._id });
        const enrolledStudents = {};
        attendanceList.forEach((attendance) => {
          if (!enrolledStudents[attendance.studentId]) {
            enrolledStudents[attendance.studentId] = {
              studentId: attendance.studentId,
              name: "",
              surname: "",
              email: "",
              totalAttendance: 0,
              totalNonAttendance: 0
            };
          }

          if (attendance.attendance) {
            enrolledStudents[attendance.studentId].totalAttendance++;
          } else {
            enrolledStudents[attendance.studentId].totalNonAttendance++;
          }
        });

        const studentIds = Object.keys(enrolledStudents);
        const studentsInfo = await Student.find({ _id: { $in: studentIds } });
        studentsInfo.forEach((student) => {
          enrolledStudents[student._id].name = student.name;
          enrolledStudents[student._id].surname = student.surname;
          enrolledStudents[student._id].email = student.email;
        });

        return Object.values(enrolledStudents);
      });

      const enrolledStudents = await Promise.all(enrolledStudentsPromises);

      res.status(200).json({ enrolledStudents });
    });
  } catch (error) {
    console.error("Error fetching enrolled students with attendance:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/addAttendance", async (req, res) => {
  console.log("Received updateAttendance request:");

  try {
    const { courseCode, attendanceData, semesterHalf } = req.body;

    console.log("Received attendance data:", attendanceData);

    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      const academianId = decoded.userId;

      const course = await Course.findOne({ code: courseCode });
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      const attendanceLimit = course.limit;

      const totalWeeks = course.week;
      const courseStartDate = new Date(course.startDate);

      const weekOffset = (semesterHalf === "firstHalf") ? 0 : totalWeeks - 7;
      const weekIndices = Array.from({ length: Math.min(7, totalWeeks) }, (_, i) => i + weekOffset);

      console.log("Week Indices:", weekIndices);

      for (const studentNumber in attendanceData) {
        const studentAttendance = attendanceData[studentNumber];
        const student = await Student.findOne({ studentId: studentNumber });
        if (!student) {
          console.log(`Student ${studentNumber} not found`);
          continue;  
        }

        for (let i = 0; i < weekIndices.length; i++) {
          const weekIndex = weekIndices[i];
          const attendanceIndex = weekIndex - weekOffset;
          const attendanceDate = new Date(courseStartDate.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000);
          const formattedDate = attendanceDate.toISOString().split('T')[0]; 
          const attendanceStatus = studentAttendance[attendanceIndex] === 1;

          console.log("Date of Attendance:", attendanceDate);
          console.log("Attendance Status:", attendanceStatus);

          await Attendance.findOneAndUpdate(
            {
              academianId: academianId,
              studentId: student._id,
              courseId: course._id,
              date: formattedDate,
            },
            {
              $set: {
                attendance: attendanceStatus,
              }
            },
            {
              upsert: true, 
              new: true
            }
          );
        }
      }

      res.status(200).json({ message: "Attendance updated successfully" });
    });
  } catch (error) {
    console.error("Error updating attendance:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }

});



app.post("/updateAttendance", async (req, res) => {
  const { studentId, courseCode, attendance, date } = req.body; 
  const token = req.headers.authorization.split(" ")[1];
  try {
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      const academianId = decoded.userId;
      const course = await Course.findOne({ code: courseCode });
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      const courseId = course._id;

      await Attendance.updateOne(
        { academianId, studentId, courseId, date }, 
        { $set: { attendance } }
      );

      res.status(200).json({ message: "Attendance updated successfully" });
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/addSignatures', async (req, res) => {
  const imagesData = req.body.signatureData;
  const courseCode = req.body.courseCode;
  const semesterHalf = req.body.semesterHalf; 
  const totalWeeks = req.body.totalWeeks || 14; 

  try {
    const results = [];

    for (const imageKey in imagesData) {
      const studentsData = imagesData[imageKey]; 
      for (const studentId in studentsData) {
        const student = studentsData[studentId];
        const { attendance, scores, groups } = student;

    
        const weekOffset = (semesterHalf === "secondHalf") ? totalWeeks / 2 : 0;
        console.log("weekOffset",weekOffset)
        const weekNumbers = attendance.map((attended, index) => attended ? index + 1 + weekOffset : null).filter(n => n);
        console.log("weekNumbers",weekNumbers)
        const updatedGroups = groups.map(group => group.map(index => weekNumbers[index]));
        console.log("updatedGroups",updatedGroups)



      
        const existingDocument = await Signature.findOne({ studentId, courseCode });
        console.log("existingDocument",existingDocument)


        if(semesterHalf === "firstHalf"){
          const firstHalfAttendance = attendance.slice(0, 7); 
          const firstHalfWeekNumbers = firstHalfAttendance.map((attended, index) => attended ? index + 1 : null).filter(n => n);
          const firstHalfGroups = groups.map(group => group.map(index => firstHalfWeekNumbers[index]));

          console.log("firstHalfAttendance",firstHalfAttendance)
          console.log("firstHalfWeekNumbers",firstHalfWeekNumbers)
          console.log("firstHalfGroups",firstHalfGroups)

          if (semesterHalf === "firstHalf") {
            const firstHalfAttendance = attendance.slice(0, 7); 
            const firstHalfWeekNumbers = firstHalfAttendance.map((attended, index) => attended ? index + 1 : null).filter(n => n);
            const firstHalfGroups = groups.map(group => group.map(index => firstHalfWeekNumbers[index]));
  
            console.log("firstHalfAttendance", firstHalfAttendance);
            console.log("firstHalfWeekNumbers", firstHalfWeekNumbers);
            console.log("firstHalfGroups", firstHalfGroups);
  
            if (existingDocument) {
              
              const secondHalfAttendance = existingDocument.attendance.slice(7); 
              const updatedAttendance = firstHalfAttendance.concat(secondHalfAttendance);
              const updatedGroups = existingDocument.groups.map((group, index) => {
                if (index < 7) {
                  return firstHalfGroups[index];
                }
                return group; 
              });
  
              await Signature.updateOne(
                { studentId, courseCode },
                { $set: { attendance: updatedAttendance, groups: updatedGroups } }
              );
            } else {
              const placeholderAttendance = Array(7).fill(null); 
              const fullAttendance = firstHalfAttendance.concat(placeholderAttendance);
              const fullGroups = firstHalfGroups.concat(Array(7).fill([])); 
  
              const newSignature = new Signature({
                studentId,
                courseCode,
                attendance: fullAttendance,
                groups: fullGroups
              });
              await newSignature.save();
            }
          }
  
        }
        else{
          const newSecondHalfAttendance = attendance.slice(0,7); 
          const newSecondHalfWeekNumbers = newSecondHalfAttendance.map((attended, index) => attended ? index + 8 : null).filter(n => n);
          const newSecondHalfGroups = groups.map(group => group.map(index => newSecondHalfWeekNumbers[index]));

          if (existingDocument) {
      
            const updatedAttendance = existingDocument.attendance.slice(0, 7).concat(newSecondHalfAttendance);
            const updatedGroups = existingDocument.groups.map((group, groupIndex) => {
              if (groupIndex < 7) return group; 
              return newSecondHalfGroups[groupIndex - 7] || []; 
            });

            await Signature.updateOne(
              { studentId, courseCode },
              { $set: { attendance: updatedAttendance, groups: updatedGroups } }
            );
          } else {
            const placeholderAttendance = Array(7).fill(null); 
            const fullAttendance = placeholderAttendance.concat(newSecondHalfAttendance);
            const fullGroups = Array(7).fill([]).concat(newSecondHalfGroups); 

            const newSignature = new Signature({
              studentId,
              courseCode,
              attendance: fullAttendance,
              groups: fullGroups
            });
            await newSignature.save();
          }
        }

    

        results.push({ studentId, imageKey, updated: true });
      }
    }

    

    res.status(201).json({ message: 'Signatures updated successfully', results });
  } catch (error) {
    console.error('Error saving signatures:', error);
    res.status(500).json({ error: 'Failed to save signatures', details: error.message });
  }
});

app.get('/getSignaturesByCourse', async (req, res) => {
  const courseCode = req.query.courseCode; 
  if (!courseCode) {
    return res.status(400).json({ message: "Course code is required" });
  }

  try {
    const signatures = await Signature.find({ courseCode }); 
    if (signatures.length === 0) {
      return res.status(404).json({ message: "No signatures found for this course" });
    }
    res.json(signatures); 
  } catch (error) {
    console.error('Error retrieving signatures:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


const getLastAttendanceWeek = async (courseId, startDate) => {
  const lastAttendance = await Attendance.findOne({ courseId: courseId }).sort({ date: -1 }); 
  if (!lastAttendance) return 0; 

  const start = new Date(startDate);
  const lastDate = new Date(lastAttendance.date);
  const diffTime = Math.abs(lastDate - start);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  const lastDiffWeeks = diffWeeks + 1;
  return lastDiffWeeks;
};


app.get("/course/limitBreaches", async (req, res) => {
  try {
    const { courseCode } = req.query;

    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    let weeksPassed = await getLastAttendanceWeek(course._id, course.startDate);
    console.log("weeksPassed", weeksPassed);

    const maximumAbsent = course.limit; 

    const weeklyAttendance = await Attendance.aggregate([
      { $match: { courseId: course._id } },
      {
        $group: {
          _id: "$studentId",
          totalAttendance: { $sum: { $cond: { if: "$attendance", then: 1, else: 0 } } },
          totalPossible: { $sum: 1 }
        }
      },
      {
        $project: {
          studentId: "$_id",
          totalAttendance: 1,
          absences: { $subtract: [weeksPassed, "$totalAttendance"] }
        }
      }
    ]);

    const studentsInfo = await Student.find({
      _id: { $in: weeklyAttendance.map(record => record.studentId) }
    }).select("studentId name surname email");

    const enrichedStudents = studentsInfo.map(student => {
      const attendanceData = weeklyAttendance.find(record => record.studentId.toString() === student._id.toString());
      return {
        ...student.toObject(),
        absences: attendanceData.absences
      };
    });

    const exceededLimit = enrichedStudents.filter(student => student.absences > maximumAbsent);
    const atLimit = enrichedStudents.filter(student => student.absences === maximumAbsent);

    res.status(200).json({ exceededLimit, atLimit });

  } catch (error) {
    console.error("Error fetching limit breaches:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/course/weeklyAttendanceSummary", async (req, res) => {
  try {
    const { courseCode } = req.query;
    console.log("courseCode::", courseCode);
    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const weeklyAttendanceSummary = await Attendance.aggregate([
      { $match: { courseId: course._id } },
      { $group: {
        _id: "$date",
        attendedCount: { $sum: { $cond: ["$attendance", 1, 0] } },
        notAttendedCount: { $sum: { $cond: ["$attendance", 0, 1] } }
      }},
      { $sort: { _id: 1 } } 
    ]);
console.log("tutmadi", weeklyAttendanceSummary);
    res.status(200).json({ weeklyAttendanceSummary });
  } catch (error) {
    console.error("Error fetching weekly attendance summary:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.post('/sendAttendanceWarnings', async (req, res) => {
  const { exceededLimitStudents, atLimitStudents, courseCode } = req.body;
  const token = req.headers.authorization.split(' ')[1]; 
  const decoded = jwt.verify(token, secretKey);
  const userId = decoded.userId;

  const instructor = await Instructor.findById(userId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    console.log("test:", instructor.password)
    console.log("instructordecodedEmail", instructor.email);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ytuayos@gmail.com',
      pass: 'tisdtrleosdyzuyr'
    }
  });

  try {
    for (const student of exceededLimitStudents) {
      await transporter.sendMail({
        from: instructor.email,
        to: student.email,
        subject: `${courseCode} Devamsızlık Sınır Aşımı Hk.`,
        text: `${student.studentId} numaralı öğrenci, ${courseCode} kodlu derste devamsızlık sınırını aştınız. Lütfen öğretim üyesi ile iletişime geçiniz.`,
      });
    }


    for (const student of atLimitStudents) {
      await transporter.sendMail({
        from: instructor.email,
        to: student.email,
        subject:  `${courseCode} Devamsızlık Sınırı Hk.`,
        text: `${student.studentId} numaralı öğrenci, ${courseCode} kodlu derste devamsızlık sınırındasınız. Lütfen öğretim üyesi ile iletişime geçiniz.`,
      });
    }

    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Failed to send emails:', error);
    res.status(500).json({ message: 'Failed to send emails' });
  }
});

app.get("/user/courseParticipants/:courseCode", async (req, res) => {
  const { courseCode } = req.params;
  try {
    const token = req.headers.authorization.split(' ')[1]; 
    const decodedToken = jwt.verify(token, secretKey); 
    const userId = decodedToken.userId; 

    
    const participants = await Participant.find({ courseCode: courseCode });

    console.log("parti", participants)

    if (!participants) {
      return res.status(404).json({ message: "Katılımcı bulunamadı" });
    }

    const studentNumbers = participants[0].students;

    const studentsData = await Promise.all(
      studentNumbers.map(async (studentNumber) => {
        const student = await Student.findOne({ studentId: studentNumber });
        return {
          studentNumber: student.studentId,
          name: student.name,
          surname: student.surname,
        };
      })
    );

    res.status(200).json({ participants: studentsData });
  } catch (error) {
    console.error("Katılımcı listesi alınırken hata oluştu:", error.message);
    res.status(500).json({ message: "Katılımcı listesi alınırken hata oluştu" });
  }
});


app.post("/user/updateCourse", async (req, res) => {
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

      const { code, limit } = req.body;

      let existingCourse = await Course.findOne({ code });

      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      existingCourse.limit = limit;

      await existingCourse.save();

      res.status(200).json({ course: existingCourse });
    } catch (error) {
      console.error("Error updating course:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  });
});
