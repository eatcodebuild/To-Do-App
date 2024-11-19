const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// const cors = require('cors');
// app.use(cors());
const PORT = 3000


require('dotenv').config();



const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));




// MongoDB Connection                                                                      
mongoose.connect(process.env.MONGODB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 50000
});

mongoose.connection.on('error', console.error.bind(console, 'MongoDB Connection Error:'));





// Middleware Connection
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // To parse URL-encoded bodies


// Initialize a session key
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }  // 1 hour

}));




// Database/User Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

const User = mongoose.model('User', userSchema);



// Database/task Model
const Task = mongoose.model('Task', {
    title: String,
    description: String,
    completed: Boolean,
    dueDate: Date,
    dateCompleted: Date,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});


//

// Database/Contact Form Model
const contactSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    question: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);



// Serve the static files from the Front End Directory > Lookup
app.use(express.static(path.join(__dirname, '../clientSide')));

// Serve the landing page
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/index.html'));
});

// // Serve the dashboard page
// app.get('/dashboard', isAuthenticated, (req, res) => {
//     res.sendFile(path.join(__dirname, '../clientSide/dashboard.html'));
// });


// Serve the dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/dashboard.html'));
});


// Serve the signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/signup.html'));
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/login.html'));
});

// Serve the contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/contact.html'));
});

// Serve the plans page
app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/pricing.html'));
});

// Serve the about page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/about.html'));
});

// Serve the enquiry submitted page
app.get('/enquiry_submitted', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/enquirySubmitted.html'));
});

// Serve the reset password page
app.get('/reset_password', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/resetPassword.html'));
});

// Serve the forgot password page
app.get('/forgot_password', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/forgotPassword.html'));
});

// Serve the link sent page
app.get('/link_sent', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/resetPasswordLinkSent.html'));
});

// Serve the success reset password page
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, '../clientSide/passwordResetSuccess.html'));
});



// function isAuthenticated(req, res, next) {
//     if (req.session.userId) {
//         return next();
//     } else {
//         res.redirect('/login');
//     }
// }



const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};




// // Routes
// app.get('/tasks', isAuthenticated, async (req, res) => {                              
//     try {
//         const userId = req.session.userId;
//         const tasks = await Task.find({ user: userId });
//         res.json(tasks);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });



// Routes
app.get('/tasks', async (req, res) => {                              
    try {
        const userId = req.session.userId;
        const tasks = await Task.find({ user: userId });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// Deleting Task
app.delete('/delete-task/:id', async (req, res) => {
    const taskId = req.params.id;
    
    try {
        await Task.findByIdAndDelete(taskId);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error });
    }
});





// app.get('/user_info', isAuthenticated, async (req, res) => {                            
//     const userId = req.session.userId;
        
//     try {
//         const user = await User.findById(userId).select('firstName lastName');
//         if (user) {
//             res.json({ firstName: user.firstName, lastName: user.lastName });
//         } else {
//             res.status(404).json({ message: 'User not found' });
//         }
//     } catch (err) {
//         res.status(500).json({ message: 'Error fetching user info' });
//     }
// });



app.get('/user_info', async (req, res) => {                            
    const userId = req.session.userId;
        
    try {
        const user = await User.findById(userId).select('firstName lastName');
        if (user) {
            res.json({ firstName: user.firstName, lastName: user.lastName });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user info' });
    }
});



app.post('/contact', async (req, res) => {
    const { firstName, lastName, email, question } = req.body;

    try {
        if (!firstName || !lastName || !email || !question) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const contactEntry = new Contact({ 
            firstName, 
            lastName, 
            email, 
            question 
        });

        await contactEntry.save();

        const transporter = nodemailer.createTransport({                      // ← ← ← FAKE EMAIL FOR TESTING "Mailtrap.io"
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "ccafd03fd41ca6",
                pass: "476e4a8a8f72f0"
            }
        });

        const mailOptions = {
            to: email,
            from: process.env.COMPANY_EMAIL || 'fallbackEmailUser',
            subject: 'Thanks For Contacting Us!',
            text: `Hi ${firstName}!\n\nThanks for reaching out! Your message has been received and one of our friendly staff will be in touch with you soon!\n\nBest regards,\nTo Do Team`
        };

        await transporter.sendMail(mailOptions);
        res.status(201).json({ success: true, message: 'Contact form submitted successfully!' });

    } catch (err) {
        console.error('Error handling contact form submission:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});





// Send information to the database
app.post('/tasks', async (req, res) => {
    const { title, description, dueDate } = req.body;
    const userId = req.session.userId;

    const task = new Task({
        title,
        description,
        completed: false,
        dueDate,
        user: userId
    });
    try {
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message});
    }
});




// // Edit / Update task
app.patch('/tasks/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, dueDate, completed } = req.body;
        const userId = req.session.userId;

        const update = {
            ...(title && { title }),
            ...(description && { description }),
            ...(dueDate && { dueDate }),
            ...(completed !== undefined && { completed }),
            dateCompleted: completed ? new Date() : null
        };

        console.log('Update Object:', update); // Log the update object

        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId, user: userId }, 
            update, 
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// // New user Signup
app.post('/signup', asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    // Password Requirements
    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;

    if (!passwordPattern.test(password)) {
        return res.status(400).json({ 
            message: 'Password does not meet requirements. Password must contain: At least one digit, at least one lowercase letter, at least one uppercase letter, at least one special character and a minimum length of 8 characters.' 
        });
    }

    // Password Requirements
    // At least one digit: (?=.*\d) — Requires at least one numeric digit (0-9).
    // At least one lowercase letter: (?=.*[a-z]) — Requires at least one lowercase letter (a-z).
    // At least one uppercase letter: (?=.*[A-Z]) — Requires at least one uppercase letter (A-Z).
    // At least one special character: (?=.*\W) — Requires at least one non-word character (e.g., !, @, #, $, %, etc.). \W matches any character that is not a letter, digit, or underscore.
    // Minimum length of 8 characters: .{8,} — The password must be at least 8 characters long.
    

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken'});
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const newUser = new User({ email, password: hashedPassword, firstName, lastName });
        

        // Save new user to database
        await newUser.save();
        console.log('User saved successfully!');

        res.status(201).json({ message: 'User created successfully' });

    } catch (err) {
        console.error('Error ceating user:', err);
        res.status(400).json({ message: err.message })
    }
}));





// // Existing user Login 
app.post('/login', async (req, res) => {
    const { email, password } = req.body;  // Changed 'username' to 'email'
    console.log('Login attempt:', { email, password });  // Debug log

    try {
        const user = await User.findOne({ email: email.toLowerCase() });  // Check user by email
        console.log('Found user:', user);  // Debug log
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Regenerate session to prevent session fixation attacks
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).send('Failed to regenerate session');
            }

            // Save user ID in the session after regeneration
            req.session.userId = user._id;

            // Save the session and then redirect the user
            req.session.save((err) => {
                if (err) {
                    return res.status(500).send('Failed to save session');
                }

                res.redirect('/dashboard');
            });
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});




// User Logout / destroy session
app.get('/logout', async (req, res) => {
    req.session.destroy(err => {
        if(err) {
            return res.status(401).json({ message: 'Failed to logout' });
        }
        res.redirect('/login');
    });
});





// // Forgot Password / sends email to user with a reset link
app.post('/forgot_password', async (req, res) => {
    const { email } = req.body;

    console.log("Received request for password reset");  // Add log
    console.log("Email:", email);  // Log the email input

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log("No user found with this email");  // Add log for no user
            return res.status(400).send('No account with this email exists!');
        } else {
            console.log('Found User')
            console.log(require('dotenv').config());
        }

        const token = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = token;
        user.resetPasswordExpires = resetTokenExpiry;

        await user.save();

        const transporter = nodemailer.createTransport({                                        // ← ← ← FAKE EMAIL FOR TESTING "Mailtrap.io"
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
            user: "ccafd03fd41ca6",
            pass: "476e4a8a8f72f0"
            }
        });

        const mailOptions = {
            to: user.email,
            from:  process.env.COMPANY_EMAIL || 'fallbackEmailUser',
            subject: 'Password Reset',
            text: `You are receiving this because you requested the reset of your account password.\n\n` +
                `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                `http://localhost:3000/reset_password/${token}\n\n` +
                `If you did not request this, please ignore this email.\n`,
        };

        

        await transporter.sendMail(mailOptions);
        res.status(200).send('Password reset email sent.');

    } catch (err) {
        console.error('Error in forgot password route:', err);
        res.status(500).send('Internal server error.');
    }
});




app.get('/reset_password/:token', async (req, res) => {
    const user = await User.findOne({ resetPasswordToken: req.params.token });
    if (!user) {
        return res.status(400).send('Invalid token');
    }
    res.render('reset_password', { token: req.params.token });
});




// // Route to handle new password submission
app.post('/reset_password/:token', async (req, res) => {
    const { newPasswordInput, confirmNewPasswordInput } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() } // Ensure token has not expired
        });

        if (!user) {
            return res.status(400).send('Password reset token is invalid or has expired.');
        }

        // Validate passwords
        if (newPasswordInput !== confirmNewPasswordInput) {
            return res.status(400).send('Passwords do not match.');
        }

        const hashedPassword = await bcrypt.hash(newPasswordInput, 10);

        // Updating the user with the new password and clear the reset token and expiry
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.redirect('/success');  // Redirecting after password reset
        console.log('Password Reset Success!');

    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).send('Internal server error.');
    }
});





// Run server
app.listen(PORT, ()=> {
    console.log(`Server listening http://localhost:${PORT}`);
});
