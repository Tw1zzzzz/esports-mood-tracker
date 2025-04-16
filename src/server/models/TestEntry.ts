import mongoose from 'mongoose';

const testEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  screenshotUrl: {
    type: String,
    required: false
  },
  isWeeklyTest: {
    type: Boolean,
    default: false,
    required: true
  }
}, { timestamps: true });

const TestEntry = mongoose.model('TestEntry', testEntrySchema);

export default TestEntry; 