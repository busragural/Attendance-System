const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",

  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",

  },
  academianId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
  },
  attendance:{
    type: Boolean,
    required: true,
  },
  date: {
    type: String,

  }
  
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
