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
const Student = require("./models/studentSchema");
const Attendance = require("./models/attendanceSchema");
const Participant = require("./models/participantSchema");
const Signature = require("./models/signatureSchema");

mongoose
  .connect(
    "Uri",
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

    // Check if the user already exists
    const existingUser = await Instructor.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Create a new user
    const newUser = new Instructor({
      name,
      surname,
      email,
      password, // Note: In a real application, always hash passwords before saving
    });
    await newUser.save();

    // Generate a token
    const token = jwt.sign({ userId: newUser._id }, secretKey);
    res.status(201).json({ token });
  } catch (error) {
    console.error("Registration failed:", error.message);
    res.status(500).json({ message: "Registration failed" });
  }
});


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
      const courseCode = req.body.courseCode;
      console.log("CSV data received:", csvData);
      console.log("Course code recieved", courseCode);

      // Parse the CSV data
      const parsedCsv = csvData.split("\n").map(row => row.split(","));

      // Iterate over each row in the CSV data
      for (const row of parsedCsv) {
        const [name, surname, email, studentId] = row.map(value => value.trim()); // Trim each value

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
          console.log("Added student:", existingStudent._id);

          // Add student to Participant collection
          const participant = await Participant.findOneAndUpdate(
            { courseCode, academianId: userId },
            { $addToSet: { students: studentId } }, // Add student to students array if not already present
            { upsert: true, new: true }
          );

          console.log("Participant updated:", participant);
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


// Endpoint to get the list of student numbers enrolled in a course for a specific instructor
app.get("/course/studentNumbers", async (req, res) => {
  try {
    console.log("Received studentnumbers request:", req.body);

    // İstekte bulunan akademisyenin kimliğini alın
    const token = req.headers.authorization.split(" ")[1];

    // JWT'yi doğrula ve akademisyen kimliğini çıkar
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const academianId = decoded.userId; // Doğrulanan akademisyen kimliği

      const { courseCode } = req.query;

      // Hem akademisyen kimliği hem de ders kodu sağlanmış mı diye kontrol edin
      if (!academianId || !courseCode) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      // Belirtilen akademisyen ve ders için katılımcı kaydını bulun
      const participant = await Participant.findOne({ academianId, courseCode });

      // Katılımcı kaydı bulunamazsa, boş bir dizi döndürün
      if (!participant) {
        return res.status(200).json({ studentNumbers: [] });
      }

      // Ders kaydına kayıtlı öğrenci numaralarının dizisini alın
      const studentNumbers = participant.students;

      // Öğrenci numaraları dizisini döndürün
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

    // courseCode ile eşleşen dersin ObjectId'sini bulun
    const course = await Course.findOne({ code: courseCode });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // courseCode ile eşleşen dersin haftalık katılım bilgilerini bulun
    const weeklyAttendance = await Attendance.aggregate([
      { $match: { courseId: course._id } },
      {
        $group: {
          _id: { date: "$date", studentId: "$studentId" },
          attended: { $max: "$attendance" }, // Determine if the student attended on this date
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
            $sum: { $cond: { if: "$attended", then: 1, else: 0 } }, // Total true attendance count for the week
          },
          totalFalse: {
            $sum: { $cond: { if: { $not: "$attended" }, then: 1, else: 0 } }, // Total false attendance count for the week
          },
        },
      },
    ]);

    // Öğrenci numaralarını öğrenci belirteçlerinden alarak güncelle
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

// Endpoint to get enrolled students and their attendance status for the courses taught by the logged-in user
app.get("/enrolledStudentsWithAttendance", async (req, res) => {
  try {
    // JWT token'i alın
    const token = req.headers.authorization.split(" ")[1];

    // JWT token'ı doğrula ve kullanıcı kimliğini al
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const userId = decoded.userId; // Doğrulanan kullanıcı kimliği

      // Kullanıcının öğrettiği dersleri bul
      const userCourses = await Course.find({ academician: userId });

      // Kullanıcının öğrettiği derslere kayıtlı öğrencileri bul
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

        // Öğrenci bilgilerini doldurun
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

    // Authenticate the teacher's token
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      const academianId = decoded.userId;
      console.log("Academian ID:", academianId);

      // Fetch the course details
      const course = await Course.findOne({ code: courseCode });
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      const attendanceLimit = course.limit;
      console.log("limitneymis: ", attendanceLimit);

      const totalWeeks = course.week;
      console.log("Total Weeks:", totalWeeks);
      const courseStartDate = new Date(course.startDate);
      console.log("Course Start Date:", courseStartDate);




      // Determine the weeks range to process based on the semester half
      const weekOffset = (semesterHalf === "firstHalf") ? 0 : totalWeeks - 7;
      const weekIndices = Array.from({ length: Math.min(7, totalWeeks) }, (_, i) => i + weekOffset);

      console.log("Week Indices:", weekIndices);

      // Iterate through the attendance data to update each student's record
      for (const studentNumber in attendanceData) {
        const studentAttendance = attendanceData[studentNumber];
        const student = await Student.findOne({ studentId: studentNumber });
        if (!student) {
          console.log(`Student ${studentNumber} not found`);
          continue;  // Skip this student if not found
        }

        for (let i = 0; i < weekIndices.length; i++) {
          const weekIndex = weekIndices[i];
          const attendanceIndex = weekIndex - weekOffset;
          const attendanceDate = new Date(courseStartDate.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000);
          const formattedDate = attendanceDate.toISOString().split('T')[0]; // Get date in 'YYYY-MM-DD' format
          console.log("stuaTTWek", studentAttendance[totalWeeks - weekIndex])
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
              upsert: true, // Create a new document if no document matches the query criteria
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
  const { studentId, courseCode, attendance } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  try {
    // Token doğrulama ve kullanıcı ID'si alma
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

      // Yoklama verisini bul ve güncelle
      await Attendance.updateOne(
        { academianId, studentId, courseId },
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
  const semesterHalf = req.body.semesterHalf; // Dönemin ilk veya son yarısı bilgisi
  const totalWeeks = req.body.totalWeeks || 14; // Toplam hafta sayısı varsayılan olarak 14 kabul edilmiştir

  try {
    const results = [];

    for (const imageKey in imagesData) {
      const studentsData = imagesData[imageKey]; // Örneğin image_0, image_1...
      for (const studentId in studentsData) {
        const student = studentsData[studentId];
        const { attendance, scores, groups } = student;

        // İkinci yarı için başlangıç hafta numarasını ayarla
        const weekOffset = (semesterHalf === "secondHalf") ? totalWeeks / 2 : 0;
        const weekNumbers = attendance.map((attended, index) => attended ? index + 1 + weekOffset : null).filter(n => n);
        const updatedGroups = groups.map(group => group.map(index => weekNumbers[index]));

        // Önceki kayıtları bul ve güncelle
        const existingDocument = await Signature.findOne({ studentId, courseCode });

        if (existingDocument && semesterHalf === "secondHalf") {
          // Var olan veriler ile yeni verileri birleştir
          const combinedAttendance = existingDocument.attendance.concat(attendance);
          const combinedScores = existingDocument.scores.concat(scores);
          const combinedGroups = existingDocument.groups.concat(updatedGroups);

          await Signature.updateOne(
            { studentId, courseCode },
            { $set: { attendance: combinedAttendance, scores: combinedScores, groups: combinedGroups, courseCode } }
          );
        } else {
          // Eğer ikinci yarı değilse veya kayıt yoksa, yeni kayıt ekle veya mevcut kaydı güncelle
          await Signature.updateOne(
            { studentId, courseCode },
            { $set: { attendance, scores, groups: updatedGroups, courseCode } },
            { upsert: true }
          );
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
  const courseCode = req.query.courseCode; // Query'den courseCode alınır
  if (!courseCode) {
    return res.status(400).json({ message: "Course code is required" });
  }

  try {
    const signatures = await Signature.find({ courseCode }); // courseCode'a göre verileri bul
    if (signatures.length === 0) {
      return res.status(404).json({ message: "No signatures found for this course" });
    }
    res.json(signatures); // Bulunan verileri JSON olarak dön
  } catch (error) {
    console.error('Error retrieving signatures:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});



async function getStudentsByCourse(courseCode, limitPercentage) {
  // Örnek MongoDB sorgusu, limit üzerindeki devamsızlığı olan öğrencileri çeker
  return Student.find({
    courseCode: courseCode,
    absencePercentage: { $gte: limitPercentage }
  }).exec();
}

// app.get('/limitBreaches', async (req, res) => {
//   const courseCode = req.query.courseCode;

//   const course = await Course.findOne({ code: courseCode });
//   if (!course) {
//     return res.status(404).json({ message: "Course not found" });
//   }
//   const limitPercentage = course.limit;


//   try {
//     const students = await getStudentsByCourse(courseCode, limitPercentage);
//     console.log("stunot",students)
//     res.json(students);
//   }
//   catch (error) {
//     console.error('Error limits', error);
//     res.status(500).json({ error: 'Internal server error', details: error.message });
//   }
// });


// En son katılım tarihine göre hafta sayısını hesaplayan fonksiyon
const getLastAttendanceWeek = async (courseId, startDate) => {
  const lastAttendance = await Attendance.findOne({ courseId: courseId }).sort({ date: -1 }); // En son tarihli katılımı getir
  if (!lastAttendance) return 0; // Eğer katılım kaydı yoksa, 0 dön

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

    const maximumAbsent = course.limit; // Maximum allowed absences, directly the limit value

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

    // Enrich students with absence data
    const enrichedStudents = studentsInfo.map(student => {
      const attendanceData = weeklyAttendance.find(record => record.studentId.toString() === student._id.toString());
      return {
        ...student.toObject(),
        absences: attendanceData.absences
      };
    });

    // Splitting into two lists
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
      { $sort: { _id: 1 } }  // Sort by date
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
  const instructorEmail = decoded.email;

  const instructor = await Course.findOne({ email: instructorEmail });
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: instructorEmail,
      pass: instructor.password
    }
  });

  try {
    // Send emails to students who have exceeded the limit
    for (const student of exceededLimitStudents) {
      await transporter.sendMail({
        from: instructorEmail,
        to: student.email,
        subject: `${courseCode} Devamsızlık Sınır Aşımı Hk.`,
        text: `${student.studentId} numaralı öğrenci, devamsızlık sınırını aştınız. Lütfen öğretim üyesi ile iletişime geçiniz.`,
      });
    }


    for (const student of atLimitStudents) {
      await transporter.sendMail({
        from: instructorEmail,
        to: student.email,
        subject:  `${courseCode} Devamsızlık Sınırı Hk.`,
        text: `${student.studentId} numaralı öğrenci, devamsızlık sınırındasınız. Lütfen öğretim üyesi ile iletişime geçiniz.`,
      });
    }

    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Failed to send emails:', error);
    res.status(500).json({ message: 'Failed to send emails' });
  }
});
