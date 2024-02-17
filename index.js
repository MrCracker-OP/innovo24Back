const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas connection string
const uri = "mongodb+srv://innovo24:root@cluster0.jkhi3lx.mongodb.net/?retryWrites=true&w=majority";

// Connect to MongoDB Atlas
mongoose.connect(uri);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB Atlas');
});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    type: {
        type: String,
        enum: ['counselor', 'student']
    },
    is_verified: {
        type: Boolean,
        default: false,
    },
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Register a new user
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, type } = req.body;

        // Check if all required fields are provided
        if (!username || !email || !password || !type) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if the user type is valid
        if (!['counselor', 'student'].includes(type)) {
            return res.status(400).json({ message: 'Invalid user type' });
        }

        // Check if the email is already registered
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });;
        if (existingUser) {
            return res.status(400).json({ message: 'User or Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            type,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Login user
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, type: user.type },
            process.env.JWT_SECRET || 'secret_key' // Use environment variable for JWT secret
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/verified-counselors', async (_, res) => {
    console.log("working on");
    try {
        const verifiedCounselors = await User.find({ type: 'counselor', is_verified: true });

        res.status(200).json(verifiedCounselors.map(counselor => ({
            username: counselor.username,
            email: counselor.email,
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

