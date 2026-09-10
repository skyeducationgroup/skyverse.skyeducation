import mongoose from 'mongoose';

const ambassadorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    fatherName: { type: String, default: '' },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },
    course: { type: String, default: '' },
    university: { type: String, default: '' },
    enrollmentNumber: { type: String, default: '' },
    counselorName: { type: String, default: '' },
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    dateCreated: { type: String, default: '' },
    profilePhoto: { type: String, default: '' },
    payouts: { type: [mongoose.Schema.Types.Mixed], default: [] },
    pendingPopups: { type: [mongoose.Schema.Types.Mixed], default: [] },
    bankName: { type: String, default: '' },
    bankHolderName: { type: String, default: '' },
    bankAccountNumber: { type: String, default: '' },
    bankIfsc: { type: String, default: '' },
    bankPassbookPhoto: { type: String, default: '' },
    upiId: { type: String, default: '' },
    upiQrPhoto: { type: String, default: '' },
    earningsOverride: { type: mongoose.Schema.Types.Mixed, default: null },
    paidOverride: { type: mongoose.Schema.Types.Mixed, default: null },
    balanceOverride: { type: mongoose.Schema.Types.Mixed, default: null },
    referralsCountOverride: { type: mongoose.Schema.Types.Mixed, default: null },
    admissionsCountOverride: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  {
    strict: false,
    timestamps: false,
    toJSON: { virtuals: false },
    toObject: { virtuals: false }
  }
);

ambassadorSchema.index({ id: 1 }, { unique: true });

const Ambassador = mongoose.model('Ambassador', ambassadorSchema);

export default Ambassador;
