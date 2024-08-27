const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors'); // Import cors package
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Use CORS middleware to allow requests from different origins
app.use(cors());

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'chaitu1504',
    database: 'dummy'
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Route for GET request
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Route for registration
// Route for registration
app.post('/register', async (req, res) => {
    const { username, password, dateOfBirth, address } = req.body;

    // Basic validation
    if (!username || !password || !dateOfBirth || !address) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if username already exists
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error('Error checking username:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // SQL query to insert new user
            const query = 'INSERT INTO users (username, password, dateOfBirth, address) VALUES (?, ?, ?, ?)';
            db.query(query, [username, hashedPassword, dateOfBirth, address], (err, results) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                }
                res.status(201).json({ message: 'User registered successfully' });
            });
        } catch (err) {
            console.error('Error hashing password:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
});


// Route for login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Query to find the user
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error('Error finding user:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = results[0];

        // Compare the provided password with the hashed password
        try {
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                res.status(200).json({ message: 'Login successful' });
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        } catch (err) {
            console.error('Error comparing passwords:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
});


// API endpoint to get all products
app.get('/products', (req, res) => {
    const query = 'SELECT * FROM products';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(200).json(results);
    });
});


// API endpoint to get a single product by ID
app.get('/products/:id', (req, res) => {
    const productId = req.params.id;
    const query = 'SELECT * FROM products WHERE id = ?';
    
    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(results[0]);
    });
});


// Route for checkout
app.post('/checkout', (req, res) => {
    const { productId, name, address, paymentMethod } = req.body;

    if (!productId || !name || !address || !paymentMethod) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // SQL query to insert purchase details into the `buynow` table
    const query = 'INSERT INTO buynow (product_id, name, address, payment_method) VALUES (?, ?, ?, ?)';

    db.query(query, [productId, name, address, paymentMethod], (err, results) => {
        if (err) {
            console.error('Error inserting purchase details:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(201).json({ message: 'Purchase completed successfully' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
