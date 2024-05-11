const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const AWS = require('aws-sdk');
const eventRoutes = require('./routes/events');

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/media-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');

});


const awsConfig = {
  region: 'eu-north-1',
  accessKeyId: 'AKIA3X5Z3MF7QFJL2XSK',
  secretAccessKey: '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',
};

AWS.config.update(awsConfig);


const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

async function uploadFileToS3(file, bucket) {
  const { originalname, buffer, mimetype } = file;
  console.log('Bucket Name:', bucket);
  const params = {
    Bucket: bucket,
    Key: originalname,
    Body: buffer,
    ACL: 'public-read',
    ContentType: mimetype,
    ContentDisposition: 'inline',
  };

  try {
    const s3Response = await s3.upload(params).promise();
    console.log('File uploaded successfully:', s3Response.Location);
    return s3Response;
  } catch (error) {
    console.log('Error uploading file:', error);
    throw error;
  }
}

const bucketName = 'myfyps';
console.log('Bucket Name:', bucketName);


app.use('/api/events', eventRoutes);


app.post('/api/upload', async (req, res) => {
  try {
    const uploadedFile = await uploadFileToS3(req.file, bucketName);
    res.status(200).json({ message: 'File uploaded successfully', file: uploadedFile });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
