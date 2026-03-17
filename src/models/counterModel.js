
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 1000000 } 
    // Start at 1,000,000 so your first short code is at least 4 characters long
    // (1,000,000 in Base62 is '4C92')
});

export default mongoose.model('Counter', counterSchema);