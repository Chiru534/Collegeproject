import mongoose from 'mongoose';

const updateSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        required: true,
        trim: true
    },
    date: { 
        type: Date, 
        required: true,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('Update', updateSchema);