import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    targetUserIds: { type: [String], default: [] },
    date: { type: String, default: '' },
    timestamp: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  {
    strict: false,
    timestamps: false
  }
);

announcementSchema.index({ id: 1 }, { unique: true });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
