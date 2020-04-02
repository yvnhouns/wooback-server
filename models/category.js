const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const categoryShema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      maxlength: 254
    },

    description: {
      type: String,
      trim: true
    },
    slug: {
      type: String,
      trim: true
    },
    parent: {
      type: ObjectId,
      ref: "Category",
      required: false
    },
    path: {
      type: String,
      trim: true
    },
    fullPath: {
      type: String,
      trim: true
    },
    count: Number
  },
  { timestamps: true }
);

categoryShema.pre("save", function(next) {
  console.log(this.name);
  this.name="moi meme"
  next();
});

module.exports = mongoose.model("Category", categoryShema);
