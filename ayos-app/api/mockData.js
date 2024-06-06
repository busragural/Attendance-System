
// Function to add 10 students
const addStudents = async () => {
  try {
    for (let i = 1; i <= 150; i++) {
      const student = new Student({
        name: `StudentName${i}`,
        surname: `StudentSurname${i}`,
        email: `student${i}@example.com`,
        studentId: `StudentID${i}`
      });
      await student.save();
    }
    console.log("150 students added successfully");
  } catch (error) {
    console.error("Error adding students", error);
  }
};

const addStudents2 = async () => {
  try {
    for (let i = 1; i <= 15; i++) {
      const student = new Student({
        name: `StudentName${i}`,
        surname: `StudentSurname${i}`,
        email: `student${i}@example.com`,
        studentId: `1001000${i}`
      });
      await student.save();
    }
    console.log("150 students added successfully");
  } catch (error) {
    console.error("Error adding students", error);
  }
};

  // Function to add 10 instructors
  const addInstructors = async () => {
    try {
      for (let i = 1; i <= 10; i++) {
        const instructor = new Instructor({
          name: `InstructorName${i}`,
          surname: `InstructorSurname${i}`,
          email: `instructor${i}@example.com`,
          password: `password${i}`
        });
        await instructor.save();
      }
      console.log("10 instructors added successfully");
    } catch (error) {
      console.error("Error adding instructors", error);
    }
  };
  
  const addAttendances = async () => {
    try {
      const courses = await Course.find();
      const students = await Student.find();
  
      for (let i = 1; i <= 150; i++) {
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        const randomCourse = courses[Math.floor(Math.random() * courses.length)];
  
        const attendance = new Attendance({
          studentId: randomStudent._id,
          courseId: randomCourse._id,
          academianId: randomCourse.academician[Math.floor(Math.random() * 3)], // Randomly select an academician from the associated instructors
          attendance: i <= 100, // Set true for the first 100 students, false for the rest
          date: new Date(randomCourse.startDate.getTime() + (Math.floor(Math.random() * 10) * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
  
        await attendance.save();
      }
      console.log("Attendances added successfully");
    } catch (error) {
      console.error("Error adding attendances", error);
    }
  };
  
  const addCourses = async () => {
    try {
      const instructors = await Instructor.find();
  
      for (let i = 1; i <= 10; i++) {
        const academicianIds = [];
  
        for (let j = 0; j < 3; j++) {
          const randomAcademician = instructors[Math.floor(Math.random() * instructors.length)];
          academicianIds.push(randomAcademician._id);
        }
  
        const course = new Course({
          name: `CourseName${i}`,
          code: `CourseCode${i}`,
          academician: academicianIds,
          startDate: new Date(),
          week: 14
        });
        await course.save();
      }
      console.log("10 courses added successfully");
    } catch (error) {
      console.error("Error adding courses", error);
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
  
  const deleteAllInstructors = async () => {
    try {
      await Instructor.deleteMany({});
      console.log("All instructors deleted successfully");
    } catch (error) {
      console.error("Error deleting instructors", error);
    }
  };
  
  
  const deleteAllStudents= async () => {
    try {
      await Student.deleteMany({});
      console.log("All students deleted successfully");
    } catch (error) {
      console.error("Error deleting students", error);
    }
  };
  
  const deleteAllAttendances= async () => {
    try {
      await Attendance.deleteMany({});
      console.log("All attendances deleted successfully");
    } catch (error) {
      console.error("Error deleting attendances", error);
    }
  };




  const addDummyAttendance = async() => {
    try{
      const objectIdString1 = "66085c57b4b59ac612d3981c";
      const objectIdString2 = "66085c57b4b59ac612d39820";
      const tmpcourseId = "66085c56b4b59ac612d39818";
      const tmpAcaId = "65b3b30720c062cafc7ae35c";
      const objectId1 = new ObjectId(objectIdString1);
      const objectId2 = new ObjectId(objectIdString2);
  
      const attendance = new Attendance({
        studentId: objectId1,
        courseId: tmpcourseId,
        academianId: tmpAcaId,
        attendance: true,
        date: "2024-12-12"
      })
      await attendance.save();
      console.log("eklendi");
      console.log("Added student:", attendance._id);
  
      
    }
    catch(error) {
      console.error("Error adding attendances", error);
    }
  }
  
  const addDummyAttendanceFor14Weeks = async () => {
    try {
      const objectIdString = "66085c57b4b59ac612d39820"; // Öğrenci ID'si
      const tmpcourseId = "66085c56b4b59ac612d39818"; // Ders ID'si
      const tmpAcaId = "65b3b30720c062cafc7ae35c"; // Akademisyen ID'si
  
      let currentDate = new Date("2024-12-12"); // Başlangıç tarihi
  
      for (let week = 1; week <= 14; week++) {
        const attendance = new Attendance({
          studentId: new ObjectId(objectIdString),
          courseId: tmpcourseId,
          academianId: tmpAcaId,
          attendance: true, // veya false, katılım durumunu buradan ayarlayabilirsiniz
          date: currentDate.toISOString().split('T')[0] // Tarihi ISO formatına dönüştür
        });
  
        await attendance.save();
        console.log(`Week ${week} attendance added for student.`);
  
        // Haftanın sonunda bir sonraki haftaya geçmek için tarihi 7 gün artır
        currentDate.setDate(currentDate.getDate() + 7);
      }
  
      console.log("Attendance for 14 weeks added successfully.");
    } catch (error) {
      console.error("Error adding attendances", error);
    }
  };
  