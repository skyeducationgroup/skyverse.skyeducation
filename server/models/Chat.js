import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, default: '' },
    senderName: { type: String, default: '' },
    text: { type: String, default: '' },
    timestamp: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  {
    strict: false,
    _id: false
  }
);

const chatSchema = new mongoose.Schema(
  {
    ambassadorId: { type: String, required: true, unique: true },
    messages: { type: [messageSchema], default: [] }
  },
  {
    strict: false,
    timestamps: false
  }
);

chatSchema.index({ ambassadorId: 1 }, { unique: true });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
