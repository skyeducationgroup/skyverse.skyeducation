import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    referrerId: { type: String, default: '' },
    studentName: { type: String, default: '' },
    studentMobile: { type: String, default: '' },
    studentEmail: { type: String, default: '' },
    courseInterest: { type: String, default: '' },
    university: { type: String, default: '' },
    studyMode: { type: String, default: '' },
    status: { type: String, default: 'Pending' },
    payoutStatus: { type: String, default: '' },
    dateSubmitted: { type: String, default: '' },
    counselorName: { type: String, default: '' },
    whatsappScreenshot: { type: String, default: '' }
  },
  {
    strict: false,
    timestamps: false
  }
);

referralSchema.index({ id: 1 }, { unique: true });

const Referral = mongoose.model('Referral', referralSchema);

export default Referral;
