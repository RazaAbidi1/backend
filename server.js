const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const AWS = require('aws-sdk');
const eventRoutes = require('./routes/events');
const multer = require('multer');

const app = express();
// Set up multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
//making the app use cors as * to allow all origins
app.use(cors(
  {
    origin: '*',
  },
));


// mongoose.connect('mongodb://localhost:27017/media-manager', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//   console.log('Connected to MongoDB');

// });

app.use('/api/events', eventRoutes);

const region = 'eu-north-1';
const bucketName = 'myfyps';

const awsConfig = {
  accessKeyId: 'AKIA3X5Z3MF7QFJL2XSK',
  secretAccessKey: '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',
};

AWS.config.update(awsConfig);


const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

async function uploadFile(file) {
  const { originalname, mimetype, buffer } = file;
  console.log('Uploading file:', originalname, mimetype, buffer, bucketName);

  return await s3_upload(buffer, bucketName, originalname, mimetype);
}

async function s3_upload(file, bucket, name, mimetype) {
  const params = {
    Bucket: bucket,
    Key: String(name),
    Body: file,
    ContentType: mimetype,
    ContentDisposition: 'inline',
    CreateBucketConfiguration: {
      LocationConstraint: region,
    },
  };

  try {
    let s3Response = await s3.upload(params).promise();
    return s3Response;
  } catch (e) {
    console.log(e);
  }
}


app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const uploadedFile = await uploadFile(req.file);
    res.status(200).json({ message: 'File uploaded successfully', file: uploadedFile });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
