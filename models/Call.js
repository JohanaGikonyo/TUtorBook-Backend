const mongoose = require('mongoose');
const callSchema = new mongoose.Schema({
    caller: { type:String, required:true},
    receiver: { type:String, required:true},
    type:{ type:String, enum:['audio', 'video',], required:true},
    status: {type:String, enum:['pending', 'accepted', 'rejected', 'completed'], default:'pending'},
    startTime:{type:Date, default:Date.now},
    endTime:{ type:Date},
});
module.exports = mongoose.model('Call', callSchema);