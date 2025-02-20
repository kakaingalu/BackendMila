// import dotenv
import dotenv from 'dotenv';

import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import errorHandler from './errorHandler.js';
// import fs from 'fs';
import multer from 'multer';
import path, {dirname} from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';
import fs from 'fs-extra';


dotenv.config();

const app = express();
const port = process.env.PORT || 3001;



app.use(express.static('public'));

// Increase the request size limit
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.raw());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const uploadDir = path.join(__dirname, 'public', 'uploads');

// Function to create the upload directory if it doesn't exist
async function ensureUploadDirectory() {
  try {
    await new Promise((resolve, reject) => {
      fs.access(uploadDir, fs.constants.F_OK, (err) => {
        if (err) {
          fs.mkdir(uploadDir, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw error;
  }
}

await ensureUploadDirectory();

// For file uploads using multer


// Function to create timestamp without seconds
function getTimestampWithoutSeconds() {
  const now = new Date();
  return moment(now).format('YYYY-MM-DD HH:mm');
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir =  path.join(__dirname, 'public', 'uploads');
      fs.mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) {
          console.error('Error creating upload directory:', err);
        }
      });
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, `${getTimestampWithoutSeconds()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(cors());
app.use(errorHandler);


app.use(cors({
  origin: ['http://localhost:3000', 'http://143.198.152.80:3000/'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Server-side configuration (Node.js example using Express)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


// MySQL connection configuration
const dbConfig = {
  host: "localhost",
  user: "kochela",
  password: "4307",
  database:  "MilaShop",
  port: 3306,
};

// Connect to MySQL
let pool;
async function connectToMySQL() {
  pool = await mysql.createPool(dbConfig);

  // Create the database if it doesn't exist
  const createDbQuery = `
    CREATE DATABASE IF NOT EXISTS MilaShop;
  `;
  
  try {
    await pool.query(createDbQuery);
    console.log(`Database MilaShop created successfully`);
  } catch (error) {
    console.error('Error creating database:', error);
    // console.log('Environment variables:', process.env);

  }
}

// Create tables
async function createTables() {
  try {
      await pool.query(`
          CREATE TABLE IF NOT EXISTS form (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      await pool.query(`
          CREATE TABLE IF NOT EXISTS bracelets (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      await pool.query(`
          CREATE TABLE IF NOT EXISTS body_chain (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      await pool.query(`
          CREATE TABLE IF NOT EXISTS beads (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      await pool.query(`
          CREATE TABLE IF NOT EXISTS necklace (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      await pool.query(`
          CREATE TABLE IF NOT EXISTS chokers (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      await pool.query(`
          CREATE TABLE IF NOT EXISTS friendship_bracelets (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      await pool.query(`
          CREATE TABLE IF NOT EXISTS bags (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      await pool.query(`
          CREATE TABLE IF NOT EXISTS covers (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );  
      `);

      await pool.query(`
          CREATE TABLE IF NOT EXISTS lookbook (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
      `);

      console.log("Tables created successfully");
  } catch (error) {
      console.error("Error creating tables:", error);
  }
}




async function createPost(postData) {
  if (!postData || typeof postData !== 'object') {
    throw new Error('Invalid post data');
  }
  
  const columns = Object.keys(postData);
  const placeholders = columns.map(() => '?').join(', ');
  
  const query = `INSERT INTO ${postData.table} (${columns.join(', ')}) VALUES (${placeholders})`;
  const params = columns.map(column => postData[column]);
  
  const [result] = await pool.query(query, params);
  return { id: result.insertId, ...postData };
}

async function getPosts() {
  const [rows] = await pool.query('SELECT * FROM posts');
  return rows;
}

async function getPostById(postId) {
  if (!postId || isNaN(postId)) {
    throw new Error('Invalid post ID');
  }

  try {
    const [row] = await pool.query('SELECT * FROM ${postId.table} WHERE id = ?', [postId]);
    if (!row) {
      throw new Error('Data not found');
    }
    return row;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}


async function updatePost(postData) {
  await pool.query('UPDATE ${postData.table} SET ? WHERE id = ?', [postData, postData.id]);
  return getPostById(postData.id);
}

async function deletePost(postId) {
  if (!postId || isNaN(postId) ) {
    throw new Error('Invalid data ID');
  }

  try {
  await pool.query('DELETE FROM ${postId.table} WHERE id = ?', [postId]);
  const deletedPost = await getPostById(postId);
  return { message: '${postId.table} deleted successfully' };
  } catch (error) {
    console.error('Error deleting data:', error);
    console.log("id:", postId);
    throw new Error('Failed to delete data');
  }
}

// delete image
async function deleteFile(filename) {
  const filePath = path.join(__dirname, 'public', 'uploads', filename);
  
  try {
    await fs.remove(filePath);
    console.log(`File ${filename} deleted successfully`);
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error);
    return { success: false, message: 'Failed to delete file' };
  }
}

// Initialize the app
async function init() {
  await connectToMySQL();
  await createTables();
}

init().catch(console.error);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid multipart form data'
    });
  }
  next(err);
});

app.post('/api/posts', async (req, res) => {
  try {
    const newPost = await createPost(req.body);
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(400).json({ message: 'Invalid request body' });
  }
});

app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    const imagePath = `/public/uploads/${req.file.filename}`;

    res.json({location: imagePath});
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});


app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getPosts();
    
    if (!posts || posts.length === 0) {
      res.status(200).json([]);
    } else {
      res.json(posts);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
});


app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

// get uploaded images
app.get('/api/uploads/:filename', (req, res) => {
  const { filename } = req.params
  const filePath = path.join(__dirname, 'uploads', filename
  );
  res.sendFile(filePath);
}
);

// get all images
app.get('/api/uploads', (req, res) => {
  const files = fs.readdirSync(uploadDir  
  );
  res.json(files);
}
);



app.put('/api/posts/:id', async (req, res) => {
  try {
    const updatedPost = await updatePost(req.body);
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const deletedPost = await deletePost(req.params.id);
    res.json(deletedPost);
  } catch (error) {
    console.error('Error deleting post:', error);
    console.log("id:", req.params.id);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// delete image
app.delete('/api/delete-image/:filename', async (req, res) => {
    try {
    const result = await deleteFile(req.params.filename);
    res.json(result);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// app.use(express.static(path.join(__dirname, 'build')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build/index.html'));
// });

// //PUBLIC IP
// const PUBLIC_IP = process.env.PUBLIC_IP || '0.0.0.0';

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, PUBLIC_IP, () => {
//   console.log(`Server running on port ${PORT}`);
// });

export { app }; 