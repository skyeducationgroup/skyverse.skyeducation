import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    strict: false,
    timestamps: false
  }
);

settingsSchema.index({ key: 1 }, { unique: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
