const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true,
    },
    surname:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    }

});

const Instructor = mongoose.model("Instructor", instructorSchema);

module.exports = Instructor;