const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  
  courseCode: {
    type: String,
    ref: "Course",
  },
  academianId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
  },
  students: [
    {
      type: String,  //store student numbers
      ref: "Student",
    },
  ],
  
});

const Participant = mongoose.model("Participant", participantSchema);
module.exports = Participant;
