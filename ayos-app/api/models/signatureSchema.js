const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
    studentId: {
        type: String,

    },
    attendance: [{
        type: Number,

    }],
    // scores: [{
    //     type: Number,

    // }],
    groups: [[{
        type: Number
    }]],
    courseCode: {
        type: String,

    },
    

});


const Signature = mongoose.model("Signature", signatureSchema);

module.exports = Signature;