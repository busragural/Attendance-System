const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  academician: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
    },
  ],
  startDate:{
    type: Date,
  },
  week:{
    type: Number,
  },
   limit:{
    type: Number,
   }
});

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;
