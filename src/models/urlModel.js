import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  ip: {
    type: String
  },
  country: {
    type: String
  },
  device: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true
    },

    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    clicks: {
      type: Number,
      default: 0
    },

    lastAccessed: {
      type: Date
    },

    expiresAt: {
      type: Date
    },

    analytics: [analyticsSchema],

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const urlModel = mongoose.model("url", urlSchema);

export default urlModel;