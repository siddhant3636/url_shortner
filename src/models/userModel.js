import mongoose from "mongoose";
import bcrypt from "bcrypt";


const  userSchema =new mongoose.Schema({
    username: {type:String,required:true,unique: true},
    role: { type: String, enum: ['user', 'admin'], default: 'user'},
    email:{  type:String,  required:true },
    password:{  type:String,  required:true,  select:false},
    isDeleted: {type: Boolean,default: false},
    deletedAt: {type: Date,default: null}
},  {  timestamps:true});


userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

userSchema.pre("save", async function () {
    try {
      if (!this.isModified("password")) return;
      this.password = await bcrypt.hash(this.password, 10);
    }catch (err) {
      throw err; // mongoose will catch this
    }
});

userSchema.pre(/^find|count/, function () {
   this.where({
    $or: [
        { isDeleted: { $ne: true } }  // checks for { false || undefined  || null }
    //   { isDeleted: false },         
    //   { isDeleted: { $exists: false } }
    ]
  });
});

  userSchema.methods.comparePass=async function (enteredPass){
  return bcrypt.compare(enteredPass,this.password);
  }

  const userModel = mongoose.models.User || mongoose.model("User", userSchema);

  export default userModel;

