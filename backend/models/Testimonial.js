import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Testimonial text is required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    role: {
      type: String,
      default: "",
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;
