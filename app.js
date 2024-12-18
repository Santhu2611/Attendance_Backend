const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const studentModel = require('./models/studentSchema')
const dotenv = require('dotenv');
const hodSchema = require('./models/hodSchema')
const cors = require('cors');
const filemodel = require('./models/studentSchema');
const cron = require('node-cron');
const QRCode = require('qrcode');
const app = express()
dotenv.config();
const mongoURI = process.env.MONGODB_URI;
const secretKeyPrincipal = process.env.ACCESS_TOKEN_SECRET_PRINCIPAL;
const secretKeyHod = process.env.ACCESS_TOKEN_SECRET_HOD;
const secretKeyStudent = process.env.ACCESS_TOKEN_SECRET_STUDENT;
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const roles = require('./models/roles');
const principalSchema = require('./models/principalSchema');
const { sendEmail } = require('./node_mailer');
const connection = {
    principal: "principal",
    hod: "hod",
    student: "student",
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    next();
});
app.get('/', (req, res) => {
    res.send("Hello World")
})

app.get('/', (req, res) => {
    res.send("Hello World")
}
)
process.env.TZ = 'Asia/Kolkata'; // Set timezone to Indian Standard Time (IST)

app.get('/students', async (req, res) => {
    try {
        const students = await studentModel.find({});
        res.status(200).json(students);

    } catch (error) {
        res.status(500).json({ message: error.message })
        console.log(error);
    }
})
app.post('/register/students', async (req, res) => {
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
app.post('/register/hod', async (req, res) => {

    try {
        const salt = await bcrypt.genSalt();
        let password = req.body.password;
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("salt", salt, hashedPassword);
        req.body.password = hashedPassword;
        const hod = await hodSchema.create(req.body);
        res.status(200).json(hod);

    } catch (error) {
        console.log("error")
        res.status(500).json({ message: error.message })
    }
})

app.get('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const specificStudent = await studentModel.findById(id);
        // console.log("this",specificStudent);
        res.status(200).json(specificStudent);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

app.put('/students/:id', async (req, res) => {
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
        }

        else {
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
})
app.delete('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteStudent = await studentModel.findByIdAndDelete(id);
        if (!deleteStudent) {
            return res.status(404).json({ message: "not found" })
        }
        res.status(200).json({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
)


/// LOGIN

app.post('/students/login', async (req, res) => {
    try {
        const student = await studentModel.findOne({ pinno: req.body.pinno });

        if (!student) {
            return res.status(400).json({ message: 'Cannot find student' });
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, student.password);

        if (isPasswordValid) {
            const token = jwt.sign({ username: student.pinno }, secretKeyStudent, { expiresIn: '7d' });
            res.status(200).json({ token, student, message: 'Success' });

        } else {
            res.status(400).json({ message: 'invalid Username or Password' });
        }
    } catch (error) {
        res.status(500).send(error);
    }
}
)
// HOD CRUD 

app.get('/hod', async (req, res) => {
    try {
        const hods = await hodSchema.find({});
        res.status(200).json(hods);

    } catch (error) {
        res.status(500).json({ message: error.message })
        console.log(error);
    }
})

app.get('/hod/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const specificHod = await hodSchema.findById(id);
        // console.log("this",specificStudent);
        res.status(200).json(specificHod);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
app.put('/hod/:id', async (req, res) => {
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
                return res.status(404).json({ message: "not found" })
            }
        }
        else {
            const UpdateHOD = await hodSchema.findByIdAndUpdate(id, req.body);
            if (!UpdateHOD) {
                return res.status(404).json({ message: "not found" })
            }
        }
        const UpdatedHOD = await hodSchema.findById(id);
        res.status(200).json(UpdatedHOD);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
app.delete('/hod/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteHOD = await hodSchema.findByIdAndDelete(id);
        if (!deleteHOD) {
            return res.status(404).json({ message: "not found" })
        }
        res.status(200).json({ message: "deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// HOD LOGIN

function verifyTokenStudent(req, res, next) {
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
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
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
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
function verifyTokenPrincipal(req, res, next) {
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
        jwt.verify(token, secretKeyPrincipal, (err, authData) => {
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



app.post('/hod/login', async (req, res) => {
    try {
        const hod = await hodSchema.findOne({ idno: req.body.idno });

        if (!hod) {
            return res.status(400).json({ message: 'Cannot find staff' });
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, hod.password);

        if (isPasswordValid) {
            const token = jwt.sign({ username: hod.idno }, secretKeyHod, { expiresIn: '7d' });
            res.status(200).json({ token, hod, message: 'Success' });

        } else {
            res.status(400).json({ message: 'invalid Username or Password' });
        }
    } catch (error) {
        res.status(500).send(error);
    }
}
)
// PRINCIPAL LOGIN
app.post('/principal/login', async (req, res) => {
    try {
        const principal = await principalSchema.findOne({ idno: req.body.idno });

        if (!principal) {
            return res.status(400).json({ message: 'Wrong Username' });
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, principal.password);

        if (isPasswordValid) {
            const token = jwt.sign({ username: principal.idno }, secretKeyHod, { expiresIn: '7d' });
            res.status(200).json({ token, principal, message: 'Success' });

        } else {
            res.status(400).json({ message: 'invalid Username or Password' });
        }
    } catch (error) {
        res.status(500).send(error);
    }
})

app.put('/principal/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (req.body.password) {
            const salt = await bcrypt.genSalt();
            let password = req.body.password;
            const hashedPassword = await bcrypt.hash(password, salt);
            console.log("salt", salt, hashedPassword);
            req.body.password = hashedPassword;
            const UpdatePrincipal = await principalSchema.findByIdAndUpdate(id, req.body);
            if (!UpdatePrincipal) {
                return res.status(404).json({ message: "not found" })
            }
        }
        else {
            const UpdatePrincipal = await principalSchema.findByIdAndUpdate(id, req.body);
            if (!UpdatePrincipal) {
                return res.status(404).json({ message: "not found" })
            }
        }
        const UpdatedPrincipal = await principalSchema.findById(id);
        res.status(200).json(UpdatedPrincipal);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    createdAt: { type: Date, expires: 300, default: Date.now }, // Set expiry for OTP
});

const OTP = mongoose.model('OTP', otpSchema);

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
        console.log('OTP saved successfully');
    } catch (error) {
        console.error('Error saving OTP:', error);
    }
}


app.post('/forgotPasswordStudent', async (req, res) => {
    try {
        const emailid = req.body?.emailid;
        const specificStudent = await studentModel.findOne({
            emailid: emailid
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
                  <p class="header">OTP to reset your password is ${otp}</p>

                <p>This is an auto generated mail. Please do not reply to this mail. You have Requested for the OTP so that you can Reset your password </p>
                <p>You have requested to reset the password. If you haven't requested that, please ignore this mail. If you believe this request was made in error or you didn't initiate it, please contact our support team immediately for further assistance. <br /> If you have any questions or need help with your account, feel free to reach out to our friendly support team. We are here to assist you.</p>
            
                <p>With Regards, <br />
                Government Polytechnic Pendurthi</p>
  </div>
                </div>

                <style>
                .background{
                    background-color: #9C9595;
                    width: 100%;
                    height: 100vh;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center
                }
.header{
  font-weight: bold;
}
.innerDive{
  background-color: #f1f1f1;
  width: fit-content;
  height: 70%;
  width: 80%;
  padding: 40px;
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 40px;
}
.logo{
  height: 30%;
}
                </style>
            `,
            };
            sendEmail(null, null, mailOptions);
            saveOTPToDB(otp, emailid);
            res.status(200).json({ message: "OTP sent successfully", studentId: specificStudent.id });
        }
        else {
            res.status(404).json({ message: "student not found" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

app.post('/verifyOTP', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const result = await OTP.findOneAndDelete({ email: email, otp: otp });

        if (!result) {
            console.log(result);
            res.status(404).json({ message: 'Invalid OTP' });
        } else {
            res.status(200).json({ message: 'OTP verified successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error verifying OTP' });
    }
});


app.post('/forgotPasswordStaff', async (req, res) => {
    try {
        const emailId = req.body.email;
        const specificStudent = await hodSchema.findOne({
            email: emailId
        })

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
            res.status(200).json({ message: "OTP sent successfully", staffId: specificStudent.id });
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
app.post('/forgotPasswordPrincipal', async (req, res) => {
    try {
        const email = req.body.email;
        const specificStudent = await principalSchema.findOne({
            email: email
        })

        if (specificStudent) {
            const otp = generateOTP();
            const mailOptions = {
                subject: "Forgot Password Reset", // Subject line
                to: email, // list of receivers
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
            saveOTPToDB(otp, email);
            res.status(200).json({ message: "OTP sent successfully", principalId: specificStudent.id });
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

app.get('/principal', async (req, res) => {
    try {
        const principal = await principalSchema.find({});
        res.status(200).json(principal);



    } catch (error) {
        res.status(500).json({ message: error.message })
        console.log(error);
    }
})

// fileUpload api for student
app.post('/fileUpload', async (req, res) => {
    try {
        const studentId = req.body.studentId;
        const files = req.body.files;

        studentModel.findByIdAndUpdate(studentId,

            { $push: { documents: files } },
            { new: true }
        ).then((result) => {
            res.status(200).json({ message: "file uploaded successfully", result });
        }).catch((err) => {
            res.status(500).json({ message: err.message });
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.log(error);
    }
})
// fileUpdate api for student
app.put('/fileUpdate', async (req, res) => {
    try {
        const studentId = req.body.studentId;
        const files = req.body.files;
        const index = req.body.index;

        studentModel.findByIdAndUpdate(studentId,

            { $set: { [`documents.${index}`]: files } },
            { new: true }
        ).then((result) => {
            res.status(200).json({ message: "file updated successfully", result });
        }).catch((err) => {
            res.status(500).json({ message: err.message });
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
        console.log(error);
    }
})

// fileDelete API for student
app.put('/fileDelete', async (req, res) => {
    try {
        const studentId = req.body.studentId;
        const documentId = req.body.documentId; // Assuming this is the ID of the document to be removed

        studentModel.findByIdAndUpdate(studentId,
            { $pull: { documents: { _id: documentId } } }, // Updated $pull syntax using _id field
            { new: true }
        ).then((result) => {
            if (!result) {
                return res.status(404).json({ message: "Student not found" });
            }
            res.status(200).json({ message: "File deleted successfully", result });
        }).catch((err) => {
            res.status(500).json({ message: err.message });
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
});


//added the time limit for the student
app.post('/setAccessExpiration/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {

        const result = await studentModel.findByIdAndUpdate(
            studentId, req.body
        );
        if (!result) {
            return res.status(404).json({ message: "Student not found" });
        }
        return res.status(200).json({ message: 'Access expiration set successfully' });
    } catch (error) {
        console.error('Error setting access expiration:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

//added the time limit for the hod
app.post('/setAccessExpirationHod/:hodId', async (req, res) => {
    const { hodId } = req.params;
    try {

        const result = await hodSchema.findByIdAndUpdate(
            hodId, req.body
        );
        if (!result) {
            return res.status(404).json({ message: "Hod not found" });
        }
        return res.status(200).json({ message: 'Access expiration set successfully' });
    } catch (error) {
        console.error('Error setting access expiration:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
);

app.post('/setAccessToECE', async (req, res) => {
    try {
        // Specify the filter to match students with the "ECE" department
        const filter = { department: 'ECE' };

        // Update all documents that match the filter
        const result = await studentModel.updateMany(filter, req.body);

        if (result.nModified === 0) {
            return res.status(404).json({ message: "No students found in the ECE department" });
        }

        return res.status(200).json({ message: 'Access expiration set for all ECE students successfully' });
    } catch (error) {
        console.error('Error setting access expiration:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.post('/setAccessToEEE', async (req, res) => {
    try {
        // Specify the filter to match students with the "ECE" department
        const filter = { department: 'EEE' };

        // Update all documents that match the filter
        const result = await studentModel.updateMany(filter, req.body);

        if (result.nModified === 0) {
            return res.status(404).json({ message: "No students found in the EEE department" });
        }

        return res.status(200).json({ message: 'Access expiration set for all EEE students successfully' });
    } catch (error) {
        console.error('Error setting access expiration:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.post('/setAccessToMech', async (req, res) => {
    try {
        // Specify the filter to match students with the "ECE" department
        const filter = { department: 'Mech' };

        // Update all documents that match the filter
        const result = await studentModel.updateMany(filter, req.body);

        if (result.nModified === 0) {
            return res.status(404).json({ message: "No students found in the Mech department" });
        }

        return res.status(200).json({ message: 'Access expiration set for all Mech students successfully' });
    } catch (error) {
        console.error('Error setting access expiration:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.post('/setAccessToCivil', async (req, res) => {
    try {
        // Specify the filter to match students with the "ECE" department
        const filter = { department: 'Civil' };

        // Update all documents that match the filter
        const result = await studentModel.updateMany(filter, req.body);

        if (result.nModified === 0) {
            return res.status(404).json({ message: "No students found in the Civil department" });
        }

        return res.status(200).json({ message: 'Access expiration set for all Civil students successfully' });
    } catch (error) {
        console.error('Error setting access expiration:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// posting attendance

app.post('/attendance', async (req, res) => {
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

        res.status(200).json({ message: "Attendance recorded successfully", updatedStudent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/attendance/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await studentModel.findById(studentId).select('attendance');

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.status(200).json(student.attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/attendance', async (req, res) => {
    try {
        const students = await studentModel.find({}).select('name attendance'); // Select only name and attendance

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
        .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            app.listen(process.env.PORT || 3000, () => {
                console.log("Node.js server is running on port 3000");
            });
            console.log("MongoDB connected");
        })
        .catch((err) => {
            console.log(err);
        });
}




