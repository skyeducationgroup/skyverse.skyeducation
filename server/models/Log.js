import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    timestamp: { type: mongoose.Schema.Types.Mixed, default: null },
    type: { type: String, default: '' },
    message: { type: String, default: '' }
  },
  {
    strict: false,
    timestamps: false
  }
);

const Log = mongoose.model('Log', logSchema);

export default Log;
