const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminNotes: String,
  userNotes: String
}, 
{ timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema); 