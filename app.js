const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const studentModel = require("./models/studentSchema");
const dotenv = require("dotenv");
const hodSchema = require("./models/hodSchema");
const cors = require("cors");
const QRCode = require("qrcode");
const fetch = require("node-fetch");
const app = express();
dotenv.config();
const secretKeyHod = process.env.ACCESS_TOKEN_SECRET_HOD;
const secretKeyStudent = process.env.ACCESS_TOKEN_SECRET_STUDENT;
const jwt = require("jsonwebtoken");
const { sendEmail } = require("./node_mailer");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/", (req, res) => {
  res.send("Hello World");
});
process.env.TZ = "Asia/Kolkata"; // Set timezone to Indian Standard Time (IST)

app.get("/proxy", async (req, res) => {
  const { url } = req.query;
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    res.set("Content-Type", response.headers.get("content-type"));
    res.send(buffer);
  } catch (error) {
    res.status(500).send("Error fetching the resource.");
  }
});

app.get("/students", async (req, res) => {
  try {
    const students = await studentModel.find({});
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
});
app.post("/register/students", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    let password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;

    // Create the student record
    const student = await studentModel.create(req.body);

    // Generate QR code for the student ID
    const qrCodeUrl = await QRCode.toDataURL(student._id.toString());

    // Update the student record with the QR code URL
    student.qrCodeUrl = qrCodeUrl;
    await student.save();

    res.status(200).json(student);
  } catch (error) {
    console.log("error");
    res.status(500).json({ message: error.message });
  }
});

app.post("/register/hod", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    let password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("salt", salt, hashedPassword);
    req.body.password = hashedPassword;
    const hod = await hodSchema.create(req.body);
    res.status(200).json(hod);
  } catch (error) {
    console.log("error");
    res.status(500).json({ message: error.message });
  }
});

app.get("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const specificStudent = await studentModel.findById(id);
    // console.log("this",specificStudent);
    res.status(200).json(specificStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.password) {
      const salt = await bcrypt.genSalt();
      let password = req.body.password;
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log("salt", salt, hashedPassword);
      req.body.password = hashedPassword;
      const updateStudent = await studentModel.findByIdAndUpdate(id, req.body);
      if (!updateStudent) {
        return res.status(404).json({ message: "not found" });
      }
    } else {
      const updateStudent = await studentModel.findByIdAndUpdate(id, req.body);
      if (!updateStudent) {
        return res.status(404).json({ message: "not found" });
      }
    }

    const updatedStudent = await studentModel.findById(id);
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.delete("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteStudent = await studentModel.findByIdAndDelete(id);
    if (!deleteStudent) {
      return res.status(404).json({ message: "not found" });
    }
    res.status(200).json({ message: "deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/// LOGIN

app.post("/students/login", async (req, res) => {
  try {
    const student = await studentModel.findOne({ pinno: req.body.pinno });

    if (!student) {
      return res.status(400).json({ message: "Cannot find student" });
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      student.password
    );

    if (isPasswordValid) {
      const token = jwt.sign({ username: student.pinno }, secretKeyStudent, {
        expiresIn: "7d",
      });
      res.status(200).json({ token, student, message: "Success" });
    } else {
      res.status(400).json({ message: "invalid Username or Password" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});
// HOD CRUD

app.get("/hod", async (req, res) => {
  try {
    const hods = await hodSchema.find({});
    res.status(200).json(hods);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
});

app.get("/hod/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const specificHod = await hodSchema.findById(id);
    // console.log("this",specificStudent);
    res.status(200).json(specificHod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.put("/hod/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.password) {
      const salt = await bcrypt.genSalt();
      let password = req.body.password;
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log("salt", salt, hashedPassword);
      req.body.password = hashedPassword;
      const UpdateHOD = await hodSchema.findByIdAndUpdate(id, req.body);
      if (!UpdateHOD) {
        return res.status(404).json({ message: "not found" });
      }
    } else {
      const UpdateHOD = await hodSchema.findByIdAndUpdate(id, req.body);
      if (!UpdateHOD) {
        return res.status(404).json({ message: "not found" });
      }
    }
    const UpdatedHOD = await hodSchema.findById(id);
    res.status(200).json(UpdatedHOD);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.delete("/hod/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteHOD = await hodSchema.findByIdAndDelete(id);
    if (!deleteHOD) {
      return res.status(404).json({ message: "not found" });
    }
    res.status(200).json({ message: "deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// HOD LOGIN

function verifyTokenStudent(req, res, next) {
  const token = req.headers["authorization"];
  if (typeof token !== "undefined") {
    jwt.verify(token, secretKeyStudent, (err, authData) => {
      if (err) {
        res.sendStatus(403); // Forbidden
      } else {
        req.hod = authData;
        next();
      }
    });
  } else {
    res.sendStatus(403); // Forbidden
  }
}
function verifyTokenHod(req, res, next) {
  const token = req.headers["authorization"];
  if (typeof token !== "undefined") {
    jwt.verify(token, secretKeyHod, (err, authData) => {
      if (err) {
        res.sendStatus(403); // Forbidden
      } else {
        req.hod = authData;
        next();
      }
    });
  } else {
    res.sendStatus(403); // Forbidden
  }
}

app.post("/hod/login", async (req, res) => {
  try {
    const hod = await hodSchema.findOne({ idno: req.body.idno });

    if (!hod) {
      return res.status(400).json({ message: "Cannot find staff" });
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      hod.password
    );

    if (isPasswordValid) {
      const token = jwt.sign({ username: hod.idno }, secretKeyHod, {
        expiresIn: "7d",
      });
      res.status(200).json({ token, hod, message: "Success" });
    } else {
      res.status(400).json({ message: "invalid Username or Password" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, expires: 300, default: Date.now }, // Set expiry for OTP
});

const OTP = mongoose.model("OTP", otpSchema);

function generateOTP() {
  const min = 100000; // Minimum value (100000)
  const max = 999999; // Maximum value (999999)

  // Generate a random number between min and max
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomNumber;
}

async function saveOTPToDB(otp, email) {
  try {
    const newOTP = new OTP({
      email: email,
      otp: otp,
    });
    await newOTP.save();
    console.log("OTP saved successfully");
  } catch (error) {
    console.error("Error saving OTP:", error);
  }
}

app.post("/forgotPasswordStudent", async (req, res) => {
  try {
    const emailid = req.body?.emailid;
    const specificStudent = await studentModel.findOne({
      emailid: emailid,
    });
    if (specificStudent) {
      const otp = generateOTP();
      const mailOptions = {
        subject: "Forgot Password Reset",
        to: emailid,
        text: `This is your OTP ${otp}`,
        html: `
                <div class="background">
                    <div class="innerDive">
                        <p class="header">Your OTP to Reset Password</p>
                        <p class="otp">OTP: <strong>${otp}</strong></p>
                        <p class="message">
                            This is an auto-generated email. Please do not reply to this mail.<br />
                            You have requested an OTP to reset your password. If this was not you, please ignore this email.<br />
                            If you believe this request was made in error, contact our support team immediately.<br />
                            For any questions or assistance, feel free to reach out to our friendly support team.
                        </p>
                        <p class="footer">With Regards,<br />GVPCE</p>
                    </div>
                </div>
                <style>
                    .background {
                        background-color: #f5f5f5;
                        width: 100%;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .innerDive {
                        background-color: #ffffff;
                        width: 100%;
                        max-width: 600px;
                        padding: 30px;
                        border-radius: 12px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        font-family: Arial, sans-serif;
                    }
                    .logo {
                        width: 120px;
                        margin-bottom: 20px;
                    }
                    .header {
                        font-size: 24px;
                        font-weight: bold;
                        color: #333333;
                        margin-bottom: 20px;
                    }
                    .otp {
                        font-size: 20px;
                        color: #d9534f;
                        margin-bottom: 20px;
                    }
                    .message {
                        font-size: 16px;
                        color: #555555;
                        line-height: 1.6;
                        margin-bottom: 20px;
                    }
                    .footer {
                        font-size: 14px;
                        color: #777777;
                        margin-top: 20px;
                    }
                </style>
                `,
      };

      sendEmail(null, null, mailOptions);
      saveOTPToDB(otp, emailid);
      res.status(200).json({
        message: "OTP sent successfully",
        studentId: specificStudent.id,
      });
    } else {
      res.status(404).json({ message: "student not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/verifyOTP", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await OTP.findOneAndDelete({ email: email, otp: otp });

    if (!result) {
      console.log(result);
      res.status(404).json({ message: "Invalid OTP" });
    } else {
      res.status(200).json({ message: "OTP verified successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

app.post("/forgotPasswordStaff", async (req, res) => {
  try {
    const emailId = req.body.email;
    const specificStudent = await hodSchema.findOne({
      email: emailId,
    });

    if (specificStudent) {
      const otp = generateOTP();
      const mailOptions = {
        subject: "Forgot Password Reset", // Subject line
        to: emailId, // list of receivers
        text: `This is your OTP ${otp}`,
        html: `
                <div>
                <p>OTP to reset your password is ${otp}</p>
                
                <p>This is an auto generated mail. Please do not reply to this mail.</p>
                <p>You have requested to reset the password. If you haven't requested that please Ignore this mail.</p>
            
                <p>Regards,</p>
                <p>GPT Pendurthi</p>
            `,
      };
      sendEmail(null, null, mailOptions);
      saveOTPToDB(otp, emailId);
      res.status(200).json({
        message: "OTP sent successfully",
        staffId: specificStudent.id,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// posting attendance

app.post("/attendance", async (req, res) => {
  try {
    const { studentId, date, status, remarks } = req.body;

    // Find the student by ID and update their attendance
    const updatedStudent = await studentModel.findByIdAndUpdate(
      studentId,
      { $push: { attendance: { date, status, remarks } } },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res
      .status(200)
      .json({ message: "Attendance recorded successfully", updatedStudent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/attendance/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await studentModel.findById(studentId).select("attendance");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student.attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/attendance", async (req, res) => {
  try {
    const students = await studentModel.find({}).select("name attendance"); // Select only name and attendance

    if (!students.length) {
      return res.status(404).json({ message: "No students found" });
    }

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not defined in your .env file.");
} else {
  // Attempt to connect to MongoDB using process.env.MONGODB_URI
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      app.listen(process.env.PORT || 3000, () => {
        console.log(
          `Node.js server is running on port ${process.env.PORT || 3000}`
        );
      });
      console.log("MongoDB connected");
    })
    .catch((err) => {
      console.log(err);
    });
}
