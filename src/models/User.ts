import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  // Note: password field and hashing removed - add back when implementing new auth system
}, {
  timestamps: true,
});

// Check if model exists, if not create it
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;