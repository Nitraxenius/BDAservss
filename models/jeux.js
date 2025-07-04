const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  players: String,
  duration: String,
  age: String,
  description: String,
  imagePath: String,
  rules: String,        
  tags: [String],
}, 
{ timestamps: true });


module.exports = mongoose.model("Game", gameSchema);