const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: String,
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    auto: true,
  },
  imageUrls: [String]
});

module.exports = mongoose.model('Event', eventSchema);
